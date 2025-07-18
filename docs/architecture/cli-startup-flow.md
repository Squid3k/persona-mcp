# CLI Startup Flow Architecture

This document describes the startup flow of the personas-mcp CLI, including command-line argument handling and server initialization.

## Overview

The CLI provides a command-line interface for the Personas MCP server with support for various options including help, version, and server configuration.

## Startup Sequence

```mermaid
sequenceDiagram
    participant User
    participant CLI as cli.ts
    participant Index as index.ts
    participant Server as PersonasMcpServer
    participant PM as PersonaManager
    participant Transport as HTTP Transport

    User->>Index: personas-mcp [args]
    Index->>CLI: import './cli.js'

    alt --version or -v flag
        CLI->>CLI: printVersion()
        CLI->>User: Display version (0.1.0)
        CLI->>CLI: process.exit(0)
    else --help flag
        CLI->>CLI: printHelp()
        CLI->>User: Display help text
        CLI->>CLI: process.exit(0)
    else Normal startup
        CLI->>CLI: main()
        CLI->>CLI: parseArgs()
        Note over CLI: Parse --port, --host, --no-cors

        alt Invalid arguments
            CLI->>User: Error message
            CLI->>CLI: process.exit(1)
        end

        CLI->>Server: new PersonasMcpServer(config)
        Server->>PM: Initialize PersonaManager
        PM->>PM: Load default personas
        PM->>PM: Load user personas (~/.ai/personas)
        PM->>PM: Load project personas (./.ai/personas)
        PM->>PM: Set up file watchers

        Server->>Transport: Create HTTP server
        Server->>Server: Setup MCP handlers
        Server->>Server: Setup middleware

        CLI->>CLI: Setup signal handlers
        Note over CLI: SIGINT, SIGTERM → shutdown()

        CLI->>Server: server.run()
        Server->>Transport: Start listening
        Server->>User: Server running on port

        Note over Server: Server is now running
    end
```

## CLI Logic Flow

```mermaid
flowchart TD
    Start([personas-mcp command]) --> Import[Import cli.js]

    Import --> CheckVersion{--version or -v?}
    CheckVersion -->|Yes| ShowVersion[Display version]
    ShowVersion --> Exit1([Exit 0])

    CheckVersion -->|No| CheckHelp{--help?}
    CheckHelp -->|Yes| ShowHelp[Display help]
    ShowHelp --> Exit2([Exit 0])

    CheckHelp -->|No| Main[Call main()]
    Main --> ParseArgs[Parse arguments]

    ParseArgs --> ValidatePort{Valid port?}
    ValidatePort -->|No| ErrorPort[Error: Invalid port]
    ErrorPort --> Exit3([Exit 1])

    ValidatePort -->|Yes| ValidateHost{Valid host?}
    ValidateHost -->|No| ErrorHost[Error: Host required]
    ErrorHost --> Exit4([Exit 1])

    ValidateHost -->|Yes| CreateServer[Create PersonasMcpServer]
    CreateServer --> InitPM[Initialize PersonaManager]
    InitPM --> LoadPersonas[Load personas]
    LoadPersonas --> SetupHandlers[Setup signal handlers]
    SetupHandlers --> RunServer[Run server]

    RunServer --> ServerError{Server error?}
    ServerError -->|Yes| LogError[Log error]
    LogError --> Exit5([Exit 1])

    ServerError -->|No| Running[Server running]

    Running --> Signal{Receive signal?}
    Signal -->|SIGINT/SIGTERM| Shutdown[Graceful shutdown]
    Shutdown --> Exit6([Exit 0])
    Signal -->|No| Running
```

## Component Interactions During Startup

```mermaid
graph TB
    subgraph "CLI Layer"
        CLI[cli.ts]
        Args[Argument Parser]
        Help[Help Display]
        Version[Version Display]
    end

    subgraph "Server Layer"
        Server[PersonasMcpServer]
        Config[ServerConfig]
        Shutdown[Shutdown Handler]
    end

    subgraph "Service Layer"
        PM[PersonaManager]
        RE[RecommendationEngine]
        PS[PersonaScorer]
    end

    subgraph "Transport Layer"
        HTTP[HTTP Server]
        MCP[MCP Transport]
        Handlers[Request Handlers]
    end

    CLI --> Args
    Args --> Config
    Config --> Server
    Server --> PM
    PM --> RE
    RE --> PS
    Server --> HTTP
    HTTP --> MCP
    MCP --> Handlers
    Handlers --> PM

    CLI --> Help
    CLI --> Version
    CLI --> Shutdown
    Shutdown --> Server
```

## Error Handling Flow

```mermaid
stateDiagram-v2
    [*] --> ParseArgs
    ParseArgs --> CheckPort: Validate
    CheckPort --> CheckHost: Valid
    CheckPort --> ErrorExit: Invalid
    CheckHost --> CreateServer: Valid
    CheckHost --> ErrorExit: Invalid
    CreateServer --> Initialize: Success
    CreateServer --> ErrorExit: Failure
    Initialize --> Running: Success
    Initialize --> ErrorExit: Failure
    Running --> Shutdown: Signal
    Running --> ErrorExit: Crash
    Shutdown --> [*]: Clean exit
    ErrorExit --> [*]: Exit code 1
```

## Key Design Decisions

1. **Early Flag Handling**: Version and help flags are checked before any server initialization to provide quick responses without unnecessary resource allocation.

2. **Graceful Shutdown**: Signal handlers ensure clean shutdown of all resources including file watchers and HTTP connections.

3. **Configuration Validation**: Arguments are validated early to fail fast with clear error messages.

4. **Modular Structure**: Clear separation between CLI handling, server initialization, and service components.

## Testing Considerations

The CLI can be tested at multiple levels:

1. **Unit Tests**: Test individual functions like `parseArgs()`, `printHelp()`, `printVersion()`
2. **Integration Tests**: Test full startup flow with various argument combinations
3. **E2E Tests**: Test actual server startup and shutdown scenarios

## Security Considerations

- Host validation prevents binding to unauthorized interfaces
- Port validation ensures only valid port numbers are accepted
- No sensitive information is logged during startup
- Graceful shutdown prevents resource leaks
