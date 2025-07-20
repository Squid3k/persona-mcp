# XML Prompt Format Documentation

## Overview

The XML prompt format is a semantic, structured approach to delivering persona prompts to AI models. Based on research showing that XML tags provide the highest precision for AI comprehension, this format achieves approximately 40% compression while maintaining semantic clarity and supporting Mermaid diagram integration.

## Format Structure

### Basic Structure

```xml
<persona role="{persona-id}">
  <context>
    {Narrative description providing mindset and approach}
  </context>
  
  <core>
    <objective>{Primary goal in clear, concise language}</objective>
    <philosophy>{Core philosophy or guiding principle}</philosophy>
  </core>
  
  <rules>
    <requirement priority="critical|high|medium">
      {Things that must be done}
    </requirement>
    <prohibition severity="critical|high|medium">
      {Things that must never be done}
    </prohibition>
  </rules>
  
  <workflow>
    <description>{Brief workflow overview}</description>
    <diagram type="mermaid">
      ```mermaid
      {Mermaid workflow diagram}
      ```
    </diagram>
  </workflow>
  
  <decision-framework>
    <description>{How decisions are made}</description>
    <diagram type="mermaid">
      ```mermaid
      {Mermaid decision diagram}
      ```
    </diagram>
    <criteria>
      <question weight="critical|high|medium">{Decision question}</question>
    </criteria>
  </decision-framework>
  
  <current-context>
    {Optional user-provided context}
  </current-context>
</persona>
```

## Sections Explained

### 1. Context Section
Provides a narrative introduction that sets the mindset and approach. This humanizes the persona while maintaining compression.

```xml
<context>
  You approach debugging with the mindset of a detective investigating 
  a crime scene - evidence guides every decision, assumptions are the enemy.
</context>
```

### 2. Core Section
Defines the essential identity and purpose in compressed form.

```xml
<core>
  <objective>Find root causes through systematic investigation</objective>
  <philosophy>Evidence over intuition, understanding over quick fixes</philosophy>
</core>
```

### 3. Rules Section
Explicit constraints and requirements with priority/severity levels.

```xml
<rules>
  <requirement priority="critical">
    Reproduce before attempting fixes
  </requirement>
  <prohibition severity="high">
    Never guess - follow the evidence trail
  </prohibition>
</rules>
```

Priority/Severity Levels:
- `critical`: Must be followed always
- `high`: Very important, rarely violated
- `medium`: Important but flexible
- `low`: Guidelines and preferences

### 4. Workflow Section
Describes the methodology with optional Mermaid visualization.

```xml
<workflow>
  <description>Systematic investigation from evidence to solution</description>
  <diagram type="mermaid">
    ```mermaid
    stateDiagram-v2
      [*] --> GatherEvidence
      GatherEvidence --> FormHypothesis
      FormHypothesis --> TestHypothesis
      TestHypothesis --> AnalyzeResults
      AnalyzeResults --> RootCause: Confirmed
      AnalyzeResults --> FormHypothesis: Rejected
      RootCause --> ImplementFix
      ImplementFix --> [*]
    ```
  </diagram>
</workflow>
```

### 5. Decision Framework Section
Critical decision points with optional visualization and weighted criteria.

```xml
<decision-framework>
  <description>Evidence-based decision making</description>
  <diagram type="mermaid">
    ```mermaid
    flowchart TD
      A[Bug Found] --> B{Can Reproduce?}
      B -->|Yes| C[Investigate]
      B -->|No| D[Gather More Data]
      C --> E{Root Cause Clear?}
      E -->|Yes| F[Fix]
      E -->|No| G[Form New Hypothesis]
    ```
  </diagram>
  <criteria>
    <question weight="critical">Can I reproduce this consistently?</question>
    <question weight="high">What does the evidence show?</question>
    <question weight="medium">Is this the simplest explanation?</question>
  </criteria>
</decision-framework>
```

## Compression Strategies

### 1. Text Compression

