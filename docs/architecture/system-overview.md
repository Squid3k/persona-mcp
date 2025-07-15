# System Architecture Overview

## Introduction

The Personas MCP Server is a Model Context Protocol server that provides AI assistants with specialized personas for improved problem-solving in software development tasks. This document provides a high-level overview of the system architecture.

## System Context

```mermaid
C4Context
    title System Context - Personas MCP Server
    
    Person(user, "User", "Developer using AI assistant")
    System(mcp_server, "Personas MCP Server", "Provides persona management and recommendations")
    System_Ext(claude, "Claude Desktop", "AI assistant client")
    System_Ext(api_client, "API Client", "Third-party MCP client")
    
    Rel(user, claude, "Uses")
    Rel(claude, mcp_server, "MCP Protocol")
    Rel(api_client, mcp_server, "MCP Protocol")
```

## Container Architecture

```mermaid
C4Container
    title Container Diagram - Personas MCP Server
    
    Container(server, "MCP Server", "Node.js/TypeScript", "HTTP server with MCP protocol handlers")
    Container(persona_manager, "Persona Manager", "TypeScript", "Manages persona lifecycle and loading")
    Container(recommendation, "Recommendation Engine", "TypeScript", "Persona matching and scoring")
    Container(file_system, "File System", "YAML/JSON", "Persona definitions and configurations")
    
    Rel(server, persona_manager, "Uses")
    Rel(server, recommendation, "Uses")
    Rel(persona_manager, file_system, "Reads")
    Rel(recommendation, persona_manager, "Queries")
```

## Component Architecture

```mermaid
graph TB
    subgraph "Server Layer"
        HTTP[HTTP Server<br/>Express.js]
        Transport[MCP Transport<br/>StreamableHTTP]
        Handlers[Request Handlers]
    end
    
    subgraph "Service Layer"
        PM[PersonaManager]
        RE[RecommendationEngine]
        PS[PersonaScorer]
        RT[RecommendationTool]
    end
    
    subgraph "Data Layer"
        Loader[PersonaLoader]
        Resolver[PersonaResolver]
        Watcher[PersonaWatcher]
        Cache[In-Memory Cache]
    end
    
    subgraph "External"
        FS[File System]
        Config[Configuration]
    end
    
    HTTP --> Transport
    Transport --> Handlers
    Handlers --> PM
    Handlers --> RT
    RT --> RE
    RE --> PS
    RE --> PM
    PM --> Loader
    PM --> Cache
    Loader --> Resolver
    Loader --> Watcher
    Resolver --> FS
    Watcher --> FS
    HTTP --> Config
```

## Key Components

### 1. Server Layer
- **HTTP Server**: Express-based server handling HTTP requests
- **MCP Transport**: Handles MCP protocol communication
- **Request Handlers**: Route MCP requests to appropriate services

### 2. Service Layer
- **PersonaManager**: Central service for persona operations
- **RecommendationEngine**: Processes recommendation requests
- **PersonaScorer**: Implements scoring algorithm
- **RecommendationTool**: MCP tool interface for recommendations

### 3. Data Layer
- **PersonaLoader**: Loads personas from various sources
- **PersonaResolver**: Resolves persona conflicts and precedence
- **PersonaWatcher**: Monitors file changes for hot-reload
- **Cache**: In-memory storage for performance

## Data Flow

```mermaid
flowchart LR
    subgraph "Request Flow"
        Client[MCP Client] --> Server[Server]
        Server --> Handler{Route}
        
        Handler -->|Resources| ResourceFlow[Resource Handler]
        Handler -->|Prompts| PromptFlow[Prompt Handler]
        Handler -->|Tools| ToolFlow[Tool Handler]
    end
    
    subgraph "Resource Flow"
        ResourceFlow --> PM1[PersonaManager]
        PM1 --> Personas1[Get Personas]
        Personas1 --> Format1[Format Response]
    end
    
    subgraph "Tool Flow"
        ToolFlow --> Tool[RecommendationTool]
        Tool --> Engine[RecommendationEngine]
        Engine --> Scorer[PersonaScorer]
        Engine --> PM2[PersonaManager]
    end
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        DevServer[Dev Server<br/>localhost:3000]
        DevFiles[Local Files]
    end
    
    subgraph "Production"
        ProdServer[Prod Server<br/>Port Configurable]
        ProdFiles[Server Files]
        Monitoring[Health Checks]
    end
    
    subgraph "Client Integration"
        Claude[Claude Desktop]
        API[API Clients]
    end
    
    DevServer --> DevFiles
    ProdServer --> ProdFiles
    ProdServer --> Monitoring
    
    Claude --> DevServer
    Claude --> ProdServer
    API --> ProdServer
```

## Technology Stack

### Core Technologies
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x
- **Framework**: Express.js
- **Protocol**: Model Context Protocol (MCP)

### Key Libraries
- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **Zod**: Runtime type validation
- **Express**: HTTP server framework
- **tsx**: TypeScript execution
- **tsup**: Build tool

### Development Tools
- **Vitest**: Testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks

## Design Principles

### 1. Modularity
- Clear separation of concerns
- Pluggable components
- Interface-based design

### 2. Extensibility
- Easy to add new personas
- Configurable scoring algorithms
- Plugin architecture for future features

### 3. Performance
- In-memory caching
- Lazy loading
- Efficient scoring algorithms

### 4. Reliability
- Comprehensive error handling
- Graceful degradation
- Health monitoring

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        Transport[Transport Security<br/>HTTPS]
        CORS[CORS Protection]
        DNS[DNS Rebinding Protection]
        Input[Input Validation<br/>Zod Schemas]
    end
    
    subgraph "Access Control"
        Host[Allowed Hosts]
        Origin[Allowed Origins]
    end
    
    Transport --> CORS
    CORS --> DNS
    DNS --> Input
    
    Host --> DNS
    Origin --> CORS
```

## Scalability Considerations

### Horizontal Scaling
- Stateless server design
- No shared state between instances
- Load balancer compatible

### Vertical Scaling
- Efficient memory usage
- Optimized algorithms
- Resource pooling

## Monitoring & Observability

### Health Endpoints
- `/health` - System health status
- `/ready` - Service readiness
- `/` - Server information

### Metrics
- Request count and latency
- Persona usage statistics
- Recommendation accuracy

## Future Architecture Evolution

### Phase 1: Current
- Basic MCP server
- File-based personas
- Simple scoring

### Phase 2: Enhanced
- Database integration
- Advanced scoring
- Caching layer

### Phase 3: Advanced
- Machine learning integration
- Distributed architecture
- Real-time updates