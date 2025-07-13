#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { randomUUID } from 'crypto';
import { EnhancedPersonaManager } from './enhanced-persona-manager.js';
import { PersonaConfig } from './types/yaml-persona.js';

export interface ServerConfig {
  name?: string;
  version?: string;
  port?: number;
  host?: string;
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
        name: this.config.name!,
        version: this.config.version!,
      },
      {
        capabilities: {
          resources: {},
          prompts: {},
        },
      }
    );

    this.personaManager = new EnhancedPersonaManager(this.config.personas);
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
          description: persona.description,
          mimeType: 'application/json',
        })),
      };
    });

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
    await this.runHttp();
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
        allowedHeaders: ['Content-Type', 'Authorization', 'Mcp-Session-Id', 'x-session-id'],
        exposedHeaders: ['Mcp-Session-Id', 'x-session-id'],
      };
      app.use(cors(corsOptions));
    }

    // Create HTTP server
    this.httpServer = createServer(app);

    // Create MCP transport
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,  // Enable JSON responses for compatibility
      enableDnsRebindingProtection: true,
      allowedHosts: [this.config.host!, '127.0.0.1', 'localhost', `localhost:${this.config.port}`, `${this.config.host}:${this.config.port}`],
    });

    // Connect MCP server to transport BEFORE setting up HTTP routes
    await this.server.connect(transport);

    // Mount the MCP endpoint
    const endpoint = this.config.http?.endpoint || '/mcp';

    // Handle MCP POST requests
    app.post(endpoint, async (req, res) => {
      try {
        await transport.handleRequest(req, res);
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
        await transport.handleRequest(req, res);
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
        error: 'SSE transport is deprecated. Please use the streamable HTTP endpoint at /mcp',
        endpoint: '/mcp',
        transport: 'streamable-http'
      });
    });

    app.post('/sse', express.json(), (req, res) => {
      res.status(400).json({
        error: 'SSE transport is deprecated. Please use the streamable HTTP endpoint at /mcp',
        endpoint: '/mcp',
        transport: 'streamable-http'
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
        description: 'MCP server providing prompt personas for LLM problem-solving assistance',
        transport: 'http',
        endpoints: {
          mcp: endpoint,
          health: '/health',
          ready: '/ready',
        },
        features: {
          cors: this.config.http?.enableCors || false,
          fileWatching: true,
          yamlPersonas: true,
        },
      });
    });

    // MCP server already connected above

    // Start HTTP server
    const host = this.config.host!;
    const port = this.config.port!;

    return new Promise<void>((resolve, reject) => {
      this.httpServer!.listen(port, host, () => {
        console.error(`Personas MCP server running on http://${host}:${port}`);
        console.error(`MCP endpoint: http://${host}:${port}${endpoint}`);
        console.error(`Health check: http://${host}:${port}/health`);
        resolve();
      });

      this.httpServer!.on('error', (error) => {
        console.error('HTTP server error:', error);
        reject(error);
      });
    });
  }

  async shutdown(): Promise<void> {
    await this.personaManager.shutdown();

    // Close HTTP server if running
    if (this.httpServer) {
      return new Promise<void>((resolve) => {
        this.httpServer!.close(() => {
          console.error('HTTP server closed');
          resolve();
        });
      });
    }

    console.error('Personas MCP server shutdown complete');
  }
}

