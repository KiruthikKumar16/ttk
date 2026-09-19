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
import { Certificates } from '@/components/Certificates'

export default function Page() {
  const [view, setView] = useState<View>('Dashboard')
  const [students, setStudents] = useState<Student[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [certificates, setCertificates] = useState<CertificateRecord[]>([])
  const [gst, setGst] = useState<GstSettings>({ rate: 18, gstin: '33AAZFT3654J1ZI', enabled: true })
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedCertificate, setSelectedCertificate] = useState<Student | null>(null)
  const [adding, setAdding] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const selected = students.find(s => s.registerId === selectedId) ?? null

  const fetchAll = async () => {
    const [studentsRes, paymentsRes, coursesRes, gstRes, certsRes] = await Promise.all([
      fetch('/api/students').then(res => res.json()),
      fetch('/api/payments').then(res => res.json()),
      fetch('/api/courses').then(res => res.json()),
      fetch('/api/gst').then(res => res.json()),
      fetch('/api/certificates').then(res => res.json()),
    ])
    if (studentsRes.data) setStudents(studentsRes.data)
    if (paymentsRes.data) setPayments(paymentsRes.data)
    if (coursesRes.data) setCourses(coursesRes.data)
    if (gstRes.data) setGst(gstRes.data)
    if (certsRes.data) setCertificates(certsRes.data)
  }

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        await fetchAll()
      } catch (err) {
        setError('Failed to load data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Refetch after mutations
  const refetch = async () => {
    try {
      setLoading(true)
      setError(null)
      await fetchAll()
    } catch (err) {
      setError('Failed to reload data')
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
        student={students.find(s => s.registerId === selectedInvoice.studentId)!}
        onBack={() => setSelectedInvoice(null)}
        gstRate={gst.enabled ? gst.rate : 0}
        courses={courses}
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
      const selectedStudent = students.find(s => s.registerId === selectedId)!
      return (
        <StudentDetail
          student={selectedStudent}
          payments={payments}
          onBack={() => setSelectedId(null)}
          onPayment={recordPayment}
          onCertificate={() => setSelectedCertificate(selectedStudent)}
          onInvoice={setSelectedInvoice}
          gstRate={gst.enabled ? gst.rate : 0}
          courses={courses}
        />
      )
    }
    if (view === 'Dashboard') return (
      <Dashboard students={students} payments={payments} setView={handleSetView} onInvoice={setSelectedInvoice} />
    )
    if (view === 'Students') return (
      <Students students={students} onAdd={() => setAdding(true)} onSelect={(s: Student) => setSelectedId(s.registerId)} />
    )
    if (view === 'Certificates') return (
      <Certificates
        students={students}
        certificates={certificates}
        onCertificate={setSelectedCertificate}
      />
    )
    if (view === 'Courses') return (
      <CoursesManager
        courses={courses}
        onSaveCourse={handleSaveCourse}
        onDeleteCourse={handleDeleteCourse}
        gstRate={gst.enabled ? gst.rate : 0}
      />
    )
    if (view === 'Settings') return (
      <GstSettingsPage
        settings={gst}
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
          if (result.data) setGst(result.data)
        }}
      />
    )
    return (
      <SimpleView
        view={view}
        students={students}
        payments={payments}
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
      <Sidebar view={view} setView={handleSetView} collapsed={sidebarCollapsed} students={students} />
      <div className="main-area">
        <Topbar
          view={view}
          onMenu={() => setSidebarCollapsed(c => !c)}
          students={students}
          payments={payments}
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
        <main className="content">
          {renderContent()}
        </main>
      </div>
      {adding && (
        <AddStudent
          courses={courses}
          onClose={() => setAdding(false)}
          onSave={save}
          gstRate={gst.enabled ? gst.rate : 0}
        />
      )}
      <div className={'sidebar-mobile ' + (mobileOpen ? 'open' : '')} onClick={e => e.stopPropagation()}>
        <div onClick={e => e.stopPropagation()}></div>
      </div>
    </div>
  )
}