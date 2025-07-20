import { CorsOptions } from 'cors';

/**
 * Security utility for CORS configuration
 */
export class CorsSecurity {
  /**
   * Create secure CORS options
   * @param allowedOrigins List of allowed origins
   * @param enableCredentials Whether to allow credentials
   * @returns Secure CORS configuration
   */
  static createSecureCorsOptions(
    allowedOrigins?: string[],
    enableCredentials: boolean = true
  ): CorsOptions {
    // Never allow wildcard with credentials
    if (enableCredentials && (!allowedOrigins || allowedOrigins.includes('*'))) {
      throw new Error(
        'CORS configuration error: Cannot use wildcard origin (*) with credentials. ' +
        'Please specify explicit allowed origins when credentials are enabled.'
      );
    }

    // Default to localhost origins in development
    const defaultOrigins = process.env.NODE_ENV === 'production'
      ? [] // No default origins in production
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
        ];

    const origins = allowedOrigins && allowedOrigins.length > 0 
      ? allowedOrigins 
      : defaultOrigins;

    // If no origins specified in production, disable CORS
    if (process.env.NODE_ENV === 'production' && origins.length === 0) {
      return {
        origin: false, // Disable CORS
      };
    }

    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) {
          callback(null, true);
          return;
        }

        // Check if origin is in allowed list
        if (origins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
        }
      },
      credentials: enableCredentials,
      methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Mcp-Session-Id',
        'x-session-id',
      ],
      exposedHeaders: ['Mcp-Session-Id', 'x-session-id'],
      maxAge: 86400, // 24 hours
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };
  }

  /**
   * Validate origin against allowed list
   * @param origin The origin to validate
   * @param allowedOrigins List of allowed origins
   * @returns true if origin is allowed
   */
  static isOriginAllowed(origin: string | undefined, allowedOrigins: string[]): boolean {
    if (!origin) {
      return true; // Allow requests with no origin
    }

    return allowedOrigins.includes(origin);
  }

  /**
   * Normalize origin URL (remove trailing slash)
   * @param origin The origin to normalize
   * @returns Normalized origin
   */
  static normalizeOrigin(origin: string): string {
    return origin.replace(/\/$/, '');
  }

  /**
   * Parse origins from environment variable
   * @param envVar Environment variable value (comma-separated)
   * @returns Array of normalized origins
   */
  static parseOriginsFromEnv(envVar?: string): string[] {
    if (!envVar) {
      return [];
    }

    return envVar
      .split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0)
      .map(origin => this.normalizeOrigin(origin));
  }
}