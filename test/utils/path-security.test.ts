import { describe, it, expect } from 'vitest';
import path from 'path';
import { PathSecurity } from '../../src/utils/path-security.js';
import { PathTraversalError } from '../../src/errors/index.js';

describe('PathSecurity', () => {
  const baseDir = '/home/user/personas';
  
  describe('validatePath', () => {
    it('should accept valid paths within the allowed directory', () => {
      const validPaths = [
        'test.yaml',
        'subdirectory/persona.yml',
        'deep/nested/path/file.yaml',
        './current/dir/file.yaml',
      ];
      
      for (const validPath of validPaths) {
        expect(() => PathSecurity.validatePath(validPath, baseDir)).not.toThrow();
      }
    });
    
    it('should reject paths that escape the allowed directory', () => {
      const invalidPaths = [
        '../../../etc/passwd',
        '../../secrets.yaml',
        'subdir/../../../../../../etc/shadow',
        '../outside.yaml',
      ];
      
      for (const invalidPath of invalidPaths) {
        expect(() => PathSecurity.validatePath(invalidPath, baseDir))
          .toThrow(PathTraversalError);
      }
    });
    
    it('should reject absolute paths outside the allowed directory', () => {
      // Only test paths that would actually be outside on the current platform
      const invalidPaths = process.platform === 'win32' 
        ? ['C:\\Windows\\System32\\config.yaml', 'D:\\secrets\\file.yaml']
        : ['/etc/passwd', '/home/other-user/file.yaml'];
      
      for (const invalidPath of invalidPaths) {
        expect(() => PathSecurity.validatePath(invalidPath, baseDir))
          .toThrow(PathTraversalError);
      }
    });
    
    it('should handle edge cases with dots', () => {
      // Single dot is allowed
      expect(() => PathSecurity.validatePath('.', baseDir)).not.toThrow();
      expect(() => PathSecurity.validatePath('./file.yaml', baseDir)).not.toThrow();
      
      // But not as part of a larger path with suspicious patterns
      expect(() => PathSecurity.validatePath('./../../etc/passwd', baseDir))
        .toThrow(PathTraversalError);
    });
    
    it('should reject paths with null bytes', () => {
      const maliciousPath = 'file.yaml\0.txt';
      expect(() => PathSecurity.validatePath(maliciousPath, baseDir))
        .toThrow(PathTraversalError);
    });
    
    it('should normalize paths correctly', () => {
      const messyPath = 'subdir//nested///file.yaml';
      const result = PathSecurity.validatePath(messyPath, baseDir);
      expect(result).toBe(path.join(baseDir, 'subdir', 'nested', 'file.yaml'));
    });
  });
  
  describe('isPathSafe', () => {
    it('should return true for safe paths', () => {
      expect(PathSecurity.isPathSafe('safe/path.yaml', baseDir)).toBe(true);
      expect(PathSecurity.isPathSafe('another.yml', baseDir)).toBe(true);
    });
    
    it('should return false for unsafe paths', () => {
      expect(PathSecurity.isPathSafe('../../../etc/passwd', baseDir)).toBe(false);
      expect(PathSecurity.isPathSafe('/etc/shadow', baseDir)).toBe(false);
    });
  });
  
  describe('normalizePath', () => {
    it('should normalize paths correctly', () => {
      expect(PathSecurity.normalizePath('foo//bar///baz')).toBe(path.normalize('foo/bar/baz'));
      expect(PathSecurity.normalizePath('./foo/../bar')).toBe('bar');
    });
  });
  
  describe('safeJoin', () => {
    it('should safely join path segments', () => {
      const result = PathSecurity.safeJoin(baseDir, 'subdir', 'file.yaml');
      expect(result).toBe(path.join(baseDir, 'subdir', 'file.yaml'));
    });
    
    it('should reject dangerous segments', () => {
      expect(() => PathSecurity.safeJoin(baseDir, '..', '..', 'etc', 'passwd'))
        .toThrow(PathTraversalError);
    });
  });
  
  describe('hasAllowedExtension', () => {
    const allowedExtensions = ['.yaml', '.yml'];
    
    it('should accept files with allowed extensions', () => {
      expect(PathSecurity.hasAllowedExtension('test.yaml', allowedExtensions)).toBe(true);
      expect(PathSecurity.hasAllowedExtension('persona.yml', allowedExtensions)).toBe(true);
      expect(PathSecurity.hasAllowedExtension('UPPERCASE.YAML', allowedExtensions)).toBe(true);
    });
    
    it('should reject files with disallowed extensions', () => {
      expect(PathSecurity.hasAllowedExtension('script.js', allowedExtensions)).toBe(false);
      expect(PathSecurity.hasAllowedExtension('data.json', allowedExtensions)).toBe(false);
      expect(PathSecurity.hasAllowedExtension('noextension', allowedExtensions)).toBe(false);
    });
  });
  
  describe('sanitizeFilename', () => {
    it('should remove dangerous characters from filenames', () => {
      // Our implementation replaces sequences of dots with equivalent dashes
      expect(PathSecurity.sanitizeFilename('../../etc/passwd')).toBe('------etc-passwd');
      expect(PathSecurity.sanitizeFilename('file/with/slashes')).toBe('file-with-slashes');
      expect(PathSecurity.sanitizeFilename('file\\with\\backslashes')).toBe('file-with-backslashes');
    });
    
    it('should remove control characters', () => {
      expect(PathSecurity.sanitizeFilename('file\0with\nnull')).toBe('filewithnull');
      expect(PathSecurity.sanitizeFilename('file\twith\ttabs')).toBe('filewithtabs');
    });
    
    it('should replace leading dots with dashes', () => {
      // Our implementation replaces leading dots with dashes for safety
      expect(PathSecurity.sanitizeFilename('...hidden')).toBe('---hidden');
      expect(PathSecurity.sanitizeFilename('.gitignore')).toBe('-gitignore');
    });
    
    it('should trim whitespace', () => {
      expect(PathSecurity.sanitizeFilename('  spaced  ')).toBe('spaced');
    });
  });
});