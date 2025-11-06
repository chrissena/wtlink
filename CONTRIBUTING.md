# Contributing to wtlink

Thank you for your interest in contributing to wtlink! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, constructive, and professional in all interactions.

## How to Contribute

### Reporting Bugs

Before creating a bug report:
- Check the [existing issues](https://github.com/chrissena/wtlink/issues) to avoid duplicates
- Collect relevant information (OS, Node version, command output, error messages)

When creating a bug report, include:
- **Clear title** describing the issue
- **Steps to reproduce** the problem
- **Expected behavior** vs actual behavior
- **Environment details** (OS, Node.js version, wtlink version)
- **Error messages** and stack traces (if applicable)
- **Screenshots** (if relevant)

### Suggesting Features

Feature requests are welcome! Please:
- Check existing issues to avoid duplicates
- Clearly describe the feature and its benefits
- Provide use cases and examples
- Consider implementation complexity

### Pull Requests

#### Before You Start

1. **Open an issue first** for major changes to discuss the approach
2. **Check existing PRs** to avoid duplicate work
3. **Understand the codebase** - read ARCHITECTURE.md

#### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/wtlink.git
cd wtlink

# Install dependencies
npm install

# Build the project
npm run build

# Link for global testing
npm link

# Run tests
npm test

# Watch mode for development
npm run watch
```

#### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Write code following the existing style**:
   - TypeScript for all source code
   - Use existing patterns (signals, pure functions)
   - Add JSDoc comments for public APIs
   - Follow reactive architecture principles (see ARCHITECTURE.md)

3. **Write tests**:
   - Add tests for all new functionality
   - Maintain 80%+ code coverage
   - Use Jest and mock external dependencies
   - Test edge cases and error conditions

4. **Update documentation**:
   - Update README.md if adding features
   - Update CHANGELOG.md (Unreleased section)
   - Update ARCHITECTURE.md if changing design
   - Add inline comments for complex logic

5. **Test your changes**:
   ```bash
   npm test              # Run all tests
   npm run test:coverage # Check coverage
   npm run build         # Ensure it builds
   wtlink               # Test the CLI
   ```

6. **Commit with conventional commits**:
   ```bash
   git commit -m "feat: add support for symbolic link targets"
   git commit -m "fix: resolve path resolution on Windows"
   git commit -m "docs: update README with new examples"
   ```

   **Commit types**:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation only
   - `style:` - Code style (formatting, no logic change)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

7. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a pull request on GitHub.

#### Pull Request Guidelines

Your PR should:
- **Have a clear title and description**
- **Reference related issues** (e.g., "Fixes #123")
- **Include tests** for new functionality
- **Maintain or improve** code coverage
- **Pass all CI checks**
- **Update documentation** as needed
- **Follow the existing code style**

### Testing Guidelines

#### Unit Tests

- Test pure functions in isolation
- Mock external dependencies (fs, child_process, inquirer)
- Test both success and error cases
- Use descriptive test names

Example:
```typescript
describe('getMainWorktreeRoot', () => {
  it('should return main worktree path when in linked worktree', () => {
    // Arrange
    mockedSpawnSync.mockReturnValue({
      stdout: '.git/worktrees/feature',
      status: 0
    });

    // Act
    const result = getMainWorktreeRoot();

    // Assert
    expect(result).toBe('/path/to/main');
  });
});
```

#### Integration Tests

- Test full command flows
- Use real file system operations (temp directories)
- Test with actual git repositories
- Cleanup after tests

#### Coverage Goals

- Overall: 80%+ coverage
- New code: 90%+ coverage
- Critical paths: 100% coverage

Run `npm run test:coverage` to check coverage.

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Run `npm run format` (Prettier)
- **Linting**: Run `npm run lint` (ESLint)
- **Naming**:
  - camelCase for functions and variables
  - PascalCase for types and interfaces
  - UPPER_CASE for constants
- **File structure**:
  - One main export per file
  - Pure functions separate from side effects
  - Co-locate tests with source (`*.test.ts`)

### Architecture Guidelines

wtlink uses a reactive architecture with signals. Key principles:

1. **Pure functions** for business logic
2. **Signals** for reactive state
3. **Immutable data** - always create new objects
4. **Single source of truth** - computed values, not duplicated state
5. **Separation of concerns** - UI, state, and side effects separate

See [ARCHITECTURE.md](ARCHITECTURE.md) for details.

### Release Process

(For maintainers only)

1. Update version in package.json (semver)
2. Update CHANGELOG.md
3. Commit: `git commit -m "chore: release v2.1.0"`
4. Tag: `git tag v2.1.0`
5. Push: `git push && git push --tags`
6. Publish: `npm publish`
7. Create GitHub release with changelog

## Questions?

- Open an issue for questions
- Check [README.md](README.md) for usage documentation
- Read [ARCHITECTURE.md](ARCHITECTURE.md) for design details

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
