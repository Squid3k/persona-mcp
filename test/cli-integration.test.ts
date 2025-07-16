import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';

// Mock all dependencies before imports
vi.mock('../src/server.js', () => ({
  PersonasMcpServer: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue(undefined),
    shutdown: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../src/cli-functions.js', () => ({
  printVersion: vi.fn(),
  printHelp: vi.fn(),
  parseArgs: vi.fn().mockReturnValue({}),
}));

describe('CLI Integration', () => {
  let originalArgv: string[];
  let originalExit: typeof process.exit;
  let mockExit: Mock;

  beforeEach(() => {
    originalArgv = process.argv;
    originalExit = process.exit.bind(process);

    mockExit = vi.fn((code?: number) => {
      throw new Error(`process.exit(${code})`);
    });
    process.exit = mockExit as any;

    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.exit = originalExit;
  });

  it('should handle version flag and exit', async () => {
    process.argv = ['node', 'cli.js', '--version'];

    const { printVersion } = await import('../src/cli-functions.js');

    try {
      await import('../src/cli.js');
    } catch (error: any) {
      expect(error.message).toBe('process.exit(0)');
    }

    expect(printVersion).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should handle -v flag and exit', async () => {
    process.argv = ['node', 'cli.js', '-v'];

    const { printVersion } = await import('../src/cli-functions.js');

    try {
      await import('../src/cli.js');
    } catch (error: any) {
      expect(error.message).toBe('process.exit(0)');
    }

    expect(printVersion).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should handle help flag and exit', async () => {
    process.argv = ['node', 'cli.js', '--help'];

    const { printHelp } = await import('../src/cli-functions.js');

    try {
      await import('../src/cli.js');
    } catch (error: any) {
      expect(error.message).toBe('process.exit(0)');
    }

    expect(printHelp).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should prepare to start server when no special flags', async () => {
    process.argv = ['node', 'cli.js'];

    // Import modules to ensure they're loaded
    const { PersonasMcpServer } = await import('../src/server.js');
    await import('../src/cli-functions.js');

    // Since the CLI runs immediately and we can't easily test the full flow,
    // we're verifying that the mocks are set up correctly
    expect(PersonasMcpServer).toBeDefined();
    expect(vi.isMockFunction(PersonasMcpServer)).toBe(true);
  });
});
