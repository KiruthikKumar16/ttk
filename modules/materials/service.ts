import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { NotFoundError } from '@/lib/http/errors'
import type { CourseMaterial } from '@/modules/materials/types'
import { normalizeJoined } from '@/lib/supabase/relations'

export async function listCourseMaterials(
  courseId: string,
  page: number,
  pageSize: number,
): Promise<{ courseName: string; data: CourseMaterial[] }> {
  const supabase = await createClient()
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('name')
    .eq('id', courseId)
    .maybeSingle()
  if (courseError) throw courseError
  if (!course) throw new NotFoundError('Course was not found.')
  const offset = (page - 1) * pageSize
  const { data, error } = await supabase
    .from('course_materials')
    .select(
      'id,course_id,title,type,storage_path,uploaded_by,created_at,courses(id,name),profiles(id,full_name,role)',
      { count: 'exact' },
    )
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)
  if (error) throw error
  const materials = await Promise.all(
    (data ?? []).map(async (material) => {
      const courseData = normalizeJoined(material.courses)
      const profile = normalizeJoined(material.profiles)
      let signedUrl: string | null = null
      const { data: urlData, error: urlError } = await supabase.storage
        .from('course-materials')
        .createSignedUrl(material.storage_path, 3600)
      if (urlError) {
        const isNotFound =
          (urlError as any).statusCode === '404' ||
          (urlError as any).code === 'NoSuchKey' ||
          urlError.message?.toLowerCase().includes('not found')
        if (isNotFound) {
          signedUrl = null
        } else {
          throw urlError
        }
      } else if (urlData?.signedUrl) {
        signedUrl = urlData.signedUrl
      }
      return {
        id: String(material.id),
        courseId: String(material.course_id),
        courseName: String(courseData?.name ?? course.name),
        title: String(material.title),
        type: String(material.type),
        storagePath: String(material.storage_path),
        uploadedBy: profile
          ? { id: String(profile.id), fullName: String(profile.full_name), role: String(profile.role) }
          : null,
        createdAt: String(material.created_at),
        signedUrl,
      }
    }),
  )
  return { courseName: String(course.name), data: materials }
}
