# Changelog

All notable changes to the Personas MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0-alpha] - TBD

### Added

- TBD

### Changed

- TBD

### Fixed

- TBD

## [0.3.0] - 2025-01-20

### Added

- **XML-Based Persona Optimization**
  - New XML prompt generation system with semantic tagging for enhanced AI comprehension
  - Added `src/types/prompt-format.ts` with prompt format types and compression levels
  - Implemented `src/utils/xml-prompt-builder.ts` with Mermaid diagram integration
  - Support for multiple AI model formats (Claude, GPT-4, Gemini)
  - Achieved 25-33% compression while improving prompt actionability
  - Enhanced `src/enhanced-persona-manager.ts` with XML generation methods
  - Comprehensive test suite for XML generation with 16 passing tests

- **Automated Version Management**
  - New `scripts/update-version.cjs` for automatic version synchronization
  - npm scripts `version:update` and `version:sync` for version management
  - Automatic sync between package.json and src/version.ts

### Changed

- **Persona Improvements**
  - Optimized all 12 built-in personas with semantic XML structure
  - Enhanced constraints with Must/Never prefixes for better categorization
  - Simplified Mermaid diagrams while retaining essential decision flows
  - Compressed methodology and decision criteria sections
  - Added BehaviorDiagram type exports for proper TypeScript validation

- **Release Process Improvements**
  - Enhanced release documentation with clearer version update instructions
  - Added version consistency verification step
  - Improved troubleshooting section for version mismatch issues
  - Removed brittle hardcoded version tests in favor of format validation

### Fixed

- Version mismatch issues between package.json and src/version.ts
- CI failures after releases due to version inconsistencies
- Brittle test expectations that were testing specific version values
- TypeScript strict checking compliance with proper variable prefixing
- ESLint warnings resolved with underscore prefix for unused parameters
- Test regex patterns improved for better reliability

## [0.2.0] - 2025-01-19

### Added

- **Context-Aware Persona Discovery System**
  - New `discover-persona-for-context` MCP tool for intelligent persona suggestions
  - Smart auto-discovery based on conversation history, file patterns, and error messages
  - Proactive recommendations that analyze current work context
  - File pattern matching for automatic persona detection
- **Advanced Metrics & Analytics**
  - New `get-adoption-metrics` MCP tool for persona usage analytics
  - Comprehensive adoption tracking with EventEmitter-based system
  - Success rate monitoring and trending analysis
  - Test persona validation signals for R&D purposes
- **Enhanced Persona Intelligence**
  - New `suggest-persona-transition` MCP tool for workflow optimization
  - New `analyze-persona-effectiveness` MCP tool for performance analytics
  - Enhanced persona metadata system with adoption triggers and incentives
  - Intelligent persona sequencing and transition recommendations
  - Attractiveness cues and authority signals for better persona selection
- **Comprehensive Documentation Suite**
  - Quick Start Guide for 5-minute setup
  - Persona Creation Guide with complete YAML schema
  - Integration examples (JavaScript, Python, curl)
  - Contributing guidelines and FAQ section
  - Example client implementations in multiple languages
- **Technical Infrastructure**
  - Project-level persona support (`./.ai/personas/*.yaml`)
  - Enhanced error handling and validation throughout the system
  - Comprehensive test coverage with E2E testing
  - Strict TypeScript checking with pre-commit hooks
  - Rate limiting and API validation for REST endpoints

### Changed

- Enhanced README with better structure and navigation
- Improved documentation organization in `docs/` directory
- Better error handling across all MCP operations
- Upgraded to strict TypeScript checking for better code quality
- Improved CI/CD pipeline with comprehensive testing

### Fixed

- Documentation gaps and missing setup instructions
- CI test environment compatibility issues
- TypeScript type assertion corrections in metrics middleware
- Test timing race conditions in CI environments
- Pre-commit hook integration and formatting consistency

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
