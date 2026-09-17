import { useState } from 'react'
import type { Student } from '@/lib/types'

const COURSE_OPTIONS = [
  'Professional Course',
  'ThoorigAI Course - Internship',
  'Crash Course (1.5 Months)',
  'Slash Course (1 Month)',
  'Full Stack Development',
  'Data Science & AI',
  'UI/UX Design Masterclass',
]

export function AddStudent({ onClose, onSave }: { onClose: () => void; onSave: (s: any) => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [course, setCourse] = useState(COURSE_OPTIONS[0])
  const [batch, setBatch] = useState(new Date().toISOString().slice(0, 10))
  const [total, setTotal] = useState('')
  const [paid, setPaid] = useState('')
  const [error, setError] = useState('')

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!name.trim()) {
      setError('Please enter the student\'s full name.')
      return
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }
    const totalNum = Number(total)
    const paidNum = Number(paid || 0)
    if (isNaN(totalNum) || totalNum <= 0) {
      setError('Please specify valid total fees.')
      return
    }
    if (isNaN(paidNum) || paidNum < 0 || paidNum > totalNum) {
      setError('Paid amount cannot exceed total fees.')
      return
    }

    setError('')
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      course,
      batch: batch || new Date().toISOString().slice(0, 10),
      total: totalNum,
      paid: paidNum
    })
  }

  return (
    <div className="flex justify-center items-start py-4 px-2 w-full">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Add New Student</h2>
          <p className="text-sm text-gray-500 mt-1">Enter the student's enrollment and fee details.</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Form Fields Grid */}
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Row 1: Full Name & Mobile Number */}
            <div>
              <label htmlFor="student-name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="student-name"
                type="text"
                required
                placeholder="e.g. Kavya Srinivasan"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="student-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number (10-digit) <span className="text-red-500">*</span>
              </label>
              <input
                id="student-phone"
                type="tel"
                required
                maxLength={10}
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Row 2: Course & Batch */}
            <div>
              <label htmlFor="student-course" className="block text-sm font-medium text-gray-700 mb-1">
                Professional Course <span className="text-red-500">*</span>
              </label>
              <select
                id="student-course"
                value={course}
                onChange={e => setCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {COURSE_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="student-batch" className="block text-sm font-medium text-gray-700 mb-1">
                Batch Start Date <span className="text-red-500">*</span>
              </label>
              <input
                id="student-batch"
                type="date"
                required
                value={batch}
                onChange={e => setBatch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Row 3: Total Fees & Paid Amount */}
            <div>
              <label htmlFor="student-total" className="block text-sm font-medium text-gray-700 mb-1">
                Total Fees (₹) <span className="text-red-500">*</span>
              </label>
              <input
                id="student-total"
                type="number"
                min="0"
                required
                placeholder="e.g. 42000"
                value={total}
                onChange={e => setTotal(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="student-paid" className="block text-sm font-medium text-gray-700 mb-1">
                Paid Amount (₹)
              </label>
              <input
                id="student-paid"
                type="number"
                min="0"
                placeholder="e.g. 20000"
                value={paid}
                onChange={e => setPaid(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              className="bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
            >
              Save student
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}