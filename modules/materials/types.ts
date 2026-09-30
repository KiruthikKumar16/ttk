export type CourseMaterial = {
  id: string
  courseId: string
  courseName: string
  title: string
  type: string
  storagePath: string
  uploadedBy: { id: string; fullName: string; role: string } | null
  createdAt: string
  signedUrl: string | null
}
