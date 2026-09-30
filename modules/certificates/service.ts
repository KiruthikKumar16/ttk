import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { listCertificates } from '@/lib/server-data'

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
