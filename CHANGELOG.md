## [3.0.1](https://github.com/chrissena/wtlink/compare/v3.0.0...v3.0.1) (2025-11-06)


### Bug Fixes

* clarify v3.0.0 breaking change affects release process only ([9797fd5](https://github.com/chrissena/wtlink/commit/9797fd50c664b7fec66b023219e090c9a4a8e7f3))

# [3.0.0](https://github.com/chrissena/wtlink/compare/v2.0.0...v3.0.0) (2025-11-06)


### Bug Fixes

* downgrade semantic-release to v24 for Node 20 compatibility ([e71e085](https://github.com/chrissena/wtlink/commit/e71e08551b78040fd9c7e84dc004d1678dd7f7d4))
* update Node version requirements and workflow permissions ([cf58883](https://github.com/chrissena/wtlink/commit/cf5888352c368245022fb1b2d37d1d9cd74edb13))


### Features

* add automatic semantic versioning and releases ([464eb26](https://github.com/chrissena/wtlink/commit/464eb26d92fb90586154365037b1f548cd5ce00d))


### BREAKING CHANGES

* **Release process only**: All future releases will be automated using semantic-release. Manual version bumps in package.json are no longer needed.

**Important**: This breaking change affects the **project's release workflow**, not the user-facing CLI or API. All commands and features work exactly the same as v2.0.0.

**For end users**: ✅ No migration needed - you can safely upgrade from v2.0.0 to v3.0.0 with no changes.

**For maintainers/contributors**: The release process has changed:
- Versions are now determined automatically from conventional commit messages
- CHANGELOG.md is auto-generated
- Publishing to npm happens automatically on push to main
- Manual version bumps would be overwritten by the automated system

See README.md "Releases & Versioning" section for details on the new workflow.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-06

### Breaking Changes

- **Manifest filename changed** from `.worktree-link-configs.txt` to `.wtlinkrc`
  - No automatic migration - manually rename or recreate manifest
- **Backups off by default** - use `--backup` / `-b` flag to create backups
- **Manifest location fixed** - always stored in main worktree root (not in linked worktrees)

### Added

- **Interactive main menu** when running `wtlink` with no args
  - Guided workflow: Manage → Link → Validate
  - Auto-prompts to link after managing
  - Built-in help screen
  - Easy navigation with arrow keys
- **Development watch mode** - `npm run watch` for auto-rebuild during development
- **Comprehensive test suite** for main-menu.ts (100% coverage)
- **NPM publishing preparation**:
  - MIT License
  - Complete package metadata (repository, bugs, homepage)
  - Engine requirements (Node >=14, npm >=6)
  - Enhanced keywords for discoverability

### Changed

- **Terminology improvement**: "Will Link (Commented)" → "Will Track (Commented)"
  - More accurate description of commented manifest entries
- **Package version** bumped to 2.0.0 (breaking changes)
- **Description** improved for clarity on npm
- **Files configuration** improved to exclude test/backup files from package

### Fixed

- **Critical worktree bug**: Manifest now correctly stored in main worktree only
  - Previous behavior: Each worktree could create its own manifest
  - New behavior: All worktrees share one manifest in main worktree root
- **Help screen border alignment** corrected
- **Jest configuration** fixed for accurate coverage reporting
- **Test mocks** updated to support `getMainWorktreeRoot()` function

### Development

- Added `coverageThreshold` to Jest config (80% target)
- Fixed Jest `roots` to include tests directory
- Enhanced test coverage from ~0% to 100% for main-menu.ts
- Improved mock implementations for git commands

## [1.0.0] - 2024-12-XX

### Added

- Initial release with core functionality:
  - Interactive file management with `wtlink manage`
  - Hierarchical directory navigation
  - File linking with `wtlink link`
  - Manifest validation with `wtlink validate`
  - Conflict detection and resolution
  - Stale entry detection
  - Flat and hierarchical view modes
  - Auto-ignore patterns for common directories
  - Reactive architecture with @preact/signals-core
  - Comprehensive documentation (README, ARCHITECTURE)

### Features

- Discover all git-ignored files
- Interactive decision-making (Will Link, Will Track, Won't Link)
- Hard link and symbolic link support
- Auto-detection of worktrees
- Dry-run mode for all commands
- Non-interactive mode for CI/CD
- View toggles for different file states
- Built-in help system

---

## Upgrade Guide

### From 1.x to 2.0.0

1. **Rename manifest file:**
   ```bash
   cd /path/to/main-worktree
   mv .worktree-link-configs.txt .wtlinkrc
   ```
   Or simply run `wtlink manage` to create a new `.wtlinkrc` file.

2. **Update backup workflow** (if you used backups):
   - Old: Backups created automatically
   - New: Use `wtlink manage --backup` to create backups

3. **Verify manifest location:**
   - Ensure manifest exists in main worktree root (not in linked worktrees)
   - Run `wtlink validate` to confirm everything is correct

4. **Test the new main menu:**
   ```bash
   wtlink  # Launch interactive menu
   ```

### Migration Notes

- No changes needed for existing linked files
- Manifest format is backward compatible
- All flags and options remain the same (except `--backup`)
