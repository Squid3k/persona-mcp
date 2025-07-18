# MCP Server Architecture

## Overview

The MCP Server component implements the Model Context Protocol, providing HTTP transport, request routing, and integration with persona services. It serves as the entry point for all client interactions.

## Server Architecture

```mermaid
classDiagram
    class PersonasMcpServer {
        -server: Server
        -personaManager: EnhancedPersonaManager
        -recommendationTool: RecommendationTool
        -config: ServerConfig
        -httpServer: HTTPServer
        +initialize(): Promise<void>
        +run(): Promise<void>
        +shutdown(): Promise<void>
        -setupHandlers(): void
        -runHttp(): Promise<void>
    }

    class Server {
        -name: string
        -version: string
        -capabilities: Capabilities
        +setRequestHandler(schema, handler): void
        +connect(transport): Promise<void>
    }

    class StreamableHTTPServerTransport {
        -sessionIdGenerator: Function
        -enableJsonResponse: boolean
        -enableDnsRebindingProtection: boolean
        -allowedHosts: string[]
        +handleRequest(req, res): Promise<void>
    }

    class ExpressApp {
        +use(middleware): void
        +post(path, handler): void
        +get(path, handler): void
        +listen(port, host, callback): void
    }

    PersonasMcpServer --> Server
    PersonasMcpServer --> StreamableHTTPServerTransport
    PersonasMcpServer --> ExpressApp
    Server --> StreamableHTTPServerTransport
```

## Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Express
    participant Transport
    participant MCPServer
    participant Handler
    participant Service

    Client->>Express: HTTP Request
    Express->>Express: CORS Check
    Express->>Transport: handleRequest()
    Transport->>Transport: Parse JSON-RPC
    Transport->>MCPServer: Route Request
    MCPServer->>Handler: Call Handler
    Handler->>Service: Process Request
    Service-->>Handler: Result
    Handler-->>MCPServer: Response
    MCPServer-->>Transport: JSON-RPC Response
    Transport-->>Express: HTTP Response
    Express-->>Client: Response
```

## HTTP Layer

### Express Configuration

```mermaid
graph TB
    subgraph "Middleware Stack"
        CORS[CORS Middleware]
        DNS[DNS Protection]
        Routes[Route Handlers]
    end

    subgraph "Endpoints"
        MCPPost[POST /mcp]
        MCPGet[GET /mcp]
        Health[GET /health]
        Ready[GET /ready]
        Info[GET /]
    end

    CORS --> DNS
    DNS --> Routes
    Routes --> MCPPost
    Routes --> MCPGet
    Routes --> Health
    Routes --> Ready
    Routes --> Info
```

### CORS Configuration

```mermaid
graph LR
    subgraph "CORS Options"
        Origins[Allowed Origins]
        Methods[Methods: GET, POST, DELETE, OPTIONS]
        Headers[Headers: Content-Type, Authorization, etc]
        Credentials[Credentials: true]
    end

    Origins --> Policy[CORS Policy]
    Methods --> Policy
    Headers --> Policy
    Credentials --> Policy
```

## MCP Protocol Implementation

### Request Handlers

```mermaid
graph TB
    subgraph "Resource Handlers"
        ListResources[ListResourcesRequest]
        ReadResource[ReadResourceRequest]
    end

    subgraph "Prompt Handlers"
        ListPrompts[ListPromptsRequest]
        GetPrompt[GetPromptRequest]
    end

    subgraph "Tool Handlers"
        ListTools[ListToolsRequest]
        CallTool[CallToolRequest]
    end

    subgraph "Processing"
        Validate[Validate Schema]
        Execute[Execute Handler]
        Format[Format Response]
    end

    ListResources --> Validate
    ReadResource --> Validate
    ListPrompts --> Validate
    GetPrompt --> Validate
    ListTools --> Validate
    CallTool --> Validate

    Validate --> Execute
    Execute --> Format
```

### Capability Registration

```mermaid
graph TB
    subgraph "Server Capabilities"
        Resources[resources: {}]
        Prompts[prompts: {}]
        Tools[tools: {}]
    end

    subgraph "Handler Registration"
        RH[Resource Handlers]
        PH[Prompt Handlers]
        TH[Tool Handlers]
    end

    Resources --> RH
    Prompts --> PH
    Tools --> TH
```

## Transport Layer

### StreamableHTTP Transport

```mermaid
flowchart TB
    subgraph "Transport Configuration"
        Session[Session Management]
        JSON[JSON Response Mode]
        DNS[DNS Protection]
        Hosts[Allowed Hosts]
    end

    subgraph "Request Processing"
        Receive[Receive Request]
        Validate[Validate Host]
        Parse[Parse JSON-RPC]
        Route[Route to Handler]
    end

    subgraph "Response Generation"
        Format[Format Response]
        Stream[Stream if Needed]
        Send[Send Response]
    end

    Session --> Receive
    DNS --> Validate
    Hosts --> Validate
    Receive --> Validate
    Validate --> Parse
    Parse --> Route
    Route --> Format
    Format --> Stream
    Stream --> Send
