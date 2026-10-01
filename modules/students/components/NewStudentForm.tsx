'use client'

import { useRouter } from 'next/navigation'
import type { Course, Role } from '@/lib/types'
import { AddStudent } from '@/modules/students/components/AddStudent'
import { useCreateStudentMutation } from '@/lib/query/mutations'

export function NewStudentForm({
  courses,
  gstRate,
  role = 'admin',
}: {
  courses: Course[]
  gstRate: number
  role?: Role
}) {
  const router = useRouter()
  const createStudent = useCreateStudentMutation()
  return (
    <AddStudent
      courses={courses}
      gstRate={gstRate}
      role={role}
      onClose={() => router.back()}
      onSave={async (student) => {
        const result = await createStudent.mutateAsync(student)
        router.push(result.data.data.registerId ? `/students/${result.data.data.registerId}` : '/students')
      }}
    />
  )
}
