import { describe, test, expect } from '@jest/globals';

// ============================================================================
// TYPES - Matching the reactive architecture
// ============================================================================

// User decisions for files (stored in decisions map)
type FileDecision = 'add' | 'comment' | 'skip';

// Computed states (includes explicit 'undecided' for items not in decisions map)
type ItemState = FileDecision | 'undecided';

interface FileNode {
  readonly path: string;
  readonly isDirectory: boolean;
  readonly children: ReadonlyArray<FileNode>;
}

interface DisplayItem {
  readonly path: string;
  readonly isDirectory: boolean;
  readonly node?: FileNode;
  readonly states: ReadonlySet<ItemState>;
}

// ============================================================================
// PURE FUNCTION IMPLEMENTATIONS FOR TESTING
// ============================================================================

function getAllFiles(node: FileNode): string[] {
  if (!node.isDirectory) {
    return [node.path];
  }
  return node.children.flatMap(child => getAllFiles(child));
}

function getAllDirectories(node: FileNode): FileNode[] {
  if (!node.isDirectory) {
    return [];
  }

  const directories: FileNode[] = [];
  for (const child of node.children) {
    if (child.isDirectory) {
      directories.push(child);
      directories.push(...getAllDirectories(child));
    }
  }
  return directories;
}

function getFileDecision(decisions: ReadonlyMap<string, FileDecision>, filePath: string): ItemState {
  return decisions.get(filePath) ?? 'undecided';
}

function getFolderStates(
  node: FileNode,
  decisions: ReadonlyMap<string, FileDecision>
): ReadonlySet<ItemState> {
  if (!node.isDirectory) {
    return new Set([getFileDecision(decisions, node.path)]);
  }

  const states = new Set<ItemState>();
  const allFiles = getAllFiles(node);

  for (const filePath of allFiles) {
    states.add(getFileDecision(decisions, filePath));
  }

  return states;
}

function getFolderStateBreakdown(
  node: FileNode,
  decisions: ReadonlyMap<string, FileDecision>
): { add: number; comment: number; skip: number; undecided: number } {
  const breakdown = { add: 0, comment: 0, skip: 0, undecided: 0 };
  const allFiles = getAllFiles(node);

  for (const filePath of allFiles) {
    const decision = getFileDecision(decisions, filePath);
    breakdown[decision]++;
  }

  return breakdown;
}

function isItemVisible(
  item: DisplayItem,
  activeFilters: ReadonlySet<ItemState>
): boolean {
  // If no filters active, nothing is visible (edge case)
  if (activeFilters.size === 0) {
    return false;
  }

  // Item visible if it has any matching state
  for (const filter of activeFilters) {
    if (item.states.has(filter)) {
      return true;
    }
  }

  return false;
}

function buildFileTree(filePaths: string[]): FileNode {
  interface MutableFileNode {
    path: string;
    isDirectory: boolean;
    children: MutableFileNode[];
  }

  const root: MutableFileNode = {
    path: '',
    isDirectory: true,
    children: [],
  };

  const nodeMap = new Map<string, MutableFileNode>();
  nodeMap.set('', root);

  for (const filePath of filePaths) {
    const parts = filePath.split('/');
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLastPart = i === parts.length - 1;

      if (!nodeMap.has(currentPath)) {
        const node: MutableFileNode = {
          path: currentPath,
          isDirectory: !isLastPart,
          children: [],
        };

        nodeMap.set(currentPath, node);

        const parent = nodeMap.get(parentPath)!;
        parent.children.push(node);
      }
    }
  }

  function makeImmutable(node: MutableFileNode): FileNode {
    return {
      path: node.path,
      isDirectory: node.isDirectory,
      children: node.children.map(makeImmutable),
    };
  }

  return makeImmutable(root);
}

// ============================================================================
// TESTS
// ============================================================================

