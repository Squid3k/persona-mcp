import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { ValidationError } from '../errors/index.js';

/**
 * Express middleware factory for request validation
 */
export function validateRequest<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      req.body = schema.parse(req.body) as unknown;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError(error));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Express middleware factory for request parameter validation
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request params
      req.params = schema.parse(req.params) as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError(error));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Express middleware factory for query parameter validation
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse numbers in query params
      const parsedQuery: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string' && /^\d+$/.test(value)) {
          parsedQuery[key] = parseInt(value, 10);
        } else if (typeof value === 'string' && /^\d+\.\d+$/.test(value)) {
          parsedQuery[key] = parseFloat(value);
        } else {
          parsedQuery[key] = value;
        }
      }

      // Validate query params
      req.query = schema.parse(parsedQuery) as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError(error));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Combined validation middleware for body, params, and query
 */
export interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate body if schema provided
      if (schemas.body) {
        req.body = (await schemas.body.parseAsync(req.body)) as unknown;
      }

      // Validate params if schema provided
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(
          req.params
        )) as typeof req.params;
      }

      // Validate query if schema provided
      if (schemas.query) {
        // Parse numbers in query params
        const parsedQuery: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(req.query)) {
          if (typeof value === 'string' && /^\d+$/.test(value)) {
            parsedQuery[key] = parseInt(value, 10);
          } else if (typeof value === 'string' && /^\d+\.\d+$/.test(value)) {
            parsedQuery[key] = parseFloat(value);
          } else {
            parsedQuery[key] = value;
          }
        }

        req.query = (await schemas.query.parseAsync(
          parsedQuery
        )) as typeof req.query;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError(error));
      } else {
        next(error);
      }
    }
  };
}
