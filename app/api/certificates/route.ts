import { NextResponse } from 'next/server'
import { listCertificates } from '@/lib/server-data'
import { supabase } from '@/lib/supabase/server'
import type { CertificateRecord } from '@/lib/types'

export async function GET() {
  try {
    if (supabase) {
      const rows = await listCertificates()
      const mapped: CertificateRecord[] = rows.map((row: any) => ({
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
    }
    return NextResponse.json({ data: [], count: 0, source: 'mock' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load certificates' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const certificateId = String(body.certificateId ?? body.certificate_id ?? '').trim()
    const studentRegisterId = Number(body.studentRegisterId ?? body.student_register_id)
    const courseName = String(body.courseName ?? body.course_name ?? '').trim()
    const studentName = String(body.studentName ?? body.student_name ?? '').trim()
    const issueDate = String(body.issueDate ?? body.issue_date ?? new Date().toISOString().slice(0, 10))

    if (!certificateId || !Number.isFinite(studentRegisterId) || !courseName || !studentName) {
      return NextResponse.json(
        { error: 'certificateId, studentRegisterId, courseName, and studentName are required.' },
        { status: 400 }
      )
    }

    const studentRowId = body.studentRowId ?? body.student_id ?? null
    const startDate = body.startDate ?? body.start_date ?? null
    const endDate = body.endDate ?? body.end_date ?? null
    const skills = Array.isArray(body.skills) ? body.skills : []
    const directorName = body.directorName ?? body.director_name ?? null
    const trainerName = body.trainerName ?? body.trainer_name ?? null
    const customNote = body.customNote ?? body.custom_note ?? null

    if (!supabase) {
      return NextResponse.json(
        {
          message: 'Certificate received (mock mode — no Supabase configured)',
          data: {
            certificateId,
            studentRegisterId,
            courseName,
            studentName,
            issueDate,
            startDate,
            endDate,
            skills,
            directorName,
            trainerName,
            customNote,
          } as CertificateRecord,
          source: 'mock',
        },
        { status: 201 }
      )
    }

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to record certificate' },
      { status: 500 }
    )
  }
}