describe('Reactive Architecture - Pure Functions', () => {
  describe('buildFileTree', () => {
    test('should build immutable tree from flat file list', () => {
      const files = [
        'src/file1.ts',
        'src/file2.ts',
        'src/subfolder/file3.ts',
        'root.txt',
      ];

      const tree = buildFileTree(files);

      expect(tree.children.length).toBe(2); // src/ and root.txt
      expect(tree.children.find(c => c.path === 'src')).toBeDefined();
      expect(tree.children.find(c => c.path === 'root.txt')).toBeDefined();

      const srcNode = tree.children.find(c => c.path === 'src');
      expect(srcNode?.isDirectory).toBe(true);
      expect(srcNode?.children.length).toBe(3); // file1.ts, file2.ts, subfolder/

      // Test immutability - should be readonly
      expect(Object.isFrozen(tree.children)).toBe(false); // Arrays aren't frozen but are readonly via TS
    });

    test('should handle empty file list', () => {
      const tree = buildFileTree([]);
      expect(tree.children.length).toBe(0);
    });

    test('should handle single file', () => {
      const tree = buildFileTree(['file.txt']);
      expect(tree.children.length).toBe(1);
      expect(tree.children[0].path).toBe('file.txt');
      expect(tree.children[0].isDirectory).toBe(false);
    });
  });

  describe('getAllFiles', () => {
    test('should get all files from a directory node', () => {
      const tree = buildFileTree([
        'folder/file1.txt',
        'folder/file2.txt',
        'folder/subfolder/file3.txt',
      ]);

      const folderNode = tree.children.find(c => c.path === 'folder')!;
      const files = getAllFiles(folderNode);

      expect(files).toHaveLength(3);
      expect(files).toContain('folder/file1.txt');
      expect(files).toContain('folder/file2.txt');
      expect(files).toContain('folder/subfolder/file3.txt');
    });

    test('should return single file for file node', () => {
      const tree = buildFileTree(['file.txt']);
      const fileNode = tree.children[0];
      const files = getAllFiles(fileNode);

      expect(files).toEqual(['file.txt']);
    });
  });

  describe('getAllDirectories', () => {
    test('should get all directories from tree', () => {
      const tree = buildFileTree([
        'folder1/file1.txt',
        'folder1/subfolder/file2.txt',
        'folder2/file3.txt',
      ]);

      const directories = getAllDirectories(tree);

      expect(directories).toHaveLength(3); // folder1, folder1/subfolder, folder2
      expect(directories.map(d => d.path).sort()).toEqual([
        'folder1',
        'folder1/subfolder',
        'folder2',
      ]);
    });

    test('should return empty array for tree with no directories', () => {
      const tree = buildFileTree([]);
      const directories = getAllDirectories(tree);
      expect(directories).toHaveLength(0);
    });
  });

  describe('getFileDecision', () => {
    test('should return decision from map', () => {
      const decisions = new Map<string, FileDecision>([
        ['file1.txt', 'add'],
        ['file2.txt', 'skip'],
      ]);

      expect(getFileDecision(decisions, 'file1.txt')).toBe('add');
      expect(getFileDecision(decisions, 'file2.txt')).toBe('skip');
    });

    test('should return undecided for files not in map', () => {
      const decisions = new Map<string, FileDecision>();
      expect(getFileDecision(decisions, 'file.txt')).toBe('undecided');
    });
  });

  describe('getFolderStates', () => {
    test('should return undecided for folder with all undecided files', () => {
      const tree = buildFileTree([
        'folder/file1.txt',
        'folder/file2.txt',
      ]);

      const folderNode = tree.children.find(c => c.path === 'folder')!;
      const decisions = new Map<string, FileDecision>();

      const states = getFolderStates(folderNode, decisions);

      expect(states.size).toBe(1);
      expect(states.has('undecided')).toBe(true);
    });

    test('should return multiple states for folder with mixed decisions', () => {
      const tree = buildFileTree([
        'folder/file1.txt',
        'folder/file2.txt',
        'folder/file3.txt',
      ]);

      const folderNode = tree.children.find(c => c.path === 'folder')!;
      const decisions = new Map<string, FileDecision>([
        ['folder/file1.txt', 'add'],
        ['folder/file2.txt', 'skip'],
        // file3.txt is undecided
      ]);

      const states = getFolderStates(folderNode, decisions);

      expect(states.size).toBe(3); // add, skip, undecided
      expect(states.has('add')).toBe(true);
      expect(states.has('skip')).toBe(true);
      expect(states.has('undecided')).toBe(true);
    });

    test('should return single state for folder with all same decisions', () => {
      const tree = buildFileTree([
        'folder/file1.txt',
        'folder/file2.txt',
      ]);

      const folderNode = tree.children.find(c => c.path === 'folder')!;
      const decisions = new Map<string, FileDecision>([
        ['folder/file1.txt', 'add'],
        ['folder/file2.txt', 'add'],
      ]);

      const states = getFolderStates(folderNode, decisions);

      expect(states.size).toBe(1);
      expect(states.has('add')).toBe(true);
    });

    test('should count nested files correctly', () => {
      const tree = buildFileTree([
        'folder/file1.txt',
        'folder/subfolder/file2.txt',
        'folder/subfolder/file3.txt',
      ]);

      const folderNode = tree.children.find(c => c.path === 'folder')!;
      const decisions = new Map<string, FileDecision>([
        ['folder/subfolder/file2.txt', 'comment'],
      ]);

      const states = getFolderStates(folderNode, decisions);

      expect(states.size).toBe(2); // comment, undecided
      expect(states.has('comment')).toBe(true);
      expect(states.has('undecided')).toBe(true);
    });
  });

  describe('getFolderStateBreakdown', () => {
    test('should count undecided files correctly', () => {
      const tree = buildFileTree([
        'folder/file1.txt',
        'folder/file2.txt',
        'folder/file3.txt',
      ]);

      const folderNode = tree.children.find(c => c.path === 'folder')!;
      const decisions = new Map<string, FileDecision>();

      const breakdown = getFolderStateBreakdown(folderNode, decisions);

      expect(breakdown.undecided).toBe(3);
      expect(breakdown.add).toBe(0);
      expect(breakdown.comment).toBe(0);
      expect(breakdown.skip).toBe(0);
    });

    test('should count mixed states correctly', () => {
      const tree = buildFileTree([
        'folder/file1.txt',
        'folder/file2.txt',
        'folder/file3.txt',
        'folder/file4.txt',
      ]);

      const folderNode = tree.children.find(c => c.path === 'folder')!;
      const decisions = new Map<string, FileDecision>([
        ['folder/file1.txt', 'add'],
        ['folder/file2.txt', 'add'],
        ['folder/file3.txt', 'skip'],
      ]);

      const breakdown = getFolderStateBreakdown(folderNode, decisions);

      expect(breakdown.undecided).toBe(1);
      expect(breakdown.add).toBe(2);
      expect(breakdown.comment).toBe(0);
      expect(breakdown.skip).toBe(1);
    });

    test('should count all decision types', () => {
      const tree = buildFileTree([
        'folder/file1.txt',
        'folder/file2.txt',
        'folder/file3.txt',
        'folder/file4.txt',
      ]);

      const folderNode = tree.children.find(c => c.path === 'folder')!;
      const decisions = new Map<string, FileDecision>([
        ['folder/file1.txt', 'add'],
        ['folder/file2.txt', 'comment'],
        ['folder/file3.txt', 'skip'],
      ]);

      const breakdown = getFolderStateBreakdown(folderNode, decisions);

      expect(breakdown.add).toBe(1);
      expect(breakdown.comment).toBe(1);
      expect(breakdown.skip).toBe(1);
      expect(breakdown.undecided).toBe(1);
    });
  });

  describe('isItemVisible', () => {
    test('should show items with undecided state when undecided filter active', () => {
      const item: DisplayItem = {
        path: 'folder',
        isDirectory: true,
        states: new Set(['undecided']),
      };

      const activeFilters = new Set<ItemState>(['undecided']);
      expect(isItemVisible(item, activeFilters)).toBe(true);
    });

    test('should hide items without undecided state when only undecided filter active', () => {
      const item: DisplayItem = {
        path: 'folder',
        isDirectory: true,
        states: new Set(['add', 'skip']),
      };

      const activeFilters = new Set<ItemState>(['undecided']);
      expect(isItemVisible(item, activeFilters)).toBe(false);
    });

    test('should show items matching active filter', () => {
      const item: DisplayItem = {
        path: 'folder',
        isDirectory: true,
        states: new Set(['add', 'undecided']),
      };

      const activeFilters = new Set<ItemState>(['add']);
      expect(isItemVisible(item, activeFilters)).toBe(true);
    });

    test('should hide items not matching active filter', () => {
      const item: DisplayItem = {
        path: 'folder',
        isDirectory: true,
        states: new Set(['skip']),
      };

      const activeFilters = new Set<ItemState>(['add']);
      expect(isItemVisible(item, activeFilters)).toBe(false);
    });

    test('should show items matching any of multiple filters', () => {
      const item: DisplayItem = {
        path: 'folder',
        isDirectory: true,
        states: new Set(['comment', 'undecided']),
      };

      const activeFilters = new Set<ItemState>(['add', 'comment']);
      expect(isItemVisible(item, activeFilters)).toBe(true);
    });

    test('should show folders with mixed states when filter matches any state', () => {
      const item: DisplayItem = {
        path: 'folder',
        isDirectory: true,
        states: new Set(['add', 'skip', 'undecided']),
      };

      const activeFilters = new Set<ItemState>(['add']);
      expect(isItemVisible(item, activeFilters)).toBe(true);
    });
  });

  describe('No Duplication - Single Source of Truth', () => {
    test('should never show same folder twice in flat view', () => {
      const tree = buildFileTree([
        'folder/file1.txt',
        'folder/file2.txt',
        'folder/file3.txt',
      ]);

      const decisions = new Map<string, FileDecision>([
        ['folder/file1.txt', 'add'],
        ['folder/file2.txt', 'skip'],
        ['folder/file3.txt', 'comment'],
      ]);

      // Simulate flat view with all filters active
      const allDirs = getAllDirectories(tree);
      const activeFilters = new Set<ItemState>(['add', 'skip', 'comment']);

      const visibleDirs = allDirs
        .map(dir => ({
          path: dir.path,
          isDirectory: true,
          node: dir,
          states: getFolderStates(dir, decisions),
        }))
        .filter(item => isItemVisible(item, activeFilters));

      // Should only have 'folder' once, not duplicated
      expect(visibleDirs.length).toBe(1);
      expect(visibleDirs[0].path).toBe('folder');

      // Verify it has all three states
      expect(visibleDirs[0].states.has('add')).toBe(true);
      expect(visibleDirs[0].states.has('skip')).toBe(true);
      expect(visibleDirs[0].states.has('comment')).toBe(true);
    });

    test('should show folder once with all relevant states', () => {
      const tree = buildFileTree([
        'folder/subfolder1/file1.txt',
        'folder/subfolder2/file2.txt',
      ]);

      const decisions = new Map<string, FileDecision>([
        ['folder/subfolder1/file1.txt', 'add'],
        ['folder/subfolder2/file2.txt', 'skip'],
      ]);

      const folderNode = tree.children.find(c => c.path === 'folder')!;
      const states = getFolderStates(folderNode, decisions);

      // Folder should have both add and skip states (from nested children)
      expect(states.size).toBe(2);
      expect(states.has('add')).toBe(true);
      expect(states.has('skip')).toBe(true);
    });
  });
});
