import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listCertificates } from '@/lib/server-data'
import { certificateSchema } from '@/lib/validation'
import { generateUniqueVerificationCode } from '@/lib/utils'
import type { CertificateRecord } from '@/lib/types'
import z from 'zod'
import { unexpectedApiError } from '@/lib/api-response'
import { pagePaginationFromSearchParams } from '@/lib/pagination'
import { validateMutationRequest } from '@/lib/security/csrf'
import { rateLimit } from '@/lib/security/rate-limit'
import { withApi } from '@/lib/http/handler'
import { rolesFor } from '@/lib/auth/permissions'

async function getCertificates(req: NextRequest) {
  // Cookie-bound client: RLS applies to every query in this handler.
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  const session = user ? { user } : null
  if (authError || !session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle()
  if (!currentProfile || !['admin', 'staff', 'trainer'].includes(currentProfile.role))
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 })

  try {
    const pagination = pagePaginationFromSearchParams(new URL(req.url).searchParams)
    const result = await listCertificates(supabase, { page: pagination.page, pageSize: pagination.pageSize })
    const mapped: CertificateRecord[] = result.data.map((row) => ({
      id: String(row.id),
      certificateId: String(row.certificate_id),
      studentRowId: row.student_id ? String(row.student_id) : undefined,
      studentRegisterId: Number(row.student_register_id),
      courseName: String(row.course_name),
      studentName: String(row.student_name),
      startDate: row.start_date ? String(row.start_date) : undefined,
      endDate: row.end_date ? String(row.end_date) : undefined,
      issueDate: String(row.issue_date),
      skills: Array.isArray(row.skills) ? row.skills : undefined,
      directorName: row.director_name ? String(row.director_name) : undefined,
      trainerName: row.trainer_name ? String(row.trainer_name) : undefined,
      customNote: row.custom_note ? String(row.custom_note) : undefined,
      issuedAt: row.issued_at ? String(row.issued_at) : undefined,
      verificationCode: row.verification_code ? String(row.verification_code) : undefined,
    }))
    return NextResponse.json({ ...result, data: mapped })
  } catch (error) {
    return unexpectedApiError(error, 'Unable to load certificates')
  }
}

async function postCertificate(req: NextRequest) {
  const rejected = validateMutationRequest(req)
  if (rejected) return rejected
  // Cookie-bound client: RLS applies to every query in this handler.
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  const session = user ? { user } : null
  if (authError || !session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Fetch the user's profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()
  if (profileError || !profile) {
    return unexpectedApiError(
      profileError ?? new Error('User profile was not found.'),
      'Unable to fetch certificate creator profile',
    )
  }

  // Only staff and admin can create certificates
  if (profile.role !== 'staff' && profile.role !== 'admin') {
    return new NextResponse(JSON.stringify({ error: 'Insufficient permissions to create certificate' }), {
      status: 403,
    })
  }
  const limit = await rateLimit(`user:${session.user.id}:/api/certificates`, 10, '15 m')
  if (!limit.success)
    return NextResponse.json(
      { error: 'Too many requests.' },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.retryAfterSeconds) },
      },
    )

  try {
    const body = await req.json()
    // Validate the request body with zod schema
    const parsedBody = certificateSchema.parse(body)

    const {
      certificateId,
      studentRegisterId,
      issueDate,
      startDate,
      endDate,
      skills,
      directorName,
      trainerName,
      customNote,
    } = parsedBody

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, register_id, name, course, paid, total')
      .eq('register_id', studentRegisterId)
      .maybeSingle()
    if (studentError) throw studentError
    if (!student) return NextResponse.json({ error: 'Student not found.' }, { status: 404 })
    if (Number(student.paid) < Number(student.total)) {
      return NextResponse.json(
        { error: 'Clear the outstanding course fees before issuing a certificate.' },
        { status: 409 },
      )
    }

    const payload: Record<string, unknown> = {
      certificate_id: certificateId,
      student_register_id: studentRegisterId,
      course_name: student.course,
      student_name: student.name,
      issue_date: issueDate,
      skills,
      director_name: directorName,
      trainer_name: trainerName,
      custom_note: customNote,
    }

    payload.student_id = student.id
    if (startDate) payload.start_date = startDate
    if (endDate) payload.end_date = endDate

    const { data, error } = await supabase.from('certificates').insert(payload).select().single()
    if (error) throw error

    const verificationCode = await generateUniqueVerificationCode(supabase)
    const { error: verificationError } = await supabase.from('verifiable_documents').insert({
      doc_type: 'certificate',
      reference_id: data.id,
      verification_code: verificationCode,
      status: 'active',
    })
    if (verificationError) throw verificationError

    return NextResponse.json(
      {
        message: 'Certificate recorded successfully',
        data: {
          id: String(data.id),
          certificateId: String(data.certificate_id),
          studentRowId: data.student_id ? String(data.student_id) : undefined,
          studentRegisterId: Number(data.student_register_id),
          courseName: String(data.course_name),
          studentName: String(data.student_name),
          startDate: data.start_date ? String(data.start_date) : undefined,
          endDate: data.end_date ? String(data.end_date) : undefined,
          issueDate: String(data.issue_date),
          skills: Array.isArray(data.skills) ? data.skills : undefined,
          directorName: data.director_name ? String(data.director_name) : undefined,
          trainerName: data.trainer_name ? String(data.trainer_name) : undefined,
          customNote: data.custom_note ? String(data.custom_note) : undefined,
          issuedAt: data.issued_at ? String(data.issued_at) : undefined,
          verificationCode: undefined,
        } as CertificateRecord,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return unexpectedApiError(error, 'Unable to record certificate')
  }
}

export const GET = withApi({ roles: rolesFor('certificates', 'read') }, async ({ request }) =>
  getCertificates(request as NextRequest),
)
export const POST = withApi({ roles: rolesFor('certificates', 'create') }, async ({ request }) =>
  postCertificate(request as NextRequest),
)
