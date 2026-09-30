import type { StudentStatus } from '@/lib/types'

export function Status({ status }: { status: StudentStatus }) {
  return (
    <span className={'status ' + (status === 'Fully Paid' ? 'status-paid' : 'status-pending')}>
      <span className="status-dot" />
      {status}
    </span>
  )
}
