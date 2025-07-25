#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Extract Mermaid diagrams from a markdown file
 * @param {string} content - Markdown content
 * @returns {Array<{code: string, line: number}>} Array of Mermaid diagrams with line numbers
 */
function extractMermaidDiagrams(content) {
  const diagrams = [];
  const lines = content.split('\n');
  let inMermaidBlock = false;
  let currentDiagram = [];
  let startLine = 0;

  lines.forEach((line, index) => {
    if (line.trim() === '```mermaid') {
      inMermaidBlock = true;
      startLine = index + 1;
      currentDiagram = [];
    } else if (inMermaidBlock && line.trim() === '```') {
      inMermaidBlock = false;
      if (currentDiagram.length > 0) {
        diagrams.push({
          code: currentDiagram.join('\n'),
          line: startLine
        });
      }
    } else if (inMermaidBlock) {
      currentDiagram.push(line);
    }
  });

  return diagrams;
}

/**
 * Validate a single Mermaid diagram
 * @param {string} diagram - Mermaid diagram code
 * @param {string} tempFile - Temporary file path
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
async function validateDiagram(diagram, tempFile) {
  try {
    // Write diagram to temp file
    await fs.writeFile(tempFile, diagram);
    
    // Try to render with mermaid-cli
    const { stderr } = await execAsync(
      `npx @mermaid-js/mermaid-cli -i ${tempFile} -o ${tempFile}.svg 2>&1`,
      { timeout: 10000 }
    );
    
    // Clean up output file
    try {
      await fs.unlink(`${tempFile}.svg`);
    } catch {}
    
    // Check for errors in stderr
    if (stderr && stderr.includes('error')) {
      return { valid: false, error: stderr };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Validate all Mermaid diagrams in a markdown file
 * @param {string} filePath - Path to markdown file
 * @returns {Promise<{file: string, results: Array}>}
 */
async function validateMarkdownFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const diagrams = extractMermaidDiagrams(content);
  const results = [];
  
  for (let i = 0; i < diagrams.length; i++) {
    const tempFile = path.join(path.dirname(filePath), `.temp-mermaid-${i}.mmd`);
    const result = await validateDiagram(diagrams[i].code, tempFile);
    
    results.push({
      index: i + 1,
      line: diagrams[i].line,
      valid: result.valid,
      error: result.error
    });
    
    // Clean up temp file
    try {
      await fs.unlink(tempFile);
    } catch {}
  }
  
  return { file: filePath, results };
}

/**
 * Find all markdown files in a directory
 * @param {string} dir - Directory path
 * @returns {Promise<string[]>} Array of markdown file paths
 */
async function findMarkdownFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...await findMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Main validation function
 */
async function main() {
  const args = process.argv.slice(2);
  let targetPath = args[0] || process.cwd();
  
  // Resolve to absolute path
  if (!path.isAbsolute(targetPath)) {
    targetPath = path.resolve(process.cwd(), targetPath);
  }
  
  console.log(`Validating Mermaid diagrams in: ${targetPath}\n`);
  
  try {
    const stats = await fs.stat(targetPath);
    let files = [];
    
    if (stats.isDirectory()) {
      files = await findMarkdownFiles(targetPath);
    } else if (stats.isFile() && targetPath.endsWith('.md')) {
      files = [targetPath];
    } else {
      console.error('Error: Target must be a markdown file or directory');
      process.exit(1);
    }
    
    if (files.length === 0) {
      console.log('No markdown files found.');
      return;
    }
    
    console.log(`Found ${files.length} markdown file(s)\n`);
    
    let totalDiagrams = 0;
    let totalErrors = 0;
    
    for (const file of files) {
      const { results } = await validateMarkdownFile(file);
      
      if (results.length > 0) {
        const relativePath = path.relative(process.cwd(), file);
        console.log(`📄 ${relativePath}`);
        
        for (const result of results) {
          totalDiagrams++;
          if (result.valid) {
            console.log(`  ✅ Diagram #${result.index} at line ${result.line}: Valid`);
          } else {
            totalErrors++;
            console.log(`  ❌ Diagram #${result.index} at line ${result.line}: Invalid`);
            if (result.error) {
              console.log(`     Error: ${result.error.split('\n')[0]}`);
            }
          }
        }
        console.log('');
      }
    }
    
    console.log(`\n📊 Summary: ${totalDiagrams} diagram(s) found, ${totalErrors} error(s)`);
    
    if (totalErrors > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { extractMermaidDiagrams, validateDiagram, validateMarkdownFile };