# MCP Integration Design

## Overview

This document describes how the Personas MCP Server integrates with the Model Context Protocol (MCP) to provide persona management and recommendation capabilities.

## MCP Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Claude[Claude Desktop]
        API[API Clients]
        Custom[Custom MCP Clients]
    end
    
    subgraph "Transport Layer"
        HTTP[HTTP Transport]
        Stream[Streaming Support]
        CORS[CORS Handler]
    end
    
    subgraph "MCP Server Core"
        Server[MCP Server Instance]
        Handlers[Request Handlers]
        Capabilities[Server Capabilities]
    end
    
    subgraph "Persona Services"
        Resources[Resource Handler]
        Prompts[Prompt Handler]
        Tools[Tool Handler]
    end
    
    Claude --> HTTP
    API --> HTTP
    Custom --> HTTP
    
    HTTP --> Server
    Stream --> Server
    
    Server --> Handlers
    Handlers --> Resources
    Handlers --> Prompts
    Handlers --> Tools
    
    Server --> Capabilities
```

## Protocol Implementation

### Server Initialization

```mermaid
sequenceDiagram
    participant App as Application
    participant Server as MCP Server
    participant PM as PersonaManager
    participant Transport as HTTP Transport
    
    App->>Server: new Server(config)
    Server->>Server: Set capabilities
    App->>PM: new PersonaManager()
    PM->>PM: Load personas
    App->>Server: Setup handlers
    App->>Transport: Create transport
    App->>Server: Connect transport
    Server-->>App: Ready
```

### Capability Registration

```mermaid
graph LR
    subgraph "Server Capabilities"
        Resources[resources: {}]
        Prompts[prompts: {}]
        Tools[tools: {}]
    end
    
    subgraph "Handler Registration"
        ListResources[ListResourcesRequest]
        ReadResource[ReadResourceRequest]
        ListPrompts[ListPromptsRequest]
        GetPrompt[GetPromptRequest]
        ListTools[ListToolsRequest]
        CallTool[CallToolRequest]
    end
    
    Resources --> ListResources
    Resources --> ReadResource
    Prompts --> ListPrompts
    Prompts --> GetPrompt
    Tools --> ListTools
    Tools --> CallTool
```

## Request Handling

### Resource Requests

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant Handler as Resource Handler
    participant PM as PersonaManager
    
    Client->>Server: ListResourcesRequest
    Server->>Handler: Handle request
    Handler->>PM: getAllPersonas()
    PM-->>Handler: Persona[]
    Handler->>Handler: Format as resources
    Handler-->>Server: Resource list
    Server-->>Client: ListResourcesResponse
    
    Client->>Server: ReadResourceRequest(uri)
    Server->>Handler: Handle request
    Handler->>Handler: Parse URI
    Handler->>PM: getPersona(id)
    PM-->>Handler: Persona
    Handler->>Handler: Format as JSON
    Handler-->>Server: Resource content
    Server-->>Client: ReadResourceResponse
```

### Tool Requests

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant TH as Tool Handler
    participant RT as RecommendationTool
    participant RE as RecommendationEngine
    
    Client->>Server: ListToolsRequest
    Server->>TH: Handle request
    TH->>RT: getToolDefinitions()
    RT-->>TH: Tool definitions
    TH-->>Server: Tool list
    Server-->>Client: ListToolsResponse
    
    Client->>Server: CallToolRequest(name, args)
    Server->>TH: Handle request
    TH->>RT: handleToolCall(name, args)
    RT->>RT: Validate input
    RT->>RE: Process request
    RE-->>RT: Results
    RT->>RT: Format response
    RT-->>TH: Tool result
    TH-->>Server: Response
    Server-->>Client: CallToolResponse
```

## Transport Layer

### HTTP Transport Configuration

```mermaid
graph TB
    subgraph "Express Server"
        App[Express App]
        CORS[CORS Middleware]
        Routes[Route Handlers]
    end
    
    subgraph "MCP Endpoints"
        POST[POST /mcp]
        GET[GET /mcp]
        Health[GET /health]
        Ready[GET /ready]
    end
    
    subgraph "Transport Handler"
        Stream[StreamableHTTPServerTransport]
        Session[Session Management]
        JSON[JSON Response Mode]
    end
    
    App --> CORS
    CORS --> Routes
    Routes --> POST
    Routes --> GET
    Routes --> Health
    Routes --> Ready
    
    POST --> Stream
    GET --> Stream
    Stream --> Session
    Stream --> JSON
