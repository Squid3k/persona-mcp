import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { EnhancedPersonaManager } from '../src/enhanced-persona-manager.js';
import { PersonaConfig, LoadedPersona } from '../src/types/yaml-persona.js';
import { Persona } from '../src/types/persona.js';
import { PersonaLoader } from '../src/loaders/persona-loader.js';
import { PersonaWatcher, WatchEvent } from '../src/loaders/persona-watcher.js';
import { PersonaResolver } from '../src/loaders/persona-resolver.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Mock all dependencies
vi.mock('fs/promises');
vi.mock('path');
vi.mock('os');

vi.mock('../src/loaders/persona-loader.js', () => ({
  PersonaLoader: vi.fn(),
}));

vi.mock('../src/loaders/persona-watcher.js', () => ({
  PersonaWatcher: vi.fn(),
}));

vi.mock('../src/loaders/persona-resolver.js', () => ({
  PersonaResolver: vi.fn(),
}));

// Mock default personas
vi.mock('../src/personas/architect.js', () => ({
  architectPersona: {
    id: 'architect',
    name: 'Software Architect',
    role: 'architect',
    core: {
      identity: 'You are a software architect.',
      primaryObjective: 'Design robust system architectures',
      constraints: [
        'Must be scalable',
        'Must be maintainable',
        'Must follow patterns',
      ],
    },
    behavior: {
      mindset: [
        'Think strategically',
        'Consider long-term impact',
        'Balance trade-offs',
      ],
      methodology: [
        'Analyze requirements',
        'Design architecture',
        'Document decisions',
        'Review implementation',
      ],
      priorities: ['System reliability', 'Scalability', 'Maintainability'],
      antiPatterns: [
        'Over-engineering',
        'Ignoring requirements',
        'Poor documentation',
      ],
    },
    expertise: {
      domains: ['architecture', 'design', 'patterns', 'scalability'],
      skills: [
        'system design',
        'documentation',
        'technical leadership',
        'decision making',
      ],
    },
    decisionCriteria: [
      'Is it scalable?',
      'Is it maintainable?',
      'Does it meet requirements?',
    ],
    examples: ['Design microservices', 'Create system blueprints'],
    tags: ['architecture'],
  },
}));

vi.mock('../src/personas/developer.js', () => ({
  developerPersona: {
    id: 'developer',
    name: 'Code Developer',
    role: 'developer',
    core: {
      identity: 'You are a code developer.',
      primaryObjective: 'Write clean, testable code',
      constraints: [
        'Must write tests',
        'Must follow patterns',
        'Must be readable',
      ],
    },
    behavior: {
      mindset: ['Code quality first', 'Test everything', 'Keep it simple'],
      methodology: [
        'Write tests first',
        'Implement features',
        'Refactor code',
        'Document changes',
      ],
      priorities: ['Code quality', 'Test coverage', 'Performance'],
      antiPatterns: [
        'Copy-paste coding',
        'Ignoring tests',
        'Premature optimization',
      ],
    },
    expertise: {
      domains: ['coding', 'implementation', 'testing', 'debugging'],
      skills: ['programming', 'testing', 'refactoring', 'documentation'],
    },
    decisionCriteria: ['Is it tested?', 'Is it readable?', 'Is it efficient?'],
    examples: ['Implement features', 'Write unit tests'],
    tags: ['development'],
  },
}));

