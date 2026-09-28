'use client'

import { useMemo, useState, useEffect } from 'react'
import type { Payment, Receipt, Student, View, GstSettings, Course, CertificateRecord } from '@/lib/types'
import { initialPayments, initialStudents } from '@/lib/mock-data'

import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { Dashboard } from '@/components/Dashboard'
import { Students } from '@/components/Students'
import { StudentDetail } from '@/components/StudentDetail'
import { CertificatePrint } from '@/components/CertificatePrint'
import { InvoicePrint } from '@/components/InvoicePrint'
import { AddStudent } from '@/components/AddStudent'
import { CoursesManager } from '@/components/CoursesManager'
import { GstSettingsPage } from '@/components/GstSettings'
import { SimpleView } from '@/components/SimpleView'
import { AuditLog } from '@/components/AuditLog' // Import the new AuditLog component
import { Assessments } from '@/components/Assessments' // Import the new Assessments component

export default function Page() {
  const [view, setView] = useState<View>('Dashboard')
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [allCertificates, setAllCertificates] = useState<CertificateRecord[]>([])
  const [allGst, setAllGst] = useState<GstSettings>({ rate: 18, gstin: '33AAZFT3654J1ZI', enabled: true })

  // Pagination state for Students and Payments views
  const [studentsPage, setStudentsPage] = useState(1)
  const [paymentsPage, setPaymentsPage] = useState(1)
  const [studentsTotalCount, setStudentsTotalCount] = useState(0)
  const [paymentsTotalCount, setPaymentsTotalCount] = useState(0)
  const [paginatedStudents, setPaginatedStudents] = useState<Student[]>([])
  const [paginatedPayments, setPaginatedPayments] = useState<Payment[]>([])

  // State for Assessments view (managed by the Assessments component itself)
  // We don't need to add state here because the Assessments component manages its own filters and pagination

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedCertificate, setSelectedCertificate] = useState<Student | null>(null)
  const [adding, setAdding] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const selected = allStudents.find(s => s.registerId === selectedId) ?? null

  const fetchAll = async () => {
    try {
      // Fetch all data (for Dashboard, etc.) with a large page size
      const [allStudentsRes, allPaymentsRes, allCoursesRes, allGstRes, allCertsRes] = await Promise.all([
        fetch('/api/students?page=1&pageSize=1000'),
        fetch('/api/payments?page=1&pageSize=1000'),
        fetch('/api/courses?page=1&pageSize=1000'),
        fetch('/api/gst'),
        fetch('/api/certificates?page=1&pageSize=1000'),
      ])

      // Helper to check response and throw error with message from body if available
      const checkResponse = async (res: Response, defaultMessage: string) => {
        if (!res.ok) {
          let errorMessage = defaultMessage
          try {
            const errData = await res.json()
            if (errData.error) errorMessage = errData.error
          } catch (e) {
            // If we can't parse json, use the default message
          }
          throw new Error(errorMessage)
        }
        return res.json()
      }

      const [
        allStudentsData,
        allPaymentsData,
        allCoursesData,
        allGstData,
        allCertsData,
      ] = await Promise.all([
        checkResponse(allStudentsRes, 'Failed to load students'),
        checkResponse(allPaymentsRes, 'Failed to load payments'),
        checkResponse(allCoursesRes, 'Failed to load courses'),
        checkResponse(allGstRes, 'Failed to load GST settings'),
        checkResponse(allCertsRes, 'Failed to load certificates'),
      ])

      if (allStudentsData.data) setAllStudents(allStudentsData.data)
      if (allPaymentsData.data) setAllPayments(allPaymentsData.data)
      if (allCoursesData.data) setAllCourses(allCoursesData.data)
      if (allGstData.data) setAllGst(allGstData.data)
      if (allCertsData.data) setAllCertificates(allCertsData.data)

      // Fetch paginated students for the Students view
      const studentsPageRes = await fetch(`/api/students?page=${studentsPage}&pageSize=50`)
      const studentsPageData = await checkResponse(studentsPageRes, 'Failed to load students page')
      if (studentsPageData.data) {
        setPaginatedStudents(studentsPageData.data)
        setStudentsTotalCount(studentsPageData.totalCount ?? 0)
      }

      // Fetch paginated payments for the Payments view (if needed elsewhere)
      const paymentsPageRes = await fetch(`/api/payments?page=${paymentsPage}&pageSize=50`)
      const paymentsPageData = await checkResponse(paymentsPageRes, 'Failed to load payments page')
      if (paymentsPageData.data) {
        setPaginatedPayments(paymentsPageData.data)
        setPaymentsTotalCount(paymentsPageData.totalCount ?? 0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      await fetchAll()
    }
    fetchData()
  }, [studentsPage, paymentsPage]) // Refetch when pagination page changes

  // Refetch after mutations
  const refetch = async () => {
    try {
      setLoading(true)
      setError(null)
      await fetchAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reload data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCourse = async (courseData: Partial<Course>) => {
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseData)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to save course')
    }
    await refetch()
  }

  const handleDeleteCourse = async (id: string) => {
    const res = await fetch(`/api/courses?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to delete course')
    }
    await refetch()
  }

  const save = async (s: Omit<Student, 'registerId'>) => {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s)
      })
      if (!res.ok) throw new Error('Failed to create student')
      const result = await res.json()
      await refetch()
      setAdding(false)
      if (result.payment) {
        setSelectedInvoice(result.payment)
      } else if (result.data?.registerId) {
        setSelectedId(result.data.registerId)
      } else {
        setView('Students')
      }
    } catch (err) {
      setError('Failed to save student')
      console.error(err)
    }
  }

  const recordPayment = async (amount: number, method: string): Promise<Receipt | string> => {
    if (!selected) return 'Select a student first.'
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selected.registerId,
          amount,
          method,
          date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
        })
      })
      if (!res.ok) throw new Error('Failed to record payment')
      const data = await res.json()
      await refetch()
      return data as Receipt
    } catch (err) {
      if (err instanceof Error) return err.message
      return 'Unknown error'
    }
  }

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">Error: {error}</div>

  const renderContent = () => {
    if (selectedInvoice) return (
      <InvoicePrint
        payment={selectedInvoice}
        student={allStudents.find(s => s.registerId === selectedInvoice.studentId)!}
        onBack={() => setSelectedInvoice(null)}
        gstRate={allGst.enabled ? allGst.rate : 0}
        courses={allCourses}
      />
    )
    if (selectedCertificate) return (
      <CertificatePrint
        student={selectedCertificate}
        onBack={() => {
          setSelectedCertificate(null)
          refetch()
        }}
      />
    )
    if (selectedId !== null) {
      const selectedStudent = allStudents.find(s => s.registerId === selectedId)!
      return (
        <StudentDetail
          student={selectedStudent}
          payments={allPayments} // Provide all payments for history filtering
          onBack={() => setSelectedId(null)}
          onPayment={recordPayment}
          onCertificate={() => setSelectedCertificate(selectedStudent)}
          onInvoice={setSelectedInvoice}
          gstRate={allGst.enabled ? allGst.rate : 0}
          courses={allCourses}
        />
      )
    }
    if (view === 'Dashboard') return (
      <Dashboard
        students={allStudents}
        payments={allPayments}
        setView={setView}
        onInvoice={setSelectedInvoice}
      />
    )
    if (view === 'Students') return (
      <Students
        students={paginatedStudents}
        onAdd={() => setAdding(true)}
        onSelect={(s: Student) => setSelectedId(s.registerId)}
        page={studentsPage}
        pageSize={50}
        totalCount={studentsTotalCount}
        onPageChange={setStudentsPage}
      />
    )
    if (view === 'Certificates') return (
      <Certificates
        students={allStudents}
        certificates={allCertificates}
        onCertificate={setSelectedCertificate}
      />
    )
    if (view === 'Courses') return (
      <CoursesManager
        courses={allCourses}
        onSaveCourse={handleSaveCourse}
        onDeleteCourse={handleDeleteCourse}
        gstRate={allGst.enabled ? allGst.rate : 0}
      />
    )
    if (view === 'Settings') return (
      <GstSettingsPage
        settings={allGst}
        onSave={async (s) => {
          const res = await fetch('/api/gst', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(s)
          })
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || 'Failed to save GST settings')
          }
          const result = await res.json()
          if (result.data) setAllGst(result.data)
        }}
      />
    )
    if (view === 'Audit Log') return (
      <AuditLog />
    )
    if (view === 'Attendance') return (
      <Attendance />
    )
    if (view === 'Assessments') return (
      <Assessments />
    )
    return (
      <SimpleView
        view={view}
        students={allStudents}
        payments={allPayments}
        onInvoice={setSelectedInvoice}
      />
    )
  }

  const handleSetView = (newView: View) => {
    setSelectedId(null)
    setSelectedInvoice(null)
    setSelectedCertificate(null)
    setAdding(false)
    setView(newView)
  }

  const handleRoot = () => {
    setSelectedId(null)
    setSelectedInvoice(null)
    setSelectedCertificate(null)
    setAdding(false)
    setView('Dashboard')
  }

  const handleClearDetail = () => {
    setSelectedId(null)
    setSelectedInvoice(null)
    setSelectedCertificate(null)
    setAdding(false)
  }

  return (
    <div className="app-shell">
      <Sidebar view={view} setView={handleSetView} collapsed={sidebarCollapsed} students={allStudents} />
      <div className="main-area">
        <Topbar
          view={view}
          onMenu={() => setSidebarCollapsed(c => !c)}
          students={allStudents}
          payments={allPayments}
          selectedStudent={selected}
          selectedInvoice={selectedInvoice}
          selectedCertificate={selectedCertificate}
          setView={handleSetView}
          onRoot={handleRoot}
          onClearDetail={handleClearDetail}
          onViewStudent={(s) => {
            setSelectedInvoice(null)
            setSelectedCertificate(null)
            setAdding(false)
            setSelectedId(s.registerId)
          }}
          onCertificate={(s) => {
            setSelectedInvoice(null)
            setAdding(false)
            setSelectedId(null)
            setSelectedCertificate(s)
          }}
          onInvoice={(p) => {
            setSelectedCertificate(null)
            setAdding(false)
            setSelectedId(null)
            setSelectedInvoice(p)
          }}
        />
        <div className="content">
          {renderContent()}
        </div>
      </div>
      {adding && (
        <AddStudent
          courses={allCourses}
          onClose={() => setAdding(false)}
          onSave={save}
          gstRate={allGst.enabled ? allGst.rate : 0}
        />
      )}
      <div className={'sidebar-mobile ' + (mobileOpen ? 'open' : '')} onClick={e => e.stopPropagation()}>
        <div onClick={e => e.stopPropagation()}></div>
      </div>
    </div>
  )
}