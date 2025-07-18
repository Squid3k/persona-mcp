#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  GetPromptRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { randomUUID } from 'crypto';
import { EnhancedPersonaManager } from './enhanced-persona-manager.js';
import { PersonaConfig } from './types/yaml-persona.js';
import { RecommendationTool } from './tools/recommendation-tool.js';

export interface ServerConfig {
  name?: string;
  version?: string;
  port?: number;
  host?: string;
  forceHttpMode?: boolean; // Force HTTP mode even in non-TTY environments
  personas?: Partial<PersonaConfig>;
  http?: {
    enableCors?: boolean;
    allowedOrigins?: string[];
    endpoint?: string;
  };
}

export class PersonasMcpServer {
  private server: Server;
  private personaManager: EnhancedPersonaManager;
  private config: ServerConfig;
  private httpServer?: ReturnType<typeof createServer>;
  private httpTransport?: StreamableHTTPServerTransport;
  private stdioTransport?: StdioServerTransport;
  private recommendationTool: RecommendationTool;

  constructor(config: ServerConfig = {}) {
    this.config = {
      name: 'personas-mcp',
      version: '1.0.0',
      port: 3000,
      host: 'localhost',
      http: {
        enableCors: true,
        allowedOrigins: ['*'],
        endpoint: '/mcp',
      },
      ...config,
    };

    this.server = new Server(
      {
        name: this.config.name || 'personas-mcp',
        version: this.config.version || '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          prompts: {},
          tools: {},
        },
      }
    );

