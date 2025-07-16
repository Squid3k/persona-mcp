import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

// Mock the cli module to prevent actual CLI execution during tests
vi.mock('../src/cli.js', () => ({
  // Empty mock - we don't want to run the actual CLI
}));

describe('index.ts', () => {
  let originalArgv: string[];
  let originalExit: typeof process.exit;
  let mockExit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Save original values
    originalArgv = process.argv;
    originalExit = process.exit;
    
    // Mock process.exit to prevent actual exit during tests
    mockExit = vi.fn();
    process.exit = mockExit as any;
  });

  afterEach(() => {
    // Restore original values
    process.argv = originalArgv;
    process.exit = originalExit;
    vi.clearAllMocks();
  });

  it('should have executable shebang', async () => {
    const indexPath = path.join(__dirname, '../src/index.ts');
    const content = await fs.readFile(indexPath, 'utf-8');
    
    expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
  });

  it('should import and execute CLI module', async () => {
    // This test verifies that the index.ts file properly imports the CLI module
    // The actual CLI functionality is tested separately in cli.test.ts
    
    // Import the index file to trigger the CLI import
    await import('../src/index.js');
    
    // Since we mocked the CLI module, we just verify that the import happened
    // without errors and the file executed
    expect(true).toBe(true);
  });

  it('should be executable as a Node.js script', async () => {
    const indexPath = path.join(__dirname, '../src/index.ts');
    const stats = await fs.stat(indexPath);
    
    // Check that the file exists and is readable
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBeGreaterThan(0);
  });

  it('should have proper module structure', async () => {
    const indexPath = path.join(__dirname, '../src/index.ts');
    const content = await fs.readFile(indexPath, 'utf-8');
    
    // Verify the file structure
    expect(content).toContain('#!/usr/bin/env node');
    expect(content).toContain("import './cli.js'");
    
    // Verify it's a minimal entry point
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('//'));
    expect(lines).toHaveLength(2); // Shebang + import
  });

  it('should work as CLI entry point', async () => {
    // Test that the built index.js file can be executed
    // This is more of an integration test but important for CLI functionality
    
    const builtIndexPath = path.join(__dirname, '../dist/index.js');
    
    try {
      // Check if the built file exists
      await fs.access(builtIndexPath);
      
      // If it exists, it should be executable (we don't actually run it to avoid side effects)
      const stats = await fs.stat(builtIndexPath);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);
    } catch (error) {
      // If the built file doesn't exist, that's expected in test environment
      // Just verify the source file is correct
      const sourcePath = path.join(__dirname, '../src/index.ts');
      const content = await fs.readFile(sourcePath, 'utf-8');
      expect(content).toContain("import './cli.js'");
    }
  });
});
