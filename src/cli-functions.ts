import { ServerConfig } from './server.js';
import { VERSION } from './version.js';

export function printVersion(): void {
  // eslint-disable-next-line no-console
  console.log(VERSION);
}

export function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log(`Usage: personas-mcp [options]

Options:
  -p, --port <number>           HTTP port (default: 3000)
  -h, --host <string>           HTTP host (default: localhost)
  --no-cors                     Disable CORS for HTTP transport
  -v, --version                 Show version number
  --help                        Show this help message
  --metrics-endpoint <url>      OTLP metrics endpoint
  --no-metrics                  Disable metrics collection
  --config <path>               Path to configuration file

Examples:
  # Run on default port
  personas-mcp

  # Run on custom port
  personas-mcp --port 8080

  # Run without CORS
  personas-mcp --no-cors

Persona Directories:
  Default personas:    Built-in TypeScript personas
  User personas:       ~/.ai/personas/*.yaml
  Project personas:    ./.ai/personas/*.yaml

  Project personas take precedence over user personas,
  which take precedence over default personas.`);
}

export function parseArgs(args: string[]): ServerConfig {
  const config: ServerConfig = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--port':
      case '-p':
        if (nextArg && !isNaN(parseInt(nextArg))) {
          const port = parseInt(nextArg);
          if (port < 0 || port > 65535) {
            console.error('Port must be between 0 and 65535');
            process.exit(1);
          }
          config.port = port;
          config.forceHttpMode = true; // Force HTTP mode when port is specified
          i++;
        } else {
          console.error('Invalid port number');
          process.exit(1);
        }
        break;

      case '--host':
      case '-h':
        if (nextArg) {
          config.host = nextArg;
          config.forceHttpMode = true; // Force HTTP mode when host is specified
          i++;
        } else {
          console.error('Host value required');
          process.exit(1);
        }
        break;

      case '--no-cors':
        config.http = { ...config.http, enableCors: false };
        break;

      case '--metrics-endpoint':
        if (nextArg) {
          config.metrics = { ...config.metrics, endpoint: nextArg };
          i++;
        } else {
          console.error('Metrics endpoint URL required');
          process.exit(1);
        }
        break;

      case '--no-metrics':
        config.metrics = { ...config.metrics, enabled: false };
        break;

      case '--config':
        if (nextArg) {
          console.error(
            'Failed to load configuration: --config option not implemented'
          );
          process.exit(1);
        } else {
          console.error('Configuration file path required');
          process.exit(1);
        }
        break;

      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
        break;
    }
  }

  // Check for environment variables for backward compatibility
  if (process.env.PORT) {
    config.port = parseInt(process.env.PORT, 10);
  }
  if (process.env.HOST) {
    config.host = process.env.HOST;
  }

  // Configure metrics from environment variables
  if (
    process.env.METRICS_ENABLED !== undefined ||
    process.env.METRICS_ENDPOINT ||
    process.env.METRICS_HEADERS ||
    process.env.METRICS_INTERVAL
  ) {
    config.metrics = {
      enabled: process.env.METRICS_ENABLED !== 'false',
      endpoint: process.env.METRICS_ENDPOINT,
      headers: process.env.METRICS_HEADERS
        ? (JSON.parse(process.env.METRICS_HEADERS) as Record<string, string>)
        : undefined,
      interval: process.env.METRICS_INTERVAL
        ? parseInt(process.env.METRICS_INTERVAL, 10)
        : undefined,
    };
  }

  return config;
}
