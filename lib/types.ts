export type View = 'Dashboard' | 'Students' | 'Certificates' | 'Courses' | 'Invoices' | 'Reports' | 'Settings' | 'Audit Log' | 'Attendance' | 'Assessments' | 'SimpleView'

export type Role = 'admin' | 'staff' | 'trainer'

export type GstSettings = {
  rate: number
  gstin: string | null
  enabled: boolean
}

export type Course = {
  id: string
  name: string
  /** Rupees at the API/UI boundary; the database stores integer paise. */
  fee: number
  duration: string
  description?: string
  gstInclusive?: boolean
  createdAt?: string
  updatedAt?: string
}

export type StudentStatus = 'Fully Paid' | 'Pending'

export type Student = {
  /** Internal UUID-style row id from the database */
  id?: string
  /** Business-facing student register id (human-usable number) */
  registerId: number
  name: string
  course: string
  /** ISO date string YYYY-MM-DD or display string depending on source */
  batch: string
  /** Rupees at the API/UI boundary; the database stores integer paise. */
  total: number
  /** Rupees at the API/UI boundary; the database stores integer paise. */
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
  /** Rupees at the API/UI boundary; the database stores integer paise. */
  amount: number
  /** Invoice reference in the configured brand format */
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
  /** CGST in rupees at the API/UI boundary; the database stores integer paise. */
  cgst?: number
  /** SGST in rupees at the API/UI boundary; the database stores integer paise. */
  sgst?: number
  /** ISO date (YYYY-MM-DD) — used when read from storage; same info as .date */
  paymentDate?: string
  /** Verification code for public verification */
  verification_code?: string
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
  verificationCode?: string
  skills?: string[]
  directorName?: string
  trainerName?: string
  customNote?: string
  issuedAt?: string
}
