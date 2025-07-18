# Changelog

All notable changes to the Personas MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Comprehensive documentation suite including:
  - Quick Start Guide for 5-minute setup
  - Persona Creation Guide with complete YAML schema
  - Integration examples (JavaScript, Python, curl)
  - Contributing guidelines
  - FAQ section
- Example client implementations in multiple languages
- Project-level persona support (`./.ai/personas/*.yaml`)

### Changed

- Enhanced README with better structure and navigation
- Improved documentation organization in `docs/` directory

### Fixed

- Documentation gaps and missing setup instructions

## [0.2.0-alpha] - 2024-01-18

### Added

- OpenTelemetry (OTLP) metrics support for monitoring
- Metrics endpoints for tracking:
  - HTTP request metrics (count, duration, active connections)
  - MCP protocol metrics (requests, errors)
  - Persona usage metrics
  - Tool invocation metrics
- MCP list resource templates endpoint (stub implementation)
- Enhanced persona manager with file watching capabilities
- REST API endpoints for non-MCP clients:
  - GET `/api/personas` - List all personas
  - GET `/api/personas/:id` - Get specific persona
  - POST `/api/recommend` - Get recommendations
  - POST `/api/compare` - Compare personas
- Command-line options:
  - `--port` - Custom port configuration
  - `--host` - Custom host binding
  - `--no-cors` - Disable CORS
- Health check endpoints (`/health`, `/ready`)

### Changed

- Migrated from stdio to HTTP transport for better flexibility
- Enhanced recommendation engine with multi-factor scoring
- Improved error handling and validation
- Updated to ES modules throughout the project

### Security

- Added DNS rebinding protection
- Implemented proper CORS handling
- Input validation using Zod schemas

## [0.1.0-alpha] - 2024-01-10

### Added

- Initial release with 12 built-in personas:
  - Architect - System design and architecture
  - Developer - Code implementation
  - Debugger - Troubleshooting specialist
  - Reviewer - Code quality analysis
  - Tester - Testing strategies
  - Optimizer - Performance tuning
  - Security Analyst - Security assessment
  - Product Manager - Requirements gathering
  - Technical Writer - Documentation
  - Engineering Manager - Team leadership
  - UI Designer - User interface design
  - Performance Analyst - Performance monitoring
- Core MCP server implementation
- Basic persona recommendation system
- MCP tools:
  - `recommend-persona` - Get persona recommendations
  - `explain-persona-fit` - Explain persona suitability
  - `compare-personas` - Compare multiple personas
  - `get-recommendation-stats` - System statistics
- User-level persona support (`~/.ai/personas/*.yaml`)
- TypeScript implementation with strict typing
- Basic test suite with Vitest

### Known Issues

- File watching may not detect all changes immediately
- Limited to local deployment only
- No authentication mechanism

## [0.0.1] - 2024-01-05

### Added

- Initial project setup
- Basic MCP protocol implementation
- Proof of concept with 4 personas

---

## Upgrade Instructions

### From 0.1.0 to 0.2.0

1. The server now uses HTTP transport by default instead of stdio
2. Update your Claude Desktop configuration:
   ```json
   {
     "mcpServers": {
       "personas": {
         "command": "node",
         "args": ["/path/to/persona-mcp/dist/index.js"]
       }
     }
   }
   ```
3. New REST API endpoints are available at `http://localhost:3000/api/*`
4. Metrics can be enabled via environment variables (see README)

### From 0.0.1 to 0.1.0

Complete reinstall recommended due to significant architectural changes.

## Future Releases

See our [Roadmap](./plans/roadmap.md) for planned features in upcoming releases.
