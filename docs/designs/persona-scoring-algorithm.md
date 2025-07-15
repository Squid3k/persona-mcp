# Persona Scoring Algorithm Design

## Overview

The persona scoring algorithm is a multi-factor system that evaluates how well a persona matches a given task. It produces a normalized score between 0 and 1, with 1 being a perfect match.

## Algorithm Flow

```mermaid
flowchart TB
    Start([Task & Persona Input]) --> Parse[Parse Task Description]
    Parse --> Factors{Calculate Factors}
    
    Factors --> KM[Keyword Matching]
    Factors --> RA[Role Alignment]  
    Factors --> EM[Expertise Matching]
    Factors --> CR[Context Relevance]
    Factors --> CF[Complexity Fit]
    
    KM --> KMS[Score: 0-1]
    RA --> RAS[Score: 0-1]
    EM --> EMS[Score: 0-1]
    CR --> CRS[Score: 0-1]
    CF --> CFS[Score: 0-1]
    
    KMS --> Weight[Apply Weights]
    RAS --> Weight
    EMS --> Weight
    CRS --> Weight
    CFS --> Weight
    
    Weight --> Sum[Weighted Sum]
    Sum --> Norm[Normalize to 0-1]
    Norm --> Final([Final Score])
```

## Factor Calculations

### 1. Keyword Matching (30% weight)

```mermaid
graph LR
    subgraph "Keyword Sources"
        TK[Task Keywords]
        TT[Task Title]
        TD[Task Description]
    end
    
    subgraph "Persona Sources"
        PE[Persona Expertise]
        PT[Persona Tags]
        PD[Persona Description]
    end
    
    subgraph "Matching Process"
        Clean[Clean & Lowercase]
        Semantic[Semantic Matching]
        Count[Match Count]
    end
    
    TK --> Clean
    TT --> Clean
    TD --> Clean
    PE --> Clean
    PT --> Clean
    PD --> Clean
    
    Clean --> Semantic
    Semantic --> Count
    Count --> Score[Keyword Score]
```

**Algorithm**:
```typescript
function calculateKeywordMatch(persona, task) {
  const taskKeywords = extractKeywords(task);
  const personaKeywords = extractKeywords(persona);
  
  let matches = 0;
  for (const taskKeyword of taskKeywords) {
    for (const personaKeyword of personaKeywords) {
      if (semanticMatch(taskKeyword, personaKeyword)) {
        matches++;
      }
    }
  }
  
  return normalize(matches, taskKeywords.length);
}
```

### 2. Role Alignment (25% weight)

```mermaid
graph TB
    subgraph "Role Mapping"
        Keywords[Task Keywords] --> RoleDetect[Detect Implied Role]
        RoleDetect --> RoleMap{Role Mapping}
        
        RoleMap -->|design, architecture| Architect
        RoleMap -->|implement, build| Developer
        RoleMap -->|review, analyze| Reviewer
        RoleMap -->|debug, troubleshoot| Debugger
    end
    
    PersonaRole[Persona Role] --> Compare
    RoleMap --> Compare[Compare Roles]
    Compare --> RoleScore[Role Score]
```

**Scoring Matrix**:
| Task Implies | Architect | Developer | Reviewer | Debugger |
|-------------|-----------|-----------|----------|----------|
| Architecture| 1.0       | 0.4       | 0.6      | 0.3      |
| Development | 0.4       | 1.0       | 0.5      | 0.6      |
| Review      | 0.6       | 0.5       | 1.0      | 0.4      |
| Debugging   | 0.3       | 0.6       | 0.4      | 1.0      |

### 3. Expertise Matching (20% weight)

```mermaid
graph LR
    subgraph "Direct Matching"
        TaskReq[Task Requirements] --> DirectMatch[Direct Match]
        PersonaExp[Persona Expertise] --> DirectMatch
    end
    
    subgraph "Inferred Matching"
        TaskDesc[Task Description] --> InferredMatch[Inferred Match]
        PersonaDesc[Persona Description] --> InferredMatch
    end
    
    DirectMatch --> Combine[Combine Scores]
    InferredMatch --> Combine
    Combine --> ExpScore[Expertise Score]
```

### 4. Context Relevance (15% weight)