The XML format supports three compression levels:

#### None (No Compression)
```xml
<requirement>Must document all debugging findings</requirement>
```

#### Moderate (Default - ~40% reduction)
```xml
<requirement>document all debugging findings</requirement>
```
- Removes common prefixes (Must, Should, Always, Never)
- Maintains readability

#### Aggressive (~60% reduction)
```xml
<requirement>doc debugging findings</requirement>
```
- Abbreviates common words
- Removes articles (the, a, an)
- Uses symbols (& for and, w/ for with)

### 2. Structural Compression

- **Mermaid diagrams replace verbose descriptions**: A single diagram can replace 10-15 lines of methodology steps
- **Semantic tags eliminate headers**: No need for "Key Constraints:", "Methodology:", etc.
- **Attributes convey metadata**: Priority and weight as attributes rather than text

## Integration with Mermaid

### Supported Diagram Types

1. **State Diagrams** (`state`): Best for workflows and processes
2. **Flowcharts** (`flowchart`): Ideal for decision trees
3. **Decision Trees** (`decision-tree`): Explicit decision logic

### Diagram Selection Logic

The system automatically selects appropriate diagrams:
- Workflow section: Prefers state diagrams or those with "workflow" in title
- Decision section: Prefers flowcharts or decision-tree types

## Usage Examples

### 1. Generate XML Prompt

```typescript
const manager = new EnhancedPersonaManager();
const persona = manager.getPersona('debugger');

// Generate with default moderate compression
const xmlPrompt = manager.generateXmlPrompt(persona);

// Generate with specific compression
const compressed = manager.generateXmlPrompt(
  persona, 
  'Bug in authentication flow',
  CompressionLevel.AGGRESSIVE
);
```

### 2. Using Generation Options

```typescript
const options: PromptGenerationOptions = {
  format: PromptFormat.XML_SEMANTIC,
  model: 'claude',
  compressionLevel: CompressionLevel.MODERATE,
  context: 'Investigating memory leak in React app'
};

const prompt = manager.generatePromptWithOptions(persona, options);
```

## Model-Specific Benefits

### Claude
- **Trained on XML**: Claude has specific training on XML-structured inputs
- **Semantic clarity**: XML tags provide clear semantic boundaries
- **Compression friendly**: Handles compressed text well within structure

### GPT-4 (Future)
- Will use hashtag format: `### Objective`, `### Constraints`
- Structured lists with consistent delimiters

### Gemini (Future)
- Hierarchical outline format
- Nested structure matching Gemini's preference

## Performance Metrics

Based on testing with the built-in personas:

| Persona | Narrative Size | XML Size | Compression | With Diagrams |
|---------|---------------|----------|-------------|---------------|
| Architect | 2,842 chars | 1,654 chars | 42% | 1,897 chars |
| Developer | 2,756 chars | 1,589 chars | 42% | 1,832 chars |
| Debugger | 2,489 chars | 1,443 chars | 42% | 1,724 chars |

## Best Practices

1. **Always include context section**: Provides crucial mindset framing
2. **Use appropriate compression**: Moderate for most cases, aggressive for token limits
3. **Leverage Mermaid diagrams**: Visual representations improve comprehension
4. **Set accurate priorities**: Critical vs high vs medium affects AI behavior
5. **Keep questions concise**: Decision criteria should be scannable

## Migration Guide

To migrate from narrative to XML format:

1. Update prompt generation calls:
   ```typescript
   // Old
   const prompt = manager.generatePrompt(persona, context);
   
   // New
   const prompt = manager.generateXmlPrompt(persona, context);
   ```

2. For backward compatibility, the narrative format remains available
3. Test with your specific use cases to ensure XML format works well

## Future Enhancements

1. **XML Schema validation**: Ensure generated XML conforms to schema
2. **Custom compression rules**: Per-persona compression strategies
3. **Dynamic diagram selection**: ML-based diagram relevance scoring
4. **Streaming XML generation**: For large personas with many diagrams