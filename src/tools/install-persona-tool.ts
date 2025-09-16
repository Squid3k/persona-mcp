/**
 * Install Persona Tool - Allows Claude to dynamically install new personas
 * 
 * This tool enables AI assistants to create and install new persona definitions
 * directly through the MCP interface, expanding the available persona library.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { z } from 'zod';
import { PersonaSchema } from '../types/persona.js';
import type { Persona } from '../types/persona.js';
import type { YAMLPersona } from '../types/yaml-persona.js';

// Schema for installing a new persona
const InstallPersonaSchema = z.object({
  name: z.string()
    .min(3, 'Persona name must be at least 3 characters')
    .max(50, 'Persona name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Persona name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(200, 'Description must be less than 200 characters'),
  
  keywords: z.array(z.string())
    .min(2, 'Must provide at least 2 keywords')
    .max(10, 'Cannot have more than 10 keywords'),
  
  expertise: z.array(z.string())
    .min(1, 'Must provide at least 1 expertise area')
    .max(15, 'Cannot have more than 15 expertise areas'),
  
  complexity_levels: z.array(z.enum(['low', 'medium', 'high']))
    .min(1, 'Must provide at least 1 complexity level'),
  
  prompt: z.string()
    .min(50, 'Prompt must be at least 50 characters')
    .max(2000, 'Prompt must be less than 2000 characters'),
  
  examples: z.array(z.string())
    .min(1, 'Must provide at least 1 example')
    .max(5, 'Cannot have more than 5 examples'),
  
  author: z.string().default('Claude AI Assistant'),
  
  category: z.string().default('general')
});

type InstallPersonaInput = z.infer<typeof InstallPersonaSchema>;

/**
 * Converts install input to YAML persona format
 */
function createYAMLPersona(input: InstallPersonaInput): YAMLPersona {
  return {
    id: input.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: input.name,
    description: input.description,
    category: input.category,
    keywords: input.keywords,
    expertise: input.expertise,
    complexity_levels: input.complexity_levels,
    prompt: input.prompt,
    examples: input.examples,
    author: input.author,
    version: '1.0.0',
    created_at: new Date().toISOString().split('T')[0]
  };
}

/**
 * Converts YAML persona to internal persona format
 */
function yamlToPersona(yamlPersona: YAMLPersona): Persona {
  return {
    id: yamlPersona.id,
    name: yamlPersona.name,
    description: yamlPersona.description,
    category: yamlPersona.category || 'general',
    keywords: yamlPersona.keywords,
    expertise: yamlPersona.expertise,
    complexity_levels: yamlPersona.complexity_levels,
    prompt: yamlPersona.prompt,
    examples: yamlPersona.examples || [],
    metadata: {
      author: yamlPersona.author || 'Unknown',
      version: yamlPersona.version || '1.0.0',
      created_at: yamlPersona.created_at || new Date().toISOString().split('T')[0],
      source: 'claude-installed'
    }
  };
}

/**
 * Saves persona to personas directory
 */
async function savePersonaFile(persona: YAMLPersona): Promise<string> {
  const personasDir = path.join(process.cwd(), 'src', 'personas');
  
  // Ensure personas directory exists
  try {
    await fs.mkdir(personasDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, that's fine
  }
  
  const filename = `${persona.id}.yaml`;
  const filepath = path.join(personasDir, filename);
  
  // Check if persona already exists
  try {
    await fs.access(filepath);
    throw new Error(`Persona with ID '${persona.id}' already exists. Use update-persona tool to modify existing personas.`);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error; // Re-throw if it's not a "file not found" error
    }
  }
  
  // Create YAML content
  const yamlContent = yaml.dump(persona, {
    indent: 2,
    lineWidth: 100,
    noRefs: true
  });
  
  await fs.writeFile(filepath, yamlContent, 'utf8');
  
  return filepath;
}

/**
 * Validates that the persona is properly formatted
 */
function validatePersona(persona: Persona): void {
  try {
    PersonaSchema.parse(persona);
  } catch (error) {
    throw new Error(`Invalid persona format: ${error}`);
  }
}

/**
 * Main function to install a new persona
 */
export async function installPersona(input: unknown): Promise<{
  success: boolean;
  message: string;
  persona?: Persona;
  filepath?: string;
}> {
  try {
    // Validate input
    const validated = InstallPersonaSchema.parse(input);
    
    // Create YAML persona
    const yamlPersona = createYAMLPersona(validated);
    
    // Convert to internal format for validation
    const persona = yamlToPersona(yamlPersona);
    
    // Validate the persona
    validatePersona(persona);
    
    // Save to file
    const filepath = await savePersonaFile(yamlPersona);
    
    return {
      success: true,
      message: `Successfully installed persona '${persona.name}' (ID: ${persona.id})`,
      persona,
      filepath
    };
    
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to install persona: ${error.message}`,
    };
  }
}

/**
 * Tool definition for MCP
 */
export const INSTALL_PERSONA_TOOL = {
  name: 'install-persona',
  description: 'Install a new persona definition that can be used by AI assistants. This allows Claude to dynamically create and add new specialized personas.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string',
        description: 'The display name of the persona (e.g., "Game Developer", "UX Researcher")',
        minLength: 3,
        maxLength: 50
      },
      description: {
        type: 'string', 
        description: 'A clear description of what this persona specializes in',
        minLength: 10,
        maxLength: 200
      },
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: 'Keywords that trigger this persona (e.g., ["gaming", "unity", "programming"])',
        minItems: 2,
        maxItems: 10
      },
      expertise: {
        type: 'array',
        items: { type: 'string' },
        description: 'Areas of expertise this persona covers',
        minItems: 1,
        maxItems: 15
      },
      complexity_levels: {
        type: 'array',
        items: { 
          type: 'string',
          enum: ['low', 'medium', 'high']
        },
        description: 'Complexity levels this persona can handle',
        minItems: 1
      },
      prompt: {
        type: 'string',
        description: 'The system prompt that defines how this persona behaves and responds',
        minLength: 50,
        maxLength: 2000
      },
      examples: {
        type: 'array',
        items: { type: 'string' },
        description: 'Example interactions or use cases for this persona',
        minItems: 1,
        maxItems: 5
      },
      author: {
        type: 'string',
        description: 'Author of this persona (defaults to "Claude AI Assistant")',
        default: 'Claude AI Assistant'
      },
      category: {
        type: 'string',
        description: 'Category for organization (defaults to "general")',
        default: 'general'
      }
    },
    required: [
      'name', 
      'description', 
      'keywords', 
      'expertise', 
      'complexity_levels', 
      'prompt', 
      'examples'
    ]
  }
};
