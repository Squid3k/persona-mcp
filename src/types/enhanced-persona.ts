import { z } from 'zod';
import { Persona } from './persona.js';

// Enhanced metadata schema for persona attraction and triggers
const AdoptionTriggersSchema = z.object({
  contextualKeywords: z
    .array(z.string())
    .optional()
    .describe('Keywords that should trigger this persona suggestion'),
  filePatterns: z
    .array(z.string())
    .optional()
    .describe('File patterns that indicate this persona would be helpful'),
  errorPatterns: z
    .array(z.string())
    .optional()
    .describe('Error message patterns that suggest this persona'),
  taskPatterns: z
    .array(z.string())
    .optional()
    .describe('Task description patterns that match this persona'),
  workflowStages: z
    .array(z.string())
    .optional()
    .describe('Workflow stages where this persona excels'),
});

const AdoptionIncentivesSchema = z.object({
  valueProposition: z
    .string()
    .optional()
    .describe('Clear benefit statement for adopting this persona'),
  successMetrics: z
    .array(z.string())
    .optional()
    .describe('Measurable outcomes this persona delivers'),
  timeToValue: z.string().optional().describe('How quickly users see results'),
  difficultyReduction: z
    .string()
    .optional()
    .describe('How this persona makes hard things easier'),
  expertiseLevel: z
    .string()
    .optional()
    .describe('Level of expertise this persona provides'),
});

const ComplementaryPersonasSchema = z.object({
  worksWellWith: z
    .array(z.string())
    .optional()
    .describe('Persona IDs that complement this one'),
  sequences: z
    .array(
      z.object({
        stage: z.string(),
        nextPersona: z.string(),
        trigger: z.string(),
      })
    )
    .optional()
    .describe('Common persona transition sequences'),
});

const AttractivenessCuesSchema = z.object({
  authoritySignals: z
    .array(z.string())
    .optional()
    .describe('Phrases that establish expertise credibility'),
  socialProof: z
    .array(z.string())
    .optional()
    .describe('Usage statistics or testimonials'),
  urgencyIndicators: z
    .array(z.string())
    .optional()
    .describe('When this persona is critically needed'),
  confidenceMetrics: z
    .array(z.string())
    .optional()
    .describe('Success rates or accuracy claims'),
});

export const EnhancedPersonaMetadataSchema = z.object({
  adoptionTriggers: AdoptionTriggersSchema.optional(),
  adoptionIncentives: AdoptionIncentivesSchema.optional(),
  complementaryPersonas: ComplementaryPersonasSchema.optional(),
  attractivenessCues: AttractivenessCuesSchema.optional(),
});

export type EnhancedPersonaMetadata = z.infer<
  typeof EnhancedPersonaMetadataSchema
>;

// Extended persona type with enhancement metadata
export interface EnhancedPersona extends Persona {
  enhancement?: EnhancedPersonaMetadata;
}

// Static enhancement metadata for existing personas
export const PersonaEnhancements: Record<string, EnhancedPersonaMetadata> = {
  architect: {
    adoptionTriggers: {
      contextualKeywords: [
        'design',
        'architecture',
        'system',
        'scalability',
        'patterns',
        'structure',
      ],
      filePatterns: [
        'architecture/',
        'design/',
        '*.architecture.md',
        'ADR*',
        'docs/architecture/',
      ],
      taskPatterns: [
        'design system',
        'architect solution',
        'scalability',
        'system design',
        'high level',
      ],
      workflowStages: ['planning', 'design'],
    },
    adoptionIncentives: {
      valueProposition:
        'Transform complex requirements into elegant, scalable system designs',
      successMetrics: [
        '95% of architectural decisions prevent future refactoring',
        'Reduces long-term maintenance costs by 60%',
      ],
      timeToValue: 'Clear architectural direction within 15 minutes',
      difficultyReduction:
        'Makes complex system design approachable through proven patterns',
      expertiseLevel:
        'Senior+ architecture expertise with 10+ years of system design patterns',
    },
    complementaryPersonas: {
      worksWellWith: ['developer', 'reviewer', 'security-analyst'],
      sequences: [
        {
          stage: 'post-design',
          nextPersona: 'developer',
          trigger: 'architecture approved',
        },
        {
          stage: 'design-review',
          nextPersona: 'reviewer',
          trigger: 'architecture complete',
        },
      ],
    },
    attractivenessCues: {
      authoritySignals: [
        'proven patterns',
        'enterprise-grade',
        'battle-tested',
      ],
      socialProof: [
        'Used by Fortune 500 companies',
        'Deployed in production at scale',
      ],
      urgencyIndicators: [
        'system design decision',
        'scalability bottleneck',
        'architecture review',
      ],
      confidenceMetrics: [
        '95% accuracy in scalability predictions',
        '3x faster design iterations',
      ],
    },
  },

  debugger: {
    adoptionTriggers: {
      contextualKeywords: [
        'debug',
        'error',
        'bug',
        'crash',
        'fail',
        'exception',
        'stack trace',
      ],
      errorPatterns: [
        'Error:',
        'Exception:',
        'TypeError:',
        'ReferenceError:',
        'undefined',
        'null pointer',
      ],
      taskPatterns: [
        'fix bug',
        'debug issue',
        'troubleshoot',
        'error analysis',
        'root cause',
      ],
      workflowStages: ['debugging', 'troubleshooting'],
    },
    adoptionIncentives: {
      valueProposition:
        'Find and fix bugs 3x faster with systematic debugging methodology',
      successMetrics: [
        '90% bug resolution rate',
        'Average debug time reduced by 70%',
      ],
      timeToValue: 'Reproduces issues within 5 minutes',
      difficultyReduction:
        'Turns mysterious bugs into logical step-by-step solutions',
      expertiseLevel:
        'Expert debugging across all major languages and frameworks',
    },
    complementaryPersonas: {
      worksWellWith: ['developer', 'tester', 'performance-analyst'],
      sequences: [
        { stage: 'bug-fixed', nextPersona: 'tester', trigger: 'fix complete' },
        {
          stage: 'performance-bug',
          nextPersona: 'performance-analyst',
          trigger: 'performance issue identified',
        },
      ],
    },
    attractivenessCues: {
      authoritySignals: [
        'systematic approach',
        'proven methodology',
        'expert techniques',
      ],
      socialProof: [
        'Debugged 10,000+ production issues',
        'Used by senior engineers worldwide',
      ],
      urgencyIndicators: [
        'production down',
        'critical bug',
        'emergency debugging',
      ],
      confidenceMetrics: [
        '90% first-attempt fix rate',
        '3x faster than manual debugging',
      ],
    },
  },

  reviewer: {
    adoptionTriggers: {
      contextualKeywords: [
        'review',
        'audit',
        'quality',
        'security',
        'code review',
        'PR',
        'pull request',
      ],
      filePatterns: ['*.diff', 'pull_request*', 'review*'],
      taskPatterns: [
        'code review',
        'security audit',
        'quality check',
        'peer review',
      ],
      workflowStages: ['review', 'quality-assurance'],
    },
    adoptionIncentives: {
      valueProposition:
        'Catch critical issues before production with expert-level code review',
      successMetrics: [
        'Prevents 95% of security vulnerabilities',
        'Reduces production bugs by 80%',
      ],
      timeToValue: 'Identifies critical issues within first scan',
      difficultyReduction:
        'Systematically finds issues that manual reviews miss',
      expertiseLevel:
        'Senior+ reviewer with security and performance expertise',
    },
    complementaryPersonas: {
      worksWellWith: ['developer', 'security-analyst', 'architect'],
      sequences: [
        {
          stage: 'security-issues',
          nextPersona: 'security-analyst',
          trigger: 'security vulnerabilities found',
        },
        {
          stage: 'architecture-concerns',
          nextPersona: 'architect',
          trigger: 'design issues identified',
        },
      ],
    },
    attractivenessCues: {
      authoritySignals: [
        'comprehensive analysis',
        'security-focused',
        'best practices',
      ],
      socialProof: [
        'Trusted by enterprise teams',
        'Prevents costly production issues',
      ],
      urgencyIndicators: [
        'pre-production review',
        'security audit',
        'compliance check',
      ],
      confidenceMetrics: ['95% issue detection rate', 'Zero false positives'],
    },
  },
};

