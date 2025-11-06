# wtlink - Worktree Config Link Manager

[![npm version](https://img.shields.io/npm/v/wtlink.svg)](https://www.npmjs.com/package/wtlink)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/wtlink.svg)](https://nodejs.org)

A powerful interactive tool for managing configuration file links between Git worktrees.

## Breaking Changes in v2.0.0

**If upgrading from v1.x**, be aware of these changes:

1. **Manifest filename changed**: `.worktree-link-configs.txt` → `.wtlinkrc`
   - Old manifests will NOT be automatically migrated
   - Run `mv .worktree-link-configs.txt .wtlinkrc` to migrate manually
   - Or run `npx wtlink manage` to create a new `.wtlinkrc`

2. **Backups off by default**: The `--backup` flag is now required to create backups
   - Old behavior: Always created `.bak` files
   - New behavior: Only creates backups when `--backup` / `-b` flag is used
   - Use `npx wtlink manage --backup` if you want backups

3. **Manifest location fixed**: Manifest is now ALWAYS stored in the main worktree root
   - Old behavior: Each worktree could have its own manifest (bug)
   - New behavior: All worktrees share one manifest in the main worktree
   - This fixes a critical bug where linked worktrees created separate manifests

4. **Terminology change**: "Will Link (Commented)" → "Will Track (Commented)"
   - More accurate description of what commented entries do
   - No action needed - just a UI/documentation change

## What Does It Do?

When working with Git worktrees, you often want to share certain configuration files (like `.vscode/settings.json`, `.editorconfig`, etc.) across all worktrees while keeping build artifacts and other generated files separate.

**wtlink** helps you:
1. **Discover** all ignored files in your repository
2. **Decide** which files should be linked between worktrees
3. **Manage** a manifest file (`.wtlinkrc`) that tracks these files
4. **Link** files automatically using hard links

## Quick Start

```bash
# Install dependencies
cd tools/wtlink
npm install

# Build the tool (auto-runs after install via prepare script)
npm run build

# Interactive main menu - recommended for first-time use
npx wtlink

# Or run commands directly:
# Discover and manage files
npx wtlink manage

# Link files from main worktree to feature branch (auto-detects worktrees)
npx wtlink link
```

## Commands

### `wtlink` (no arguments)

**NEW**: Interactive main menu that provides a guided workflow through all commands.

**Features:**
- 📋 Menu options: Manage, Link, Validate, Help, Exit
- 🔄 Guided workflow: Prompts to link after managing
- ⌨️ Easy navigation with arrow keys
- 📖 Built-in help screen
- 💾 Automatic save and exit

**When to use:**
- First-time setup and learning the tool
- Complete workflow from discovery to linking
- When you're not sure which command to run

```bash
npx wtlink
```

### `wtlink manage`

Interactive file selection interface to manage your worktree config manifest.

**Features:**
- 🔍 Discovers all git-ignored files
- 📁 Hierarchical directory navigation
- ⚡ Instant keyboard actions
- 👁️ Toggle visibility of decided items
- 🔄 Pre-populates decisions from existing manifest
- ⚠️ Detects and handles stale manifest entries
- ❓ Built-in help system

**Stale Entry Detection:**
When you run `wtlink manage`, the tool checks for files in your manifest that:
1. **No longer exist** (deleted files) - prompts to remove, comment as `# DELETED`, or leave unchanged
2. **Are now tracked by git** (not ignored anymore) - prompts to remove (recommended), comment as `# TRACKED`, or leave unchanged

This prevents linking files that could cause git conflicts or don't exist anymore.

**Pre-populated Decisions:**
Files already in the manifest are pre-populated in the interactive view:
- Active entries → ✓ Will Link
- Commented entries → ◎ Will Track (Commented)
- New files → ⋯ Undecided

**Options:**
- `--non-interactive`, `-n`: Non-interactive mode (new files added as comments)
- `--clean`, `-c`: Clean mode (stale entries automatically removed)
- `--dry-run`, `-d`: Preview changes without writing
- `--backup`, `-b`: Create backup of manifest before updating (default: false)

### `wtlink link [source] [destination]`

Creates hard links for all files listed in the manifest.

**Auto-detection:**
- If you omit `source` and `destination`, the tool will auto-detect them
- Destination defaults to current worktree
- Source inferred from `git worktree list` (prefers `main`, `master`, or `develop`)

**Conflict Detection:**
Before creating any links, the tool scans for conflicts:
- ✅ **Safe**: Destination file doesn't exist (ready to link)
- 🔗 **Already linked**: File is already correctly linked (skipped)
- ⚠️ **Conflict**: Different file exists at destination

**Interactive Conflict Resolution:**
When conflicts are detected (and `--yes` is not used), you'll be prompted to resolve them:
1. **Bulk resolution**: Apply the same action to all conflicts
2. **Individual resolution**: Decide each conflict separately

**Resolution Actions:**
- **Replace** - Delete destination file and create link (overwrites existing)
- **Ignore** - Keep destination file as-is, don't create link
- **Remove from manifest** - Remove file from manifest (won't link now or in future)

After resolving conflicts, you'll see a summary and final confirmation before any changes are made.

**Options:**
- `--type symbolic`: Create symbolic links instead of hard links
- `--dry-run`, `-d`: Preview links without creating them
- `--yes`, `-y`: Skip confirmation prompt and auto-replace all conflicts

**Example:**
```bash
# Auto-detect source and destination (prompts for confirmation)
npx wtlink link

# Preview what will be linked (no confirmation needed)
npx wtlink link --dry-run

# Skip confirmation prompt (useful for automation)
npx wtlink link --yes

# Or specify explicitly
npx wtlink link ~/projects/syrf ~/projects/syrf-feature-branch
```

**Conflict Resolution Example:**
```
⚠️  Found 3 conflicting files

  config/
    - local-settings.json

Resolution Options:
  R - Replace destination file (delete existing, create link)
  I - Ignore (keep destination file as-is, don't link)
  M - Remove from manifest (won't link now or in future)

How do you want to resolve these conflicts?
  > Resolve all conflicts the same way
    Resolve each conflict individually

═══════════════════════════════════════
  Conflict Resolution Complete!
═══════════════════════════════════════

Summary:
  ⚠  Replace: 2 files (will overwrite and link)
  ℹ  Ignore: 1 file (will skip, keep destination)
  ✓ Safe: 10 files (no conflict)

  From: ~/source/repos/syrf-monorepo
  To:   ~/source/repos/syrf-feature
  Type: hard links

Proceed with linking 12 files? (2 will overwrite existing files)
```

**Confirmation Prompt:**
By default, `wtlink link` will show a confirmation prompt before creating links:
```
Found 15 files to link
  From: ~/source/repos/syrf-monorepo
  To:   ~/source/repos/syrf-feature
  Type: hard links

Proceed with linking? (y/n)
```

The confirmation is automatically skipped when using `--dry-run` or `--yes`.

### `wtlink validate [source]`

Validates that manifest entries exist and are properly ignored by git.

**Checks:**
- Manifest exists and has no duplicates
- Listed files exist in source worktree
- All files are ignored by Git

**Example:**
```bash
npx wtlink validate
```

Exits with non-zero status on validation failure (CI-friendly).

## Understanding Actions

When running `wtlink manage`, you'll decide what to do with each file. Press `?` anytime for help!

### ✓ **Will Link** (Press `A`)
- **What it does:** File will be **actively linked** between worktrees
- **Manifest format:** `path/to/file.json` (no prefix)
- **When to use:**
  - Configuration files (`.vscode/settings.json`, `.editorconfig`)
  - Shared development tools config
  - IDE workspace settings you want consistent

**Example manifest entries:**
```
.vscode/settings.json
.editorconfig
.prettierrc
```

### ◎ **Will Track (Commented)** (Press `C`)
- **What it does:** File is **tracked in manifest but disabled** (won't be linked)
- **Manifest format:** `# path/to/file.json` (with `#` prefix)
- **When to use:**
  - Files you might want to link later
  - Documentation of potential linkable files
  - Testing configuration before enabling

**Example manifest entries:**
```
# .vscode/launch.json
# .gitconfig
```

### ✗ **Won't Link** (Press `S`)
- **What it does:** File is **completely ignored** (not added to manifest)
- **Manifest format:** (not present in manifest)
- **When to use:**
  - Build artifacts (`bin/`, `obj/`, `node_modules/`)
  - Temporary files
  - IDE-specific files you don't want to track
  - Cache directories

**Result:** These files won't appear in the manifest at all.

## Interactive UI Guide

### Navigation Keys

| Key | Action |
|-----|--------|
| `↑` `↓` | Move cursor up/down through the file list |
| `→` | Drill into a directory (navigate deeper) |
| `←` | Go back to parent directory |

### Action Keys (Instant - No Confirmation!)

| Key | Action | Color | Effect |
|-----|--------|-------|--------|
| `A` | Will Link | 🟢 Green | File will be linked (active) |
| `C` | Will Track (Commented) | 🔵 Blue | File tracked but disabled |
| `S` | Won't Link | 🟡 Yellow | File ignored (not in manifest) |
| `Q` | Quit | 🔴 Red | Save and exit |

**Note:** Actions happen instantly when you press the key - the item disappears and counts update!

### View Toggle Keys

| Key | Action | Description |
|-----|--------|-------------|
| `0` | Toggle Undecided | Show/hide undecided files (on by default) |
| `1` | Toggle Added | Show/hide files marked "Will Link" |
| `2` | Toggle Tracked | Show/hide files marked "Will Track (Commented)" |
| `3` | Toggle Skipped | Show/hide files marked "Won't Link" |
| `V` | Toggle View Mode | Switch between hierarchical and flat view |
| `?` | Toggle Help | Show/hide full help panel |

## UI Elements Explained

### Status Header

```
╔═══════════════════════════════════════════════════════════════════════════╗
║          Worktree Config Link Manager                                     ║
╚═══════════════════════════════════════════════════════════════════════════╝

  ✓ Will Link:    5  ◎ Commented:    3  ✗ Skipped:  127  ⋯ Undecided:  865
  Viewing: Undecided                            | Layout: Hierarchical
```

Numbers are padded to 4 digits (supports up to 9999 items) to prevent layout shifting as counts change.

- **Will Link:** Files that will be actively linked when you run `wtlink link`
- **Commented:** Files tracked in manifest but won't be linked (disabled with `#`)
- **Skipped:** Files completely ignored (not in manifest at all)
- **Undecided:** Files you haven't made a decision on yet

### Action Hint Panel

A permanent info panel (2 lines) appears above the file list. When you select a directory with undecided files, it shows helpful information:

```
ℹ  node_modules — 1234 undecided files inside

```

When you select a file or a folder without undecided files, the panel remains empty to keep the layout stable:

```

```

This fixed-height panel prevents the file list from shifting up/down as you navigate.

### File List

**In hierarchical mode, folders appear first (alphabetically), then files (alphabetically).**

**Example (default view - hierarchical):**
```
 ▶    ⬆️  .. (go back)
      📁 .idea (20 files: 20 undecided) [auto-ignore]
      📁 deploy (200 files: 150 undecided, 30 added, 20 skipped)
    ✓ 📄 .editorconfig
    ◎ 📄 .gitconfig
    ✗ 📄 temp.txt
```

**Note**: All items are aligned with consistent spacing, even those without status icons.

**Example (flat view with V toggle):**
```
 ▶    📁 .idea (20 files: 20 undecided) [auto-ignore]
      📁 deploy (200 files: 150 undecided, 30 added, 20 skipped)
    ✓ 📄 .editorconfig
      📄 .env
    ◎ 📄 .gitconfig
      📄 package.json
```

**Symbols:**
- `▶` = Current cursor position (blue highlight)
- `📁` = Directory (shows state breakdown of all descendants)
- `📄` = File
- `✓` = Marked "Will Link" (green)
- `◎` = Marked "Will Track (Commented)" (blue)
- `✗` = Marked "Won't Link" (yellow)
- `  ` = Reserved space (2 spaces) for items without status icons - ensures alignment
- `[auto-ignore]` = Common build/cache directory (detected automatically)

**Directory State Breakdown:**
- Single state: `(20 files: 20 undecided)`
- Mixed states: `(10 undecided, 5 added, 3 skipped)` - shows breakdown of all descendants
- Directories appear only once, even if containing items in multiple states
- When view toggles (1/2/3) are active, directories show if they contain matching descendants

### Footer

Shows all available key bindings. Active toggles are highlighted!

```
Nav: ↑↓ select | ← back | → drill-in   Actions: A link | C link(commented) | S skip
View: 0 undecided | 1 added | 2 commented | 3 skipped | V flat   Help: ?   Q save+quit | X cancel
```

## Common Workflows

### First-Time Setup (Recommended: Main Menu)

**Using the interactive main menu** (recommended for beginners):

1. **Launch the main menu:**
   ```bash
   npx wtlink
   ```

2. **Select "Manage config manifest"** from the menu

3. **Press `?` to see help** - understand what each action does

4. **Navigate through directories:**
   - Use `↑` `↓` to move through the list
   - Press `→` on a directory to drill in
   - Press `←` to go back

5. **Make quick decisions on common directories:**
   - Navigate to `node_modules/` → press `S` (won't link)
   - Navigate to `bin/` → press `S` (won't link)
   - Navigate to `obj/` → press `S` (won't link)
   - Navigate to `.vscode/` → press `→` to drill in and decide individually

6. **Decide on individual files:**
   - `.vscode/settings.json` → press `A` (will link)
   - `.editorconfig` → press `A` (will link)
   - `.gitconfig` → press `C` (will track commented - document but don't link)

7. **Review your choices:**
   - Press `0` to toggle undecided files (on by default)
   - Press `1` to see all files marked "Will Link" ✓
   - Press `2` to see all files marked "Will Track (Commented)" ◎
   - Press `3` to see all files marked "Won't Link" ✗
   - Press the number again to hide that view
   - Combine filters to see multiple states (e.g., press `0` and `1` to see both undecided and added)

8. **Save and exit:**
   - Press `Q` to quit and save

9. **Link the files:**
   - The menu will ask "Would you like to link configs now?" → select Yes
   - Files are automatically linked from main worktree to current worktree
   - Review the summary and confirm

### First-Time Setup (Advanced: Direct Commands)

**Using direct commands** (for experienced users):

1. **Run manage:**
   ```bash
   npx wtlink manage
   ```

2. Follow steps 3-8 from the main menu workflow above

3. **Link the files:**
   ```bash
   npx wtlink link
   ```

### Reviewing and Editing Decisions

1. **Show specific categories:**
   ```bash
   npx wtlink manage
   ```

2. **Press `0`** to toggle off undecided items (focus on decided items)

3. **Press `1`** to see only "Will Link" files
   - Verify these are what you want linked
   - Navigate to any file and press `C` to change to "Will Track (Commented)"
   - Or press `S` to change to "Won't Link"

4. **Press `2`** to see "Will Track (Commented)" files
   - Consider if any should be enabled (press `A`)
   - Or completely remove them (press `S`)

5. **Press `3`** to see "Won't Link" files
   - Double-check you didn't skip anything important
   - Press `A` or `C` to add them back

**Tip:** You can combine filters! Press `0`, `1`, and `2` together to see undecided, added, and tracked files all at once.

### Linking Files Between Worktrees

```bash
# Auto-detect (recommended)
npx wtlink link

# Or specify explicitly
npx wtlink link ~/projects/syrf ~/projects/syrf-feature-branch
```

This creates hard links for all **active** (uncommented) files in the manifest.

### Handling Conflicts During Linking

When linking files, you may encounter conflicts if different files exist at the destination:

**Scenario 1: Bulk Resolution (All Same Action)**
1. Run `npx wtlink link`
2. Tool detects 5 conflicting files
3. Choose "Resolve all conflicts the same way"
4. Select action:
   - **Replace all** - Overwrite all destination files with links
   - **Ignore all** - Keep all destination files, skip linking
   - **Remove all from manifest** - Clean up manifest and skip these files permanently

**Scenario 2: Individual Resolution (Per-File Decisions)**
1. Run `npx wtlink link`
2. Tool detects 5 conflicting files
3. Choose "Resolve each conflict individually"
4. For each file, decide:
   - **Replace** - You trust the source version, overwrite destination
   - **Ignore** - Destination has custom changes, keep it
   - **Remove from manifest** - This file shouldn't be linked

**After Resolution:**
- See summary of all decisions
- Final confirmation before any changes
- Manifest automatically updated if files removed
- Can cancel at any point (Ctrl+C)

**Tips:**
- Use `--dry-run` first to see what would be linked
- Already-linked files are automatically skipped (no prompt)
- Use `--yes` for automation (auto-replaces all conflicts)

### Updating the Manifest

```bash
# Re-run manage to discover new files
npx wtlink manage
```

The tool will:
- Show any new ignored files (marked as "Undecided")
- Preserve your existing decisions from the manifest
- Identify stale entries:
  - **Deleted files** - No longer exist on disk
  - **Tracked files** - No longer git-ignored (could cause conflicts)
- Prompt you to handle stale entries before showing the interactive view

## Manifest File Format

The manifest is stored in `.wtlinkrc` at the repository root (in the main worktree):

```
# Active files (will be linked)
.vscode/settings.json
.editorconfig
.prettierrc

# Commented files (tracked but disabled)
# .vscode/launch.json
# .gitconfig

# Note: Skipped files don't appear in the manifest at all
```

**Important:** The manifest is always stored in the **main worktree root**, not in linked worktrees. This ensures all worktrees share the same configuration.

## Configuration (Coming Soon)

Future versions will support configuration via `package.json`:

```json
{
  "wtlink": {
    "manifestFile": ".wtlinkrc",
    "linkType": "hard",
    "ui": {
      "colors": true,
      "symbols": "unicode"
    },
    "autoIgnorePatterns": [
      "node_modules/",
      "dist/",
      "build/"
    ]
  }
}
```

**Planned features:**
- Custom manifest filename and location
- Default link type (hard vs symbolic)
- UI customization (colors, symbols)
- Auto-ignore patterns for common directories

For now, use command-line flags to customize behavior.

## Tips & Best Practices

### Common Auto-Ignore Directories

The tool automatically detects and highlights common build/cache directories:
- `node_modules`, `bin`, `obj`
- `.git`, `.vs`, `.vscode`, `.idea`
- `dist`, `build`, `coverage`, `out`, `target`
- `__pycache__`, `.pytest_cache`, `.gradle`, `vendor`

**Tip:** These are marked with `[auto-ignore]`. Press `S` on them to skip entire directories instantly!

### Using View Toggles Effectively

**Review workflow:**
1. Press `0` to turn off undecided view (focus on decided items)
2. Press `1` to see only "Will Link" files - verify these are correct
3. Press `2` to see "Will Track (Commented)" - consider if any should be enabled
4. Press `3` to see "Won't Link" - make sure you didn't skip anything important

**Combining filters:**
- You can have multiple toggles active at once
- Example: `0` + `1` shows both undecided and added files
- Example: `1` + `2` + `3` shows all decided files (no undecided)
- Press `0` to go back to default (undecided only)

### Flat View Features

Press `V` to toggle between hierarchical and flat view modes.

**In Flat View:**
- All directories and files are shown in a single alphabetically sorted list
- Directories are mixed with files (not separated at the top)
- Each directory shows a state breakdown of all its descendants
- View toggles (1/2/3) control which directories appear:
  - Directory appears if it contains any descendants matching active toggle states
  - Directory appears once even if it has children in multiple states
  - Breakdown shows counts for each state: `(5 added, 3 commented, 2 skipped)`

**Example Workflow:**
1. Press `V` to switch to flat view
2. Press `1` to show only "added" items
3. All directories containing added files appear with breakdown
4. Files marked as "added" appear in the list
5. Navigate and review all added items

### Directory Actions Apply to All Children

When you make a decision on a directory (in both hierarchical and flat view):
- **All files inside** get the same action
- The directory **disappears from the list** (since all children are now decided)
- Counts update to reflect all affected files

**In Flat View:**
- Directories are listed alongside files
- Yellow hint shows "Actions apply to all X files inside"
- Perfect for quickly processing large directories like `node_modules/`, `bin/`, `obj/`

**Example:**
- Navigate to `node_modules/` (shows "1234 files")
- Press `S` → all 1234 files marked "Won't Link"
- Directory removed from list
- "Won't Link" count increases by 1234

### Getting Help Anytime

Press `?` at any time to see the full help panel with:
- Detailed explanation of each action
- What gets written to the manifest
- When to use each option
- View toggle descriptions

Press `?` again to close help and return to the file list.

## Troubleshooting

### "Warning: Could not run `git ls-files`"

**Cause:** Brand new repository with no commits.

**Fix:** Make at least one commit first:
```bash
git add .
git commit -m "Initial commit"
```

### Files Not Linking

**Check:**
1. Files are **active** in manifest (no `#` prefix):
   ```bash
   cat .wtlinkrc
   ```

2. Files exist in source worktree:
   ```bash
   ls /path/to/source/.vscode/settings.json
   ```

3. Files are git-ignored:
   ```bash
   git check-ignore .vscode/settings.json
   ```

4. Manifest is in the main worktree root (not a linked worktree)

### Manifest Out of Sync

**Solution:** Run `wtlink manage` again:
- Discovers new files
- Cleans up stale entries
- Preserves existing decisions

### Buffer Size Errors

**Symptom:** Tool crashes with `ENOBUFS` error

**Cause:** Extremely large number of ignored files (10,000+)

**Status:** Fixed in latest version (50MB buffer)

## Development

### Building from Source

```bash
cd tools/wtlink
npm install
npm run build
```

### Running Tests

```bash
cd tools/wtlink
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

**Test Coverage:**
- File tree building and traversal
- Directory state breakdown calculation
- Flat view directory filtering with view toggles
- Alphabetical sorting of directories and files
- Edge cases and mixed states

### Project Structure

```
tools/wtlink/
├── src/
│   ├── cli.ts                      # CLI entry point and command router
│   ├── manage-manifest.ts          # Interactive file manager (reactive architecture)
│   ├── manage-manifest.test.ts     # Tests for pure functions and state logic
│   ├── link-configs.ts             # Hard link creation logic
│   └── validate-manifest.ts        # Manifest validation
├── dist/                           # Compiled JavaScript
├── jest.config.js                  # Jest test configuration
├── ARCHITECTURE.md                 # Reactive architecture documentation
├── package.json
└── README.md                       # This file
```

### Architecture

The interactive file manager uses a **reactive, declarative architecture** with high-performance signals:

- **@preact/signals-core**: Reactive state management with automatic memoization
- **Immutable state**: All state updates create new objects
- **Pure functions**: State computation with no side effects
- **Single source of truth**: `getVisibleItems()` prevents duplication
- **Derived folder states**: Folders show all states present in their children
- **Smart caching**: Computed values only recalculate when dependencies change

**Performance benefits**:
- Cursor movement: Instant (~0ms) - uses cached results
- Filter toggles: Fast (~50ms) - only recomputes when needed
- Large file trees: No lag even with 1000+ files

**Key benefit**: Folders can have multiple states (e.g., both "added" and "skipped" children) and appear exactly once in the UI, eliminating duplicate listing bugs.

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed design documentation.

### Global Installation for Development

```bash
cd tools/wtlink
npm link
```

This makes `wtlink` available as a global command.

### Adding to Repository Package.json

Add to your repo root `package.json`:
```json
{
  "bin": {
    "wtlink": "./tools/wtlink/dist/src/cli.js"
  }
}
```

Then run `npm install` to make `wtlink` available via `npx`.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

**Development Setup:**
```bash
git clone https://github.com/chrissena/wtlink.git
cd wtlink
npm install
npm run build
npm link  # For global testing
```

**Running Tests:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

**Code Quality:**
- Write tests for new features
- Maintain 80%+ test coverage
- Follow existing code style
- Update documentation

## License

MIT © 2025 Chris Sena

See [LICENSE](LICENSE) file for details.