```

### Request/Response Flow

```mermaid
flowchart LR
    subgraph "Request Processing"
        Receive[Receive HTTP Request]
        Parse[Parse JSON-RPC]
        Route[Route to Handler]
        Process[Process Request]
    end
    
    subgraph "Response Generation"
        Format[Format Result]
        Wrap[JSON-RPC Wrapper]
        Send[Send Response]
    end
    
    Receive --> Parse
    Parse --> Route
    Route --> Process
    Process --> Format
    Format --> Wrap
    Wrap --> Send
```

## Error Handling

```mermaid
graph TB
    subgraph "Error Types"
        Validation[Validation Errors]
        NotFound[Resource Not Found]
        Internal[Internal Errors]
        Protocol[Protocol Errors]
    end
    
    subgraph "Error Response"
        Code[Error Code]
        Message[Error Message]
        Data[Error Data]
    end
    
    Validation --> Code
    NotFound --> Code
    Internal --> Code
    Protocol --> Code
    
    Code --> Response[JSON-RPC Error]
    Message --> Response
    Data --> Response
```

## Tool Integration Pattern

```mermaid
classDiagram
    class MCPServer {
        -handlers: Map
        +setRequestHandler(schema, handler)
        +connect(transport)
    }
    
    class RecommendationTool {
        -engine: RecommendationEngine
        +getToolDefinitions(): Tool[]
        +handleToolCall(name, args): Result
    }
    
    class Tool {
        +name: string
        +description: string
        +inputSchema: object
    }
    
    class ToolHandler {
        +handle(request): Response
        -validateInput(args): boolean
        -processRequest(args): Result
    }
    
    MCPServer --> ToolHandler
    ToolHandler --> RecommendationTool
    RecommendationTool --> Tool
```

## Data Flow Through MCP

```mermaid
graph TB
    subgraph "Input Layer"
        ClientRequest[Client Request]
        Validation[Schema Validation]
    end
    
    subgraph "Processing Layer"
        Handler[Request Handler]
        Service[Service Layer]
        Data[Data Access]
    end
    
    subgraph "Output Layer"
        Transform[Response Transform]
        Protocol[Protocol Wrapper]
        ClientResponse[Client Response]
    end
    
    ClientRequest --> Validation
    Validation --> Handler
    Handler --> Service
    Service --> Data
    Data --> Service
    Service --> Transform
    Transform --> Protocol
    Protocol --> ClientResponse
```

## Session Management

```mermaid
stateDiagram-v2
    [*] --> Disconnected
    Disconnected --> Connecting: Client connects
    Connecting --> Connected: Handshake complete
    Connected --> Active: First request
    Active --> Active: Subsequent requests
    Active --> Idle: No activity
    Idle --> Active: New request
    Idle --> Disconnected: Timeout
    Connected --> Disconnected: Client disconnect
    Active --> Disconnected: Error
```

## Security Considerations

### DNS Rebinding Protection
```mermaid
graph LR
    Request[Incoming Request] --> Check{Host Allowed?}
    Check -->|Yes| Process[Process Request]
    Check -->|No| Reject[Reject 403]
    
    AllowedHosts[Allowed Hosts List] --> Check
```

### CORS Configuration
```mermaid
graph TB
    subgraph "CORS Settings"
        Origins[Allowed Origins]
        Methods[Allowed Methods]
        Headers[Allowed Headers]
        Credentials[Credentials Support]
    end
    
    Origins --> Policy[CORS Policy]
    Methods --> Policy
    Headers --> Policy
    Credentials --> Policy
    
    Policy --> Middleware[Express CORS]
```

## Performance Optimizations

1. **Connection Pooling**: Reuse transport connections
2. **Response Caching**: Cache resource listings
3. **Lazy Loading**: Load personas on demand
4. **Streaming**: Use streaming for large responses

## Future Enhancements

1. **WebSocket Transport**: Real-time updates
2. **Authentication**: Token-based auth
3. **Rate Limiting**: Prevent abuse
4. **Metrics Collection**: Usage analytics