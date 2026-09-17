export type View = 'Dashboard' | 'Students' | 'Courses' | 'Certificates' | 'Invoices' | 'Reports' | 'Settings'

export type GstSettings = {
  rate: number
  gstin: string
  enabled: boolean
}

export type Course = {
  id: string
  name: string
  fee: number
  duration: string
  description?: string
}

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
  gender?: 'Male' | 'Female' | 'Others'
  dob?: string
  altPhone?: string
  maritalStatus?: string
  email?: string
  country?: string
  state?: string
  city?: string
  area?: string
  leadType?: 'Hot' | 'Warm' | 'Cold'
  leadSource?: string
  comments?: string
  knowledgeTags?: string[]
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
