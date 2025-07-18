# Architecture Documentation

This directory contains detailed architectural documentation for the Personas MCP server components.

## Documents

### System Level

- [System Overview](./system-overview.md) - High-level system architecture, deployment models, and security architecture

### Core Components

- [MCP Server](./mcp-server.md) - MCP protocol server implementation and request handling
- [Persona Manager](./persona-manager.md) - Persona loading, validation, and lifecycle management
- [Recommendation Engine](./recommendation-engine.md) - Intelligent persona recommendation system

### Implementation Details

- [CLI Startup Flow](./cli-startup-flow.md) - Command-line interface and startup sequence diagrams

## Architecture Principles

1. **Modularity**: Clear separation of concerns between components
2. **Extensibility**: Plugin-based persona system with multiple loading strategies
3. **Performance**: Caching and parallel processing for optimal response times
4. **Reliability**: Graceful error handling and recovery mechanisms
5. **Security**: Defense-in-depth with validation at multiple layers

## Diagram Types

Each document contains various UML and Mermaid diagrams:

- **Sequence Diagrams**: Show interaction flows between components
- **Class Diagrams**: Illustrate object structures and relationships
- **State Diagrams**: Define component lifecycle and state transitions
- **Flow Charts**: Describe algorithmic processes and decision flows
- **C4 Diagrams**: Provide context, container, and component views

## Reading Order

For new contributors, we recommend reading in this order:

1. System Overview - Understand the big picture
2. MCP Server - Learn about the protocol implementation
3. Persona Manager - Understand persona handling
4. CLI Startup Flow - See how everything starts up
5. Recommendation Engine - Dive into the AI-powered features
