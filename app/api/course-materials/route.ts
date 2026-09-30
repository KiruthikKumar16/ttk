import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { courseMaterialSchema, courseMaterialResponseSchema } from '@/lib/validation'
import { unexpectedApiError } from '@/lib/api-response'
import { pagePaginationFromSearchParams } from '@/lib/pagination'
import { normalizeJoined } from '@/lib/supabase/relations'
import z from 'zod'
import { validateMutationRequest } from '@/lib/security/csrf'
import { validateCourseMaterialFile } from '@/lib/security/uploads'
import { withApi } from '@/lib/http/handler'
import { rolesFor } from '@/lib/auth/permissions'

async function getCourseMaterials(req: NextRequest, requestId: string) {
  // User client enforces RLS; service role is used only for signed storage URLs.
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  const session = user ? { user } : null
  if (authError || !session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user!.id).maybeSingle()
  if (!currentProfile || !['admin', 'staff', 'trainer'].includes(currentProfile.role)) {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const pagination = pagePaginationFromSearchParams(searchParams)

    let query = supabase.from('course_materials').select(
      `
        id,
        course_id,
        title,
        type,
        storage_path,
        uploaded_by,
        created_at,
        courses!course_materials_course_id_fkey (id, name),
        profiles!course_materials_uploaded_by_fkey (id, full_name, role)
      `,
      { count: 'exact' },
    )

    // Apply filters
    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1)

    if (error) throw error

    // For each course material, generate a signed URL for the file
    const adminSupabase = getSupabaseAdminClient(requestId)
    const materialsWithSignedUrl = await Promise.all(
      (data || []).map(async (material) => {
        const course = normalizeJoined(material.courses)
        const profile = normalizeJoined(material.profiles)
        const { data: signedUrlData, error: signedUrlError } = await adminSupabase.storage
          .from('course-materials')
          .createSignedUrl(material.storage_path, 300)

        if (signedUrlError) {
          throw signedUrlError
        }

        return {
          ...material,
          course,
          profile,
          signedUrl: signedUrlData.signedUrl,
        }
      }),
    )

    // Format the response for easier consumption
    const formattedData = materialsWithSignedUrl.map((material) => ({
      id: material.id,
      courseId: material.course_id,
      courseName: material.course?.name,
      title: material.title,
      type: material.type,
      storagePath: material.storage_path,
      uploadedBy: material.profile
        ? {
            id: material.profile.id,
            fullName: material.profile.full_name,
            role: material.profile.role,
          }
        : null,
      createdAt: material.created_at,
      signedUrl: material.signedUrl,
    }))

    return NextResponse.json({
      data: formattedData,
      count: data?.length || 0,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalCount: count || 0,
      hasMore: pagination.offset + pagination.limit < (count || 0),
    })
  } catch (error) {
    return unexpectedApiError(error, 'Unable to load course materials')
  }
}

async function postCourseMaterial(req: NextRequest, requestId: string) {
  const rejected = validateMutationRequest(req, ['multipart/form-data'])
  if (rejected) return rejected
  // User client enforces RLS; service role is used only for signed storage URLs.
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  const session = user ? { user } : null
  if (authError || !session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Get the current user's profile to get their ID and role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (profileError || !profile) {
    return unexpectedApiError(
      profileError ?? new Error('User profile was not found.'),
      'Unable to fetch course material uploader profile',
    )
  }

  // Check permissions: only staff, admin, and trainer can upload course materials
  const hasPermission = profile.role === 'admin' || profile.role === 'staff' || profile.role === 'trainer'

  if (!hasPermission) {
    return NextResponse.json({ error: 'Insufficient permissions to upload course material' }, { status: 403 })
  }

  try {
    // Parse the form data
    const formData = await req.formData()
    const file = formData.get('file')
    const courseId = formData.get('courseId') as string
    const title = formData.get('title') as string
    const type = formData.get('type') as string

    // Validate the metadata
    const parsedBody = courseMaterialSchema.parse({
      courseId,
      title,
      type,
    })

    // Validate the file
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const extension = await validateCourseMaterialFile(file)
    if (!extension) return NextResponse.json({ error: 'Unsupported or invalid file.' }, { status: 400 })

    // We'll create a storage path that is unique to avoid collisions
    // We can use a combination of courseId, title, and a random string or timestamp
    const storagePath = `${crypto.randomUUID()}.${extension}`

    // Uploads use the authenticated user client so Storage RLS remains in force.
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-materials')
      .upload(storagePath, file)

    if (uploadError) {
      return unexpectedApiError(uploadError, 'Failed to upload course material')
    }

    // Insert the course material metadata into the database
    const courseMaterialData = {
      course_id: parsedBody.courseId,
      title: parsedBody.title,
      type: parsedBody.type,
      storage_path: storagePath,
      uploaded_by: session.user.id,
    }

    const { data: courseMaterial, error: courseMaterialError } = await supabase
      .from('course_materials')
      .insert(courseMaterialData)
      .select()
      .single()

    if (courseMaterialError) {
      // If the database insert fails, we should try to delete the uploaded file to avoid orphaned files
      // Note: This is a best-effort cleanup; if this fails, we might have an orphaned file.
      await supabase.storage.from('course-materials').remove([storagePath])
      return unexpectedApiError(courseMaterialError, 'Failed to save course material metadata')
    }

    // Generate a signed URL for the uploaded file (short-lived)
    const adminSupabase = getSupabaseAdminClient(requestId)
    const { data: signedUrlData, error: signedUrlError } = await adminSupabase.storage
      .from('course-materials')
      .createSignedUrl(storagePath, 300)

    if (signedUrlError) {
      throw signedUrlError
    }

    // Format the response
    const formattedResponse = {
      id: courseMaterial.id,
      courseId: courseMaterial.course_id,
      courseName: null, // We don't have the course name in the inserted data, but we can fetch it if needed
      title: courseMaterial.title,
      type: courseMaterial.type,
      storagePath: courseMaterial.storage_path,
      uploadedBy: {
        id: profile.id,
        fullName: profile.full_name,
        role: profile.role,
      },
      createdAt: courseMaterial.created_at,
      signedUrl: signedUrlData?.signedUrl ?? null,
    }

    return NextResponse.json(
      {
        data: formattedResponse,
        message: 'Course material uploaded successfully',
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return unexpectedApiError(error, 'Unable to upload course material')
  }
}

export const GET = withApi({ roles: rolesFor('materials', 'read') }, async ({ request, requestId }) =>
  getCourseMaterials(request as NextRequest, requestId),
)
export const POST = withApi(
  {
    roles: rolesFor('materials', 'create'),
    mutationContentTypes: ['multipart/form-data'],
  },
  async ({ request, requestId }) => postCourseMaterial(request as NextRequest, requestId),
)

const deleteMaterialQuery = z.object({ id: z.string().uuid() })
export const DELETE = withApi(
  { roles: rolesFor('materials', 'delete'), query: deleteMaterialQuery },
  async ({ supabase, query }) => {
    const client = supabase!
    const { data: material, error: lookupError } = await client
      .from('course_materials')
      .select('id,storage_path')
      .eq('id', query.id)
      .maybeSingle()
    if (lookupError) throw lookupError
    if (!material) return NextResponse.json({ error: 'Material not found.' }, { status: 404 })
    const { error: storageError } = await client.storage.from('course-materials').remove([material.storage_path])
    if (storageError) throw storageError
    const { error: deleteError } = await client.from('course_materials').delete().eq('id', material.id)
    if (deleteError) throw deleteError
    return { deleted: true }
  },
)
