#!/usr/bin/env node

import { PersonasMcpServer } from './server.js';
import { printVersion, printHelp, parseArgs } from './cli-functions.js';

// Handle version and help flags early before server initialization
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  printVersion();
  process.exit(0);
}

if (process.argv.includes('--help')) {
  printHelp();
  process.exit(0);
}

async function main(): Promise<void> {
  const config = parseArgs(process.argv.slice(2));
  const server = new PersonasMcpServer(config);

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    console.error(`Received ${signal}, shutting down gracefully...`);
    try {
      await server.shutdown();
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  try {
    await server.run();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