    this.personaManager = new EnhancedPersonaManager(this.config.personas);
    this.recommendationTool = new RecommendationTool(this.personaManager);
    this.setupHandlers();
  }

  private setupHandlers() {
    // List available resources (personas)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const personas = this.personaManager.getAllPersonas();
      return {
        resources: personas.map(persona => ({
          uri: `persona://${persona.id}`,
          name: persona.name,
          description: persona.core.identity,
          mimeType: 'application/json',
        })),
      };
    });

    // List resource templates - stub implementation that returns empty array
    this.server.setRequestHandler(
      ListResourceTemplatesRequestSchema,
      async () => {
        // Currently no resource templates are supported
        // This stub prevents errors when clients query for templates
        return {
          resourceTemplates: [],
        };
      }
    );

    // Read a specific persona resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async request => {
      const uri = request.params.uri;
      const match = uri.match(/^persona:\/\/(.+)$/);

      if (!match) {
        throw new Error(`Invalid persona URI: ${uri}`);
      }

      const personaId = match[1];
      const persona = this.personaManager.getPersona(personaId);

      if (!persona) {
        throw new Error(`Persona not found: ${personaId}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(persona, null, 2),
          },
        ],
      };
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const personas = this.personaManager.getAllPersonas();
      return {
        prompts: personas.map(persona => ({
          name: `adopt-persona-${persona.id}`,
          description: `Adopt the ${persona.name} persona for ${persona.role} tasks`,
          arguments: [
            {
              name: 'context',
              description: 'The specific problem or task context',
              required: false,
            },
          ],
        })),
      };
    });

    // Get a specific prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async request => {
      const promptName = request.params.name;
      const match = promptName.match(/^adopt-persona-(.+)$/);

      if (!match) {
        throw new Error(`Invalid prompt name: ${promptName}`);
      }

      const personaId = match[1];
      const persona = this.personaManager.getPersona(personaId);

      if (!persona) {
        throw new Error(`Persona not found: ${personaId}`);
      }

      const context = request.params.arguments?.context || '';
      const prompt = this.personaManager.generatePrompt(persona, context);

      return {
        description: `${persona.name} persona prompt`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: prompt,
            },
          },
        ],
      };
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.recommendationTool.getToolDefinitions(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      try {
        const result = await this.recommendationTool.handleToolCall(
          name,
          args ?? {}
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : 'Unknown error occurred',
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async initialize(): Promise<void> {
    console.error('Initializing Personas MCP Server...');
    await this.personaManager.initialize();

    // Log persona information
    const info = this.personaManager.getPersonaInfo();
    console.error(
      `Loaded ${info.statistics.total} personas (${info.statistics.valid} valid)`
    );

    if (info.conflicts.length > 0) {
      console.error(`Found ${info.conflicts.length} persona conflicts:`);
      info.conflicts.forEach(conflict => {
        console.error(`  - ${conflict.id}: ${conflict.sources.join(' > ')}`);
      });
    }

    if (info.invalid.length > 0) {
      console.error(`Found ${info.invalid.length} invalid personas:`);
      info.invalid.forEach(invalid => {
        console.error(`  - ${invalid.id}: ${invalid.errors.join(', ')}`);
      });
    }
  }

  async run(): Promise<void> {
    // If running in STDIO mode (not TTY) and not forced to HTTP mode, only start stdio transport
    if (
      process.stdin &&
      process.stdout &&
      !process.stdin.isTTY &&
      !this.config.forceHttpMode
    ) {
      await this.runStdio();
    } else {
      await this.runHttp();
    }
  }

  private async runStdio(): Promise<void> {
    await this.initialize();

    // Set up stdio transport only
    this.stdioTransport = new StdioServerTransport();
    await this.server.connect(this.stdioTransport);
    console.error('Stdio transport connected for command-line usage');

    // Keep the process alive
    return new Promise<void>(resolve => {
      process.stdin.on('end', () => {
        console.error('Stdio transport disconnected');
        resolve();
      });
    });
  }

  private async runHttp(): Promise<void> {
    await this.initialize();

    // Create Express app
    const app = express();

    // JSON parsing will be applied selectively to specific endpoints

    // Configure CORS if enabled
    if (this.config.http?.enableCors) {
      const corsOptions = {
        origin: this.config.http.allowedOrigins || ['*'],
        credentials: true,
        methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'Mcp-Session-Id',
          'x-session-id',
        ],
        exposedHeaders: ['Mcp-Session-Id', 'x-session-id'],
      };
      app.use(cors(corsOptions));
    }

    // Create HTTP server
    this.httpServer = createServer(app);

    // Create HTTP MCP transport
    this.httpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true, // Enable JSON responses for compatibility
      enableDnsRebindingProtection: true,
      allowedHosts: [
        this.config.host || 'localhost',
        '127.0.0.1',
        'localhost',
        `localhost:${this.config.port || 3000}`,
        `${this.config.host || 'localhost'}:${this.config.port || 3000}`,
      ],
    });

    // Connect MCP server to HTTP transport BEFORE setting up HTTP routes
    await this.server.connect(this.httpTransport);

    // Mount the MCP endpoint
    const endpoint = this.config.http?.endpoint || '/mcp';

    // Handle MCP POST requests
    app.post(endpoint, async (req, res) => {
      try {
        if (!this.httpTransport) {
          throw new Error('HTTP transport not initialized');
        }
        await this.httpTransport.handleRequest(req, res);
      } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: null,
          });
        }
      }
    });

    // Handle MCP GET requests for streaming
    app.get(endpoint, async (req, res) => {
      try {
        if (!this.httpTransport) {
          throw new Error('HTTP transport not initialized');
        }
        await this.httpTransport.handleRequest(req, res);
      } catch (error) {
        console.error('Error handling MCP streaming request:', error);
        if (!res.headersSent) {
          res.status(500).send('Internal server error');
        }
      }
    });

    // Handle deprecated SSE endpoint
    app.get('/sse', (req, res) => {
      res.status(400).json({
        error:
          'SSE transport is deprecated. Please use the streamable HTTP endpoint at /mcp',
        endpoint: '/mcp',
        transport: 'streamable-http',
      });
    });

    app.post('/sse', express.json(), (req, res) => {
      res.status(400).json({
        error:
          'SSE transport is deprecated. Please use the streamable HTTP endpoint at /mcp',
        endpoint: '/mcp',
        transport: 'streamable-http',
      });
    });

    // Add a health check endpoint
    app.get('/health', (req, res) => {
      const info = this.personaManager.getPersonaInfo();
      res.json({
        status: 'healthy',
        server: {
          name: this.config.name,
          version: this.config.version,
          transport: 'http',
          endpoint,
        },
        personas: {
          total: info.statistics.total,
          valid: info.statistics.valid,
          invalid: info.statistics.invalid,
          conflicts: info.conflicts.length,
        },
      });
    });

    // Add a ready endpoint to confirm MCP server is connected
    app.get('/ready', (req, res) => {
      res.json({
        ready: true,
        server: 'connected',
        transport: 'streamable-http',
        timestamp: new Date().toISOString(),
      });
    });

    // Add a simple info endpoint
    app.get('/', (req, res) => {
      res.json({
        name: this.config.name,
        version: this.config.version,
        description:
          'MCP server providing prompt personas for LLM problem-solving assistance',
        transport: 'http',
        endpoints: {
          mcp: endpoint,
          health: '/health',
          ready: '/ready',
          api: '/api',
        },
        features: {
          cors: this.config.http?.enableCors || false,
          fileWatching: true,
          yamlPersonas: true,
          restApi: true,
        },
      });
    });

    // REST API endpoints for direct HTTP access (non-MCP)
    app.use('/api', express.json());

    // Get all personas
    app.get('/api/personas', (req, res) => {
      try {
        const personas = this.personaManager.getAllPersonas();
        res.json({
          success: true,
          data: personas.map(persona => ({
            id: persona.id,
            name: persona.name,
            role: persona.role,
            core: persona.core,
            behavior: persona.behavior,
            expertise: persona.expertise,
            decisionCriteria: persona.decisionCriteria,
            tags: persona.tags,
          })),
          total: personas.length,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Get specific persona by ID
    app.get('/api/personas/:id', (req, res) => {
      try {
        const persona = this.personaManager.getPersona(req.params.id);
        if (!persona) {
          return res.status(404).json({
            success: false,
            error: `Persona with ID '${req.params.id}' not found`,
          });
        }
        res.json({
          success: true,
          data: {
            id: persona.id,
            name: persona.name,
            role: persona.role,
            core: persona.core,
            behavior: persona.behavior,
            expertise: persona.expertise,
            decisionCriteria: persona.decisionCriteria,
            tags: persona.tags,
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Get persona recommendations
    app.post('/api/recommend', async (req, res) => {
      try {
        const body = req.body as { query?: unknown; limit?: unknown };
        const query = body.query;
        const limit = typeof body.limit === 'number' ? body.limit : 3;

        if (!query || typeof query !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'Query string is required',
          });
        }

        const result = await this.recommendationTool.handleToolCall(
          'recommend-persona',
          {
            description: query,
            title: query,
            limit,
          }
        );
        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Compare personas
    app.post('/api/compare', async (req, res) => {
      try {
        const body = req.body as {
          persona1?: unknown;
          persona2?: unknown;
          context?: unknown;
        };
        const persona1 = body.persona1;
        const persona2 = body.persona2;
        const context = typeof body.context === 'string' ? body.context : '';

        if (
          !persona1 ||
          typeof persona1 !== 'string' ||
          !persona2 ||
          typeof persona2 !== 'string'
        ) {
          return res.status(400).json({
            success: false,
            error: 'Both persona1 and persona2 are required',
          });
        }

        const result = await this.recommendationTool.handleToolCall(
          'compare-personas',
          {
            persona1,
            persona2,
            context,
          }
        );
        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // MCP server already connected above

    // Start HTTP server
    const host = this.config.host || 'localhost';
    const port = this.config.port || 3000;

    return new Promise<void>((resolve, reject) => {
      if (!this.httpServer) {
        reject(new Error('HTTP server not initialized'));
        return;
      }

      this.httpServer.listen(port, host, () => {
        console.error(`Personas MCP server running on http://${host}:${port}`);
        console.error(`MCP endpoint: http://${host}:${port}${endpoint}`);
        console.error(`Health check: http://${host}:${port}/health`);
        resolve();
      });

      if (!this.httpServer) {
        reject(new Error('HTTP server not initialized'));
        return;
      }

      this.httpServer.on('error', error => {
        console.error('HTTP server error:', error);
        reject(error);
      });
    });
  }

  private async setupStdioTransport(): Promise<void> {
    // Only set up stdio transport if stdin/stdout are available and not TTY
    // This allows the server to work with both HTTP and stdio simultaneously
    if (process.stdin && process.stdout && !process.stdin.isTTY) {
      try {
        this.stdioTransport = new StdioServerTransport();
        await this.server.connect(this.stdioTransport);
        console.error('Stdio transport connected for command-line usage');
      } catch (error) {
        // Don't fail if stdio transport setup fails, just log it
        console.error('Failed to setup stdio transport:', error);
      }
    }
  }

  async shutdown(): Promise<void> {
    console.error('Starting graceful shutdown...');

    // Shutdown persona manager (stops file watchers)
    await this.personaManager.shutdown();

    // Disconnect MCP server from transports
    if (this.httpTransport) {
      try {
        await this.httpTransport.close();
        console.error('HTTP transport disconnected');
      } catch (error) {
        console.error('Error disconnecting HTTP transport:', error);
      }
      this.httpTransport = undefined;
    }

    if (this.stdioTransport) {
      try {
        await this.stdioTransport.close();
        console.error('Stdio transport disconnected');
      } catch (error) {
        console.error('Error disconnecting stdio transport:', error);
      }
      this.stdioTransport = undefined;
    }

    // Close the MCP server after all transports are disconnected
    try {
      await this.server.close();
      console.error('MCP server closed');
    } catch (error) {
      console.error('Error closing MCP server:', error);
    }

    // Close HTTP server if running
    if (this.httpServer) {
      return new Promise<void>((resolve, reject) => {
        if (!this.httpServer) {
          resolve();
          return;
        }

        // Set a timeout to prevent hanging
        const timeout = setTimeout(() => {
          console.error('HTTP server close timeout, forcing shutdown');
          reject(new Error('HTTP server close timeout'));
        }, 5000);

        this.httpServer.close(error => {
          clearTimeout(timeout);
          if (error) {
            console.error('Error closing HTTP server:', error);
            reject(error);
          } else {
            console.error('HTTP server closed');
            resolve();
          }
        });
      });
    }

    console.error('Personas MCP server shutdown complete');
  }
}
