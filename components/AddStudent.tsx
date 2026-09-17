import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import type { Course, Student } from '@/lib/types'
import { money } from '@/lib/formatters'

const DEFAULT_COURSE_OPTIONS = [
  'Professional Course',
  'ThoorigAI Course - Internship',
  'Crash Course (1.5 Months)',
  'Slash Course (1 Month)',
  'Full Stack Development',
  'Data Science & AI',
  'UI/UX Design Masterclass',
]

export function AddStudent({
  courses,
  onClose,
  onSave,
  gstRate = 18,
}: {
  courses?: Course[]
  onClose: () => void
  onSave: (s: any) => void
  gstRate?: number
}) {
  const courseList = courses && courses.length > 0 ? courses.map(c => c.name) : DEFAULT_COURSE_OPTIONS
  const initialCourse = courseList[0]
  const initialFee = courses?.find(c => c.name === initialCourse)?.fee

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [course, setCourse] = useState(initialCourse)
  const [batch, setBatch] = useState(new Date().toISOString().slice(0, 10))
  const [total, setTotal] = useState(initialFee ? String(initialFee) : '')
  const [paid, setPaid] = useState('')
  const [error, setError] = useState('')

  const handleCourseChange = (selectedCourseName: string) => {
    setCourse(selectedCourseName)
    const match = courses?.find(c => c.name === selectedCourseName)
    if (match) {
      setTotal(String(match.fee))
    }
  }

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
      setError('Please specify valid base course fees.')
      return
    }
    if (isNaN(paidNum) || paidNum < 0 || paidNum > totalNum) {
      setError('Initial payment cannot exceed base course fees.')
      return
    }

    onSave({
      name: name.trim(),
      phone: phone.trim(),
      course,
      batch,
      total: totalNum,
      paid: paidNum,
    })
  }

  const baseFeeNum = Number(total) || 0
  const gstAmount = gstRate > 0 ? Math.round(baseFeeNum * (gstRate / 100)) : 0
  const grandTotal = baseFeeNum + gstAmount

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Register New Student
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Enroll student, assign course tuition fee, and issue initial payment receipt.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-600 flex items-center gap-2 shrink-0">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body with smooth scroll if screen is small */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                Mobile Number <span className="text-red-500">*</span>
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
          </div>

          {/* Row 2: Course & Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="student-course" className="block text-sm font-medium text-gray-700 mb-1">
                Professional Course <span className="text-red-500">*</span>
              </label>
              <select
                id="student-course"
                value={course}
                onChange={e => handleCourseChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {courseList.map(c => (
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
          </div>

          {/* Row 3: Total Fees & Paid Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="student-total" className="block text-sm font-medium text-gray-700 mb-1">
                Tuition Fee (₹) <span className="text-red-500">*</span>
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
              <span className="text-[11px] text-gray-400 mt-0.5 block">Exclusive of GST</span>
            </div>

            <div>
              <label htmlFor="student-paid" className="block text-sm font-medium text-gray-700 mb-1">
                Initial Payment (₹)
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
              <span className="text-[11px] text-gray-400 mt-0.5 block">Generates invoice immediately</span>
            </div>
          </div>

          {/* Fee + GST Breakdown Card */}
          {baseFeeNum > 0 && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 text-gray-700">
              <div className="font-semibold text-gray-900 flex items-center justify-between">
                <span>Fee Breakdown</span>
                <span className="text-slate-500 font-normal">
                  {gstRate > 0 ? `GST @ ${gstRate}% (9% CGST + 9% SGST)` : 'GST Disabled'}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Base Tuition Fee:</span>
                <span className="font-medium text-gray-900">{money(baseFeeNum)}</span>
              </div>
              {gstRate > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Applicable GST ({gstRate}%):</span>
                  <span className="font-medium text-gray-900">+{money(gstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1.5 border-t border-slate-200 text-sm font-bold text-gray-900">
                <span>Total Payable:</span>
                <span className="text-blue-600">{money(grandTotal)}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
            >
              Save Student
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}