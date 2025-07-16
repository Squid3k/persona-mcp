import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { PersonaWatcher } from '../../src/loaders/persona-watcher.js';
// FSWatcher type is used implicitly through mocked chokidar

// Mock chokidar
vi.mock('chokidar', () => ({
  default: {
    watch: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      close: vi.fn().mockResolvedValue(undefined),
      getWatched: vi.fn(),
      add: vi.fn(),
      unwatch: vi.fn(),
    }),
  },
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  access: vi.fn(),
}));

// Mock path
vi.mock('path', () => ({
  default: {
    join: vi.fn((...args) => args.join('/')),
  },
  join: vi.fn((...args) => args.join('/')),
}));

describe('PersonaWatcher', () => {
  let watcher: PersonaWatcher;
  let mockConsoleError: Mock;
  let mockConsoleWarn: Mock;
  let originalConsoleError: typeof console.error;
  let originalConsoleWarn: typeof console.warn;
  let mockChokidar: any;
  let mockWatcher: any;

  beforeEach(async () => {
    watcher = new PersonaWatcher();

    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    mockConsoleError = vi.fn();
    mockConsoleWarn = vi.fn();
    console.error = mockConsoleError;
    console.warn = mockConsoleWarn;

    // Get the mocked chokidar
    mockChokidar = (await import('chokidar')).default;
    mockWatcher = {
      on: vi.fn().mockReturnThis(),
      close: vi.fn().mockResolvedValue(undefined),
      getWatched: vi.fn(),
      add: vi.fn(),
      unwatch: vi.fn(),
    };

    // Reset mocks
    vi.clearAllMocks();

    // Setup default behavior for chokidar mock
    vi.mocked(mockChokidar.watch).mockReturnValue(mockWatcher);
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe('startWatching', () => {
    it('should start watching valid directories', async () => {
      const directories = ['/valid/dir1', '/valid/dir2'];
      const callback = vi.fn();

      // Mock fs.access to succeed for all directories
      const { access } = await import('fs/promises');
      vi.mocked(access).mockResolvedValue(undefined);

      await watcher.startWatching(directories, callback);

      expect(vi.mocked(mockChokidar.watch)).toHaveBeenCalledWith(
        ['/valid/dir1/**/*.{yaml,yml}', '/valid/dir2/**/*.{yaml,yml}'],
        {
          persistent: true,
          ignoreInitial: true,
          awaitWriteFinish: {
            stabilityThreshold: 100,
            pollInterval: 50,
          },
          ignored: ['**/node_modules/**', '**/.git/**', '**/.*'],
        }
      );

      expect(mockWatcher.on).toHaveBeenCalledWith('add', expect.any(Function));
      expect(mockWatcher.on).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
      expect(mockWatcher.on).toHaveBeenCalledWith(
        'unlink',
        expect.any(Function)
      );
      expect(mockWatcher.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
      expect(mockWatcher.on).toHaveBeenCalledWith(
        'ready',
        expect.any(Function)
      );

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Watching directory /valid/dir1 for persona changes'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Watching directory /valid/dir2 for persona changes'
      );
    });

    it('should skip non-existent directories', async () => {
      const directories = ['/valid/dir', '/invalid/dir'];
      const callback = vi.fn();

      // Mock fs.access to fail for one directory
      const { access } = await import('fs/promises');
      vi.mocked(access)
        .mockResolvedValueOnce(undefined) // First directory exists
        .mockRejectedValueOnce(new Error('Directory not found')); // Second directory doesn't exist

      await watcher.startWatching(directories, callback);

      expect(vi.mocked(mockChokidar.watch)).toHaveBeenCalledWith(
        ['/valid/dir/**/*.{yaml,yml}'],
        expect.any(Object)
      );

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Watching directory /valid/dir for persona changes'
      );
      expect(mockConsoleError).not.toHaveBeenCalledWith(
        'Watching directory /invalid/dir for persona changes'
      );
    });

    it('should handle case when no directories exist', async () => {
      const directories = ['/invalid/dir1', '/invalid/dir2'];
      const callback = vi.fn();

      // Mock fs.access to fail for all directories
      const { access } = await import('fs/promises');
      vi.mocked(access).mockRejectedValue(new Error('Directory not found'));

      await watcher.startWatching(directories, callback);

      expect(vi.mocked(mockChokidar.watch)).not.toHaveBeenCalled();
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'No valid directories to watch for personas'
      );
    });

    it('should stop existing watcher before starting new one', async () => {
      const directories = ['/valid/dir'];
      const callback = vi.fn();

      const { access } = await import('fs/promises');
      vi.mocked(access).mockResolvedValue(undefined);

      // Start watching first time
      await watcher.startWatching(directories, callback);

      // Simulate ready event to make watcher active
      const readyCallback = mockWatcher.on.mock.calls.find(
        call => call[0] === 'ready'
      )?.[1];
      readyCallback?.();

      // Start watching second time (should stop first watcher)
      await watcher.startWatching(directories, callback);

      expect(mockWatcher.close).toHaveBeenCalled();
    });

    it('should handle watcher initialization failure', async () => {
      const directories = ['/valid/dir'];
      const callback = vi.fn();

      // Mock chokidar.watch to return null
      vi.mocked(mockChokidar.watch).mockReturnValueOnce(null);

      const { access } = await import('fs/promises');
      vi.mocked(access).mockResolvedValue(undefined);

      await watcher.startWatching(directories, callback);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Watcher initialization failed'
      );
    });

    it('should set isWatching to true on ready event', async () => {
      const directories = ['/valid/dir'];
      const callback = vi.fn();

      const { access } = await import('fs/promises');
      vi.mocked(access).mockResolvedValue(undefined);

      await watcher.startWatching(directories, callback);

      expect(watcher.watching).toBe(false);

      // Simulate ready event
      const readyCallback = mockWatcher.on.mock.calls.find(
        call => call[0] === 'ready'
      )?.[1];
      readyCallback?.();

      expect(watcher.watching).toBe(true);
    });

    it('should handle file events through debounced callback', async () => {
      const directories = ['/valid/dir'];
      const callback = vi.fn();

      const { access } = await import('fs/promises');
      vi.mocked(access).mockResolvedValue(undefined);

      await watcher.startWatching(directories, callback, 50);

      // Get the event handlers
      const addHandler = mockWatcher.on.mock.calls.find(
        call => call[0] === 'add'
      )?.[1];
      const changeHandler = mockWatcher.on.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      const unlinkHandler = mockWatcher.on.mock.calls.find(
        call => call[0] === 'unlink'
      )?.[1];

      expect(addHandler).toBeDefined();
      expect(changeHandler).toBeDefined();
      expect(unlinkHandler).toBeDefined();

      // Simulate file events with different file paths to avoid debounce conflicts
      addHandler?.('/test/file1.yaml');
      changeHandler?.('/test/file2.yaml');
      unlinkHandler?.('/test/file3.yaml');

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(callback).toHaveBeenCalledWith({
        type: 'add',
        filePath: '/test/file1.yaml',
      });
      expect(callback).toHaveBeenCalledWith({
        type: 'change',
        filePath: '/test/file2.yaml',
      });
      expect(callback).toHaveBeenCalledWith({
        type: 'unlink',
        filePath: '/test/file3.yaml',
      });
    });

    it('should handle error events', async () => {
      const directories = ['/valid/dir'];
      const callback = vi.fn();

      const { access } = await import('fs/promises');
      vi.mocked(access).mockResolvedValue(undefined);

      await watcher.startWatching(directories, callback);

      // Get the error handler
      const errorHandler = mockWatcher.on.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];
      expect(errorHandler).toBeDefined();

      // Simulate error event
      const testError = new Error('Test error');
      errorHandler?.(testError);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'File watcher error:',
        testError
      );
    });
  });

  describe('stopWatching', () => {
    it('should stop watching and cleanup', async () => {
      const directories = ['/valid/dir'];
      const callback = vi.fn();

      const { access } = await import('fs/promises');
      vi.mocked(access).mockResolvedValue(undefined);

      await watcher.startWatching(directories, callback);

      // Simulate ready event
      const readyCallback = mockWatcher.on.mock.calls.find(
        call => call[0] === 'ready'
      )?.[1];
      readyCallback?.();

      expect(watcher.watching).toBe(true);

      await watcher.stopWatching();

      expect(mockWatcher.close).toHaveBeenCalled();
      expect(watcher.watching).toBe(false);
    });

    it('should handle stop watching when not watching', async () => {
      await watcher.stopWatching();

      expect(mockWatcher.close).not.toHaveBeenCalled();
      expect(watcher.watching).toBe(false);
    });

    it('should clear debounced callbacks', async () => {
      const directories = ['/valid/dir'];
      const callback = vi.fn();

      const { access } = await import('fs/promises');
      vi.mocked(access).mockResolvedValue(undefined);

      await watcher.startWatching(directories, callback, 500);

      // Trigger a debounced callback
      const addHandler = mockWatcher.on.mock.calls.find(
        call => call[0] === 'add'
      )?.[1];
      addHandler?.('/test/file.yaml');

      // Stop watching before debounce completes
      await watcher.stopWatching();

      // Wait longer than debounce time
      await new Promise(resolve => setTimeout(resolve, 600));

      // Callback should not have been called since timeout was cleared
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('watching getter', () => {
    it('should return false initially', () => {
      expect(watcher.watching).toBe(false);
    });

    it('should return true when watching', async () => {
      const directories = ['/valid/dir'];
      const callback = vi.fn();

      const { access } = await import('fs/promises');
      vi.mocked(access).mockResolvedValue(undefined);

      await watcher.startWatching(directories, callback);

      // Simulate ready event
      const readyCallback = mockWatcher.on.mock.calls.find(
        call => call[0] === 'ready'
      )?.[1];
      readyCallback?.();

      expect(watcher.watching).toBe(true);
    });
  });

  describe('getWatchedPaths', () => {
    it('should return empty array when not watching', () => {
      const paths = watcher.getWatchedPaths();
      expect(paths).toEqual([]);
    });

    it('should return watched paths', async () => {
      const directories = ['/valid/dir'];
      const callback = vi.fn();

      const { access } = await import('fs/promises');
      vi.mocked(access).mockResolvedValue(undefined);

      await watcher.startWatching(directories, callback);

      // Mock getWatched return value
      mockWatcher.getWatched.mockReturnValue({
        '/valid/dir': ['file1.yaml', 'file2.yml'],
        '/another/dir': ['file3.yaml'],
      });

      const paths = watcher.getWatchedPaths();

      expect(paths).toEqual([
        '/valid/dir/file1.yaml',
        '/valid/dir/file2.yml',
        '/another/dir/file3.yaml',
      ]);
    });

    it('should handle non-array entries in getWatched', async () => {
      const directories = ['/valid/dir'];
      const callback = vi.fn();

      const { access } = await import('fs/promises');
      vi.mocked(access).mockResolvedValue(undefined);

      await watcher.startWatching(directories, callback);

      // Mock getWatched with non-array value
      mockWatcher.getWatched.mockReturnValue({
        '/valid/dir': 'not-an-array',
      });

      const paths = watcher.getWatchedPaths();

      expect(paths).toEqual([]);
    });
  });

  describe('debouncedCallback', () => {
    it('should debounce rapid callbacks', async () => {
      const directories = ['/valid/dir'];
      const callback = vi.fn();

      const { access } = await import('fs/promises');
      vi.mocked(access).mockResolvedValue(undefined);

      await watcher.startWatching(directories, callback, 100);

      const addHandler = mockWatcher.on.mock.calls.find(
        call => call[0] === 'add'
      )?.[1];

      // Trigger multiple rapid events
      addHandler?.('/test/file.yaml');
      addHandler?.('/test/file.yaml');
      addHandler?.('/test/file.yaml');

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should only be called once
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'add',
        filePath: '/test/file.yaml',
      });
    });

    it('should handle callback errors', async () => {
      const directories = ['/valid/dir'];
      const callback = vi.fn().mockRejectedValue(new Error('Callback error'));

      const { access } = await import('fs/promises');
      vi.mocked(access).mockResolvedValue(undefined);

      await watcher.startWatching(directories, callback, 50);

      const addHandler = mockWatcher.on.mock.calls.find(
        call => call[0] === 'add'
      )?.[1];
      addHandler?.('/test/file.yaml');

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error handling add event for /test/file.yaml:',
        expect.any(Error)
      );
    });
  });

  describe('addDirectory', () => {
    it('should add directory to existing watcher', async () => {
      const directories = ['/valid/dir'];
      const callback = vi.fn();

      const { access } = await import('fs/promises');
      vi.mocked(access).mockResolvedValue(undefined);

      await watcher.startWatching(directories, callback);

      // Add another directory
      await watcher.addDirectory('/new/dir');

      expect(mockWatcher.add).toHaveBeenCalledWith('/new/dir/**/*.{yaml,yml}');
    });

    it('should throw error when watcher not started', async () => {
      await expect(watcher.addDirectory('/new/dir')).rejects.toThrow(
        'Watcher not started. Call startWatching() first.'
      );
    });

    it('should handle directory access error', async () => {
      const directories = ['/valid/dir'];
      const callback = vi.fn();

      const { access } = await import('fs/promises');
      vi.mocked(access)
        .mockResolvedValueOnce(undefined) // For startWatching
        .mockRejectedValueOnce(new Error('Directory not found')); // For addDirectory

      await watcher.startWatching(directories, callback);

      await watcher.addDirectory('/invalid/dir');

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Cannot add directory to watch: /invalid/dir',
        expect.any(Error)
      );
    });
  });

  describe('removeDirectory', () => {
    it('should remove directory from watcher', async () => {
      const directories = ['/valid/dir'];
      const callback = vi.fn();

      const { access } = await import('fs/promises');
      vi.mocked(access).mockResolvedValue(undefined);

      await watcher.startWatching(directories, callback);

      watcher.removeDirectory('/valid/dir');

      expect(mockWatcher.unwatch).toHaveBeenCalledWith(
        '/valid/dir/**/*.{yaml,yml}'
      );
    });

    it('should handle remove when not watching', () => {
      watcher.removeDirectory('/some/dir');

      expect(mockWatcher.unwatch).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty directories array', async () => {
      const callback = vi.fn();

      await watcher.startWatching([], callback);

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'No valid directories to watch for personas'
      );
      expect(vi.mocked(mockChokidar.watch)).not.toHaveBeenCalled();
    });

    it('should handle synchronous callback', async () => {
      const directories = ['/valid/dir'];
      const callback = vi.fn(); // Synchronous callback

      const { access } = await import('fs/promises');
      vi.mocked(access).mockResolvedValue(undefined);

      await watcher.startWatching(directories, callback, 50);

      const addHandler = mockWatcher.on.mock.calls.find(
        call => call[0] === 'add'
      )?.[1];
      addHandler?.('/test/file.yaml');

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(callback).toHaveBeenCalledWith({
        type: 'add',
        filePath: '/test/file.yaml',
      });
    });

    it('should handle async callback', async () => {
      const directories = ['/valid/dir'];
      const callback = vi.fn().mockResolvedValue(undefined); // Async callback

      const { access } = await import('fs/promises');
      vi.mocked(access).mockResolvedValue(undefined);

      await watcher.startWatching(directories, callback, 50);

      const addHandler = mockWatcher.on.mock.calls.find(
        call => call[0] === 'add'
      )?.[1];
      addHandler?.('/test/file.yaml');

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(callback).toHaveBeenCalledWith({
        type: 'add',
        filePath: '/test/file.yaml',
      });
    });
  });
});
