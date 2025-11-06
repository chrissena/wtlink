import { run } from '../src/link-configs';
import { spawnSync, SpawnSyncReturns } from 'child_process';
import fs from 'fs';

jest.mock('child_process');
jest.mock('fs');

const mockedSpawnSync = spawnSync as jest.MockedFunction<typeof spawnSync>;
const mockedFs = fs as jest.Mocked<typeof fs>;

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

const GIT_ROOT = '/home/chris/workspace/syrf';
const MANIFEST_CONTENT = 'config.json';

const baseArgv = {
  source: '/syrf-main',
  destination: '/syrf-feature',
  manifestFile: '.wtlinkrc',
  dryRun: false,
  type: 'hard' as const,
  yes: true, // Skip confirmation prompt in tests
};

describe('link-configs', () => {
  beforeEach(() => {
    jest.clearAllMocks();

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
        const filePath = args[1] ?? '';
        return {
          pid: 0,
          output: ['', filePath, ''],
          stdout: filePath,
          stderr: '',
          status: 0,
          signal: null,
          error: undefined,
        } as unknown as SpawnSyncReturns<string>;
      }

      if (args[0] === 'worktree') {
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

    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(MANIFEST_CONTENT);
    mockedFs.statSync.mockReturnValue({
      isDirectory: () => true,
    } as unknown as fs.Stats);
  });

  it('creates hard links by default', () => {
    run(baseArgv);
    expect(mockedFs.linkSync).toHaveBeenCalledWith(
      expect.stringContaining('syrf-main/config.json'),
      expect.stringContaining('syrf-feature/config.json')
    );
  });

  it('creates symbolic links when type is symbolic', () => {
    run({ ...baseArgv, type: 'symbolic' });
    expect(mockedFs.symlinkSync).toHaveBeenCalledWith(
      expect.stringContaining('syrf-main/config.json'),
      expect.stringContaining('syrf-feature/config.json')
    );
  });

  it('does not create links in dry-run mode', () => {
    run({ ...baseArgv, dryRun: true });
    expect(mockedFs.linkSync).not.toHaveBeenCalled();
    expect(mockedFs.symlinkSync).not.toHaveBeenCalled();
  });

  it('throws an error when manifest file is missing', () => {
    mockedFs.existsSync.mockImplementation((filePath: fs.PathLike) => {
      if (typeof filePath === 'string' && filePath.endsWith('.txt')) {
        return false;
      }
      return true;
    });

    expect(() => run(baseArgv)).toThrow('Manifest file not found');
  });

  it('throws an error when source directory is missing', () => {
    mockedFs.existsSync.mockImplementation((filePath: fs.PathLike) => {
      if (typeof filePath === 'string' && filePath.includes('syrf-main')) {
        return false;
      }
      return true;
    });

    expect(() => run(baseArgv)).toThrow('Source directory does not exist');
  });

  it('skips linking when a file is not git-ignored', () => {
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

    run(baseArgv);
    expect(mockedFs.linkSync).not.toHaveBeenCalled();
  });

  it('warns when a source file is missing', () => {
    mockedFs.existsSync.mockImplementation((filePath: fs.PathLike) => {
      if (typeof filePath === 'string' && filePath.endsWith('syrf-main/config.json')) {
        return false;
      }
      return true;
    });

    const warnSpy = jest.spyOn(console, 'warn');
    run(baseArgv);

    expect(mockedFs.linkSync).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('WARNING: Source file not found')
    );
  });

  it('auto-detects the source worktree when omitted', () => {
    const worktreeOutput = `worktree /syrf-main
HEAD abc
branch refs/heads/main

worktree ${GIT_ROOT}
HEAD def
branch refs/heads/feature
`;

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
      if (args[0] === 'worktree') {
        return {
          pid: 0,
          output: ['', worktreeOutput, ''],
          stdout: worktreeOutput,
          stderr: '',
          status: 0,
          signal: null,
          error: undefined,
        } as unknown as SpawnSyncReturns<string>;
      }
      if (args[0] === 'check-ignore') {
        const filePath = args[1] ?? '';
        return {
          pid: 0,
          output: ['', filePath, ''],
          stdout: filePath,
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

    run({
      manifestFile: baseArgv.manifestFile,
      dryRun: false,
      type: 'hard',
      yes: true,
    });

    expect(mockedFs.linkSync).toHaveBeenCalledWith(
      expect.stringContaining('syrf-main/config.json'),
      expect.stringContaining('workspace/syrf/config.json')
    );
  });

  it('throws when auto-detection cannot find another worktree', () => {
    const worktreeOutput = `worktree ${GIT_ROOT}
HEAD abc
branch refs/heads/feature
`;

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
      if (args[0] === 'worktree') {
        return {
          pid: 0,
          output: ['', worktreeOutput, ''],
          stdout: worktreeOutput,
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
        status: 1,
        signal: null,
        error: undefined,
      } as unknown as SpawnSyncReturns<string>;
    });

    expect(() =>
      run({
        manifestFile: baseArgv.manifestFile,
        dryRun: false,
        type: 'hard',
        yes: true,
      })
    ).toThrow('Unable to detect an alternate worktree');
  });
});
