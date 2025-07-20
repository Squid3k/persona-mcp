import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PersonaLoader } from '../../src/loaders/persona-loader.js';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

describe('PersonaLoader File Limits', () => {
  let loader: PersonaLoader;
  let testDir: string;
  
  beforeEach(async () => {
    loader = new PersonaLoader();
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `persona-limit-test-${Date.now()}`);
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
  
  const validPersonaContent = `
id: test-persona
name: Test Persona
role: developer
core:
  identity: A test persona
  primaryObjective: Testing
  constraints:
    - Be safe
    - Write clean code
    - Follow best practices
behavior:
  mindset:
    - Security first
    - Test driven development
    - Code quality matters
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
    - Development
    - Security
    - Performance
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
  - "Example 2: Review before merge"
tags:
  - test
  - development
  - security
version: "1.0"
`;

  describe('File Size Limits', () => {
    it('should reject files exceeding size limit', async () => {
      const largeContent = validPersonaContent + '\n# Extra content\n'.repeat(50000);
      const largePath = path.join(testDir, 'large.yaml');
      await fs.writeFile(largePath, largeContent);
      
      // Try to load with 1KB limit
      const result = await loader.loadPersonaFromFile(largePath, 'user', testDir, 1024);
      
      expect(result.isValid).toBe(false);
      expect(result.validationErrors?.[0]).toContain('exceeds maximum allowed size');
    });
    
    it('should accept files within size limit', async () => {
      const smallPath = path.join(testDir, 'small.yaml');
      await fs.writeFile(smallPath, validPersonaContent);
      
      // Load with default limit (1MB)
      const result = await loader.loadPersonaFromFile(smallPath, 'user', testDir);
      
      expect(result.isValid).toBe(true);
    });
    
    it('should use custom size limit when provided', async () => {
      const mediumContent = validPersonaContent + '\n# Extra\n'.repeat(100);
      const mediumPath = path.join(testDir, 'medium.yaml');
      await fs.writeFile(mediumPath, mediumContent);
      
      const stats = await fs.stat(mediumPath);
      const fileSize = stats.size;
      
      // Should fail with limit just below file size
      const result1 = await loader.loadPersonaFromFile(mediumPath, 'user', testDir, fileSize - 10);
      expect(result1.isValid).toBe(false);
      
      // Should succeed with limit just above file size
      const result2 = await loader.loadPersonaFromFile(mediumPath, 'user', testDir, fileSize + 10);
      expect(result2.isValid).toBe(true);
    });
  });
  
  describe('File Count Limits', () => {
    it('should limit files per directory', async () => {
      // Create 10 persona files
      for (let i = 0; i < 10; i++) {
        const content = validPersonaContent.replace('test-persona', `persona-${i}`);
        await fs.writeFile(path.join(testDir, `persona-${i}.yaml`), content);
      }
      
      // Discover with limit of 5
      const files = await loader.discoverPersonaFiles(testDir, 5);
      expect(files).toHaveLength(5);
    });
    
    it('should respect maxFilesPerDirectory in loadPersonasFromDirectory', async () => {
      // Create 10 persona files
      for (let i = 0; i < 10; i++) {
        const content = validPersonaContent.replace('test-persona', `persona-${i}`);
        await fs.writeFile(path.join(testDir, `persona-${i}.yaml`), content);
      }
      
      const limits = {
        maxFilesPerDirectory: 3,
      };
      
      const personas = await loader.loadPersonasFromDirectory(testDir, 'user', limits);
      expect(personas.filter(p => p.isValid)).toHaveLength(3);
    });
    
    it('should track total file count across directories', async () => {
      // Reset counter
      loader.resetFileCount();
      
      // Create first directory with 5 files
      const dir1 = path.join(testDir, 'dir1');
      await fs.mkdir(dir1, { recursive: true });
      for (let i = 0; i < 5; i++) {
        const content = validPersonaContent.replace('test-persona', `persona1-${i}`);
        await fs.writeFile(path.join(dir1, `persona-${i}.yaml`), content);
      }
      
      // Create second directory with 5 files
      const dir2 = path.join(testDir, 'dir2');
      await fs.mkdir(dir2, { recursive: true });
      for (let i = 0; i < 5; i++) {
        const content = validPersonaContent.replace('test-persona', `persona2-${i}`);
        await fs.writeFile(path.join(dir2, `persona-${i}.yaml`), content);
      }
      
      const limits = {
        maxTotalFiles: 7,
      };
      
      // Load from first directory
      const personas1 = await loader.loadPersonasFromDirectory(dir1, 'user', limits);
      expect(personas1.filter(p => p.isValid)).toHaveLength(5);
      
      // Load from second directory - should only get 2 more due to total limit
      const personas2 = await loader.loadPersonasFromDirectory(dir2, 'user', limits);
      expect(personas2.filter(p => p.isValid)).toHaveLength(2);
    });
    
    it('should skip directory when total limit reached', async () => {
      loader.resetFileCount();
      
      // Create directory with files
      for (let i = 0; i < 5; i++) {
        const content = validPersonaContent.replace('test-persona', `persona-${i}`);
        await fs.writeFile(path.join(testDir, `persona-${i}.yaml`), content);
      }
      
      // First load with limit of 3
      const limits = { maxTotalFiles: 3 };
      const personas1 = await loader.loadPersonasFromDirectory(testDir, 'user', limits);
      expect(personas1.filter(p => p.isValid)).toHaveLength(3);
      
      // Second load should return empty array
      const personas2 = await loader.loadPersonasFromDirectory(testDir, 'user', limits);
      expect(personas2).toHaveLength(0);
    });
    
    it('should handle combined limits correctly', async () => {
      loader.resetFileCount();
      
      // Create 10 files
      for (let i = 0; i < 10; i++) {
        const content = validPersonaContent.replace('test-persona', `persona-${i}`);
        await fs.writeFile(path.join(testDir, `persona-${i}.yaml`), content);
      }
      
      const limits = {
        maxFilesPerDirectory: 5,
        maxTotalFiles: 3,
        maxFileSize: 10 * 1024, // 10KB
      };
      
      // Should be limited by maxTotalFiles (3) not maxFilesPerDirectory (5)
      const personas = await loader.loadPersonasFromDirectory(testDir, 'user', limits);
      expect(personas.filter(p => p.isValid)).toHaveLength(3);
    });
  });
  
  describe('resetFileCount', () => {
    it('should reset the file counter', async () => {
      loader.resetFileCount();
      
      // Create files
      for (let i = 0; i < 3; i++) {
        const content = validPersonaContent.replace('test-persona', `persona-${i}`);
        await fs.writeFile(path.join(testDir, `persona-${i}.yaml`), content);
      }
      
      const limits = { maxTotalFiles: 2 };
      
      // First load
      const personas1 = await loader.loadPersonasFromDirectory(testDir, 'user', limits);
      expect(personas1.filter(p => p.isValid)).toHaveLength(2);
      
      // Should fail without reset
      const personas2 = await loader.loadPersonasFromDirectory(testDir, 'user', limits);
      expect(personas2).toHaveLength(0);
      
      // Reset and try again
      loader.resetFileCount();
      const personas3 = await loader.loadPersonasFromDirectory(testDir, 'user', limits);
      expect(personas3.filter(p => p.isValid)).toHaveLength(2);
    });
  });
});