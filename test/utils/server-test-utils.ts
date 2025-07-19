import { vi } from 'vitest';
import { EventEmitter } from 'events';
import type { PersonasMcpServer, ServerConfig } from '../../src/server.js';

interface MockHttpServer extends EventEmitter {
  listen: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  listening: boolean;
}

interface MockTransport {
  close: ReturnType<typeof vi.fn>;
  handleRequest: ReturnType<typeof vi.fn>;
}

interface MockPersonaManager {
  initialize: ReturnType<typeof vi.fn>;
  shutdown: ReturnType<typeof vi.fn>;
  getAllPersonas: ReturnType<typeof vi.fn>;
  getPersona: ReturnType<typeof vi.fn>;
  getPersonaInfo: ReturnType<typeof vi.fn>;
  generatePrompt: ReturnType<typeof vi.fn>;
}

interface MockMcpServer {
  connect: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  setRequestHandler: ReturnType<typeof vi.fn>;
}

export function createMockHttpServer(): MockHttpServer {
  const server = new EventEmitter() as MockHttpServer;
  server.listening = false;

  server.listen = vi.fn((port: number, host: string, callback: () => void) => {
    server.listening = true;
    // Call the callback immediately to simulate successful binding
    if (callback) callback();
    return server;
  });

  server.close = vi.fn((callback?: (err?: Error) => void) => {
    server.listening = false;
    // Call the callback immediately to simulate successful close
    if (callback) callback();
  });

  return server;
}

export function createMockTransport(): MockTransport {
  return {
    close: vi.fn().mockResolvedValue(undefined),
    handleRequest: vi.fn().mockResolvedValue(undefined),
  };
}

export function createMockPersonaManager(): MockPersonaManager {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    shutdown: vi.fn().mockResolvedValue(undefined),
    getAllPersonas: vi.fn().mockReturnValue([]),
    getPersona: vi.fn().mockReturnValue(null),
    getPersonaInfo: vi.fn().mockReturnValue({
      statistics: { total: 0, valid: 0, invalid: 0 },
      conflicts: [],
      invalid: [],
    }),
    generatePrompt: vi.fn().mockReturnValue('Mock prompt'),
  };
}

export function createMockMcpServer(): MockMcpServer {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    setRequestHandler: vi.fn(),
  };
}

export function createMockRecommendationTool() {
  return {
    getToolDefinitions: vi.fn().mockReturnValue([]),
    handleToolCall: vi.fn().mockResolvedValue({}),
  };
}

// Mock the entire server creation process
export function setupServerMocks() {
  const mocks = {
    httpServer: createMockHttpServer(),
    httpTransport: createMockTransport(),
    stdioTransport: createMockTransport(),
    personaManager: createMockPersonaManager(),
    mcpServer: createMockMcpServer(),
    recommendationTool: createMockRecommendationTool(),
    express: vi.fn(() => ({
      use: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
    })),
    createServer: vi.fn(() => mocks.httpServer),
  };

  // Mock the imports
  vi.doMock('express', () => ({ default: mocks.express }));
  vi.doMock('http', () => ({ createServer: mocks.createServer }));

  return mocks;
}

// Helper to create a test server with all dependencies mocked
export async function createTestServer(config: ServerConfig = {}) {
  const mocks = setupServerMocks();

  // Import the server class after mocks are set up
  const { PersonasMcpServer } = await import('../../src/server.js');

  const server = new PersonasMcpServer(config);

  // Replace internal properties with mocks
  (server as any).personaManager = mocks.personaManager;
  (server as any).server = mocks.mcpServer;
  (server as any).recommendationTool = mocks.recommendationTool;
  (server as any).httpServer = mocks.httpServer;
  (server as any).httpTransport = mocks.httpTransport;

  return { server, mocks };
}

// Track all created servers for cleanup
const activeServers: Set<PersonasMcpServer> = new Set();

export function trackServer(server: PersonasMcpServer) {
  activeServers.add(server);
}

export async function cleanupAllServers() {
  const shutdownPromises = Array.from(activeServers).map(async server => {
    try {
      await server.shutdown();
    } catch {
      // Ignore errors during cleanup
    }
  });

  await Promise.all(shutdownPromises);
  activeServers.clear();

  // Clear all mocks
  vi.clearAllMocks();
  vi.resetModules();
}
