export type SkillTag = {
  id: string
  name: string
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export const DEFAULT_SKILL_TAGS: string[] = [
  'Python',
  'Web Dev',
  'React',
  'AI/ML',
  'Full Stack',
  'UI/UX',
  'Internship',
  'College Student',
  'Job Seeker',
  'Beginner',
]