```

## Session Management

```mermaid
stateDiagram-v2
    [*] --> New: Client Connect
    New --> Active: First Request
    Active --> Active: Subsequent Requests
    Active --> Idle: No Activity
    Idle --> Active: New Request
    Idle --> Expired: Timeout
    Active --> Closed: Client Disconnect
    Expired --> [*]
    Closed --> [*]

    note right of Active: Session ID tracked
    note right of Idle: Keep-alive period
    note right of Expired: Clean up resources
```

## Error Handling

### Error Flow

```mermaid
flowchart TB
    subgraph "Error Types"
        Parse[Parse Error -32700]
        Invalid[Invalid Request -32600]
        Method[Method Not Found -32601]
        Params[Invalid Params -32602]
        Internal[Internal Error -32603]
    end

    subgraph "Error Handling"
        Catch[Catch Error]
        Log[Log Error]
        Format[Format JSON-RPC Error]
        Send[Send Error Response]
    end

    Parse --> Catch
    Invalid --> Catch
    Method --> Catch
    Params --> Catch
    Internal --> Catch

    Catch --> Log
    Log --> Format
    Format --> Send
```

### Error Response Format

```mermaid
graph TB
    subgraph "JSON-RPC Error"
        Code[Error Code]
        Message[Error Message]
        Data[Optional Data]
        ID[Request ID]
    end

    subgraph "HTTP Response"
        Status[HTTP Status]
        Headers[Response Headers]
        Body[JSON Body]
    end

    Code --> Body
    Message --> Body
    Data --> Body
    ID --> Body
    Status --> Headers
```

## Health Monitoring

### Health Check System

```mermaid
graph TB
    subgraph "Health Endpoints"
        Health[/health]
        Ready[/ready]
        Info[/]
    end

    subgraph "Health Checks"
        Server[Server Status]
        Personas[Persona Status]
        Memory[Memory Usage]
        Uptime[Uptime]
    end

    subgraph "Status Response"
        Status[Overall Status]
        Details[Component Details]
        Metrics[Metrics]
    end

    Health --> Server
    Health --> Personas
    Ready --> Server
    Info --> Memory
    Info --> Uptime

    Server --> Status
    Personas --> Details
    Memory --> Metrics
    Uptime --> Metrics
```

## Security Architecture

### Security Layers

```mermaid
graph TB
    subgraph "Network Security"
        HTTPS[HTTPS/TLS]
        Firewall[Firewall Rules]
    end

    subgraph "Application Security"
        CORS[CORS Protection]
        DNS[DNS Rebinding Protection]
        Input[Input Validation]
        Rate[Rate Limiting*]
    end

    subgraph "Protocol Security"
        Schema[Schema Validation]
        Auth[Authentication*]
        Audit[Audit Logging]
    end

    HTTPS --> CORS
    Firewall --> CORS
    CORS --> DNS
    DNS --> Input
    Input --> Schema
    Schema --> Auth
    Auth --> Audit

    style Rate stroke-dasharray: 5 5
    style Auth stroke-dasharray: 5 5
```

\*Future enhancements

## Performance Optimization

### Request Pipeline

```mermaid
graph LR
    subgraph "Optimization Points"
        Parse[Fast JSON Parse]
        Route[Efficient Routing]
        Cache[Response Cache]
        Pool[Connection Pool]
    end

    subgraph "Metrics"
        Latency[Request Latency]
        Throughput[Throughput]
        Errors[Error Rate]
    end

    Parse --> Route
    Route --> Cache
    Cache --> Pool

    Parse --> Latency
    Route --> Throughput
    Cache --> Errors
```

## Configuration

### Server Configuration

```mermaid
graph TB
    subgraph "Config Sources"
        Default[Default Config]
        Env[Environment Vars]
        CLI[CLI Arguments]
        File[Config File*]
    end

    subgraph "Config Options"
        Server[Server Settings]
        HTTP[HTTP Settings]
        Personas[Persona Settings]
        Logging[Logging Settings]
    end

    Default --> Server
    Env --> HTTP
    CLI --> Personas
    File --> Logging

    style File stroke-dasharray: 5 5
```

### Environment Variables

- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: localhost)
- `CORS_ENABLED`: Enable CORS (default: true)
- `LOG_LEVEL`: Logging level
- `MCP_ENDPOINT`: MCP endpoint path

## Deployment Architecture

### Production Deployment

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx/HAProxy]
    end

    subgraph "Server Instances"
        S1[Server 1]
        S2[Server 2]
        S3[Server 3]
    end

    subgraph "Monitoring"
        Health[Health Checks]
        Metrics[Metrics Collection]
        Logs[Log Aggregation]
    end

    LB --> S1
    LB --> S2
    LB --> S3

    S1 --> Health
    S2 --> Health
    S3 --> Health

    S1 --> Metrics
    S2 --> Metrics
    S3 --> Metrics

    S1 --> Logs
    S2 --> Logs
    S3 --> Logs
```

## Future Enhancements

1. **WebSocket Support**: Real-time bidirectional communication
2. **Authentication**: OAuth2/JWT authentication
3. **Rate Limiting**: Protect against abuse
4. **Metrics Export**: Prometheus/OpenTelemetry
5. **Clustering**: Multi-process support
