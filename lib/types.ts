export type View = 'Dashboard' | 'Students' | 'Certificates' | 'Invoices' | 'Reports'

export type StudentStatus = 'Fully Paid' | 'Pending'

export type Student = {
  registerId: number
  name: string
  course: string
  batch: string
  total: number
  paid: number
  phone: string
  status: StudentStatus
}

export type Payment = {
  id: string
  student: string
  method: string
  date: string
  amount: number
  invoice: string
  studentId: number
}

export type Receipt = Payment & {
  cgst: number
  sgst: number
}
