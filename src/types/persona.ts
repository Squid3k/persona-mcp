import { z } from 'zod';

export const PersonaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  description: z.string().min(1),
  expertise: z.array(z.string().min(1)).min(1),
  approach: z.string().min(1),
  promptTemplate: z.string().min(1),
  examples: z.array(z.string().min(1)).optional(),
  tags: z.array(z.string().min(1)).optional(),
});

export type Persona = z.infer<typeof PersonaSchema>;

export const PersonaRole = {
  ARCHITECT: 'architect',
  DEVELOPER: 'developer',
  REVIEWER: 'reviewer',
  DEBUGGER: 'debugger',
  OPTIMIZER: 'optimizer',
  SECURITY_ANALYST: 'security-analyst',
  TESTER: 'tester',
} as const;

export type PersonaRoleType = (typeof PersonaRole)[keyof typeof PersonaRole];
