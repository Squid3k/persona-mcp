# API Client Integration Guide

This guide shows how to integrate the Personas MCP Server into your applications using various programming languages and frameworks.

## Overview

The Personas MCP Server provides two types of APIs:

1. **MCP Protocol API** - For AI assistants and MCP-compatible clients
2. **REST API** - For direct HTTP integration

## MCP Protocol Integration

### JavaScript/TypeScript

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { WebSocketTransport } from '@modelcontextprotocol/sdk/transport/websocket.js';

class PersonasMCPClient {
  private client: Client;
  
  constructor() {
    this.client = new Client({
      name: 'my-app',
      version: '1.0.0'
    });
  }
  
  async connect(url: string = 'http://localhost:3000/mcp') {
    const transport = new WebSocketTransport(url);
    await this.client.connect(transport);
  }
  
  async getRecommendations(task: {
    title: string;
    description: string;
    keywords?: string[];
    complexity?: 'simple' | 'moderate' | 'complex' | 'expert';
  }) {
    const result = await this.client.callTool('recommend-persona', task);
    return result.data.recommendations;
  }
  
  async explainFit(personaId: string, task: any) {
    const result = await this.client.callTool('explain-persona-fit', {
      personaId,
      ...task
    });
    return result.data;
  }
}

// Usage
const client = new PersonasMCPClient();
await client.connect();

const recommendations = await client.getRecommendations({
  title: 'Build REST API',
  description: 'Create a scalable REST API with authentication',
  complexity: 'moderate'
});
```

### Python

```python
from mcp import Client
from mcp.transport import HTTPTransport

class PersonasMCPClient:
    def __init__(self, url="http://localhost:3000/mcp"):
        self.client = Client(name="my-app", version="1.0.0")
        self.url = url
        
    async def connect(self):
        transport = HTTPTransport(self.url)
        await self.client.connect(transport)
        
    async def get_recommendations(self, task):
        result = await self.client.call_tool(
            "recommend-persona", 
            task
        )
        return result["data"]["recommendations"]
        
    async def explain_fit(self, persona_id, task):
        result = await self.client.call_tool(
            "explain-persona-fit",
            {"personaId": persona_id, **task}
        )
        return result["data"]

# Usage with asyncio
import asyncio

async def main():
    client = PersonasMCPClient()
    await client.connect()
    
    recommendations = await client.get_recommendations({
        "title": "Debug memory leak",
        "description": "Find and fix memory leaks in Node.js app",
        "complexity": "complex"
    })
    
    for rec in recommendations:
        print(f"{rec['personaId']}: {rec['score']}%")

asyncio.run(main())
```

## REST API Integration

### JavaScript/TypeScript with Fetch

```typescript
class PersonasRESTClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
  }
  
  async getPersonas(): Promise<Persona[]> {
    const response = await fetch(`${this.baseUrl}/personas`);
    return response.json();
  }
  
  async getPersona(id: string): Promise<Persona> {
    const response = await fetch(`${this.baseUrl}/personas/${id}`);
    return response.json();
  }
  
  async recommend(query: string, limit: number = 3): Promise<Recommendation[]> {
    const response = await fetch(`${this.baseUrl}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit })
    });
    return response.json();
  }
  
  async compare(persona1: string, persona2: string, context: string) {
    const response = await fetch(`${this.baseUrl}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona1, persona2, context })
    });
    return response.json();
  }
}
```

### Python with Requests

```python
import requests
from typing import List, Dict, Any

