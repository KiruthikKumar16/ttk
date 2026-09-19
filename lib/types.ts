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
  gstInclusive?: boolean
  createdAt?: string
  updatedAt?: string
}

export type StudentStatus = 'Fully Paid' | 'Pending'

export type Student = {
  /** Internal UUID-style row id (Supabase only, optional for mock) */
  id?: string
  /** Business-facing student register id (human-usable number) */
  registerId: number
  name: string
  course: string
  /** ISO date string YYYY-MM-DD or display string depending on source */
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
  /** How the student was sourced / referred */
  studentSource?: string
  /** Free-form admin comments */
  comments?: string
  /** Tags (Python, Java, Marketing, etc.) */
  knowledgeTags?: string[]
  createdAt?: string
  updatedAt?: string
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Online Transfer' | 'Cheque' | 'Card' | (string & {})

export type Payment = {
  id: string
  /** Student full name (for display) */
  student: string
  /** How the payment was made */
  method: PaymentMethod
  /** UI date string — 'DD Mmm YYYY' (format preserved for display) */
  date: string
  /** Amount before GST if GST-inclusive course, else base amount */
  amount: number
  /** Invoice reference e.g. TAI/2026/INVxxxxxx */
  invoice: string
  /** Matches Student.registerId */
  studentId: number
  /** Internal student row id (Supabase only, optional) */
  studentRowId?: string
  /** Optional bank / UPI transaction reference */
  transactionId?: string
  /** Optional custom note shown on invoice */
  customNote?: string
  /** GST percent applied (from gst_settings at time of payment) */
  gstRate?: number
  /** CGST portion (computed from gstRate on base taxable amount) */
  cgst?: number
  /** SGST portion */
  sgst?: number
  /** ISO date (YYYY-MM-DD) — used when read from storage; same info as .date */
  paymentDate?: string
  createdAt?: string
}

export type Receipt = Payment & {
  cgst: number
  sgst: number
}

export type CertificateRecord = {
  id?: string
  certificateId: string
  studentRowId?: string
  studentRegisterId: number
  courseName: string
  studentName: string
  startDate?: string
  endDate?: string
  issueDate: string
  skills?: string[]
  directorName?: string
  trainerName?: string
  customNote?: string
  issuedAt?: string
}
