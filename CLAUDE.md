# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that provides LLM clients with specialized prompt personas for improved problem-solving approaches in software development tasks.

## Technology Stack

- **TypeScript** with ES modules
- **@modelcontextprotocol/sdk** for MCP protocol implementation
- **Zod** for schema validation
- **tsup** for building and bundling

## Development Commands

```bash
npm run build      # Build the project with tsup
npm run dev        # Watch mode for development
npm run start      # Start the MCP server
npm run typecheck  # TypeScript type checking
```

## Architecture

### Core Components

- `src/index.ts` - Main MCP server entry point with HTTP transport
- `src/persona-manager.ts` - Manages persona loading and prompt generation
- `src/types/` - TypeScript type definitions for personas and MCP
- `src/personas/` - Individual persona definitions

### MCP Capabilities

The server exposes:

- **Resources**: Persona definitions accessible via `persona://{id}` URIs
- **Prompts**: Persona adoption prompts via `adopt-persona-{id}` commands

### Persona System

Each persona includes:

- Unique ID and role classification
- Specialized expertise areas
- Problem-solving approach
- Detailed prompt template
- Examples and tags

## Adding New Personas

1. Create new persona file in `src/personas/`
2. Export persona object following the `Persona` type
3. Add to persona imports in `persona-manager.ts`
4. Include in `defaultPersonas` array

## Testing

Test the server using MCP Inspector or integrate with MCP-compatible clients like Claude Desktop.

## File Organization

- Store plans in a `plans/` directory using a file name format `{year-month-day}-{version}-{brief topic}.md`

## Code Guidelines

- Never use emojis in docs unless the user specifically requests it

## Automatic Persona Selection

When the Personas MCP server is connected and the user asks a question:

1. Analyze the request to determine the task type (e.g., debugging, architecture, implementation)
2. If appropriate, use the @recommend-persona tool to get recommendations
3. Automatically adopt the highest-scoring persona for the task
4. Briefly inform the user: "I've adopted the [persona name] persona for this [task type] task"
5. Proceed with the persona's perspective

Example scenarios:
- "Why is my app crashing?" → Adopt debugger persona
- "How should I structure this service?" → Adopt architect persona
- "Review this code" → Adopt reviewer persona
- "Write tests for this function" → Adopt tester persona

Do not automatically adopt personas when:
- The user explicitly requests a specific persona
- The user asks to compare personas
- The task is about persona management itself
