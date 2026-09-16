import type { Payment, Student } from './types'

export const initialStudents: Student[] = [
  { registerId: 1048, name: 'Kavya Srinivasan', course: 'Professional Course', batch: '12 Aug 2026', total: 42000, paid: 42000, phone: '9876543210', status: 'Fully Paid' },
  { registerId: 1047, name: 'Arjun Prakash', course: 'ThoorigAI Course - Internship', batch: '09 Aug 2026', total: 36000, paid: 18000, phone: '9840123456', status: 'Pending' },
  { registerId: 1046, name: 'Meena Lakshmi', course: 'Crash Course (1.5 Months)', batch: '04 Aug 2026', total: 24000, paid: 24000, phone: '9962012345', status: 'Fully Paid' },
  { registerId: 1045, name: 'Rohit Kumar', course: 'Slash Course (1 Month)', batch: '28 Jul 2026', total: 18000, paid: 9000, phone: '9789012345', status: 'Pending' },
  { registerId: 1044, name: 'Divya Narayanan', course: 'Professional Course', batch: '20 Jul 2026', total: 42000, paid: 42000, phone: '9884312345', status: 'Fully Paid' },
]

export const initialPayments: Payment[] = [
  { id: 'RCPT-1086', student: 'Kavya Srinivasan', method: 'UPI', date: '14 Sep 2026', amount: 12000, invoice: 'TAI/2026/INV086', studentId: 1048 },
  { id: 'RCPT-1085', student: 'Arjun Prakash', method: 'Bank Transfer', date: '13 Sep 2026', amount: 18000, invoice: 'TAI/2026/INV085', studentId: 1047 },
  { id: 'RCPT-1084', student: 'Meena Lakshmi', method: 'Cash', date: '11 Sep 2026', amount: 12000, invoice: 'TAI/2026/INV084', studentId: 1046 },
  { id: 'RCPT-1083', student: 'Rohit Kumar', method: 'UPI', date: '09 Sep 2026', amount: 9000, invoice: 'TAI/2026/INV083', studentId: 1045 },
]
