import { BaseError } from './base.js';

/**
 * Error thrown when MCP transport is not initialized
 */
export class TransportNotInitializedError extends BaseError {
  constructor(transportType: 'HTTP' | 'Stdio') {
    super(
      `${transportType} transport not initialized`,
      'TRANSPORT_NOT_INITIALIZED',
      503
    );
    this.name = 'TransportNotInitializedError';
  }
}

/**
 * Error thrown when prompt name is invalid
 */
export class InvalidPromptNameError extends BaseError {
  constructor(promptName: string) {
    super(
      `Invalid prompt name: ${promptName}. Expected format: adopt-persona-[id]`,
      'INVALID_PROMPT_NAME',
      400
    );
    this.name = 'InvalidPromptNameError';
  }
}

/**
 * Error thrown when MCP server initialization fails
 */
export class ServerInitializationError extends BaseError {
  constructor(reason: string, originalError?: Error) {
    super(
      `Failed to initialize MCP server: ${reason}`,
      'SERVER_INITIALIZATION_ERROR',
      500,
      false // Not operational - requires restart
    );
    this.name = 'ServerInitializationError';
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * Error thrown when server shutdown fails
 */
export class ServerShutdownError extends BaseError {
  constructor(component: string, originalError?: Error) {
    super(
      `Error shutting down ${component}: ${originalError?.message || 'Unknown error'}`,
      'SERVER_SHUTDOWN_ERROR',
      500,
      false
    );
    this.name = 'ServerShutdownError';
  }
}

/**
 * Error thrown when tool is not found
 */
export class ToolNotFoundError extends BaseError {
  constructor(toolName: string) {
    super(
      `Unknown tool: ${toolName}`,
      'TOOL_NOT_FOUND',
      404
    );
    this.name = 'ToolNotFoundError';
  }
}

/**
 * Error thrown when resource request is invalid
 */
export class InvalidResourceRequestError extends BaseError {
  constructor(message: string) {
    super(
      message,
      'INVALID_RESOURCE_REQUEST',
      400
    );
    this.name = 'InvalidResourceRequestError';
  }
}