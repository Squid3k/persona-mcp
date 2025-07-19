#!/usr/bin/env node

/**
 * Script to update version in both package.json and src/version.ts
 * Usage: node scripts/update-version.js [version]
 * If no version is provided, it reads from package.json
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const versionTsPath = path.join(__dirname, '..', 'src', 'version.ts');

function updateVersion(newVersion) {
  // If no version provided, read from package.json
  if (!newVersion) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    newVersion = packageJson.version;
    console.log(`Syncing version from package.json: ${newVersion}`);
  } else {
    // Update package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`Updated package.json to version ${newVersion}`);
  }

  // Update src/version.ts
  const versionContent = `// This file is auto-generated or manually updated when version changes
export const VERSION = '${newVersion}';
`;
  fs.writeFileSync(versionTsPath, versionContent);
  console.log(`Updated src/version.ts to version ${newVersion}`);
}

// Main execution
const newVersion = process.argv[2];

try {
  updateVersion(newVersion);
  console.log('✅ Version update complete!');
} catch (error) {
  console.error('❌ Error updating version:', error.message);
  process.exit(1);
}