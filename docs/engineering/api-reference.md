# API Reference - Persona Recommendation Tools

## Overview

The Personas MCP Server provides four tools for persona recommendations through the Model Context Protocol. All tools are accessible via the MCP `CallToolRequest` method.

## Base URLs

### MCP Protocol Endpoint
```
http://localhost:3000/mcp
```

### REST API Endpoints
```
http://localhost:3000/api/*
```

## Authentication

Currently, no authentication is required. Future versions may implement token-based authentication.

## REST API Endpoints

For direct HTTP access without MCP protocol, the following REST endpoints are available:

### GET /api/personas

Get all available personas.

#### Request
```bash
curl http://localhost:3000/api/personas
```

#### Response
```json
{
  "personas": [
    {
      "id": "architect",
      "name": "Software Architect",
      "role": "architect",
      "description": "Focuses on high-level system design...",
      "specialty": "System Architecture",
      "tags": ["architecture", "design", "scalability"]
    },
    // ... more personas
  ],
  "total": 12
}
```

### GET /api/personas/:id

Get a specific persona by ID.

#### Request
```bash
curl http://localhost:3000/api/personas/architect
```

#### Response
```json
{
  "id": "architect",
  "name": "Software Architect",
  "role": "architect",
  "description": "Focuses on high-level system design...",
  "specialty": "System Architecture",
  "approach": "Top-down system thinking",
  "expertise": ["system design", "scalability", "patterns"],
  "tags": ["architecture", "design", "scalability"],
  "prompt": "You are a Software Architect..."
}
```

### POST /api/recommend

Get persona recommendations for a task.

#### Request
```bash
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "query": "debug memory leak",
    "limit": 3
  }'
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Task description or keywords |
| limit | number | No | Max recommendations (default: 3) |

#### Response
```json
{
  "recommendations": [
    {
      "personaId": "debugger",
      "score": 95,
      "name": "Debugging Specialist",
      "reasoning": "Perfect match for debugging tasks"
    },
    {
      "personaId": "performance-analyst",
      "score": 87,
      "name": "Performance Analyst",
      "reasoning": "Good for memory and performance issues"
    }
  ]
}
```

### POST /api/compare

Compare multiple personas for a task.

#### Request
```bash
curl -X POST http://localhost:3000/api/compare \
  -H "Content-Type: application/json" \
  -d '{
    "persona1": "architect",
    "persona2": "developer",
    "context": "API design"
  }'
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| persona1 | string | Yes | First persona ID |
| persona2 | string | Yes | Second persona ID |
| context | string | Yes | Task context for comparison |

#### Response
```json
{
  "comparison": {
    "context": "API design",
    "personas": {
      "architect": {
        "strengths": ["High-level design", "API patterns", "Scalability"],
        "weaknesses": ["Implementation details"],
        "score": 88
      },
      "developer": {
        "strengths": ["Implementation", "Code quality"],
        "weaknesses": ["May miss architectural concerns"],
        "score": 75
      }
    },
    "recommendation": "Use architect for initial design, developer for implementation"
  }
}
```

## MCP Protocol Tools

### 1. recommend-persona

Recommends the best personas for a given task description.

#### Request

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "recommend-persona",
    "arguments": {
      "title": "string (required)",
      "description": "string (required)",
      "keywords": ["string"],
      "context": "string",
      "domain": "string",
      "complexity": "simple | moderate | complex | expert",
      "urgency": "low | medium | high | critical",
      "maxRecommendations": 3,
      "includeReasoning": true
    }
  },
  "id": 1
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | Yes | Brief title or summary of the task |
| description | string | Yes | Detailed description of what needs to be accomplished |
| keywords | string[] | No | Keywords related to the task |
| context | string | No | Additional context about the environment or constraints |
| domain | string | No | Domain area (e.g., "backend", "frontend", "data science") |
| complexity | enum | No | Task complexity level |
| urgency | enum | No | Task urgency level |
| maxRecommendations | number | No | Maximum personas to return (1-10, default: 3) |
| includeReasoning | boolean | No | Include detailed reasoning (default: true) |

#### Response

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "personaId": "architect",
        "score": 85,
        "reasoning": "Excellent match for \"Design microservices architecture\". Strong keyword alignment with architecture, microservices, scalability. This persona specializes in complex system design.",
        "strengths": [
          "System-level thinking and design patterns",
          "Specialized in architecture, scalability",
          "Expert knowledge in patterns"
        ],
        "limitations": [],
        "confidence": 92
      }
    ],
    "totalPersonasEvaluated": 4,
    "processingTimeMs": 45
  }
}
```

#### Example

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "recommend-persona",
      "arguments": {
        "title": "Design microservices architecture",
        "description": "Design a scalable microservices architecture for an e-commerce platform",
        "keywords": ["microservices", "architecture", "scalability"],
        "complexity": "complex",
        "domain": "backend"
      }
    },
    "id": 1
  }'
```

### 2. explain-persona-fit

Explains why a specific persona is suitable (or not) for a given task.

#### Request

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "explain-persona-fit",
    "arguments": {
      "personaId": "string (required)",
      "title": "string (required)",
      "description": "string (required)",
      "keywords": ["string"],
      "context": "string",
      "domain": "string",
      "complexity": "simple | moderate | complex | expert"
    }
  },
  "id": 2
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| personaId | string | Yes | ID of the persona to analyze |
| title | string | Yes | Task title |
| description | string | Yes | Task description |
| keywords | string[] | No | Task keywords |
| context | string | No | Additional context |
| domain | string | No | Task domain |
| complexity | enum | No | Task complexity |