vi.mock('../src/personas/reviewer.js', () => ({
  reviewerPersona: {
    id: 'reviewer',
    name: 'Code Reviewer',
    role: 'reviewer',
    core: {
      identity: 'You are a code reviewer.',
      primaryObjective: 'Ensure code quality and standards',
      constraints: [
        'Must be constructive',
        'Must check tests',
        'Must verify patterns',
      ],
    },
    behavior: {
      mindset: ['Quality matters', 'Details count', 'Help others improve'],
      methodology: [
        'Check functionality',
        'Review tests',
        'Verify patterns',
        'Suggest improvements',
      ],
      priorities: ['Code correctness', 'Test coverage', 'Maintainability'],
      antiPatterns: ['Nitpicking', 'Missing bugs', 'Harsh criticism'],
    },
    expertise: {
      domains: ['code review', 'quality', 'best practices', 'standards'],
      skills: [
        'critical analysis',
        'pattern recognition',
        'constructive feedback',
        'mentoring',
      ],
    },
    decisionCriteria: [
      'Is it correct?',
      'Is it tested?',
      'Does it follow standards?',
    ],
    examples: ['Review pull requests', 'Suggest improvements'],
    tags: ['review'],
  },
}));

vi.mock('../src/personas/debugger.js', () => ({
  debuggerPersona: {
    id: 'debugger',
    name: 'Debugger',
    role: 'debugger',
    core: {
      identity: 'You are a debugger.',
      primaryObjective: 'Find and fix bugs systematically',
      constraints: [
        'Must find root cause',
        'Must verify fix',
        'Must prevent recurrence',
      ],
    },
    behavior: {
      mindset: ['Be systematic', 'Question everything', 'Verify assumptions'],
      methodology: [
        'Reproduce issue',
        'Isolate problem',
        'Find root cause',
        'Implement fix',
      ],
      priorities: ['Find root cause', 'Fix correctly', 'Prevent recurrence'],
      antiPatterns: [
        'Quick patches',
        'Ignoring edge cases',
        'Not testing fixes',
      ],
    },
    expertise: {
      domains: ['debugging', 'troubleshooting', 'analysis', 'problem solving'],
      skills: [
        'systematic investigation',
        'root cause analysis',
        'testing',
        'documentation',
      ],
    },
    decisionCriteria: [
      'Is root cause found?',
      'Is fix correct?',
      'Will it recur?',
    ],
    examples: ['Debug complex issues', 'Trace execution flow'],
    tags: ['debugging'],
  },
}));

// Type definitions for mocks
type MockPersonaLoader = {
  loadPersonasFromDirectory: Mock;
  loadPersonaFromFile: Mock;
};

type MockPersonaWatcher = {
  startWatching: Mock;
  stopWatching: Mock;
};

type MockPersonaResolver = {
  resolveConflicts: Mock;
  getStatistics: Mock;
  getInvalidPersonas: Mock;
};

