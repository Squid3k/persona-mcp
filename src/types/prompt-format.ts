/**
 * Prompt format types and options for generating persona prompts
 * in different structures optimized for various AI models
 */

export enum PromptFormat {
  /** Traditional narrative format (current/legacy) */
  NARRATIVE = 'narrative',

  /** Semantic XML format with Mermaid diagrams (recommended for Claude) */
  XML_SEMANTIC = 'xml',

  /** Hashtag-delimited format (optimized for GPT-4) */
  HASHTAG = 'hashtag',

  /** Hierarchical outline format (optimized for Gemini) */
  HIERARCHICAL = 'hierarchical',
}

export enum CompressionLevel {
  /** No compression - full verbosity */
  NONE = 'none',

  /** ~40% compression - balanced clarity and conciseness */
  MODERATE = 'moderate',

  /** ~60% compression - maximum conciseness */
  AGGRESSIVE = 'aggressive',
}

export interface PromptGenerationOptions {
  /** The format to use for prompt generation */
  format: PromptFormat;

  /** Target AI model for optimization */
  model?: 'claude' | 'gpt4' | 'gemini';

  /** Compression level to apply */
  compressionLevel?: CompressionLevel;

  /** Whether to include Mermaid diagrams (for supported formats) */
  includeDiagrams?: boolean;

  /** Additional context to include in the prompt */
  context?: string;
}

export interface XmlPromptSection {
  /** XML tag name */
  tag: string;

  /** Optional attributes for the tag */
  attributes?: Record<string, string>;

  /** Content - either text or nested sections */
  content: string | XmlPromptSection[];

  /** Whether to wrap content in CDATA (for Mermaid diagrams) */
  useCData?: boolean;
}

export interface MermaidDiagramReference {
  /** Type of diagram (from BehaviorDiagram) */
  type: 'state' | 'flowchart' | 'decision-tree';

  /** Title of the diagram */
  title: string;

  /** The Mermaid DSL content */
  content: string;

  /** Description of what the diagram shows */
  description: string;
}

/**
 * Priority levels for requirements and prohibitions
 */
export enum Priority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Weight levels for decision criteria
 */
export enum Weight {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}
