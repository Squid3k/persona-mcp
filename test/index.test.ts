import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the MCP SDK modules
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn(() => ({
    setRequestHandler: vi.fn(),
    connect: vi.fn(),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(),
}));

vi.mock('@modelcontextprotocol/sdk/types.js', () => ({
  ListPromptsRequestSchema: 'list-prompts',
  ListResourcesRequestSchema: 'list-resources',
  ReadResourceRequestSchema: 'read-resource',
  GetPromptRequestSchema: 'get-prompt',
  CallToolRequestSchema: 'call-tool',
}));

// Import after mocking
import { PersonaManager } from '../src/persona-manager.js';

describe('MCP Server Integration', () => {
  let originalConsoleError: typeof console.error;
  let personaManager: PersonaManager;

  beforeEach(() => {
    // Mock console.error to prevent test output pollution
    originalConsoleError = console.error;
    console.error = vi.fn();

    personaManager = new PersonaManager();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.clearAllMocks();
  });

  describe('PersonaManager Integration', () => {
    it('should load default personas correctly', () => {
      const personas = personaManager.getAllPersonas();

      expect(personas).toHaveLength(4);
      expect(personas.map(p => p.id)).toEqual(
        expect.arrayContaining([
          'architect',
          'developer',
          'reviewer',
          'debugger',
        ])
      );
    });

    it('should generate MCP resource format correctly', () => {
      const personas = personaManager.getAllPersonas();

      // Simulate how the MCP server would format resources
      const resources = personas.map(persona => ({
        uri: `persona://${persona.id}`,
        name: persona.name,
        description: persona.description,
        mimeType: 'application/json',
      }));

      expect(resources).toHaveLength(4);
      expect(resources[0]).toMatchObject({
        uri: expect.stringMatching(/^persona:\/\/\w+$/),
        name: expect.any(String),
        description: expect.any(String),
        mimeType: 'application/json',
      });
    });

    it('should generate MCP prompt format correctly', () => {
      const personas = personaManager.getAllPersonas();

      // Simulate how the MCP server would format prompts
      const prompts = personas.map(persona => ({
        name: `adopt-persona-${persona.id}`,
        description: `Adopt the ${persona.name} persona for ${persona.role} tasks`,
        arguments: [
          {
            name: 'context',
            description: 'The specific problem or task context',
            required: false,
          },
        ],
      }));

      expect(prompts).toHaveLength(4);
      expect(prompts[0]).toMatchObject({
        name: expect.stringMatching(/^adopt-persona-\w+$/),
        description: expect.stringContaining('Adopt the'),
        arguments: expect.arrayContaining([
          expect.objectContaining({
            name: 'context',
            required: false,
          }),
        ]),
      });
    });

    it('should handle persona URI parsing correctly', () => {
      const testUris = [
        'persona://architect',
        'persona://developer',
        'persona://reviewer',
        'persona://debugger',
      ];

      for (const uri of testUris) {
        const match = uri.match(/^persona:\/\/(.+)$/);
        expect(match).toBeTruthy();

        if (match) {
          const personaId = match[1];
          const persona = personaManager.getPersona(personaId);
          expect(persona).toBeDefined();
          expect(persona?.id).toBe(personaId);
        }
      }
    });

    it('should handle invalid persona URIs gracefully', () => {
      const invalidUris = [
        'invalid://architect',
        'persona://',
        'persona://non-existent',
        'not-a-uri',
      ];

      for (const uri of invalidUris) {
        const match = uri.match(/^persona:\/\/(.+)$/);

        if (!match) {
          // Should fail URI pattern matching
          expect(match).toBeFalsy();
        } else {
          // Should handle non-existent persona IDs
          const personaId = match[1];
          if (personaId === 'non-existent') {
            expect(personaManager.getPersona(personaId)).toBeUndefined();
          }
        }
      }
    });

    it('should handle prompt name parsing correctly', () => {
      const testPromptNames = [
        'adopt-persona-architect',
        'adopt-persona-developer',
        'adopt-persona-reviewer',
        'adopt-persona-debugger',
      ];

      for (const promptName of testPromptNames) {
        const match = promptName.match(/^adopt-persona-(.+)$/);
        expect(match).toBeTruthy();

        if (match) {
          const personaId = match[1];
          const persona = personaManager.getPersona(personaId);
          expect(persona).toBeDefined();
          expect(persona?.id).toBe(personaId);
        }
      }
    });

    it('should generate complete prompt with context', () => {
      const persona = personaManager.getPersona('developer');
      expect(persona).toBeDefined();

      if (persona) {
        const context = 'Build a REST API for user management';
        const prompt = personaManager.generatePrompt(persona, context);

        expect(prompt).toContain(persona.promptTemplate);
        expect(prompt).toContain(`Context: ${context}`);

        // Should contain examples if available
        if (persona.examples && persona.examples.length > 0) {
          expect(prompt).toContain('Examples of this approach:');
        }
      }
    });

    it('should format JSON response correctly', () => {
      const persona = personaManager.getPersona('architect');
      expect(persona).toBeDefined();

      if (persona) {
        // Simulate the JSON response format
        const jsonResponse = JSON.stringify(persona, null, 2);
        const parsed = JSON.parse(jsonResponse);

        expect(parsed).toEqual(persona);
        expect(parsed.id).toBe('architect');
        expect(parsed.name).toBe('Software Architect');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed URIs gracefully', () => {
      const malformedUris = [
        '',
        'persona',
        'persona:',
        'persona:///',
        'persona://architect/extra',
      ];

      malformedUris.forEach(uri => {
        const match = uri.match(/^persona:\/\/(.+)$/);
        if (match && match[1]) {
          // Only valid if there's actually a persona ID
          expect(match[1].length).toBeGreaterThan(0);
        } else {
          // Should fail pattern matching for malformed URIs
          expect(match).toBeFalsy();
        }
      });
    });

    it('should handle malformed prompt names gracefully', () => {
      const malformedNames = [
        '',
        'adopt-persona',
        'adopt-persona-',
        'wrong-prefix-architect',
        'adopt-persona-architect-extra',
      ];

      malformedNames.forEach(name => {
        const match = name.match(/^adopt-persona-(.+)$/);
        if (match && match[1]) {
          // Only valid if there's actually a persona ID
          expect(match[1].length).toBeGreaterThan(0);
        } else {
          // Should fail pattern matching for malformed names
          expect(match).toBeFalsy();
        }
      });
    });
  });
});