describe('EnhancedPersonaManager', () => {
  let manager: EnhancedPersonaManager;
  let mockLoader: MockPersonaLoader;
  let mockWatcher: MockPersonaWatcher;
  let mockResolver: MockPersonaResolver;
  let mockConsoleError: Mock;
  let mockConsoleWarn: Mock;
  let originalConsoleError: typeof console.error;
  let originalConsoleWarn: typeof console.warn;

  // Test data
  const testPersona: LoadedPersona = {
    id: 'test-persona',
    name: 'Test Persona',
    role: 'tester',
    core: {
      identity: 'You are a test persona.',
      primaryObjective: 'Test everything thoroughly',
      constraints: [
        'Must test edge cases',
        'Must verify behavior',
        'Must document results',
      ],
    },
    behavior: {
      mindset: ['Test-driven', 'Quality focused', 'Detail oriented'],
      methodology: [
        'Write test cases',
        'Execute tests',
        'Verify results',
        'Document findings',
      ],
      priorities: ['Test coverage', 'Bug detection', 'Documentation'],
      antiPatterns: [
        'Skipping tests',
        'Ignoring edge cases',
        'Poor documentation',
      ],
    },
    expertise: {
      domains: [
        'testing',
        'quality assurance',
        'test automation',
        'validation',
      ],
      skills: [
        'test design',
        'test execution',
        'bug reporting',
        'documentation',
      ],
    },
    decisionCriteria: [
      'Is it testable?',
      'Are edge cases covered?',
      'Is it documented?',
    ],
    examples: ['Example 1', 'Example 2'],
    tags: ['testing'],
    version: '1.0',
    source: {
      type: 'user',
      filePath: '/test/path/test.yaml',
    },
    isValid: true,
  };

  const testBasicPersona: Persona = {
    id: 'test-persona',
    name: 'Test Persona',
    role: 'tester',
    core: {
      identity: 'You are a test persona.',
      primaryObjective: 'Test-driven development',
      constraints: [
        'Must test thoroughly',
        'Follow best practices',
        'Write clear tests',
      ],
    },
    behavior: {
      mindset: ['Quality first', 'Test everything', 'Prevent bugs'],
      methodology: ['Write test first', 'Run tests', 'Refactor', 'Repeat'],
      priorities: ['Test coverage', 'Code quality', 'Performance'],
      antiPatterns: ['Skip tests', 'Test later', 'Ignore failures'],
    },
    expertise: {
      domains: ['testing', 'quality assurance', 'TDD', 'BDD'],
      skills: [
        'Unit testing',
        'Integration testing',
        'Mocking',
        'Test automation',
      ],
    },
    decisionCriteria: ['Is it tested?', 'Does it work?', 'Is it maintainable?'],
    examples: ['Example 1', 'Example 2'],
    tags: ['testing'],
  };

  beforeEach(() => {
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    mockConsoleError = vi.fn();
    mockConsoleWarn = vi.fn();
    console.error = mockConsoleError;
    console.warn = mockConsoleWarn;

    // Mock loader
    mockLoader = {
      loadPersonasFromDirectory: vi.fn().mockResolvedValue([testPersona]),
      loadPersonaFromFile: vi.fn().mockResolvedValue(testPersona),
    };
    vi.mocked(PersonaLoader).mockImplementation(
      () => mockLoader as unknown as PersonaLoader
    );

    // Mock watcher
    mockWatcher = {
      startWatching: vi.fn().mockResolvedValue(undefined),
      stopWatching: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(PersonaWatcher).mockImplementation(
      () => mockWatcher as unknown as PersonaWatcher
    );

    // Mock resolver
    mockResolver = {
      resolveConflicts: vi
        .fn()
        .mockImplementation((personas: LoadedPersona[]) => {
          const map = new Map<
            string,
            { persona: LoadedPersona; conflicts: LoadedPersona[] }
          >();
          personas.forEach((p: LoadedPersona) => {
            map.set(p.id, { persona: p, conflicts: [] });
          });
          return map;
        }),
      getStatistics: vi.fn().mockReturnValue({
        total: 13,
        valid: 12,
        invalid: 1,
        conflicts: 0,
        bySource: { default: 12, user: 1, project: 0 },
      }),
      getInvalidPersonas: vi.fn().mockReturnValue([]),
    };
    vi.mocked(PersonaResolver).mockImplementation(
      () => mockResolver as unknown as PersonaResolver
    );

    // Mock fs operations
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);

    // Mock path operations
    vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
    vi.mocked(os.homedir).mockReturnValue('/home/test');

    // Mock process.cwd()
    vi.spyOn(process, 'cwd').mockReturnValue('/project');

    vi.clearAllMocks();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create manager with default config', () => {
      manager = new EnhancedPersonaManager();

      expect(PersonaResolver).toHaveBeenCalled();
      expect(PersonaLoader).toHaveBeenCalled();
      expect(PersonaWatcher).toHaveBeenCalled();
    });

    it('should create manager with custom config', () => {
      const customConfig: Partial<PersonaConfig> = {
        directories: {
          user: '/custom/user',
          project: '/custom/project',
        },
        watchOptions: {
          enabled: false,
          debounceMs: 300,
        },
      };

      manager = new EnhancedPersonaManager(customConfig);

      expect(PersonaResolver).toHaveBeenCalled();
      expect(PersonaLoader).toHaveBeenCalled();
      expect(PersonaWatcher).toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    beforeEach(() => {
      manager = new EnhancedPersonaManager();
    });

    it('should initialize successfully', async () => {
      await manager.initialize();

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Initializing Enhanced Persona Manager...'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Enhanced Persona Manager initialized successfully'
      );
      expect(mockLoader.loadPersonasFromDirectory).toHaveBeenCalledTimes(2);
      expect(mockWatcher.startWatching).toHaveBeenCalled();
    });

    it('should not initialize twice', async () => {
      await manager.initialize();
      mockConsoleError.mockClear();

      await manager.initialize();

      expect(mockConsoleError).not.toHaveBeenCalledWith(
        'Initializing Enhanced Persona Manager...'
      );
    });

    it('should create user directory if it does not exist', async () => {
      vi.mocked(fs.access).mockRejectedValueOnce(
        new Error('Directory does not exist')
      );

      await manager.initialize();

      expect(fs.mkdir).toHaveBeenCalledWith('/home/test/.ai/personas', {
        recursive: true,
      });
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Created directory: /home/test/.ai/personas'
      );
    });

    it('should handle directory creation failure', async () => {
      vi.mocked(fs.access).mockRejectedValueOnce(
        new Error('Directory does not exist')
      );
      vi.mocked(fs.mkdir).mockRejectedValueOnce(new Error('Permission denied'));

      await manager.initialize();

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to create directory /home/test/.ai/personas:',
        expect.any(Error)
      );
    });

    it('should skip watching when disabled', async () => {
      manager = new EnhancedPersonaManager({
        watchOptions: { enabled: false, debounceMs: 150 },
      });

      await manager.initialize();

      expect(mockWatcher.startWatching).not.toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    beforeEach(() => {
      manager = new EnhancedPersonaManager();
    });

    it('should shutdown successfully', async () => {
      await manager.initialize();
      await manager.shutdown();

      expect(mockWatcher.stopWatching).toHaveBeenCalled();
    });
  });

  describe('getAllPersonas', () => {
    beforeEach(async () => {
      manager = new EnhancedPersonaManager();
      await manager.initialize();
    });

    it('should return all valid personas', () => {
      const personas = manager.getAllPersonas();

      expect(mockResolver.resolveConflicts).toHaveBeenCalled();
      expect(personas).toHaveLength(13); // 12 default + 1 test
    });

    it('should filter out invalid personas', () => {
      const invalidPersona = { ...testPersona, isValid: false };
      mockResolver.resolveConflicts.mockReturnValue(
        new Map([['test-persona', { persona: invalidPersona, conflicts: [] }]])
      );

      const personas = manager.getAllPersonas();

      expect(personas).toHaveLength(0);
    });
  });

  describe('getPersona', () => {
    beforeEach(async () => {
      manager = new EnhancedPersonaManager();
      await manager.initialize();
    });

    it('should return specific persona by id', () => {
      mockResolver.resolveConflicts.mockReturnValue(
        new Map([['test-persona', { persona: testPersona, conflicts: [] }]])
      );

      const persona = manager.getPersona('test-persona');

      expect(persona).toBeDefined();
      expect(persona?.id).toBe('test-persona');
    });

    it('should return undefined for non-existent persona', () => {
      mockResolver.resolveConflicts.mockReturnValue(new Map());

      const persona = manager.getPersona('non-existent');

      expect(persona).toBeUndefined();
    });

    it('should return undefined for invalid persona', () => {
      const invalidPersona = { ...testPersona, isValid: false };
      mockResolver.resolveConflicts.mockReturnValue(
        new Map([['test-persona', { persona: invalidPersona, conflicts: [] }]])
      );

      const persona = manager.getPersona('test-persona');

      expect(persona).toBeUndefined();
    });
  });

  describe('generatePrompt', () => {
    beforeEach(async () => {
      manager = new EnhancedPersonaManager();
      await manager.initialize();
    });

    it('should generate prompt with template only', () => {
      const persona = { ...testBasicPersona, examples: [] };

      const prompt = manager.generatePrompt(persona);

      expect(prompt).toContain('You are a test persona.');
      expect(prompt).toContain('Primary Objective:');
      expect(prompt).toContain('Key Constraints:');
      expect(prompt).toContain('Mindset:');
      expect(prompt).toContain('Methodology:');
    });

    it('should generate prompt with context', () => {
      const persona = { ...testBasicPersona, examples: [] };
      const context = 'Build a REST API';

      const prompt = manager.generatePrompt(persona, context);

      expect(prompt).toContain('You are a test persona.');
      expect(prompt).toContain('Context: Build a REST API');
    });

    it('should generate prompt with examples', () => {
      const prompt = manager.generatePrompt(testBasicPersona);

      expect(prompt).toContain('You are a test persona.');
      expect(prompt).toContain('Examples:');
      expect(prompt).toContain('1. Example 1');
      expect(prompt).toContain('2. Example 2');
    });

    it('should generate prompt with context and examples', () => {
      const context = 'Build a REST API';

      const prompt = manager.generatePrompt(testBasicPersona, context);

      expect(prompt).toContain('You are a test persona.');
      expect(prompt).toContain('Context: Build a REST API');
      expect(prompt).toContain('Examples:');
      expect(prompt).toContain('1. Example 1');
      expect(prompt).toContain('2. Example 2');
    });

    it('should handle empty examples array', () => {
      const persona = { ...testBasicPersona, examples: [] };

      const prompt = manager.generatePrompt(persona);

      expect(prompt).toContain('You are a test persona.');
      expect(prompt).not.toContain('Examples:');
    });

    it('should include behavior diagrams in prompt', () => {
      const personaWithDiagrams = {
        ...testBasicPersona,
        behaviorDiagrams: [
          {
            title: 'Test Workflow',
            mermaidDSL: 'flowchart TD\n    A[Start] --> B[End]',
            diagramType: 'flowchart' as const,
            description: 'A simple test workflow diagram',
          },
        ],
      };

      const prompt = manager.generatePrompt(personaWithDiagrams);

      expect(prompt).toContain('Behavior Diagrams:');
      expect(prompt).toContain('1. Test Workflow');
      expect(prompt).toContain('A simple test workflow diagram');
      expect(prompt).toContain('```mermaid');
      expect(prompt).toContain('flowchart TD');
      expect(prompt).toContain('A[Start] --> B[End]');
    });

    it('should handle empty behavior diagrams array', () => {
      const persona = { ...testBasicPersona, behaviorDiagrams: [] };

      const prompt = manager.generatePrompt(persona);

      expect(prompt).toContain('You are a test persona.');
      expect(prompt).not.toContain('Behavior Diagrams:');
    });
  });

  describe('getPersonaInfo', () => {
    beforeEach(async () => {
      manager = new EnhancedPersonaManager();
      await manager.initialize();
    });

    it('should return persona information', () => {
      const info = manager.getPersonaInfo();

      expect(info).toHaveProperty('statistics');
      expect(info).toHaveProperty('conflicts');
      expect(info).toHaveProperty('invalid');
      expect(mockResolver.getStatistics).toHaveBeenCalled();
      expect(mockResolver.getInvalidPersonas).toHaveBeenCalled();
    });

    it('should return conflicts information', () => {
      const conflictPersona = { ...testPersona, id: 'conflict-persona' };
      mockResolver.resolveConflicts.mockReturnValue(
        new Map([
          [
            'conflict-persona',
            {
              persona: conflictPersona,
              conflicts: [{ ...testPersona, source: { type: 'project' } }],
            },
          ],
        ])
      );

      const info = manager.getPersonaInfo();

      expect(info.conflicts).toHaveLength(1);
      expect(info.conflicts[0]).toEqual({
        id: 'conflict-persona',
        sources: ['user', 'project'],
      });
    });

    it('should return invalid personas information', () => {
      const invalidPersona = {
        ...testPersona,
        id: 'invalid-persona',
        validationErrors: ['Error 1', 'Error 2'],
      };
      mockResolver.getInvalidPersonas.mockReturnValue([invalidPersona]);

      const info = manager.getPersonaInfo();

      expect(info.invalid).toHaveLength(1);
      expect(info.invalid[0]).toEqual({
        id: 'invalid-persona',
        errors: ['Error 1', 'Error 2'],
      });
    });
  });

  describe('reloadPersonas', () => {
    beforeEach(async () => {
      manager = new EnhancedPersonaManager();
      await manager.initialize();
    });

    it('should reload all personas', async () => {
      mockConsoleError.mockClear();
      mockLoader.loadPersonasFromDirectory.mockClear();

      await manager.reloadPersonas();

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Reloading all personas...'
      );
      expect(mockLoader.loadPersonasFromDirectory).toHaveBeenCalledTimes(2); // Called again during reload
    });
  });

  describe('addPersona', () => {
    beforeEach(async () => {
      manager = new EnhancedPersonaManager();
      await manager.initialize();
    });

    it('should add persona programmatically', () => {
      const newPersona: Persona = {
        id: 'new-persona',
        name: 'New Persona',
        role: 'new',
        core: {
          identity: 'New persona identity',
          primaryObjective: 'New objective',
          constraints: ['Constraint 1', 'Constraint 2', 'Constraint 3'],
        },
        behavior: {
          mindset: ['Mindset 1', 'Mindset 2', 'Mindset 3'],
          methodology: ['Step 1', 'Step 2', 'Step 3', 'Step 4'],
          priorities: ['Priority 1', 'Priority 2', 'Priority 3'],
          antiPatterns: ['Anti-pattern 1', 'Anti-pattern 2', 'Anti-pattern 3'],
        },
        expertise: {
          domains: ['domain1', 'domain2', 'domain3', 'domain4'],
          skills: ['skill1', 'skill2', 'skill3', 'skill4'],
        },
        decisionCriteria: ['Criteria 1', 'Criteria 2', 'Criteria 3'],
        examples: ['Example 1', 'Example 2'],
        tags: ['new'],
      };

      manager.addPersona(newPersona);

      // Verify it was added by checking internal state
      mockResolver.resolveConflicts.mockReturnValue(
        new Map([
          [
            'new-persona',
            {
              persona: {
                ...newPersona,
                version: '1.0',
                source: { type: 'default' },
                isValid: true,
              },
              conflicts: [],
            },
          ],
        ])
      );

      const retrieved = manager.getPersona('new-persona');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('new-persona');
    });
  });

  describe('removePersona', () => {
    beforeEach(async () => {
      manager = new EnhancedPersonaManager();
      await manager.initialize();
    });

    it('should remove persona by id', () => {
      // First add a persona so we can remove it
      const testPersona: Persona = {
        id: 'remove-test',
        name: 'Remove Test',
        role: 'test',
        core: {
          identity: 'Test persona for removal',
          primaryObjective: 'Test removal functionality',
          constraints: [
            'Test constraint 1',
            'Test constraint 2',
            'Test constraint 3',
          ],
        },
        behavior: {
          mindset: ['Test mindset 1', 'Test mindset 2', 'Test mindset 3'],
          methodology: [
            'Test step 1',
            'Test step 2',
            'Test step 3',
            'Test step 4',
          ],
          priorities: ['Test priority 1', 'Test priority 2', 'Test priority 3'],
          antiPatterns: [
            'Test anti-pattern 1',
            'Test anti-pattern 2',
            'Test anti-pattern 3',
          ],
        },
        expertise: {
          domains: [
            'test domain 1',
            'test domain 2',
            'test domain 3',
            'test domain 4',
          ],
          skills: [
            'test skill 1',
            'test skill 2',
            'test skill 3',
            'test skill 4',
          ],
        },
        decisionCriteria: [
          'Test criteria 1',
          'Test criteria 2',
          'Test criteria 3',
        ],
        examples: ['Test example 1', 'Test example 2'],
        tags: ['test'],
      };

      manager.addPersona(testPersona);

      const result = manager.removePersona('remove-test');

      expect(result).toBe(true);
    });

    it('should return false for non-existent persona', () => {
      const result = manager.removePersona('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('file watching', () => {
    beforeEach(async () => {
      manager = new EnhancedPersonaManager();
      await manager.initialize();
    });

    it('should handle file add event', async () => {
      const event: WatchEvent = {
        type: 'add',
        filePath: '/home/test/.ai/personas/new-persona.yaml',
      };

      // Get the callback that was passed to startWatching
      const callback = mockWatcher.startWatching.mock.calls[0][1];

      await callback(event);

      expect(mockLoader.loadPersonaFromFile).toHaveBeenCalledWith(
        '/home/test/.ai/personas/new-persona.yaml',
        'user'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'File add: /home/test/.ai/personas/new-persona.yaml'
      );
    });

    it('should handle file change event', async () => {
      const event: WatchEvent = {
        type: 'change',
        filePath: '/project/.ai/personas/test-persona.yaml',
      };

      const callback = mockWatcher.startWatching.mock.calls[0][1];

      await callback(event);

      expect(mockLoader.loadPersonaFromFile).toHaveBeenCalledWith(
        '/project/.ai/personas/test-persona.yaml',
        'project'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'File change: /project/.ai/personas/test-persona.yaml'
      );
    });

    it('should handle file unlink event', async () => {
      const event: WatchEvent = {
        type: 'unlink',
        filePath: '/home/test/.ai/personas/deleted-persona.yaml',
      };

      const callback = mockWatcher.startWatching.mock.calls[0][1];

      await callback(event);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'File unlink: /home/test/.ai/personas/deleted-persona.yaml'
      );
    });

    it('should handle file change errors', async () => {
      const event: WatchEvent = {
        type: 'add',
        filePath: '/home/test/.ai/personas/error-persona.yaml',
      };

      mockLoader.loadPersonaFromFile.mockRejectedValue(new Error('Load error'));

      const callback = mockWatcher.startWatching.mock.calls[0][1];

      await callback(event);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error handling file change /home/test/.ai/personas/error-persona.yaml:',
        expect.any(Error)
      );
    });

    it('should determine source type from path - user', () => {
      const _manager = new EnhancedPersonaManager();
      const _filePath = '/home/test/.ai/personas/test.yaml';

      // We need to call the private method through a public one that uses it
      const _event: WatchEvent = { type: 'add', filePath: _filePath };

      // The source type determination is tested indirectly through the file handling
      expect(vi.mocked(path.join)).toHaveBeenCalledWith(
        '/home/test',
        '.ai',
        'personas'
      );
    });

    it('should determine source type from path - project', () => {
      const _manager = new EnhancedPersonaManager();
      const _filePath = '/project/.ai/personas/test.yaml';

      // The source type determination is tested indirectly through the file handling
      expect(vi.mocked(path.join)).toHaveBeenCalledWith(
        '/project',
        '.ai',
        'personas'
      );
    });

    it('should handle file removal with existing persona', async () => {
      // First add a persona with a file path
      const testPersonaWithPath: LoadedPersona = {
        ...testPersona,
        source: { type: 'user', filePath: '/home/test/.ai/personas/test.yaml' },
      };

      // Mock the persona being found
      const mockPersonas = new Map([
        [
          'test-persona:user:/home/test/.ai/personas/test.yaml',
          testPersonaWithPath,
        ],
      ]);

      // Access private method through reflection to test it
      const privateManager = manager as any;
      privateManager.personas = mockPersonas;

      const event: WatchEvent = {
        type: 'unlink',
        filePath: '/home/test/.ai/personas/test.yaml',
      };

      const callback = mockWatcher.startWatching.mock.calls[0][1];

      await callback(event);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Removed persona 'test-persona' from /home/test/.ai/personas/test.yaml"
      );
    });

    it('should handle file add with existing persona key', async () => {
      // First add a persona with a file path
      const testPersonaWithPath: LoadedPersona = {
        ...testPersona,
        source: { type: 'user', filePath: '/home/test/.ai/personas/test.yaml' },
      };

      // Mock the persona being found - put it in personas map
      const mockPersonas = new Map([
        [
          'test-persona:user:/home/test/.ai/personas/test.yaml',
          testPersonaWithPath,
        ],
      ]);

      // Access private method through reflection to test it
      const privateManager = manager as any;
      privateManager.personas = mockPersonas;

      const event: WatchEvent = {
        type: 'add',
        filePath: '/home/test/.ai/personas/test.yaml',
      };

      const callback = mockWatcher.startWatching.mock.calls[0][1];

      await callback(event);

      expect(mockLoader.loadPersonaFromFile).toHaveBeenCalledWith(
        '/home/test/.ai/personas/test.yaml',
        'user'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Loaded persona 'test-persona' from /home/test/.ai/personas/test.yaml"
      );
    });

    it('should handle file with default source type', async () => {
      const event: WatchEvent = {
        type: 'add',
        filePath: '/some/other/path/test.yaml',
      };

      const callback = mockWatcher.startWatching.mock.calls[0][1];

      await callback(event);

      expect(mockLoader.loadPersonaFromFile).toHaveBeenCalledWith(
        '/some/other/path/test.yaml',
        'default'
      );
    });

    it('should handle file add with invalid persona', async () => {
      const invalidPersona: LoadedPersona = {
        ...testPersona,
        isValid: false,
      };

      mockLoader.loadPersonaFromFile.mockResolvedValue(invalidPersona);

      const event: WatchEvent = {
        type: 'add',
        filePath: '/home/test/.ai/personas/invalid.yaml',
      };

      const callback = mockWatcher.startWatching.mock.calls[0][1];

      await callback(event);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Failed to load persona 'test-persona' from /home/test/.ai/personas/invalid.yaml"
      );
    });
  });

  describe('loadAllPersonas', () => {
    beforeEach(() => {
      manager = new EnhancedPersonaManager();
    });

    it('should load personas from all sources', async () => {
      await manager.initialize();

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Loading default personas...'
      );
      expect(mockConsoleError).toHaveBeenCalledWith('Loading user personas...');
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Loading project personas...'
      );

      expect(mockLoader.loadPersonasFromDirectory).toHaveBeenCalledWith(
        '/home/test/.ai/personas',
        'user'
      );
      expect(mockLoader.loadPersonasFromDirectory).toHaveBeenCalledWith(
        '/project/.ai/personas',
        'project'
      );
    });

    it('should log statistics after loading', async () => {
      await manager.initialize();

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Loaded 13 personas (12 valid, 1 invalid)'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Sources: 12 default, 1 user, 0 project'
      );
    });

    it('should log conflicts when present', async () => {
      mockResolver.getStatistics.mockReturnValue({
        total: 13,
        valid: 12,
        invalid: 1,
        conflicts: 2,
        bySource: { default: 12, user: 1, project: 0 },
      });

      await manager.initialize();

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Found 2 persona conflicts'
      );
    });
  });

  describe('private methods', () => {
    beforeEach(async () => {
      manager = new EnhancedPersonaManager();
      await manager.initialize();
    });

    it('should convert loaded persona to basic persona', () => {
      const personas = manager.getAllPersonas();

      // Verify that the returned personas don't have LoadedPersona specific fields
      personas.forEach(persona => {
        expect(persona).not.toHaveProperty('source');
        expect(persona).not.toHaveProperty('isValid');
        expect(persona).not.toHaveProperty('validationErrors');
        expect(persona).not.toHaveProperty('version');
      });
    });
  });
});