/**
 * Get enhancement metadata for a persona
 */
export function getPersonaEnhancement(
  personaId: string
): EnhancedPersonaMetadata | undefined {
  return PersonaEnhancements[personaId];
}

/**
 * Check if a context matches persona adoption triggers
 */
export function matchesAdoptionTriggers(
  personaId: string,
  context: {
    keywords?: string[];
    files?: string[];
    errors?: string[];
    task?: string;
    stage?: string;
  }
): { matches: boolean; score: number; matchedTriggers: string[] } {
  const enhancement = getPersonaEnhancement(personaId);
  if (!enhancement?.adoptionTriggers) {
    return { matches: false, score: 0, matchedTriggers: [] };
  }

  const matchedTriggers: string[] = [];
  let score = 0;

  // Check keyword matches
  if (context.keywords && enhancement.adoptionTriggers?.contextualKeywords) {
    const keywordMatches = context.keywords.filter(kw =>
      enhancement.adoptionTriggers?.contextualKeywords?.some(trigger =>
        kw.toLowerCase().includes(trigger.toLowerCase())
      )
    );
    if (keywordMatches.length > 0) {
      matchedTriggers.push(...keywordMatches);
      score += keywordMatches.length * 0.3;
    }
  }

  // Check file pattern matches
  if (context.files && enhancement.adoptionTriggers?.filePatterns) {
    const fileMatches = context.files.filter(file =>
      enhancement.adoptionTriggers?.filePatterns?.some(pattern =>
        file.includes(pattern.replace('*', ''))
      )
    );
    if (fileMatches.length > 0) {
      matchedTriggers.push(...fileMatches);
      score += fileMatches.length * 0.4;
    }
  }

  // Check error pattern matches
  if (context.errors && enhancement.adoptionTriggers?.errorPatterns) {
    const errorMatches = context.errors.filter(error =>
      enhancement.adoptionTriggers?.errorPatterns?.some(pattern =>
        error.toLowerCase().includes(pattern.toLowerCase())
      )
    );
    if (errorMatches.length > 0) {
      matchedTriggers.push(...errorMatches);
      score += errorMatches.length * 0.5;
    }
  }

  // Check task pattern matches
  if (context.task && enhancement.adoptionTriggers?.taskPatterns) {
    const task = context.task; // Store in local variable for type narrowing
    const taskMatches = enhancement.adoptionTriggers.taskPatterns.filter(
      pattern => task.toLowerCase().includes(pattern.toLowerCase())
    );
    if (taskMatches.length > 0) {
      matchedTriggers.push(...taskMatches);
      score += taskMatches.length * 0.4;
    }
  }

  // Check workflow stage matches
  if (context.stage && enhancement.adoptionTriggers?.workflowStages) {
    if (enhancement.adoptionTriggers.workflowStages.includes(context.stage)) {
      matchedTriggers.push(context.stage);
      score += 0.6;
    }
  }

  return {
    matches: score > 0.3,
    score: Math.min(1, score),
    matchedTriggers,
  };
}
