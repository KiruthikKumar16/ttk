import type { Role } from '@/lib/types'
import { ForbiddenError, UnauthorizedError } from '@/lib/http/errors'

export function requireRole(role: Role | null | undefined, allowedRoles: readonly Role[]): asserts role is Role {
  if (!role) throw new UnauthorizedError()
  if (!allowedRoles.includes(role)) throw new ForbiddenError()
}
