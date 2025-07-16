import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('CLI Coverage Tests', () => {
  it('should have correct shebang and imports', () => {
    // Read the CLI file to ensure it has proper structure
    const cliContent = readFileSync(join(__dirname, '../src/cli.ts'), 'utf-8');

    expect(cliContent).toContain('#!/usr/bin/env node');
    expect(cliContent).toContain(
      "import { PersonasMcpServer } from './server.js'"
    );
    expect(cliContent).toContain(
      "import { printVersion, printHelp, parseArgs } from './cli-functions.js'"
    );
  });

  it('should check for version and help flags', () => {
    const cliContent = readFileSync(join(__dirname, '../src/cli.ts'), 'utf-8');

    expect(cliContent).toContain("process.argv.includes('--version')");
    expect(cliContent).toContain("process.argv.includes('-v')");
    expect(cliContent).toContain("process.argv.includes('--help')");
    expect(cliContent).toContain('printVersion()');
    expect(cliContent).toContain('printHelp()');
    expect(cliContent).toContain('process.exit(0)');
  });

  it('should have main function with server setup', () => {
    const cliContent = readFileSync(join(__dirname, '../src/cli.ts'), 'utf-8');

    expect(cliContent).toContain('async function main()');
    expect(cliContent).toContain('parseArgs(process.argv.slice(2))');
    expect(cliContent).toContain('new PersonasMcpServer(config)');
    expect(cliContent).toContain('server.run()');
    expect(cliContent).toContain('server.shutdown()');
  });

  it('should handle signals', () => {
    const cliContent = readFileSync(join(__dirname, '../src/cli.ts'), 'utf-8');

    expect(cliContent).toContain("process.on('SIGINT'");
    expect(cliContent).toContain("process.on('SIGTERM'");
    expect(cliContent).toContain('shutting down gracefully...');
  });

  it('should check import.meta.url condition', () => {
    const cliContent = readFileSync(join(__dirname, '../src/cli.ts'), 'utf-8');

    expect(cliContent).toContain(
      'if (import.meta.url === `file://${process.argv[1]}`)'
    );
    expect(cliContent).toContain('main().catch(console.error)');
  });
});
