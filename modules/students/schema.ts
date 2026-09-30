import { studentSchema } from '@/lib/validation'

export const createStudentSchema = studentSchema
export type CreateStudentInput = ReturnType<typeof createStudentSchema.parse>
