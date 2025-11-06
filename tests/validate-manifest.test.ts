import { run } from '../src/validate-manifest';
import { spawnSync, SpawnSyncReturns } from 'child_process';
import fs from 'fs';
import path from 'path';

jest.mock('child_process');
jest.mock('fs');

const mockedSpawnSync = spawnSync as jest.MockedFunction<typeof spawnSync>;
const mockedFs = fs as jest.Mocked<typeof fs>;

const GIT_ROOT = process.platform === 'win32' ? 'C:\\workspace\\syrf' : '/home/chris/workspace/syrf';
const MANIFEST_FILE = '.wtlinkrc';
const MANIFEST_PATH = path.join(GIT_ROOT, MANIFEST_FILE);

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('validate-manifest', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (console.log as jest.Mock).mockClear();
    (console.error as jest.Mock).mockClear();

    mockedSpawnSync.mockImplementation((command: string, args?: ReadonlyArray<string>) => {
      if (!args || args.length === 0) {
        return {
          pid: 0,
          output: ['', '', ''],
          stdout: '',
          stderr: '',
          status: 0,
          signal: null,
          error: undefined,
        } as unknown as SpawnSyncReturns<string>;
      }

      if (args[0] === '--version') {
        return {
          pid: 0,
          output: ['', 'git version 2.44', ''],
          stdout: 'git version 2.44',
          stderr: '',
          status: 0,
          signal: null,
          error: undefined,
        } as unknown as SpawnSyncReturns<string>;
      }

      if (args[0] === 'rev-parse') {
        if (args[1] === '--git-common-dir') {
          // Return .git for main worktree (as absolute path to match real git behavior)
          const gitCommonDir = path.join(GIT_ROOT, '.git');
          return {
            pid: 0,
            output: ['', gitCommonDir, ''],
            stdout: gitCommonDir,
            stderr: '',
            status: 0,
            signal: null,
            error: undefined,
          } as unknown as SpawnSyncReturns<string>;
        }
        return {
          pid: 0,
          output: ['', GIT_ROOT, ''],
          stdout: GIT_ROOT,
          stderr: '',
          status: 0,
          signal: null,
          error: undefined,
        } as unknown as SpawnSyncReturns<string>;
      }

      if (args[0] === 'check-ignore') {
        return {
          pid: 0,
          output: ['', 'ignored', ''],
          stdout: 'ignored',
          stderr: '',
          status: 0,
          signal: null,
          error: undefined,
        } as unknown as SpawnSyncReturns<string>;
      }

      return {
        pid: 0,
        output: ['', '', ''],
        stdout: '',
        stderr: '',
        status: 0,
        signal: null,
        error: undefined,
      } as unknown as SpawnSyncReturns<string>;
    });

    mockedFs.existsSync.mockImplementation((filePath: fs.PathLike) => {
      if (typeof filePath === 'string' && filePath === MANIFEST_PATH) return true;
      return true;
    });
    mockedFs.statSync.mockReturnValue({
      isDirectory: () => true,
    } as unknown as fs.Stats);
    mockedFs.readFileSync.mockReturnValue('config.json');
  });

  it('passes when all manifest entries exist and are ignored', () => {
    expect(() => run({ manifestFile: MANIFEST_FILE })).not.toThrow();
  });

  it('throws when the manifest file is missing', () => {
    mockedFs.existsSync.mockImplementation((filePath: fs.PathLike) => {
      const filePathStr = typeof filePath === 'string' ? filePath : filePath.toString();
      const normalizedFilePath = path.normalize(filePathStr);
      const normalizedManifestPath = path.normalize(MANIFEST_PATH);
      if (normalizedFilePath === normalizedManifestPath) return false;
      return true;
    });

    expect(() => run({ manifestFile: MANIFEST_FILE })).toThrow(
      'Manifest file not found'
    );
  });

  it('throws when a manifest entry is duplicated', () => {
    mockedFs.readFileSync.mockReturnValue('config.json\nconfig.json');
    expect(() => run({ manifestFile: MANIFEST_FILE })).toThrow(
      'validation issue'
    );
    expect(
      (console.error as jest.Mock).mock.calls
        .flat()
        .some((msg: string) => msg.includes('Duplicate entry'))
    ).toBe(true);
  });

  it('throws when a file listed does not exist', () => {
    mockedFs.existsSync.mockImplementation((filePath: fs.PathLike) => {
      if (typeof filePath === 'string' && filePath === MANIFEST_PATH) return true;
      if (typeof filePath === 'string' && filePath.endsWith('config.json'))
        return false;
      return true;
    });

    expect(() => run({ manifestFile: MANIFEST_FILE })).toThrow(
      'validation issue'
    );
    expect(
      (console.error as jest.Mock).mock.calls
        .flat()
        .some((msg: string) => msg.includes('Missing source file'))
    ).toBe(true);
  });

  it('throws when a file is not ignored by git', () => {
    mockedSpawnSync.mockImplementation((command: string, args?: ReadonlyArray<string>) => {
      if (!args || args.length === 0) {
        return {
          pid: 0,
          output: ['', '', ''],
          stdout: '',
          stderr: '',
          status: 0,
          signal: null,
          error: undefined,
        } as unknown as SpawnSyncReturns<string>;
      }
      if (args[0] === '--version') {
        return {
          pid: 0,
          output: ['', 'git version 2.44', ''],
          stdout: 'git version 2.44',
          stderr: '',
          status: 0,
          signal: null,
          error: undefined,
        } as unknown as SpawnSyncReturns<string>;
      }
      if (args[0] === 'rev-parse') {
        if (args[1] === '--git-common-dir') {
          return {
            pid: 0,
            output: ['', '.git', ''],
            stdout: '.git',
            stderr: '',
            status: 0,
            signal: null,
            error: undefined,
          } as unknown as SpawnSyncReturns<string>;
        }
        return {
          pid: 0,
          output: ['', GIT_ROOT, ''],
          stdout: GIT_ROOT,
          stderr: '',
          status: 0,
          signal: null,
          error: undefined,
        } as unknown as SpawnSyncReturns<string>;
      }
      if (args[0] === 'check-ignore') {
        return {
          pid: 0,
          output: ['', '', ''],
          stdout: '',
          stderr: '',
          status: 1,
          signal: null,
          error: undefined,
        } as unknown as SpawnSyncReturns<string>;
      }
      return {
        pid: 0,
        output: ['', '', ''],
        stdout: '',
        stderr: '',
        status: 0,
        signal: null,
        error: undefined,
      } as unknown as SpawnSyncReturns<string>;
    });

    expect(() => run({ manifestFile: MANIFEST_FILE })).toThrow(
      'validation issue'
    );
    expect(
      (console.error as jest.Mock).mock.calls
        .flat()
        .some((msg: string) => msg.includes('File is not ignored by git'))
    ).toBe(true);
  });
});