```mermaid
graph TB
    subgraph "Context Factors"
        Domain[Task Domain] --> DomainMatch[Domain Matching]
        Context[Task Context] --> ContextMatch[Context Analysis]
        Urgency[Task Urgency] --> UrgencyMatch[Urgency Factor]
    end
    
    subgraph "Persona Context"
        PersonaDomain[Persona Domain Knowledge]
        PersonaContext[Persona Contextual Fit]
    end
    
    DomainMatch --> Aggregate
    ContextMatch --> Aggregate
    UrgencyMatch --> Aggregate
    PersonaDomain --> Aggregate
    PersonaContext --> Aggregate
    
    Aggregate[Aggregate Context Score] --> CtxScore[Context Score]
```

### 5. Complexity Fit (10% weight)

```mermaid
graph LR
    TaskComplexity[Task Complexity] --> Matrix[Complexity Matrix]
    PersonaRole[Persona Role] --> Matrix
    
    Matrix --> Score[Complexity Score]
    
    subgraph "Complexity Matrix"
        Simple[Simple: Dev=1.0, Arch=0.3]
        Moderate[Moderate: Dev=0.8, Arch=0.6]
        Complex[Complex: Arch=1.0, Dev=0.5]
        Expert[Expert: Arch=1.0, Dev=0.3]
    end
```

## Score Aggregation

```mermaid
graph TB
    subgraph "Individual Scores"
        KS[Keyword Score × 0.30]
        RS[Role Score × 0.25]
        ES[Expertise Score × 0.20]
        CS[Context Score × 0.15]
        FS[Complexity Score × 0.10]
    end
    
    KS --> Sum[Sum All Weighted Scores]
    RS --> Sum
    ES --> Sum
    CS --> Sum
    FS --> Sum
    
    Sum --> Clamp[Clamp to 0-1 Range]
    Clamp --> Final[Final Score]
```

## Reasoning Generation

```mermaid
flowchart LR
    Score[Final Score] --> Threshold{Score Range?}
    
    Threshold -->|> 0.8| Excellent[Excellent Match]
    Threshold -->|0.6-0.8| Good[Good Match]
    Threshold -->|0.4-0.6| Moderate[Moderate Match]
    Threshold -->|< 0.4| Limited[Limited Match]
    
    Excellent --> Reasoning[Generate Reasoning]
    Good --> Reasoning
    Moderate --> Reasoning
    Limited --> Reasoning
    
    Factors[Factor Analysis] --> Reasoning
    Reasoning --> Output[Reasoning Text]
```

## Strengths & Limitations Identification

```mermaid
graph TB
    subgraph "Strength Detection"
        HighScores[High-Scoring Factors] --> StrengthAnalysis
        ExpertiseMatch[Matched Expertise] --> StrengthAnalysis
        RoleMatch[Role Alignment] --> StrengthAnalysis
    end
    
    subgraph "Limitation Detection"
        LowScores[Low-Scoring Factors] --> LimitationAnalysis
        ComplexityMismatch[Complexity Mismatch] --> LimitationAnalysis
        DomainMismatch[Domain Mismatch] --> LimitationAnalysis
    end
    
    StrengthAnalysis --> Strengths[Top 3 Strengths]
    LimitationAnalysis --> Limitations[Top 2 Limitations]
```

## Implementation Details

### Semantic Matching
The algorithm uses fuzzy string matching for keywords:
- Exact matches: 1.0 score
- Substring matches: 0.7 score
- Related terms: 0.5 score (e.g., "build" ↔ "implement")

### Normalization
All individual factors are normalized to 0-1 range:
```typescript
normalize(value, max) = Math.min(1, value / max)
```

### Weight Distribution
Default weights sum to 1.0:
- Keyword: 0.30
- Role: 0.25
- Expertise: 0.20
- Context: 0.15
- Complexity: 0.10

### Confidence Calculation
Confidence is based on:
- Number of factors with data: More data = higher confidence
- Score distribution: Extreme scores (very high/low) = higher confidence
- Match quality: Clear matches = higher confidence

## Performance Considerations

1. **Caching**: Keyword extraction cached per request
2. **Early Exit**: Skip detailed calculation if role mismatch > threshold
3. **Parallel Processing**: Calculate factors concurrently
4. **Memoization**: Cache semantic matching results

## Future Enhancements

1. **Machine Learning**: Train weights based on user feedback
2. **NLP Enhancement**: Better semantic understanding
3. **Domain Ontology**: Structured domain knowledge
4. **Collaborative Filtering**: Learn from similar task patterns