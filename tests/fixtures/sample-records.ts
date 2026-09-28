import type { Course, Payment, Student } from '@/lib/types'

export const sampleCourse: Course = {
  id: 'FIXTURE-COURSE',
  name: 'Sample Training Course',
  fee: 42000,
  duration: '6 Months',
  description: 'Fixture course for API and component tests.',
  gstInclusive: false,
}

export const sampleStudent: Student = {
  registerId: 9999,
  name: 'Test Student',
  course: sampleCourse.name,
  batch: '01 Jan 2026',
  total: 42000,
  paid: 0,
  phone: '9000000000',
  status: 'Pending',
}

export const samplePayment: Payment = {
  id: 'FIXTURE-RECEIPT',
  student: sampleStudent.name,
  method: 'UPI',
  date: '01 Jan 2026',
  amount: 1000,
  invoice: 'TAI/2026/FIXTURE',
  studentId: sampleStudent.registerId,
}
