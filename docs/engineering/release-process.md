# Release Process

This document outlines the process for releasing new versions of personas-mcp to the npm registry.

## Prerequisites

- [ ] Ensure you have an npm account with publishing rights
- [ ] Set up 2FA on your npm account for security
- [ ] Generate an automation token from npm
- [ ] Add the npm token to GitHub repository secrets as `NPM_TOKEN`

## Pre-Release Checklist

Before creating a release, ensure:

- [ ] All tests pass locally: `npm run test:all`
- [ ] TypeScript compilation succeeds: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Package builds successfully: `npm run build`
- [ ] CHANGELOG.md is updated with the new version's changes
- [ ] Version in package.json follows semantic versioning

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version (1.0.0): Incompatible API changes
- **MINOR** version (0.1.0): New functionality, backwards compatible
- **PATCH** version (0.0.1): Backwards compatible bug fixes

## Release Methods

### Method 1: Automated via GitHub Release (Recommended)

1. Update the version in package.json:

   ```bash
   npm version patch  # or minor/major
   ```

2. Update CHANGELOG.md:
   - Move items from "Unreleased" to the new version section
   - Add comparison link at the bottom
   - Commit these changes

3. Push changes and tags:

   ```bash
   git push origin main
   git push origin --tags
   ```

4. Create a GitHub Release:
   - Go to Releases → "Create a new release"
   - Choose the tag you just created
   - Title: `v{version}` (e.g., v0.1.0)
   - Copy the CHANGELOG entries for this version
   - Click "Publish release"

5. The GitHub Actions workflow will automatically:
   - Run all tests
   - Build the package
   - Publish to npm with provenance

### Method 2: Manual Release (Backup)

If automated release fails:

1. Ensure you're on the main branch with latest changes:

   ```bash
   git checkout main
   git pull origin main
   ```

2. Run pre-release verification:

   ```bash
   npm run test:all
   npm run typecheck
   npm run build
   ```

3. Check what will be published:

   ```bash
   npm pack --dry-run
   ```

4. Login to npm (if needed):

   ```bash
   npm login
   ```

5. Publish the package:

   ```bash
   npm publish --access public
   ```

6. Create and push the git tag:

   ```bash
   git tag v$(node -p "require('./package.json').version")
   git push origin --tags
   ```

7. Create the GitHub release manually

## Post-Release Verification

After releasing:

1. Verify the package on npmjs.com:

   ```bash
   npm view personas-mcp@latest
   ```

2. Test installation globally:

   ```bash
   npm install -g personas-mcp
   personas-mcp --version
   ```

3. Verify the GitHub release and workflow succeeded

4. Update the "Unreleased" section in CHANGELOG.md for future changes

## Troubleshooting

### Publishing fails with 403 error

- Verify your npm token is valid
- Check if the package name is available
- Ensure you have publishing permissions

### GitHub Actions workflow fails

- Check the workflow logs for specific errors
- Verify the NPM_TOKEN secret is set correctly
- Ensure all tests pass locally first

### Package is too large

- Review the .npmignore file
- Check if unnecessary files are being included
- Run `npm pack` locally to inspect contents

## Security Considerations

- Never commit npm tokens to the repository
- Use GitHub secrets for automation tokens
- Enable 2FA on npm account
- Review package contents before publishing
- Use npm provenance for supply chain security
