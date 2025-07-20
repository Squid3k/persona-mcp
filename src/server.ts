#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
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
  type ListResourcesRequest,
  type ListResourceTemplatesRequest,
  type ReadResourceRequest,
  type ListPromptsRequest,
  type GetPromptRequest,
  type ListToolsRequest,
  type CallToolRequest,
  type ListResourcesResult,
  type ListResourceTemplatesResult,
  type ReadResourceResult,
  type ListPromptsResult,
  type GetPromptResult,
  type ListToolsResult,
  type CallToolResult,
  type Request,
  type Notification,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { randomUUID } from 'crypto';
import { EnhancedPersonaManager } from './enhanced-persona-manager.js';
import { PersonaConfig } from './types/yaml-persona.js';
import { RecommendationTool } from './tools/recommendation-tool.js';
import { DiscoveryTool } from './tools/discovery-tool.js';
import {
  initializeMetrics,
  metricsCollector,
} from './metrics/metrics-collector.js';
import {
  createMetricsMiddleware,
  measureAsyncExecution,
} from './metrics/metrics-middleware.js';
import {
  PersonaNotFoundError,
  InvalidPersonaURIError,
  InvalidPromptNameError,
  TransportNotInitializedError,
  ServerInitializationError,
  ServerShutdownError,
  errorHandler,
} from './errors/index.js';
import {
  validateRequest,
  validateParams,
  RecommendRequestSchema,
  CompareRequestSchema,
  PersonaIdParamSchema,
} from './validation/index.js';
import { apiLimiter, recommendLimiter } from './middleware/rate-limit.js';
import { adoptionMetrics } from './metrics/adoption-metrics.js';
import { CorsSecurity } from './utils/cors-security.js';
import { ErrorSanitizer } from './utils/error-sanitizer.js';
import { 
  getMcpRateLimiter, 
  extractMcpClientId,
  mcpRateLimiters 
} from './middleware/mcp-rate-limit.js';

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
  metrics?: {
    enabled?: boolean;
    endpoint?: string; // OTLP endpoint
    headers?: Record<string, string>; // Authentication headers
    interval?: number; // Export interval in ms
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
  private discoveryTool: DiscoveryTool;

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

    // Initialize metrics if enabled
    if (this.config.metrics?.enabled !== false) {
      initializeMetrics({
        enabled: true,
        endpoint: this.config.metrics?.endpoint,
        headers: this.config.metrics?.headers,
        interval: this.config.metrics?.interval,
        serviceName: this.config.name,
        serviceVersion: this.config.version,
      });
    }

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
    this.discoveryTool = new DiscoveryTool(this.personaManager);
    this.setupHandlers();
  }

  /**
   * Wrap an MCP handler with rate limiting
   */
  private wrapWithRateLimit<TRequest, TResult>(
    handler: (request: TRequest, extra: RequestHandlerExtra<Request, Notification>) => TResult | Promise<TResult>,
    method: string
  ): (request: TRequest, extra: RequestHandlerExtra<Request, Notification>) => Promise<TResult> {
    return async (request: TRequest, extra: RequestHandlerExtra<Request, Notification>): Promise<TResult> => {
      // Get appropriate rate limiter
      const limiter = getMcpRateLimiter(method);
      
      // Extract client identifier
      const clientId = extractMcpClientId(request);
      
      // Check rate limit
      try {
        limiter.checkLimit(clientId);
      } catch (error) {
        // Log rate limit violation
        if (this.config.metrics?.enabled !== false) {
          metricsCollector.recordMcpRequest(method, 'error', 0);
        }
        throw error;
      }
      
      // Execute the handler
      return handler(request, extra);
    };
  }

  private setupHandlers() {
    // List available resources (personas)
    this.server.setRequestHandler(
      ListResourcesRequestSchema, 
      this.wrapWithRateLimit<ListResourcesRequest, ListResourcesResult>(async (_request, _extra) => {
      return measureAsyncExecution(
        async () => {
          const personas = this.personaManager.getAllPersonas();
          return {
            resources: personas.map(persona => ({
              uri: `persona://${persona.id}`,
              name: persona.name,
              description: persona.core.identity,
              mimeType: 'application/json',
            })),
          };
        },
        duration =>
          metricsCollector.recordMcpRequest(
            'ListResources',
            'success',
            duration
          )
      );
    }, 'resources/list'));

    // List resource templates - stub implementation that returns empty array
    this.server.setRequestHandler(
      ListResourceTemplatesRequestSchema,
      this.wrapWithRateLimit<ListResourceTemplatesRequest, ListResourceTemplatesResult>(async (_request, _extra) => {
        // Currently no resource templates are supported
        // This stub prevents errors when clients query for templates
        return {
          resourceTemplates: [],
        };
      }, 'resources/list-templates')
    );

    // Read a specific persona resource
    this.server.setRequestHandler(
      ReadResourceRequestSchema, 
      this.wrapWithRateLimit<ReadResourceRequest, ReadResourceResult>(async (request, _extra) => {
      const startTime = Date.now();
      try {
        const uri = request.params.uri;
        const match = uri.match(/^persona:\/\/(.+)$/);

        if (!match) {
          throw new InvalidPersonaURIError(uri);
        }

        const personaId = match[1];
        const persona = this.personaManager.getPersona(personaId);

        if (!persona) {
          throw new PersonaNotFoundError(personaId);
        }

        // Record persona request metric
        metricsCollector.recordPersonaRequest(personaId);

        const result = {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(persona, null, 2),
            },
          ],
        };

        const duration = Date.now() - startTime;
        metricsCollector.recordMcpRequest('ReadResource', 'success', duration);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        metricsCollector.recordMcpRequest('ReadResource', 'error', duration);
        throw error;
      }
    }, 'resources/read'));

    // List available prompts
    this.server.setRequestHandler(
      ListPromptsRequestSchema, 
      this.wrapWithRateLimit<ListPromptsRequest, ListPromptsResult>(async (_request, _extra) => {
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
    }, 'prompts/list'));

    // Get a specific prompt
    this.server.setRequestHandler(
      GetPromptRequestSchema, 
      this.wrapWithRateLimit<GetPromptRequest, GetPromptResult>(async (request, _extra) => {
      const promptName = request.params.name;
      const match = promptName.match(/^adopt-persona-(.+)$/);

      if (!match) {
        throw new InvalidPromptNameError(promptName);
      }

      const personaId = match[1];
      const persona = this.personaManager.getPersona(personaId);

      if (!persona) {
        throw new PersonaNotFoundError(personaId);
      }

      const context = request.params.arguments?.context || '';
      const prompt = this.personaManager.generatePrompt(persona, context);

      // Record prompt generation metric
      if (this.config.metrics?.enabled !== false) {
        metricsCollector.recordPersonaPromptGeneration(personaId);
      }

      // Record persona adoption event
      adoptionMetrics.recordAdoption({
        personaId,
        sessionId: request.params.arguments?.sessionId || 'unknown',
        context: {
          triggerType: 'manual',
          sourceContext: context || 'prompt-generation',
        },
      });

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
    }, 'prompts/get'));

    // List available tools
    this.server.setRequestHandler(
      ListToolsRequestSchema, 
      this.wrapWithRateLimit<ListToolsRequest, ListToolsResult>(async (_request, _extra) => {
      return {
        tools: [
          ...this.recommendationTool.getToolDefinitions(),
          ...this.discoveryTool.getToolDefinitions(),
        ],
      };
    }, 'tools/list'));

    // Handle tool calls
    this.server.setRequestHandler(
      CallToolRequestSchema, 
      this.wrapWithRateLimit<CallToolRequest, CallToolResult>(async (request, _extra) => {
      const { name, arguments: args } = request.params;
      const startTime = Date.now();

      // Record tool invocation
      if (this.config.metrics?.enabled !== false) {
        metricsCollector.recordToolInvocation(name);
      }

      try {
        // Route to appropriate tool handler
        let result: unknown;
        const discoveryToolNames = [
          'discover-persona-for-context',
          'suggest-persona-transition',
          'analyze-persona-effectiveness',
        ];

        if (discoveryToolNames.includes(name)) {
          result = await this.discoveryTool.handleToolCall(name, args ?? {});
        } else {
          result = await this.recommendationTool.handleToolCall(
            name,
            args ?? {}
          );
        }

        const duration = Date.now() - startTime;
        if (this.config.metrics?.enabled !== false) {
          metricsCollector.recordToolExecution(name, duration, true);
          metricsCollector.recordMcpRequest('CallTool', 'success', duration);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        if (this.config.metrics?.enabled !== false) {
          metricsCollector.recordToolExecution(name, duration, false);
          metricsCollector.recordMcpRequest('CallTool', 'error', duration);
        }

        // Sanitize error for external exposure
        const sanitized = ErrorSanitizer.sanitize(error);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: sanitized.message,
                  code: sanitized.code,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }, 'tools/call'));
  }

  async initialize(): Promise<void> {
    console.error('Initializing Personas MCP Server...');

    const startTime = Date.now();
    await this.personaManager.initialize();
    const duration = Date.now() - startTime;

    // Record persona load duration if metrics are enabled
    if (this.config.metrics?.enabled !== false) {
      metricsCollector.recordPersonaLoadDuration(duration);
    }

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

    // Add metrics middleware if metrics are enabled
    if (this.config.metrics?.enabled !== false) {
      app.use(
        createMetricsMiddleware({
          excludePaths: ['/health', '/ready', '/metrics'],
        })
      );
    }

    // JSON parsing will be applied selectively to specific endpoints

    // Configure CORS if enabled
    if (this.config.http?.enableCors !== false) { // Default to enabled
      try {
        const corsOptions = CorsSecurity.createSecureCorsOptions(
          this.config.http?.allowedOrigins,
          true // Enable credentials
        );
        app.use(cors(corsOptions));
      } catch (error) {
        console.error('CORS configuration error:', error);
        // In production, fail fast on CORS misconfiguration
        if (process.env.NODE_ENV === 'production') {
          throw new ServerInitializationError(
            `Invalid CORS configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
        // In development, use restrictive defaults
        const fallbackOptions = CorsSecurity.createSecureCorsOptions(
          ['http://localhost:3000', 'http://127.0.0.1:3000'],
          false // Disable credentials as fallback
        );
        app.use(cors(fallbackOptions));
        console.error('Using restrictive CORS fallback configuration');
      }
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
          throw new TransportNotInitializedError('HTTP');
        }
        await this.httpTransport.handleRequest(req, res);
      } catch (error) {
        // Log full error details
        ErrorSanitizer.logAndSanitize(error, 'MCP POST request');
        
        if (!res.headersSent) {
          const sanitized = ErrorSanitizer.sanitize(error);
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: sanitized.message,
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
          throw new TransportNotInitializedError('HTTP');
        }
        await this.httpTransport.handleRequest(req, res);
      } catch (error) {
        // Log full error details
        ErrorSanitizer.logAndSanitize(error, 'MCP GET request');
        
        if (!res.headersSent) {
          const sanitized = ErrorSanitizer.sanitize(error);
          res.status(sanitized.statusCode || 500).send(sanitized.message);
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

    // Apply rate limiting to all API routes
    app.use('/api', apiLimiter);

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
        const sanitized = ErrorSanitizer.sanitize(error);
        res.status(sanitized.statusCode || 500).json({
          success: false,
          error: sanitized.message,
          code: sanitized.code,
        });
      }
    });

    // Get specific persona by ID
    app.get(
      '/api/personas/:id',
      validateParams(PersonaIdParamSchema),
      (req, res, next) => {
        try {
          const persona = this.personaManager.getPersona(req.params.id);
          if (!persona) {
            throw new PersonaNotFoundError(req.params.id);
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
          next(error);
        }
      }
    );

    // Get persona recommendations
    app.post(
      '/api/recommend',
      recommendLimiter,
      validateRequest(RecommendRequestSchema),
      async (req, res, next) => {
        try {
          const { query, limit = 3 } = req.body as {
            query: string;
            limit?: number;
          };

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
          next(error);
        }
      }
    );

    // Compare personas
    app.post(
      '/api/compare',
      recommendLimiter,
      validateRequest(CompareRequestSchema),
      async (req, res, next) => {
        try {
          const {
            persona1,
            persona2,
            context = '',
          } = req.body as {
            persona1: string;
            persona2: string;
            context?: string;
          };

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
          next(error);
        }
      }
    );

    // Add error handler middleware (must be last)
    app.use(errorHandler);

    // MCP server already connected above

    // Start HTTP server
    const host = this.config.host || 'localhost';
    const port = this.config.port || 3000;

    return new Promise<void>((resolve, reject) => {
      if (!this.httpServer) {
        reject(new ServerInitializationError('HTTP server not initialized'));
        return;
      }

      this.httpServer.listen(port, host, () => {
        console.error(`Personas MCP server running on http://${host}:${port}`);
        console.error(`MCP endpoint: http://${host}:${port}${endpoint}`);
        console.error(`Health check: http://${host}:${port}/health`);
        resolve();
      });

      if (!this.httpServer) {
        reject(new ServerInitializationError('HTTP server not initialized'));
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

    // Shutdown metrics collector if enabled
    if (this.config.metrics?.enabled !== false) {
      await metricsCollector.shutdown();
    }
    
    // Shutdown MCP rate limiters
    mcpRateLimiters.general.shutdown();
    mcpRateLimiters.tools.shutdown();
    mcpRateLimiters.resources.shutdown();
    mcpRateLimiters.prompts.shutdown();

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
          reject(
            new ServerShutdownError('HTTP server', new Error('Close timeout'))
          );
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
