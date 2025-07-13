import { describe, it, expect } from 'vitest';
import {
  McpResourceSchema,
  McpPromptSchema,
  type McpResource,
  type McpPrompt,
} from '../../src/types/mcp.js';

describe('MCP Types', () => {
  describe('McpResourceSchema', () => {
    it('should validate a complete MCP resource', () => {
      const resource: McpResource = {
        uri: 'persona://architect',
        name: 'Software Architect',
        description: 'High-level system design persona',
        mimeType: 'application/json',
      };

      const result = McpResourceSchema.safeParse(resource);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(resource);
      }
    });

    it('should validate minimal MCP resource without optional fields', () => {
      const resource = {
        uri: 'persona://developer',
        name: 'Code Developer',
      };

      const result = McpResourceSchema.safeParse(resource);
      expect(result.success).toBe(true);
    });

    it('should reject resource with missing required fields', () => {
      const resource = {
        name: 'Test Resource',
        // missing uri
      };

      const result = McpResourceSchema.safeParse(resource);
      expect(result.success).toBe(false);
    });

    it('should reject resource with invalid field types', () => {
      const resource = {
        uri: 123, // should be string
        name: 'Test Resource',
      };

      const result = McpResourceSchema.safeParse(resource);
      expect(result.success).toBe(false);
    });
  });

  describe('McpPromptSchema', () => {
    it('should validate a complete MCP prompt', () => {
      const prompt: McpPrompt = {
        name: 'adopt-persona-architect',
        description: 'Adopt the architect persona for system design',
        arguments: [
          {
            name: 'context',
            description: 'The specific problem context',
            required: false,
          },
          {
            name: 'focus',
            description: 'Specific area to focus on',
            required: true,
          },
        ],
      };

      const result = McpPromptSchema.safeParse(prompt);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(prompt);
      }
    });

    it('should validate minimal MCP prompt without optional fields', () => {
      const prompt = {
        name: 'adopt-persona-developer',
      };

      const result = McpPromptSchema.safeParse(prompt);
      expect(result.success).toBe(true);
    });

    it('should validate prompt with empty arguments array', () => {
      const prompt = {
        name: 'adopt-persona-reviewer',
        description: 'Code review persona',
        arguments: [],
      };

      const result = McpPromptSchema.safeParse(prompt);
      expect(result.success).toBe(true);
    });

    it('should reject prompt with missing required fields', () => {
      const prompt = {
        description: 'Test prompt',
        // missing name
      };

      const result = McpPromptSchema.safeParse(prompt);
      expect(result.success).toBe(false);
    });

    it('should reject prompt with invalid field types', () => {
      const prompt = {
        name: 123, // should be string
        description: 'Test prompt',
      };

      const result = McpPromptSchema.safeParse(prompt);
      expect(result.success).toBe(false);
    });

    it('should validate prompt arguments with optional fields', () => {
      const prompt = {
        name: 'test-prompt',
        arguments: [
          {
            name: 'arg1',
            // optional description and required
          },
          {
            name: 'arg2',
            description: 'Second argument',
            // optional required
          },
          {
            name: 'arg3',
            required: true,
            // optional description
          },
        ],
      };

      const result = McpPromptSchema.safeParse(prompt);
      expect(result.success).toBe(true);
    });

    it('should reject prompt arguments with invalid structure', () => {
      const prompt = {
        name: 'test-prompt',
        arguments: [
          {
            // missing name
            description: 'Invalid argument',
          },
        ],
      };

      const result = McpPromptSchema.safeParse(prompt);
      expect(result.success).toBe(false);
    });
  });

  describe('Type compatibility', () => {
    it('should work with TypeScript types', () => {
      const resource: McpResource = {
        uri: 'test://resource',
        name: 'Test Resource',
      };

      const prompt: McpPrompt = {
        name: 'test-prompt',
      };

      // These should compile without TypeScript errors
      expect(resource.uri).toBe('test://resource');
      expect(prompt.name).toBe('test-prompt');
    });
  });
});
