import { z } from 'zod';

// Core definition schema
const CoreSchema = z.object({
  identity: z.string().min(1),
  primaryObjective: z.string().min(1),
  constraints: z.array(z.string().min(1)).min(3).max(11),
});

// Behavioral guidance schema
const BehaviorSchema = z.object({
  mindset: z.array(z.string().min(1)).min(3).max(6),
  methodology: z.array(z.string().min(1)).min(4).max(6),
  priorities: z.array(z.string().min(1)).min(3).max(5),
  antiPatterns: z.array(z.string().min(1)).min(3).max(4),
});

// Expertise schema
const ExpertiseSchema = z.object({
  domains: z.array(z.string().min(1)).min(4).max(6),
  skills: z.array(z.string().min(1)).min(4).max(6),
});

// Behavior diagram schema
const BehaviorDiagramSchema = z.object({
  title: z.string().min(1),
  mermaidDSL: z.string().min(1),
  diagramType: z.enum(['state', 'flowchart', 'decision-tree']),
  description: z.string().min(1),
});

// Main Persona schema
export const PersonaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  core: CoreSchema,
  behavior: BehaviorSchema,
  expertise: ExpertiseSchema,
  decisionCriteria: z.array(z.string().min(1)).min(3).max(4),
  examples: z.array(z.string().min(1)).min(2).max(3),
  tags: z.array(z.string().min(1)).min(3).max(5),
  behaviorDiagrams: z.array(BehaviorDiagramSchema).optional(),
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
  ANALYST: 'analyst',
  COMMUNICATOR: 'communicator',
  MANAGER: 'manager',
  DESIGNER: 'designer',
} as const;

export type PersonaRoleType = (typeof PersonaRole)[keyof typeof PersonaRole];
