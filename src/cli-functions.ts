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

Environment Variables:
  CORS_ALLOWED_ORIGINS          Comma-separated list of allowed CORS origins
  METRICS_ENABLED               Enable/disable metrics (true/false)
  METRICS_ENDPOINT              OTLP metrics endpoint URL
  METRICS_HEADERS               JSON object with headers for metrics
  METRICS_INTERVAL              Metrics export interval in milliseconds

Examples:
  # Run on default port
  personas-mcp

  # Run on custom port
  personas-mcp --port 8080

  # Run without CORS
  personas-mcp --no-cors

  # Run with specific CORS origins
  CORS_ALLOWED_ORIGINS="http://localhost:3000,https://app.example.com" personas-mcp

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
  // Only use env vars if not already set by CLI args
  if (process.env.PORT && config.port === undefined) {
    config.port = parseInt(process.env.PORT, 10);
  }
  if (process.env.HOST && config.host === undefined) {
    config.host = process.env.HOST;
  }

  // Configure CORS from environment variables
  if (process.env.CORS_ALLOWED_ORIGINS) {
    config.http = {
      ...config.http,
      allowedOrigins: process.env.CORS_ALLOWED_ORIGINS
        .split(',')
        .map(origin => origin.trim())
        .filter(origin => origin.length > 0),
    };
  }

  // Configure metrics from environment variables
  if (
    process.env.METRICS_ENABLED !== undefined ||
    process.env.METRICS_ENDPOINT ||
    process.env.METRICS_HEADERS ||
    process.env.METRICS_INTERVAL
  ) {
    // Parse headers with error handling
    let headers: Record<string, string> | undefined;
    if (process.env.METRICS_HEADERS) {
      try {
        headers = JSON.parse(process.env.METRICS_HEADERS) as Record<string, string>;
      } catch (error) {
        console.error('Warning: Invalid JSON in METRICS_HEADERS environment variable:', error);
        console.error('METRICS_HEADERS will be ignored. Expected format: \'{"key": "value"}\'');
        headers = undefined;
      }
    }

    // Parse interval with validation
    let interval: number | undefined;
    if (process.env.METRICS_INTERVAL) {
      const parsedInterval = parseInt(process.env.METRICS_INTERVAL, 10);
      if (isNaN(parsedInterval) || parsedInterval <= 0) {
        console.error('Warning: Invalid METRICS_INTERVAL value:', process.env.METRICS_INTERVAL);
        console.error('METRICS_INTERVAL must be a positive number (milliseconds). Using default.');
        interval = undefined;
      } else {
        interval = parsedInterval;
      }
    }

    config.metrics = {
      enabled: process.env.METRICS_ENABLED !== 'false',
      endpoint: process.env.METRICS_ENDPOINT,
      headers,
      interval,
    };
  }

  return config;
}
