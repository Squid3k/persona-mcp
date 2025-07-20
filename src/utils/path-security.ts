import path from 'path';
import { PathTraversalError } from '../errors/index.js';

/**
 * Security utility for validating and normalizing file paths
 */
export class PathSecurity {
  /**
   * Validate that a file path stays within the allowed directory
   * @param filePath The file path to validate
   * @param allowedDirectory The directory that the file must be within
   * @returns The normalized absolute path
   * @throws PathTraversalError if the path escapes the allowed directory
   */
  static validatePath(filePath: string, allowedDirectory: string): string {
    // Normalize and resolve to absolute paths
    const normalizedBase = path.resolve(allowedDirectory);
    const normalizedPath = path.resolve(allowedDirectory, filePath);
    
    // Check if the resolved path starts with the allowed directory
    if (!normalizedPath.startsWith(normalizedBase + path.sep) && 
        normalizedPath !== normalizedBase) {
      throw new PathTraversalError(
        `Path traversal attempt detected: ${filePath} would escape ${allowedDirectory}`
      );
    }
    
    // Additional checks for common path traversal patterns
    const segments = filePath.split(/[/\\]/);
    for (const segment of segments) {
      // Check for dangerous segments
      if (segment === '..') {
        throw new PathTraversalError(
          `Suspicious path segment detected: ${segment}`
        );
      }
      
      // Check for null bytes or other dangerous characters
      if (segment.includes('\0')) {
        throw new PathTraversalError(
          'Null byte injection attempt detected'
        );
      }
    }
    
    return normalizedPath;
  }
  
  /**
   * Check if a path is safe (no traversal attempts) without throwing
   * @param filePath The file path to check
   * @param allowedDirectory The directory that the file must be within
   * @returns true if the path is safe, false otherwise
   */
  static isPathSafe(filePath: string, allowedDirectory: string): boolean {
    try {
      this.validatePath(filePath, allowedDirectory);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Normalize a file path for consistent comparison
   * @param filePath The file path to normalize
   * @returns The normalized path
   */
  static normalizePath(filePath: string): string {
    return path.normalize(filePath);
  }
  
  /**
   * Join path segments safely
   * @param base The base directory
   * @param segments Path segments to join
   * @returns The safely joined path
   */
  static safeJoin(base: string, ...segments: string[]): string {
    // First join the segments
    const joined = path.join(base, ...segments);
    
    // Then validate the result stays within base
    return this.validatePath(joined, base);
  }
  
  /**
   * Check if a file has an allowed extension
   * @param filePath The file path to check
   * @param allowedExtensions Array of allowed extensions (including the dot)
   * @returns true if the extension is allowed
   */
  static hasAllowedExtension(filePath: string, allowedExtensions: string[]): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return allowedExtensions.includes(ext);
  }
  
  /**
   * Sanitize a filename by removing dangerous characters
   * @param filename The filename to sanitize
   * @returns The sanitized filename
   */
  static sanitizeFilename(filename: string): string {
    // Remove path separators and other dangerous characters
    return filename
      .replace(/[/\\]/g, '-')  // Replace path separators
      .replace(/\.{2,}/g, match => '-'.repeat(match.length))   // Replace sequences of dots with dashes
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1f]/g, '') // Remove control characters
      .replace(/^\.+/, match => '-'.repeat(match.length))     // Replace leading dots with dashes
      .trim();
  }
}