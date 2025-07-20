import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PersonaLoader } from '../../src/loaders/persona-loader.js';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

describe('PersonaLoader Security', () => {
  let loader: PersonaLoader;
  let testDir: string;

  beforeEach(async () => {
    loader = new PersonaLoader();
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `persona-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Path Traversal Protection', () => {
    it('should reject loading files with path traversal attempts', async () => {
      const maliciousPath = path.join(testDir, '..', '..', 'etc', 'passwd');
      const result = await loader.loadPersonaFromFile(
        maliciousPath,
        'user',
        testDir
      );

      expect(result.isValid).toBe(false);
      // Check that at least one error mentions path traversal or invalid extension
      const hasRelevantError =
        result.validationErrors?.some(
          err =>
            err.includes('Path traversal') ||
            err.includes('Invalid file extension')
        ) ?? false;
      expect(hasRelevantError).toBe(true);
    });

    it('should reject files outside the base directory', async () => {
      // Create a file outside the test directory
      const outsideDir = path.join(os.tmpdir(), `outside-${Date.now()}`);
      await fs.mkdir(outsideDir, { recursive: true });
      const outsideFile = path.join(outsideDir, 'malicious.yaml');
      await fs.writeFile(outsideFile, 'id: malicious\nname: Bad Persona');

      try {
        const result = await loader.loadPersonaFromFile(
          outsideFile,
          'user',
          testDir
        );
        expect(result.isValid).toBe(false);
      } finally {
        await fs.rm(outsideDir, { recursive: true, force: true });
      }
    });

    it('should accept valid files within the directory', async () => {
      const validFile = path.join(testDir, 'valid-persona.yaml');
      const validContent = `
id: test-persona
name: Test Persona
role: developer
core:
  identity: A test persona
  primaryObjective: Testing
  constraints:
    - Be safe
    - Follow best practices
    - Maintain quality
behavior:
  mindset:
    - Security first
    - Quality focused
    - User-centric
  methodology:
    - Test thoroughly
    - Review carefully
    - Document clearly
    - Deploy safely
  priorities:
    - Safety
    - Quality
    - Performance
  antiPatterns:
    - Unsafe practices
    - Quick hacks
    - Skipping tests
expertise:
  domains:
    - Testing
    - Security
    - Performance
    - Development
  skills:
    - Unit testing
    - Integration testing
    - Security analysis
    - Performance optimization
decisionCriteria:
  - Is it safe?
  - Is it tested?
  - Is it maintainable?
examples:
  - "Example 1: Test before code"
  - "Example 2: Security first"
tags:
  - test
  - security
  - quality
version: "1.0"
`;
      await fs.writeFile(validFile, validContent);

      const result = await loader.loadPersonaFromFile(
        validFile,
        'user',
        testDir
      );

      // Debug info
      if (!result.isValid) {
        console.log('Validation errors:', result.validationErrors);
      }

      expect(result.isValid).toBe(true);
      expect(result.id).toBe('test-persona');
    });

    it('should reject files with invalid extensions', async () => {
      const invalidFile = path.join(testDir, 'script.js');
      await fs.writeFile(invalidFile, 'console.log("malicious");');

      const result = await loader.loadPersonaFromFile(
        invalidFile,
        'user',
        testDir
      );
      expect(result.isValid).toBe(false);
      const hasExtensionError =
        result.validationErrors?.some(err =>
          err.includes('Invalid file extension')
        ) ?? false;
      expect(hasExtensionError).toBe(true);
    });

    it('should handle nested directories safely', async () => {
      const nestedDir = path.join(testDir, 'nested', 'deep');
      await fs.mkdir(nestedDir, { recursive: true });
      const nestedFile = path.join(nestedDir, 'persona.yaml');

      const validContent = `
id: nested-persona
name: Nested Persona
role: developer
core:
  identity: A nested persona
  primaryObjective: Testing nested
  constraints:
    - Be safe
    - Follow best practices
    - Maintain quality
behavior:
  mindset:
    - Security first
    - Quality focused
    - User-centric
  methodology:
    - Test thoroughly
    - Review carefully
    - Document clearly
    - Deploy safely
  priorities:
    - Safety
    - Quality
    - Performance
  antiPatterns:
    - Unsafe practices
    - Quick hacks
    - Skipping tests
expertise:
  domains:
    - Testing
    - Security
    - Performance
    - Development
  skills:
    - Unit testing
    - Integration testing
    - Security analysis
    - Performance optimization
decisionCriteria:
  - Is it safe?
  - Is it tested?
  - Is it maintainable?
examples:
  - "Example 1: Test nested code"
  - "Example 2: Security in depth"
tags:
  - test
  - nested
  - security
version: "1.0"
`;
      await fs.writeFile(nestedFile, validContent);

      const result = await loader.loadPersonaFromFile(
        nestedFile,
        'user',
        testDir
      );
      expect(result.isValid).toBe(true);
      expect(result.id).toBe('nested-persona');
    });
  });

  describe('discoverPersonaFiles', () => {
    it('should only discover safe YAML files', async () => {
      // Create some test files
      await fs.writeFile(path.join(testDir, 'valid1.yaml'), 'test');
      await fs.writeFile(path.join(testDir, 'valid2.yml'), 'test');
      await fs.writeFile(path.join(testDir, 'invalid.txt'), 'test');
      await fs.writeFile(path.join(testDir, 'script.js'), 'test');

      const files = await loader.discoverPersonaFiles(testDir);

      expect(files).toHaveLength(2);
      expect(files.every(f => f.endsWith('.yaml') || f.endsWith('.yml'))).toBe(
        true
      );
      expect(files.every(f => f.startsWith(testDir))).toBe(true);
    });
  });
});