class PersonasRESTClient:
    def __init__(self, base_url: str = "http://localhost:3000/api"):
        self.base_url = base_url
        self.session = requests.Session()
        
    def get_personas(self) -> List[Dict[str, Any]]:
        """Get all available personas"""
        response = self.session.get(f"{self.base_url}/personas")
        response.raise_for_status()
        return response.json()
        
    def get_persona(self, persona_id: str) -> Dict[str, Any]:
        """Get a specific persona by ID"""
        response = self.session.get(f"{self.base_url}/personas/{persona_id}")
        response.raise_for_status()
        return response.json()
        
    def recommend(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Get persona recommendations for a query"""
        response = self.session.post(
            f"{self.base_url}/recommend",
            json={"query": query, "limit": limit}
        )
        response.raise_for_status()
        return response.json()
        
    def compare(self, persona1: str, persona2: str, context: str) -> Dict[str, Any]:
        """Compare two personas for a given context"""
        response = self.session.post(
            f"{self.base_url}/compare",
            json={
                "persona1": persona1,
                "persona2": persona2,
                "context": context
            }
        )
        response.raise_for_status()
        return response.json()
```

### Ruby

```ruby
require 'net/http'
require 'json'
require 'uri'

class PersonasRESTClient
  def initialize(base_url = 'http://localhost:3000/api')
    @base_url = base_url
  end
  
  def get_personas
    uri = URI("#{@base_url}/personas")
    response = Net::HTTP.get_response(uri)
    JSON.parse(response.body)
  end
  
  def get_persona(id)
    uri = URI("#{@base_url}/personas/#{id}")
    response = Net::HTTP.get_response(uri)
    JSON.parse(response.body)
  end
  
  def recommend(query, limit = 3)
    uri = URI("#{@base_url}/recommend")
    http = Net::HTTP.new(uri.host, uri.port)
    request = Net::HTTP::Post.new(uri)
    request['Content-Type'] = 'application/json'
    request.body = { query: query, limit: limit }.to_json
    
    response = http.request(request)
    JSON.parse(response.body)
  end
end

# Usage
client = PersonasRESTClient.new
personas = client.get_personas
recommendations = client.recommend("build authentication system")
```

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

type PersonasClient struct {
    BaseURL string
    Client  *http.Client
}

type Persona struct {
    ID          string   `json:"id"`
    Name        string   `json:"name"`
    Role        string   `json:"role"`
    Description string   `json:"description"`
    Expertise   []string `json:"expertise"`
}

type RecommendRequest struct {
    Query string `json:"query"`
    Limit int    `json:"limit"`
}

func NewPersonasClient(baseURL string) *PersonasClient {
    return &PersonasClient{
        BaseURL: baseURL,
        Client:  &http.Client{},
    }
}

func (c *PersonasClient) GetPersonas() ([]Persona, error) {
    resp, err := c.Client.Get(c.BaseURL + "/personas")
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var personas []Persona
    err = json.NewDecoder(resp.Body).Decode(&personas)
    return personas, err
}

func (c *PersonasClient) Recommend(query string, limit int) ([]map[string]interface{}, error) {
    reqBody, _ := json.Marshal(RecommendRequest{
        Query: query,
        Limit: limit,
    })
    
    resp, err := c.Client.Post(
        c.BaseURL+"/recommend",
        "application/json",
        bytes.NewBuffer(reqBody),
    )
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var recommendations []map[string]interface{}
    err = json.NewDecoder(resp.Body).Decode(&recommendations)
    return recommendations, err
}

// Usage
func main() {
    client := NewPersonasClient("http://localhost:3000/api")
    
    personas, _ := client.GetPersonas()
    fmt.Printf("Found %d personas\n", len(personas))
    
    recommendations, _ := client.Recommend("optimize API performance", 3)
    for _, rec := range recommendations {
        fmt.Printf("Recommended: %v\n", rec["persona"])
    }
}
```

## Error Handling

### Common Error Responses

```json
{
  "error": "Persona not found",
  "code": "PERSONA_NOT_FOUND"
}
```

### Error Handling Best Practices

```typescript
// TypeScript
try {
  const result = await client.callTool('recommend-persona', task);
  return result.data;
} catch (error) {
  if (error.code === 'VALIDATION_ERROR') {
    console.error('Invalid input:', error.message);
  } else if (error.code === 'PERSONA_NOT_FOUND') {
    console.error('Persona does not exist');
  } else {
    console.error('Unexpected error:', error);
  }
  throw error;
}
```

```python
# Python
try:
    result = client.recommend("task description")
except requests.HTTPError as e:
    if e.response.status_code == 400:
        print(f"Validation error: {e.response.json()}")
    elif e.response.status_code == 404:
        print("Persona not found")
    else:
        raise
```

## Authentication (Future)

Authentication is not currently implemented but is planned for future versions. When available, it will use Bearer token authentication:

```typescript
// Future authentication example
const client = new PersonasMCPClient({
  apiKey: 'your-api-key',
  headers: {
    'Authorization': 'Bearer your-api-key'
  }
});
```

## Rate Limiting

Currently no rate limiting is implemented. Future versions may include:
- 100 requests per minute per IP
- 1000 requests per hour per IP

Plan your integration accordingly.

## Caching Recommendations

Since persona recommendations are deterministic for the same input, consider caching:

```typescript
class CachedPersonasClient extends PersonasRESTClient {
  private cache = new Map<string, any>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  async recommend(query: string, limit: number = 3) {
    const cacheKey = `${query}-${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    const result = await super.recommend(query, limit);
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  }
}
```

## WebSocket Support (Future)

Future versions may support WebSocket connections for real-time updates:

```typescript
// Future WebSocket example
const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('persona-updated', (persona) => {
  console.log('Persona updated:', persona.id);
});

ws.on('recommendation', (data) => {
  console.log('New recommendation:', data);
});
```

## Best Practices

1. **Connection Management**
   - Reuse HTTP connections with session/client objects
   - Implement retry logic for transient failures
   - Set appropriate timeouts

2. **Error Handling**
   - Always handle network errors gracefully
   - Provide fallback behavior when service is unavailable
   - Log errors for debugging

3. **Performance**
   - Cache frequently requested data
   - Batch requests when possible
   - Use appropriate concurrency limits

4. **Security**
   - Always use HTTPS in production
   - Validate all inputs before sending
   - Don't expose the service publicly without authentication

## Testing Your Integration

```typescript
// Example test suite
describe('PersonasClient', () => {
  let client: PersonasRESTClient;
  
  beforeEach(() => {
    client = new PersonasRESTClient('http://localhost:3000/api');
  });
  
  test('should get all personas', async () => {
    const personas = await client.getPersonas();
    expect(personas).toBeInstanceOf(Array);
    expect(personas.length).toBeGreaterThan(0);
  });
  
  test('should recommend personas', async () => {
    const recommendations = await client.recommend('debug memory leak');
    expect(recommendations).toBeInstanceOf(Array);
    expect(recommendations[0]).toHaveProperty('persona');
    expect(recommendations[0]).toHaveProperty('score');
  });
});
```

## Support

For issues with client integration:
- Check the [FAQ](../FAQ.md)
- Review [API Reference](../engineering/api-reference.md)
- Open an issue on [GitHub](https://github.com/pidster/persona-mcp/issues)