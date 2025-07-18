import chokidar, { type FSWatcher } from 'chokidar';
import path from 'path';
/**
 * Error thrown when watcher operations are performed without starting the watcher
 */
export class WatcherNotStartedError extends Error {
  constructor() {
    super('Watcher not started. Call startWatching() first.');
    this.name = 'WatcherNotStartedError';
  }
}

export interface WatchEvent {
  type: 'add' | 'change' | 'unlink';
  filePath: string;
}

export type WatchCallback = (event: WatchEvent) => void | Promise<void>;

export class PersonaWatcher {
  private watcher: FSWatcher | null = null;
  private debounceMap = new Map<string, NodeJS.Timeout>();
  private isWatching = false;
  private watchedDirectories: string[] = [];

  /**
   * Start watching directories for YAML file changes
   */
  async startWatching(
    directories: string[],
    callback: WatchCallback,
    debounceMs: number = 150
  ): Promise<void> {
    if (this.isWatching) {
      await this.stopWatching();
    }

    // Filter out directories that don't exist
    const existingDirectories: string[] = [];
    for (const dir of directories) {
      try {
        const { access } = await import('fs/promises');
        await access(dir);
        existingDirectories.push(dir);
      } catch {
        // Directory doesn't exist, skip it
      }
    }

    if (existingDirectories.length === 0) {
      console.warn('No valid directories to watch for personas');
      return;
    }

    // Store the directories we're watching
    this.watchedDirectories = existingDirectories;

    // Log each directory being watched
    for (const dir of this.watchedDirectories) {
      console.error(`Watching directory ${dir} for persona changes`);
    }

    // Create watch patterns for YAML files
    const patterns = this.watchedDirectories.map(dir =>
      path.join(dir, '**/*.{yaml,yml}')
    );

    this.watcher = chokidar.watch(patterns, {
      persistent: true,
      ignoreInitial: true, // Don't trigger events for existing files
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.*', // Hidden files
      ],
    });

    if (!this.watcher) {
      console.error('Watcher initialization failed');
      return;
    }

    this.watcher
      .on('add', (filePath: string) =>
        this.debouncedCallback('add', filePath, callback, debounceMs)
      )
      .on('change', (filePath: string) =>
        this.debouncedCallback('change', filePath, callback, debounceMs)
      )
      .on('unlink', (filePath: string) =>
        this.debouncedCallback('unlink', filePath, callback, debounceMs)
      )
      .on('error', (error: unknown) =>
        console.error('File watcher error:', error)
      )
      .on('ready', () => {
        this.isWatching = true;
      });
  }

  /**
   * Stop watching for file changes
   */
  async stopWatching(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    // Clear any pending debounced callbacks
    for (const timeout of this.debounceMap.values()) {
      clearTimeout(timeout);
    }
    this.debounceMap.clear();
    this.isWatching = false;
    this.watchedDirectories = [];
  }

  /**
   * Check if currently watching
   */
  get watching(): boolean {
    return this.isWatching;
  }

  /**
   * Get list of watched paths
   */
  getWatchedPaths(): string[] {
    if (!this.watcher) {
      return [];
    }
    const watched = this.watcher.getWatched();
    const paths: string[] = [];
    for (const [dir, files] of Object.entries(watched)) {
      if (Array.isArray(files)) {
        for (const file of files) {
          paths.push(path.join(dir, file));
        }
      }
    }
    return paths;
  }

  /**
   * Debounced callback to prevent rapid-fire events
   */
  private debouncedCallback(
    eventType: WatchEvent['type'],
    filePath: string,
    callback: WatchCallback,
    debounceMs: number
  ): void {
    // Clear existing timeout for this file
    const existingTimeout = this.debounceMap.get(filePath);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      void (async () => {
        try {
          await callback({
            type: eventType,
            filePath,
          });
        } catch (error) {
          console.error(
            `Error handling ${eventType} event for ${filePath}:`,
            error
          );
        } finally {
          this.debounceMap.delete(filePath);
        }
      })();
    }, debounceMs);

    this.debounceMap.set(filePath, timeout);
  }

  /**
   * Add a directory to watch (if not already watching)
   */
  async addDirectory(directory: string): Promise<void> {
    if (!this.watcher) {
      throw new WatcherNotStartedError();
    }

    try {
      const { access } = await import('fs/promises');
      await access(directory);
      const pattern = path.join(directory, '**/*.{yaml,yml}');
      this.watcher.add(pattern);
    } catch (error) {
      console.warn(`Cannot add directory to watch: ${directory}`, error);
    }
  }

  /**
   * Remove a directory from watching
   */
  removeDirectory(directory: string): void {
    if (!this.watcher) {
      return;
    }

    const pattern = path.join(directory, '**/*.{yaml,yml}');
    this.watcher.unwatch(pattern);
  }
}
