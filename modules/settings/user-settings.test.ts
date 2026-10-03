import { describe, expect, it } from 'vitest'
import type { UserContactDetails, UserMetadata, UserProfile } from '@/lib/types'

describe('User Settings Data Structures', () => {
  it('correctly models contact details with phone, email, and address', () => {
    const contact: UserContactDetails = {
      phone: '+91 98765 43210',
      altPhone: '+91 91234 56789',
      email: 'user@example.com',
      address: '123 Main St',
      city: 'Madurai',
      emergencyContact: 'Emergency Contact: +91 99999 88888',
    }

    expect(contact.phone).toBe('+91 98765 43210')
    expect(contact.altPhone).toBe('+91 91234 56789')
    expect(contact.email).toBe('user@example.com')
    expect(contact.city).toBe('Madurai')
  })

  it('correctly models metadata with presets and arbitrary custom attributes', () => {
    const metadata: UserMetadata = {
      department: 'Academics & Training',
      designation: 'Senior Instructor',
      employeeId: 'EMP-2026-001',
      bio: 'Lead faculty for Full Stack Development courses.',
      timezone: 'Asia/Kolkata',
      slack_handle: '@faculty_lead',
      skills: ['React', 'Next.js', 'PostgreSQL'],
    }

    expect(metadata.department).toBe('Academics & Training')
    expect(metadata.designation).toBe('Senior Instructor')
    expect(metadata.employeeId).toBe('EMP-2026-001')
    expect(metadata.slack_handle).toBe('@faculty_lead')
    expect(metadata.skills).toEqual(['React', 'Next.js', 'PostgreSQL'])
  })

  it('supports UserProfile with contact details and metadata', () => {
    const profile: UserProfile = {
      id: '00000000-0000-4000-8000-000000000001',
      full_name: 'Kiruthik Kumar',
      role: 'admin',
      created_at: '2026-10-01T00:00:00Z',
      contact_details: {
        phone: '+91 98765 43210',
        email: 'admin@thoorigai.test',
      },
      metadata: {
        department: 'Operations',
        designation: 'Administrator',
      },
    }

    expect(profile.full_name).toBe('Kiruthik Kumar')
    expect(profile.contact_details?.phone).toBe('+91 98765 43210')
    expect(profile.metadata?.department).toBe('Operations')
  })
})
