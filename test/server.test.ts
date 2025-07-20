import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { ServerConfig, PersonasMcpServer } from '../src/server.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express, { Request, Response } from 'express';
import { createServer as createHttpServer } from 'http';
import { EnhancedPersonaManager } from '../src/enhanced-persona-manager.js';
import { RecommendationTool } from '../src/tools/recommendation-tool.js';

// Mock all dependencies
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn().mockImplementation(() => ({
    setRequestHandler: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: vi.fn().mockImplementation(() => ({
    handleRequest: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('express', () => {
  const mockApp = {
    use: vi.fn(),
    post: vi.fn(),
    get: vi.fn(),
  };
  const expressFn = vi.fn(() => mockApp) as any;
  expressFn.json = vi.fn();
  return { default: expressFn };
});

vi.mock('cors', () => ({
  default: vi.fn(() => 'cors-middleware'),
}));

vi.mock('http', () => ({
  createServer: vi.fn(),
}));

vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'test-uuid-123'),
}));

vi.mock('../src/enhanced-persona-manager.js', () => ({
  EnhancedPersonaManager: vi.fn(),
}));

vi.mock('../src/tools/recommendation-tool.js', () => ({
  RecommendationTool: vi.fn().mockImplementation(() => ({
    getToolDefinitions: vi.fn().mockReturnValue([
      {
        name: 'recommend-persona',
        description: 'Recommend a persona',
        inputSchema: {},
      },
    ]),
    handleToolCall: vi.fn().mockResolvedValue({
      success: true,
      result: 'Tool executed successfully',
    }),
  })),
}));

describe('PersonasMcpServer', () => {
  let mockConsoleError: Mock;
  let originalConsoleError: typeof console.error;
  let mockHttpServer: {
    listen: Mock;
    on: Mock;
    close: Mock;
    address: Mock;
    _port?: number;
    _host?: string;
  };
  let mockPersonaManager: any;

  beforeEach(() => {
    originalConsoleError = console.error;
    mockConsoleError = vi.fn();
    console.error = mockConsoleError;

    mockHttpServer = {
      listen: vi.fn((port, host, callback) => {
        // Store the port for address() to return
        mockHttpServer._port = port;
        mockHttpServer._host = host;
        callback();
      }),
      on: vi.fn(),
      close: vi.fn(callback => callback()),
      address: vi.fn(() => ({
        port: mockHttpServer._port || 3000,
        address: mockHttpServer._host || 'localhost',
      })),
      _port: 3000,
      _host: 'localhost',
    };

    vi.mocked(createHttpServer).mockReturnValue(mockHttpServer as any);

    // Reset the persona manager mock for each test
    mockPersonaManager = {
      initialize: vi.fn().mockResolvedValue(undefined),
      getAllPersonas: vi.fn().mockReturnValue([
        {
          id: 'test-persona',
          name: 'Test Persona',
          role: 'tester',
          core: {
            identity: 'A test persona for testing purposes',
            primaryObjective: 'Test functionality',
            constraints: [
              'Test constraints',
              'Keep it simple',
              'Follow test patterns',
            ],
          },
          behavior: {
            mindset: ['Test-focused', 'Systematic', 'Thorough'],
            methodology: [
              'Plan tests',
              'Execute tests',
              'Verify results',
              'Document findings',
            ],
            priorities: ['Test coverage', 'Quality', 'Reliability'],
            antiPatterns: [
              'Skipping tests',
              'Incomplete coverage',
              'Poor documentation',
            ],
          },
          expertise: {
            domains: [
              'testing',
              'quality assurance',
              'test automation',
              'verification',
            ],
            skills: [
              'test design',
              'test execution',
              'bug tracking',
              'test documentation',
            ],
          },
          decisionCriteria: [
            'Is it testable?',
            'Does it improve quality?',
            'Is it verifiable?',
          ],
          examples: ['Write unit tests', 'Create test cases'],
          tags: ['testing', 'quality', 'verification'],
        },
      ]),
      getPersona: vi.fn(id => {
        if (id === 'test-persona') {
          return {
            id: 'test-persona',
            name: 'Test Persona',
            role: 'tester',
            core: {
              identity: 'A test persona for testing purposes',
              primaryObjective: 'Test functionality',
              constraints: [
                'Test constraints',
                'Keep it simple',
                'Follow test patterns',
              ],
            },
            behavior: {
              mindset: ['Test-focused', 'Systematic', 'Thorough'],
              methodology: [
                'Plan tests',
                'Execute tests',
                'Verify results',
                'Document findings',
              ],
              priorities: ['Test coverage', 'Quality', 'Reliability'],
              antiPatterns: [
                'Skipping tests',
                'Incomplete coverage',
                'Poor documentation',
              ],
            },
            expertise: {
              domains: [
                'testing',
                'quality assurance',
                'test automation',
                'verification',
              ],
              skills: [
                'test design',
                'test execution',
                'bug tracking',
                'test documentation',
              ],
            },
            decisionCriteria: [
              'Is it testable?',
              'Does it improve quality?',
              'Is it verifiable?',
            ],
            examples: ['Write unit tests', 'Create test cases'],
            tags: ['testing', 'quality', 'verification'],
          };
        }
        return null;
      }),
      generatePrompt: vi.fn(
        (persona, context) =>
          `Generated prompt for ${persona.name} with context: ${context}`
      ),
      getPersonaInfo: vi.fn(() => ({
        statistics: {
          total: 5,
          valid: 4,
          invalid: 1,
        },
        conflicts: [{ id: 'conflict-1', sources: ['source1', 'source2'] }],
        invalid: [{ id: 'invalid-1', errors: ['Error 1', 'Error 2'] }],
      })),
      shutdown: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(EnhancedPersonaManager).mockImplementation(
      () => mockPersonaManager
    );

    vi.clearAllMocks();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create server with default config', () => {
      const _server = new PersonasMcpServer();

      expect(Server).toHaveBeenCalledWith(
        {
          name: 'personas-mcp',
          version: '1.0.0',
        },
        {
          capabilities: {
            resources: {},
            prompts: {},
            tools: {},
          },
        }
      );

      expect(EnhancedPersonaManager).toHaveBeenCalledWith(undefined);
      expect(RecommendationTool).toHaveBeenCalled();
    });

    it('should create server with custom config', () => {
      const config: ServerConfig = {
        name: 'custom-server',
        version: '2.0.0',
        port: 8080,
        host: '0.0.0.0',
        personas: {
          directories: {
            user: '~/.ai/personas',
            project: './custom',
          },
        } as any,
        http: {
          enableCors: false,
          allowedOrigins: ['http://localhost:3000'],
          endpoint: '/custom-mcp',
        },
      };

      const _server = new PersonasMcpServer(config);

      expect(Server).toHaveBeenCalledWith(
        {
          name: 'custom-server',
          version: '2.0.0',
        },
        expect.any(Object)
      );

      expect(EnhancedPersonaManager).toHaveBeenCalledWith({
        directories: {
          user: '~/.ai/personas',
          project: './custom',
        },
      });
    });
  });

  describe('request handlers', () => {
    let server: PersonasMcpServer;
    let mockServer: any;
    let handlers: Map<any, Function>;

    beforeEach(() => {
      handlers = new Map();
      mockServer = {
        setRequestHandler: vi.fn((schema, handler) => {
          handlers.set(schema, handler);
        }),
        connect: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(Server).mockImplementation(() => mockServer);
      server = new PersonasMcpServer();
    });

    it('should handle ListResourcesRequest', async () => {
      // Find the handler by getting the first one registered
      const handlersArray = Array.from(handlers.values());
      const handler = handlersArray[0];
      const result = await handler({ params: {} });

      expect(result).toEqual({
        resources: [
          {
            uri: 'persona://test-persona',
            name: 'Test Persona',
            description: 'A test persona for testing purposes',
            mimeType: 'application/json',
          },
        ],
      });
    });

    it('should handle ListResourceTemplatesRequest', async () => {
      // Find the handler by getting the second one registered
      const handlersArray = Array.from(handlers.values());
      const handler = handlersArray[1];
      const result = await handler({ params: {} });

      expect(result).toEqual({
        resourceTemplates: [],
      });
    });

    it('should handle ReadResourceRequest with valid URI', async () => {
      const handlers: any[] = [];
      mockServer.setRequestHandler.mockImplementation(
        (schema: any, handler: any) => {
          handlers.push(handler);
        }
      );

      server = new PersonasMcpServer();

      // The third handler is ReadResourceRequest (after ListResources and ListResourceTemplates)
      const handler = handlers[2];
      const result = await handler({
        params: { uri: 'persona://test-persona' },
      });

      expect(result).toEqual({
        contents: [
          {
            uri: 'persona://test-persona',
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                id: 'test-persona',
                name: 'Test Persona',
                role: 'tester',
                core: {
                  identity: 'A test persona for testing purposes',
                  primaryObjective: 'Test functionality',
                  constraints: [
                    'Test constraints',
                    'Keep it simple',
                    'Follow test patterns',
                  ],
                },
                behavior: {
                  mindset: ['Test-focused', 'Systematic', 'Thorough'],
                  methodology: [
                    'Plan tests',
                    'Execute tests',
                    'Verify results',
                    'Document findings',
                  ],
                  priorities: ['Test coverage', 'Quality', 'Reliability'],
                  antiPatterns: [
                    'Skipping tests',
                    'Incomplete coverage',
                    'Poor documentation',
                  ],
                },
                expertise: {
                  domains: [
                    'testing',
                    'quality assurance',
                    'test automation',
                    'verification',
                  ],
                  skills: [
                    'test design',
                    'test execution',
                    'bug tracking',
                    'test documentation',
                  ],
                },
                decisionCriteria: [
                  'Is it testable?',
                  'Does it improve quality?',
                  'Is it verifiable?',
                ],
                examples: ['Write unit tests', 'Create test cases'],
                tags: ['testing', 'quality', 'verification'],
              },
              null,
              2
            ),
          },
        ],
      });
    });

    it('should handle ReadResourceRequest with invalid URI', async () => {
      const handlers: any[] = [];
      mockServer.setRequestHandler.mockImplementation(
        (schema: any, handler: any) => {
          handlers.push(handler);
        }
      );

      server = new PersonasMcpServer();
      const handler = handlers[2];

      await expect(
        handler({ params: { uri: 'invalid://uri' } })
      ).rejects.toThrow('Invalid persona URI: invalid://uri');
    });

    it('should handle ReadResourceRequest with non-existent persona', async () => {
      const handlers: any[] = [];
      mockServer.setRequestHandler.mockImplementation(
        (schema: any, handler: any) => {
          handlers.push(handler);
        }
      );

      server = new PersonasMcpServer();
      const handler = handlers[2];

      await expect(
        handler({ params: { uri: 'persona://non-existent' } })
      ).rejects.toThrow('Persona not found: non-existent');
    });

    it('should handle ListPromptsRequest', async () => {
      const handlers: any[] = [];
      mockServer.setRequestHandler.mockImplementation(
        (schema: any, handler: any) => {
          handlers.push(handler);
        }
      );

      server = new PersonasMcpServer();
      const handler = handlers[3]; // Fourth handler is ListPromptsRequest
      const result = await handler({ params: {} });

      expect(result).toEqual({
        prompts: [
          {
            name: 'adopt-persona-test-persona',
            description: 'Adopt the Test Persona persona for tester tasks',
            arguments: [
              {
                name: 'context',
                description: 'The specific problem or task context',
                required: false,
              },
            ],
          },
        ],
      });
    });

    it('should handle GetPromptRequest with valid prompt name', async () => {
      const handlers: any[] = [];
      mockServer.setRequestHandler.mockImplementation(
        (schema: any, handler: any) => {
          handlers.push(handler);
        }
      );

      server = new PersonasMcpServer();
      const handler = handlers[4]; // Fifth handler is GetPromptRequest
      const result = await handler({
        params: {
          name: 'adopt-persona-test-persona',
          arguments: { context: 'test context' },
        },
      });

      expect(result).toEqual({
        description: 'Test Persona persona prompt',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Generated prompt for Test Persona with context: test context',
            },
          },
        ],
      });
    });

    it('should handle GetPromptRequest without context', async () => {
      const handlers: any[] = [];
      mockServer.setRequestHandler.mockImplementation(
        (schema: any, handler: any) => {
          handlers.push(handler);
        }
      );

      server = new PersonasMcpServer();
      const handler = handlers[4];
      const result = await handler({
        params: {
          name: 'adopt-persona-test-persona',
        },
      });

      expect(result.messages[0].content.text).toContain(
        'Generated prompt for Test Persona with context: '
      );
    });

    it('should handle GetPromptRequest with invalid prompt name', async () => {
      const handlers: any[] = [];
      mockServer.setRequestHandler.mockImplementation(
        (schema: any, handler: any) => {
          handlers.push(handler);
        }
      );

      server = new PersonasMcpServer();
      const handler = handlers[4];

      await expect(
        handler({ params: { name: 'invalid-prompt' } })
      ).rejects.toThrow('Invalid prompt name: invalid-prompt');
    });

    it('should handle GetPromptRequest with non-existent persona', async () => {
      const handlers: any[] = [];
      mockServer.setRequestHandler.mockImplementation(
        (schema: any, handler: any) => {
          handlers.push(handler);
        }
      );

      server = new PersonasMcpServer();
      const handler = handlers[4];

      await expect(
        handler({ params: { name: 'adopt-persona-non-existent' } })
      ).rejects.toThrow('Persona not found: non-existent');
    });

    it('should handle ListToolsRequest', async () => {
      const handlers: any[] = [];
      mockServer.setRequestHandler.mockImplementation(
        (schema: any, handler: any) => {
          handlers.push(handler);
        }
      );

      server = new PersonasMcpServer();
      const handler = handlers[5]; // Sixth handler is ListToolsRequest
      const result = await handler({ params: {} });

      expect(result).toHaveProperty('tools');
      expect(Array.isArray(result.tools)).toBe(true);
      expect(result.tools.length).toBeGreaterThan(0);

      // Check that we have both recommendation and discovery tools
      const toolNames = result.tools.map((t: any) => t.name);
      expect(toolNames).toContain('recommend-persona');
      expect(toolNames).toContain('discover-persona-for-context');
    });

    it('should handle CallToolRequest successfully', async () => {
      const handlers: any[] = [];
      mockServer.setRequestHandler.mockImplementation(
        (schema: any, handler: any) => {
          handlers.push(handler);
        }
      );

      server = new PersonasMcpServer();
      const handler = handlers[6]; // Seventh handler is CallToolRequest
      const result = await handler({
        params: {
          name: 'recommend-persona',
          arguments: { task: 'test task' },
        },
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                result: 'Tool executed successfully',
              },
              null,
              2
            ),
          },
        ],
      });
    });

    it('should handle CallToolRequest with no arguments', async () => {
      const handlers: any[] = [];
      mockServer.setRequestHandler.mockImplementation(
        (schema: any, handler: any) => {
          handlers.push(handler);
        }
      );

      server = new PersonasMcpServer();
      const handler = handlers[6];
      const result = await handler({
        params: {
          name: 'recommend-persona',
        },
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                result: 'Tool executed successfully',
              },
              null,
              2
            ),
          },
        ],
      });
    });

    it('should handle CallToolRequest with Error', async () => {
      const handlers: any[] = [];
      mockServer.setRequestHandler.mockImplementation(
        (schema: any, handler: any) => {
          handlers.push(handler);
        }
      );

      server = new PersonasMcpServer();

      // Mock tool to throw error
      const mockTool = vi.mocked(server['recommendationTool']);
      mockTool.handleToolCall = vi
        .fn()
        .mockRejectedValue(new Error('Tool error'));

      const handler = handlers[6];
      const result = await handler({
        params: {
          name: 'recommend-persona',
          arguments: { task: 'test task' },
        },
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: 'Tool error',
                code: 'UNKNOWN_ERROR',
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      });
    });

    it('should handle CallToolRequest with non-Error exception', async () => {
      const handlers: any[] = [];
      mockServer.setRequestHandler.mockImplementation(
        (schema: any, handler: any) => {
          handlers.push(handler);
        }
      );

      server = new PersonasMcpServer();

      // Mock tool to throw non-Error
      const mockTool = vi.mocked(server['recommendationTool']);
      mockTool.handleToolCall = vi.fn().mockRejectedValue('String error');

      const handler = handlers[6];
      const result = await handler({
        params: {
          name: 'recommend-persona',
          arguments: { task: 'test task' },
        },
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: 'String error',
                code: 'UNKNOWN_ERROR',
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('initialize', () => {
    it('should initialize and log persona information', async () => {
      const server = new PersonasMcpServer();
      await server.initialize();

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Initializing Personas MCP Server...'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Loaded 5 personas (4 valid)'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Found 1 persona conflicts:'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        '  - conflict-1: source1 > source2'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Found 1 invalid personas:'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        '  - invalid-1: Error 1, Error 2'
      );
    });

    it('should initialize without conflicts or invalid personas', async () => {
      const mockManager = {
        initialize: vi.fn().mockResolvedValue(undefined),
        getPersonaInfo: vi.fn(() => ({
          statistics: {
            total: 3,
            valid: 3,
            invalid: 0,
          },
          conflicts: [],
          invalid: [],
        })),
      };

      vi.mocked(EnhancedPersonaManager).mockImplementation(
        () => mockManager as any
      );

      const server = new PersonasMcpServer();
      await server.initialize();

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Initializing Personas MCP Server...'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Loaded 3 personas (3 valid)'
      );
      expect(mockConsoleError).not.toHaveBeenCalledWith(
        expect.stringContaining('conflicts')
      );
      expect(mockConsoleError).not.toHaveBeenCalledWith(
        expect.stringContaining('invalid')
      );
    });
  });

  describe('HTTP server', () => {
    beforeEach(() => {
      // Mock process.stdin.isTTY to ensure HTTP mode
      Object.defineProperty(process.stdin, 'isTTY', {
        value: true,
        configurable: true,
      });
    });

    it('should run HTTP server with default config', async () => {
      const server = new PersonasMcpServer();
      void server.run();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockHttpServer.listen).toHaveBeenCalledWith(
        3000,
        'localhost',
        expect.any(Function)
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Personas MCP server running on http://localhost:3000'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'MCP endpoint: http://localhost:3000/mcp'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Health check: http://localhost:3000/health'
      );
    });

    it('should run HTTP server with custom config', async () => {
      const config: ServerConfig = {
        port: 8080,
        host: '0.0.0.0',
        http: {
          endpoint: '/custom',
        },
      };

      const server = new PersonasMcpServer(config);
      void server.run();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockHttpServer.listen).toHaveBeenCalledWith(
        8080,
        '0.0.0.0',
        expect.any(Function)
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Personas MCP server running on http://0.0.0.0:8080'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'MCP endpoint: http://0.0.0.0:8080/custom'
      );
    });

    it('should configure CORS when enabled', async () => {
      const mockApp = {
        use: vi.fn(),
        post: vi.fn(),
        get: vi.fn(),
      };
      vi.mocked(express).mockReturnValue(mockApp as any);

      const server = new PersonasMcpServer({
        http: {
          enableCors: true,
          allowedOrigins: ['http://example.com'],
        },
      });

      await server.run();

      expect(mockApp.use).toHaveBeenCalledWith('cors-middleware');
    });

    it('should not configure CORS when disabled', async () => {
      const mockApp = {
        use: vi.fn(),
        post: vi.fn(),
        get: vi.fn(),
      };
      vi.mocked(express).mockReturnValue(mockApp as any);

      const server = new PersonasMcpServer({
        http: {
          enableCors: false,
        },
      });

      await server.run();

      expect(mockApp.use).not.toHaveBeenCalledWith('cors-middleware');
    });

    it('should handle HTTP server error', async () => {
      mockHttpServer.listen.mockImplementation(() => {
        // Don't call callback immediately
      });

      mockHttpServer.on.mockImplementation((event, handler) => {
        if (event === 'error') {
          setTimeout(() => handler(new Error('Port in use')), 10);
        }
      });

      const server = new PersonasMcpServer();

      await expect(server.run()).rejects.toThrow('Port in use');
    });

    it('should reject if HTTP server is not initialized', async () => {
      vi.mocked(createHttpServer).mockReturnValue(null as any);

      const server = new PersonasMcpServer();

      await expect(server.run()).rejects.toThrow('HTTP server not initialized');
    });
  });

  describe('HTTP endpoints', () => {
    let server: PersonasMcpServer;
    let mockApp: any;
    let routes: Map<string, Map<string, Function>>;

    beforeEach(() => {
      routes = new Map();
      mockApp = {
        use: vi.fn(),
        post: vi.fn((path: string, ...handlers: any[]) => {
          if (!routes.has('post')) routes.set('post', new Map());
          const handler = handlers[handlers.length - 1] as Function;
          routes.get('post')!.set(path, handler);
        }),
        get: vi.fn((path: string, ...handlers: any[]) => {
          if (!routes.has('get')) routes.set('get', new Map());
          const handler = handlers[handlers.length - 1] as Function;
          routes.get('get')!.set(path, handler);
        }),
      };

      vi.mocked(express).mockReturnValue(mockApp);
      vi.mocked(express.json).mockReturnValue('json-middleware' as any);
    });

    it('should handle POST /mcp endpoint', async () => {
      server = new PersonasMcpServer();
      await server.run();

      const mockReq = {} as Request;
      const mockRes = {
        headersSent: false,
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any as Response;

      const handler = routes.get('post')!.get('/mcp')!;
      await handler(mockReq, mockRes);

      const mockTransport = vi.mocked(StreamableHTTPServerTransport).mock
        .results[0].value;
      expect(mockTransport.handleRequest).toHaveBeenCalledWith(
        mockReq,
        mockRes
      );
    });

    it('should handle POST /mcp endpoint error', async () => {
      server = new PersonasMcpServer();
      await server.run();

      const mockReq = {} as Request;
      const mockRes = {
        headersSent: false,
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any as Response;

      const mockTransport = vi.mocked(StreamableHTTPServerTransport).mock
        .results[0].value;
      mockTransport.handleRequest = vi
        .fn()
        .mockRejectedValue(new Error('Transport error'));

      const handler = routes.get('post')!.get('/mcp')!;
      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Transport error',
        },
        id: null,
      });
    });

    it('should not send response if headers already sent', async () => {
      server = new PersonasMcpServer();
      await server.run();

      const mockReq = {} as Request;
      const mockRes = {
        headersSent: true,
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any as Response;

      const mockTransport = vi.mocked(StreamableHTTPServerTransport).mock
        .results[0].value;
      mockTransport.handleRequest = vi
        .fn()
        .mockRejectedValue(new Error('Transport error'));

      const handler = routes.get('post')!.get('/mcp')!;
      await handler(mockReq, mockRes);

      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should handle GET /mcp endpoint', async () => {
      server = new PersonasMcpServer();
      await server.run();

      const mockReq = {} as Request;
      const mockRes = {
        headersSent: false,
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any as Response;

      const handler = routes.get('get')!.get('/mcp')!;
      await handler(mockReq, mockRes);

      const mockTransport = vi.mocked(StreamableHTTPServerTransport).mock
        .results[0].value;
      expect(mockTransport.handleRequest).toHaveBeenCalledWith(
        mockReq,
        mockRes
      );
    });

    it('should handle GET /mcp endpoint error', async () => {
      server = new PersonasMcpServer();
      await server.run();

      const mockReq = {} as Request;
      const mockRes = {
        headersSent: false,
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any as Response;

      const mockTransport = vi.mocked(StreamableHTTPServerTransport).mock
        .results[0].value;
      mockTransport.handleRequest = vi
        .fn()
        .mockRejectedValue(new Error('Stream error'));

      const handler = routes.get('get')!.get('/mcp')!;
      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith('Stream error');
    });

    it('should handle GET /sse with deprecation message', async () => {
      server = new PersonasMcpServer();
      await server.run();

      const mockReq = {} as Request;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any as Response;

      const handler = routes.get('get')!.get('/sse')!;
      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error:
          'SSE transport is deprecated. Please use the streamable HTTP endpoint at /mcp',
        endpoint: '/mcp',
        transport: 'streamable-http',
      });
    });

    it('should handle POST /sse with deprecation message', async () => {
      server = new PersonasMcpServer();
      await server.run();

      const mockReq = {} as Request;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any as Response;

      const handler = routes.get('post')!.get('/sse')!;
      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error:
          'SSE transport is deprecated. Please use the streamable HTTP endpoint at /mcp',
        endpoint: '/mcp',
        transport: 'streamable-http',
      });
    });

    it('should handle GET /health endpoint', async () => {
      // Set specific persona info for this test
      mockPersonaManager.getPersonaInfo = vi.fn(() => ({
        statistics: {
          total: 5,
          valid: 4,
          invalid: 1,
        },
        conflicts: [{ id: 'conflict-1', sources: ['source1', 'source2'] }],
        invalid: [{ id: 'invalid-1', errors: ['Error 1', 'Error 2'] }],
      }));

      server = new PersonasMcpServer();
      await server.run();

      const mockReq = {} as Request;
      const mockRes = {
        json: vi.fn(),
      } as any as Response;

      const handler = routes.get('get')!.get('/health')!;
      handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'healthy',
        server: {
          name: 'personas-mcp',
          version: '1.0.0',
          transport: 'http',
          endpoint: '/mcp',
        },
        personas: {
          total: 5,
          valid: 4,
          invalid: 1,
          conflicts: 1,
        },
      });
    });

    it('should handle GET /ready endpoint', async () => {
      server = new PersonasMcpServer();
      await server.run();

      const mockReq = {} as Request;
      const mockRes = {
        json: vi.fn(),
      } as any as Response;

      const handler = routes.get('get')!.get('/ready')!;
      handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        ready: true,
        server: 'connected',
        transport: 'streamable-http',
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
        ),
      });
    });

    it('should handle GET / endpoint', async () => {
      server = new PersonasMcpServer();
      await server.run();

      const mockReq = {} as Request;
      const mockRes = {
        json: vi.fn(),
      } as any as Response;

      const handler = routes.get('get')!.get('/')!;
      handler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        name: 'personas-mcp',
        version: '1.0.0',
        description:
          'MCP server providing prompt personas for LLM problem-solving assistance',
        transport: 'http',
        endpoints: {
          mcp: '/mcp',
          health: '/health',
          ready: '/ready',
          api: '/api',
        },
        features: {
          cors: true,
          fileWatching: true,
          yamlPersonas: true,
          restApi: true,
        },
      });
    });
  });

  describe('shutdown', () => {
    it('should shutdown server and HTTP server', async () => {
      const server = new PersonasMcpServer();
      await server.run();

      // Clear previous console.error calls from run()
      mockConsoleError.mockClear();

      await server.shutdown();

      expect(mockHttpServer.close).toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith('HTTP server closed');
      // Note: "Personas MCP server shutdown complete" is NOT logged when HTTP server exists
      // because the function returns inside the HTTP server close callback

      expect(mockPersonaManager.shutdown).toHaveBeenCalled();
    });

    it('should shutdown without HTTP server', async () => {
      const server = new PersonasMcpServer();
      // Don't run the server, so HTTP server is not created

      await server.shutdown();

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Personas MCP server shutdown complete'
      );

      const mockManager = vi.mocked(EnhancedPersonaManager).mock.results[0]
        .value;
      expect(mockManager.shutdown).toHaveBeenCalled();
    });

    it('should handle shutdown when httpServer becomes null', async () => {
      const server = new PersonasMcpServer();
      await server.run();

      // Simulate httpServer becoming null during shutdown
      server['httpServer'] = null as any;

      await server.shutdown();

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Personas MCP server shutdown complete'
      );
    });
  });
});
