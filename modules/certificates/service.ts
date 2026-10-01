'server-only'

import { createClient } from '@/lib/supabase/server'
import { listCertificates } from '@/lib/server-data'
import { getStudentDetail } from '@/modules/students/service'
import type { CertificateRecord, Student } from '@/lib/types'

export async function listCertificatePage(options: {
  page: number
  pageSize: number
  search: string
  sort: string
  direction: 'asc' | 'desc'
  categoryId?: string
  course?: string
}) {
  const supabase = await createClient()
  const sort = ['issue_date', 'student_name', 'certificate_id'].includes(options.sort)
  ? (options.sort as 'issue_date' | 'student_name' | 'certificate_id')
    : 'issue_date'
  return listCertificates(supabase, {
    ...options,
    sort,
    direction: options.direction,
    categoryId: options.categoryId,
    course: options.course,
  })
}

export async function getCertificateDetail(certificateIdentifier: string) {
  const supabase = await createClient()
  const cleanId = decodeURIComponent(certificateIdentifier).trim()

  let query = supabase.from('certificates').select('*')
  if (cleanId.includes('-')) {
    query = query.or(`certificate_id.eq.${cleanId},id.eq.${cleanId}`)
  } else {
    query = query.eq('certificate_id', cleanId)
  }

  const { data: cert, error } = await query.maybeSingle()
  if (error || !cert) return null

  // Fetch verification code from verifiable_documents
  const { data: doc } = await supabase
    .from('verifiable_documents')
    .select('verification_code')
    .eq('reference_id', cert.id)
    .eq('doc_type', 'certificate')
    .maybeSingle()

  // Fetch student detail if exists
  let studentData: Student | null = null
  if (cert.student_register_id) {
    try {
      const studentRes = await getStudentDetail(Number(cert.student_register_id))
      studentData = studentRes?.student ?? null
    } catch {
      studentData = null
    }
  }

  const certificateRecord: CertificateRecord = {
    id: String(cert.id),
    certificateId: String(cert.certificate_id),
    studentRowId: cert.student_id ? String(cert.student_id) : undefined,
    studentRegisterId: Number(cert.student_register_id),
    studentName: String(cert.student_name),
    courseName: String(cert.course_name),
    startDate: cert.start_date ? String(cert.start_date) : undefined,
    endDate: cert.end_date ? String(cert.end_date) : undefined,
    issueDate: String(cert.issue_date),
    skills: Array.isArray(cert.skills) ? cert.skills : [],
    directorName: cert.director_name ? String(cert.director_name) : undefined,
    trainerName: cert.trainer_name ? String(cert.trainer_name) : undefined,
    verificationCode: doc?.verification_code,
  }

  const fallbackStudent: Student = studentData ?? {
    id: String(cert.student_id || cert.id),
    registerId: Number(cert.student_register_id),
    name: String(cert.student_name),
    course: String(cert.course_name),
    batch: cert.start_date || cert.issue_date,
    total: 0,
    paid: 0,
    phone: '',
    status: 'Fully Paid',
  }

  return {
    certificate: certificateRecord,
    student: fallbackStudent,
  }
}
