import { z } from 'zod'

export const aiTutorIssueSchema = z.object({
  title: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high']),
  explanation: z.string().min(1),
  fixSuggestion: z.string().min(1),
})

export const aiTutorFeedbackSchema = z.object({
  summary: z.string().min(1),
  complexityExplanation: z.string().min(1),
  strengths: z.array(z.string().min(1)).min(1).max(4),
  issues: z.array(aiTutorIssueSchema).max(5),
  nextSteps: z.array(z.string().min(1)).min(1).max(5),
  nextExercise: z.string().min(1),
})

export type AiTutorFeedbackSchema = z.infer<typeof aiTutorFeedbackSchema>
