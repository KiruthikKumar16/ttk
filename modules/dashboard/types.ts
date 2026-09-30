export type DashboardSummary = {
  studentCount: number
  revenuePaise: number
  outstandingPaise: number
  eligibleCount: number
  monthlyRevenuePaise: number
  courseMix: { course: string; studentCount: number }[]
}
