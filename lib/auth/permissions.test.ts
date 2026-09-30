import { describe, expect, it } from 'vitest'
import { can, permissions, rolesFor } from './permissions'
import { requireRole } from './requireRole'

describe('permissions matrix', () => {
  it('allows declared resource actions and denies missing actions', () => {
    expect(can('admin', 'audit', 'delete')).toBe(true)
    expect(can('staff', 'courses', 'create')).toBe(true)
    expect(can('trainer', 'courses', 'create')).toBe(false)
    expect(can(undefined, 'students', 'read')).toBe(false)
    expect(can('pending', 'students', 'read')).toBe(false)
  })

  it('derives route role sets from the same matrix used by the UI', () => {
    expect(rolesFor('courses', 'read')).toEqual(['admin', 'staff', 'trainer'])
    expect(rolesFor('courses', 'delete')).toEqual(['admin'])
    expect(Object.keys(permissions)).toEqual(['admin', 'staff', 'trainer', 'pending'])
  })

  it('requires authentication and enforces route roles', () => {
    expect(() => requireRole(undefined, ['admin'])).toThrowError('Authentication is required.')
    expect(() => requireRole('trainer', ['admin'])).toThrowError('You are not allowed')
    expect(() => requireRole('admin', ['admin'])).not.toThrow()
  })
})
