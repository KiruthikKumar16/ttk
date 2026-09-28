import type { Role } from '@/lib/types'

export const resources = [
  'students',
  'payments',
  'courses',
  'certificates',
  'attendance',
  'assessments',
  'materials',
  'audit',
  'reports',
  'gst',
  'verification',
] as const

export type Resource = (typeof resources)[number]
export type Action = 'read' | 'create' | 'update' | 'delete' | 'issue' | 'grade' | 'export' | 'manage'
type PermissionMap = Partial<Record<Resource, readonly Action[]>>

const allActions: readonly Action[] = ['read', 'create', 'update', 'delete', 'issue', 'grade', 'export', 'manage']

export const permissions: Record<Role, PermissionMap> = {
  admin: Object.fromEntries(resources.map((resource) => [resource, allActions])) as Record<Resource, readonly Action[]>,
  staff: {
    students: ['read', 'create', 'update'],
    payments: ['read', 'create'],
    courses: ['read', 'create'],
    certificates: ['read', 'create', 'issue'],
    attendance: ['read', 'create', 'update'],
    assessments: ['read', 'create', 'update', 'grade'],
    materials: ['read', 'create', 'update', 'delete'],
    reports: ['read', 'export'],
    gst: ['read'],
  },
  trainer: {
    students: ['read'],
    courses: ['read'],
    certificates: ['read'],
    attendance: ['read', 'create', 'update'],
    assessments: ['read', 'create', 'update', 'grade'],
    materials: ['read'],
    reports: ['read'],
  },
}

export function can(role: Role | null | undefined, resource: Resource, action: Action): boolean {
  return role !== null && role !== undefined && permissions[role][resource]?.includes(action) === true
}

export function rolesFor(resource: Resource, action: Action): readonly Role[] {
  return (Object.keys(permissions) as Role[]).filter((role) => can(role, resource, action))
}