#### Response

```json
{
  "success": true,
  "data": {
    "persona": {
      "id": "architect",
      "name": "Software Architect",
      "role": "architect",
      "description": "Focuses on high-level system design..."
    },
    "score": 85,
    "reasoning": "Excellent match for \"System design\". Strong keyword alignment...",
    "strengths": [
      "System-level thinking and design patterns",
      "Specialized in architecture, design, system"
    ],
    "limitations": [
      "May overcomplicate simple tasks"
    ],
    "confidence": 90
  }
}
```

### 3. compare-personas

Compares multiple personas for the same task.

#### Request

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "compare-personas",
    "arguments": {
      "personaIds": ["string"],
      "title": "string (required)",
      "description": "string (required)",
      "keywords": ["string"],
      "context": "string",
      "domain": "string",
      "complexity": "simple | moderate | complex | expert"
    }
  },
  "id": 3
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| personaIds | string[] | Yes | List of persona IDs to compare |
| title | string | Yes | Task title |
| description | string | Yes | Task description |
| keywords | string[] | No | Task keywords |
| context | string | No | Additional context |
| domain | string | No | Task domain |
| complexity | enum | No | Task complexity |

#### Response

```json
{
  "success": true,
  "data": {
    "comparisons": [
      {
        "personaId": "architect",
        "score": 90,
        "reasoning": "Best for system design tasks",
        "strengths": ["System thinking", "Architecture expertise"],
        "confidence": 95
      },
      {
        "personaId": "developer",
        "score": 70,
        "reasoning": "Good for implementation aspects",
        "strengths": ["Implementation focus", "Code quality"],
        "confidence": 85
      }
    ],
    "task": {
      "title": "API design",
      "description": "Design RESTful APIs for microservices"
    }
  }
}
```

### 4. get-recommendation-stats

Provides system statistics and configuration information.

#### Request

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get-recommendation-stats",
    "arguments": {}
  },
  "id": 4
}
```

#### Parameters

None required.

#### Response

```json
{
  "success": true,
  "data": {
    "totalPersonas": 4,
    "availableRoles": ["architect", "developer", "reviewer", "debugger"],
    "scoringWeights": {
      "keywordMatch": 0.3,
      "roleAlignment": 0.25,
      "expertiseMatch": 0.2,
      "contextRelevance": 0.15,
      "complexityFit": 0.1
    },
    "systemInfo": {
      "version": "1.0.0",
      "features": [
        "multi-factor-scoring",
        "semantic-matching",
        "contextual-recommendations",
        "keyword-matching"
      ]
    }
  }
}
```

## Error Responses

All tools return errors in a consistent format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common Error Codes

| Error | Description |
|-------|-------------|
| Validation Error | Input parameters failed validation |
| Persona Not Found | Specified persona ID doesn't exist |
| Processing Error | Internal error during recommendation processing |

## Data Types

### Complexity Levels

- `simple`: Basic, straightforward tasks
- `moderate`: Standard complexity tasks
- `complex`: Challenging tasks requiring expertise
- `expert`: Highly complex tasks requiring deep expertise

### Urgency Levels

- `low`: No time pressure
- `medium`: Normal priority
- `high`: Time-sensitive
- `critical`: Urgent, immediate attention needed

### Score Interpretation

| Score Range | Interpretation |
|-------------|----------------|
| 80-100 | Excellent match |
| 60-79 | Good match |
| 40-59 | Moderate match |
| 0-39 | Limited match |

### Confidence Levels

| Confidence | Meaning |
|------------|---------|
| 90-100% | Very high confidence in the recommendation |
| 70-89% | High confidence |
| 50-69% | Moderate confidence |
| 0-49% | Low confidence (limited data) |

## Rate Limiting

Currently no rate limiting is implemented. Future versions may include:
- 100 requests per minute per IP
- 1000 requests per hour per IP

## Versioning

The API version is included in the system stats response. Breaking changes will increment the major version.

## SDK Examples

### JavaScript/TypeScript

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({
  name: 'my-app',
  version: '1.0.0'
});

// Connect to server
await client.connect(transport);

// Call recommendation tool
const result = await client.callTool(
  'recommend-persona',
  {
    title: 'Build a REST API',
    description: 'Create a RESTful API with authentication',
    complexity: 'moderate'
  }
);
```

### Python

```python
from mcp import Client

client = Client(name="my-app", version="1.0.0")
client.connect("http://localhost:3000/mcp")

result = client.call_tool(
    "recommend-persona",
    {
        "title": "Build a REST API",
        "description": "Create a RESTful API with authentication",
        "complexity": "moderate"
    }
)
```

## Best Practices

1. **Always provide title and description** - These are required fields
2. **Use keywords for better matching** - Include relevant technical terms
3. **Specify complexity when known** - Helps match appropriate personas
4. **Check confidence scores** - Higher confidence means better recommendations
5. **Compare multiple personas** - Use compare-personas for important decisions
6. **Cache results** - Recommendations for identical inputs are deterministic

## Webhook Support (Future)

Future versions may support webhooks for async processing:

```json
{
  "webhookUrl": "https://your-server.com/webhook",
  "events": ["recommendation.completed", "persona.updated"]
}
```