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

const LEAD_SOURCES = [
  'Walk-in',
  'Website',
  'Social Media',
  'Reference',
  'Call / WhatsApp',
  'Campus Drive',
  'Google Search',
  'Poster / Banner',
  'Other',
]

const CITIES = [
  'Tuticorin',
  'Tirunelveli',
  'Madurai',
  'Chennai',
  'Coimbatore',
  'Trichy',
  'Salem',
  'Nagercoil',
  'Other',
]

const AVAILABLE_TAGS = [
  'Python',
  'Web Dev',
  'React',
  'AI/ML',
  'Full Stack',
  'UI/UX',
  'Internship',
  'College Student',
  'Job Seeker',
  'Beginner',
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

  // Core fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [course, setCourse] = useState(initialCourse)
  const [batch, setBatch] = useState(new Date().toISOString().slice(0, 10))
  const [total, setTotal] = useState(initialFee ? String(initialFee) : '')
  const [paid, setPaid] = useState('')
  const [error, setError] = useState('')

  // New Lead fields matching reference design
  const [gender, setGender] = useState<'Male' | 'Female' | 'Others'>('Male')
  const [dob, setDob] = useState('')
  const [altPhone, setAltPhone] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('Single')
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('India')
  const [state, setState] = useState('Tamil Nadu')
  const [city, setCity] = useState('Tuticorin')
  const [area, setArea] = useState('')
  const [leadType, setLeadType] = useState<'Hot' | 'Warm' | 'Cold'>('Hot')
  const [leadSource, setLeadSource] = useState('Walk-in')
  const [comments, setComments] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>(['Web Dev'])

  const handleCourseChange = (selectedCourseName: string) => {
    setCourse(selectedCourseName)
    const match = courses?.find(c => c.name === selectedCourseName)
    if (match) {
      setTotal(String(match.fee))
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!name.trim()) {
      setError('Please enter the lead / student name.')
      return
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }
    const totalNum = Number(total)
    const paidNum = Number(paid || 0)
    if (isNaN(totalNum) || totalNum <= 0) {
      setError('Please specify valid base course tuition fees.')
      return
    }
    if (isNaN(paidNum) || paidNum < 0 || paidNum > totalNum) {
      setError('Initial payment cannot exceed base course tuition fees.')
      return
    }

    onSave({
      name: name.trim(),
      phone: phone.trim(),
      course,
      batch,
      total: totalNum,
      paid: paidNum,
      gender,
      dob: dob || undefined,
      altPhone: altPhone.trim() || undefined,
      maritalStatus,
      email: email.trim() || undefined,
      country,
      state,
      city,
      area: area.trim() || undefined,
      leadType,
      leadSource,
      comments: comments.trim() || undefined,
      knowledgeTags: selectedTags,
    })
  }

  const baseFeeNum = Number(total) || 0
  const gstAmount = gstRate > 0 ? Math.round(baseFeeNum * (gstRate / 100)) : 0
  const grandTotal = baseFeeNum + gstAmount

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-3xl my-6 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Create Lead / Register Student
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Fill in student profile, communication channels, location details, and tuition fees.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-600 flex items-center gap-2 shrink-0">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto max-h-[78vh]">
          {/* Row 1: Lead Name, Gender, DOB */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="lead-name" className="block text-xs font-semibold text-gray-700 mb-1">
                Lead Name <span className="text-red-500">*</span>
              </label>
              <input
                id="lead-name"
                type="text"
                required
                placeholder="Enter Lead Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4 pt-1">
                {(['Male', 'Female', 'Others'] as const).map(g => (
                  <label key={g} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={gender === g}
                      onChange={() => setGender(g)}
                      className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="lead-dob" className="block text-xs font-semibold text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                id="lead-dob"
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Row 2: Mobile Number, Alternate Mobile, Marital Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="lead-mobile" className="block text-xs font-semibold text-gray-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-2.5 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs font-medium">
                  IN - +91
                </span>
                <input
                  id="lead-mobile"
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="Enter Mobile Number"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-r-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="lead-alt-mobile" className="block text-xs font-semibold text-gray-700 mb-1">
                Alternate Mobile Number
              </label>
              <input
                id="lead-alt-mobile"
                type="tel"
                maxLength={10}
                placeholder="Enter Alternate Mobile Number"
                value={altPhone}
                onChange={e => setAltPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="lead-marital" className="block text-xs font-semibold text-gray-700 mb-1">
                Marital Status
              </label>
              <select
                id="lead-marital"
                value={maritalStatus}
                onChange={e => setMaritalStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Unspecified">Unspecified</option>
              </select>
            </div>
          </div>

          {/* Row 3: Email, Country, State */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="lead-email" className="block text-xs font-semibold text-gray-700 mb-1">
                Email ID
              </label>
              <input
                id="lead-email"
                type="email"
                placeholder="Enter E-Mail ID"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="lead-country" className="block text-xs font-semibold text-gray-700 mb-1">
                Country
              </label>
              <select
                id="lead-country"
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="India">India</option>
                <option value="Singapore">Singapore</option>
                <option value="Malaysia">Malaysia</option>
                <option value="UAE">UAE</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="lead-state" className="block text-xs font-semibold text-gray-700 mb-1">
                State
              </label>
              <select
                id="lead-state"
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Kerala">Kerala</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Telangana">Telangana</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Row 4: City, Area / Street, Lead Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="lead-city" className="block text-xs font-semibold text-gray-700 mb-1">
                City
              </label>
              <select
                id="lead-city"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="lead-area" className="block text-xs font-semibold text-gray-700 mb-1">
                Area / Street
              </label>
              <input
                id="lead-area"
                type="text"
                placeholder="Enter Area / Street"
                value={area}
                onChange={e => setArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="lead-type" className="block text-xs font-semibold text-gray-700 mb-1">
                Lead Type
              </label>
              <select
                id="lead-type"
                value={leadType}
                onChange={e => setLeadType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="Hot">Hot (Ready to enroll)</option>
                <option value="Warm">Warm (Follow up)</option>
                <option value="Cold">Cold (Inquiry only)</option>
              </select>
            </div>
          </div>

          {/* Row 5: Lead Source & Comments */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="lead-source" className="block text-xs font-semibold text-gray-700 mb-1">
                Lead Source <span className="text-red-500">*</span>
              </label>
              <select
                id="lead-source"
                value={leadSource}
                onChange={e => setLeadSource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {LEAD_SOURCES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="lead-comments" className="block text-xs font-semibold text-gray-700 mb-1">
                Comments
              </label>
              <textarea
                id="lead-comments"
                rows={2}
                placeholder="Enter counselor notes, special requirements, or background..."
                value={comments}
                onChange={e => setComments(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Row 6: Course & Batch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label htmlFor="student-course" className="block text-xs font-semibold text-gray-700 mb-1">
                Course <span className="text-red-500">*</span>
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
              <label htmlFor="student-batch" className="block text-xs font-semibold text-gray-700 mb-1">
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

          {/* Row 7: Lead Knowledge Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Lead Knowledge Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map(tag => {
                const active = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-xs px-2.5 py-1 rounded-md transition-colors border ${
                      active 
                        ? 'bg-blue-600 text-white border-blue-600 font-medium' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {tag} {active && '✓'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Row 8: Tuition Fee & Initial Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label htmlFor="student-total" className="block text-xs font-semibold text-gray-700 mb-1">
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
              <span className="text-[11px] text-gray-400 mt-0.5 block">Base fee (exclusive of GST)</span>
            </div>

            <div>
              <label htmlFor="student-paid" className="block text-xs font-semibold text-gray-700 mb-1">
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

          {/* Fee Breakdown Preview */}
          {baseFeeNum > 0 && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 text-gray-700">
              <div className="font-semibold text-gray-900 flex items-center justify-between">
                <span>Fee Summary</span>
                <span className="text-slate-500 font-normal">
                  {gstRate > 0 ? `GST @ ${gstRate}% (9% CGST + 9% SGST)` : 'GST Disabled'}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Base Course Fee:</span>
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
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-5 py-2 rounded-md font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-slate-900 text-white hover:bg-slate-800 px-6 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
            >
              Create Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}