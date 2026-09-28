import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { listCertificates } from '@/lib/server-data'
import { certificateSchema } from '@/lib/validation'
import { generateUniqueVerificationCode } from '@/lib/utils'
import type { CertificateRecord } from '@/lib/types'
import z from 'zod'

export async function GET(req: NextRequest) {
  // Create a Supabase client with the anon key for this request
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const session = user ? { user } : null
  if (authError || !session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const rows = await listCertificates(supabase)
    const mapped: CertificateRecord[] = rows.map((row) => ({
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
    }))
    return NextResponse.json({ data: mapped, count: mapped.length, source: 'supabase' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load certificates' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  // Create a Supabase client with the anon key for this request
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
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
    return new NextResponse(JSON.stringify({ error: 'Unable to fetch user profile' }), { status: 500 })
  }

  // Only staff and admin can create certificates
  if (profile.role !== 'staff' && profile.role !== 'admin') {
    return new NextResponse(JSON.stringify({ error: 'Insufficient permissions to create certificate' }), { status: 403 })
  }

  try {
    const body = await req.json()
    // Validate the request body with zod schema
    const parsedBody = certificateSchema.parse(body)

    const {
      certificateId,
      studentRegisterId,
      courseName,
      studentName,
      issueDate,
      studentRowId,
      startDate,
      endDate,
      skills,
      directorName,
      trainerName,
      customNote,
    } = parsedBody

    const payload: Record<string, unknown> = {
      certificate_id: certificateId,
      student_register_id: studentRegisterId,
      course_name: courseName,
      student_name: studentName,
      issue_date: issueDate,
      skills,
      director_name: directorName,
      trainer_name: trainerName,
      custom_note: customNote,
    }

    if (studentRowId) payload.student_id = studentRowId
    if (startDate) payload.start_date = startDate
    if (endDate) payload.end_date = endDate

    const { data, error } = await supabase
      .from('certificates')
      .insert(payload)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Create verifiable document entry for this certificate (only in real Supabase mode)
    if (supabase) {
      try {
        const verificationCode = await generateUniqueVerificationCode(supabase);
        await supabase
          .from('verifiable_documents')
          .insert({
            doc_type: 'certificate',
            reference_id: data.id,
            verification_code: verificationCode,
            status: 'active'
          });
      } catch (verificationError) {
        // Log the error but don't fail the certificate creation
        console.error('Failed to create verifiable document entry:', verificationError);
      }
    }

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
        } as CertificateRecord,
        source: 'supabase',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to record certificate' },
      { status: 500 }
    )
  }
}