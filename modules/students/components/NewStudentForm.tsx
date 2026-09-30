'use client'

import { useRouter } from 'next/navigation'
import type { Course } from '@/lib/types'
import { AddStudent } from '@/modules/students/components/AddStudent'
import { useCreateStudentMutation } from '@/lib/query/mutations'

export function NewStudentForm({ courses, gstRate }: { courses: Course[]; gstRate: number }) {
  const router = useRouter()
  const createStudent = useCreateStudentMutation()
  return (
    <AddStudent
      courses={courses}
      gstRate={gstRate}
      onClose={() => router.back()}
      onSave={async (student) => {
        const result = await createStudent.mutateAsync(student)
        router.push(result.data.data.registerId ? `/students/${result.data.data.registerId}` : '/students')
      }}
    />
  )
}
