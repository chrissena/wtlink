import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync, SpawnSyncOptions, SpawnSyncReturns } from 'child_process';

function runGit(args: string[], options: SpawnSyncOptions): void {
  const result = spawnSync('git', args, {
    ...options,
    encoding: 'utf-8',
  });

  if (result.status !== 0) {
    throw new Error(
      `git ${args.join(' ')} failed with code ${result.status}: ${result.stderr || result.stdout}`
    );
  }
}

describe('wtlink CLI (integration)', () => {
  let tmpRoot: string;
  let mainDir: string;
  let featureDir: string;
  let linkRun: typeof import('../src/link-configs').run;
  let validateRun: typeof import('../src/validate-manifest').run;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wtlink-e2e-'));
    mainDir = path.join(tmpRoot, 'main');
    featureDir = path.join(tmpRoot, 'feature');
    fs.mkdirSync(mainDir);

    runGit(['init'], { cwd: mainDir });
    runGit(['config', 'user.email', 'ci@example.com'], { cwd: mainDir });
    runGit(['config', 'user.name', 'CI Bot'], { cwd: mainDir });

    fs.writeFileSync(path.join(mainDir, 'README.md'), '# e2e\n');
    runGit(['add', 'README.md'], { cwd: mainDir });
    runGit(['commit', '-m', 'chore: initial commit'], { cwd: mainDir });
    fs.writeFileSync(path.join(mainDir, '.gitignore'), 'config/local-settings.json\n');
    fs.writeFileSync(
      path.join(mainDir, '.wtlinkrc'),
      'config/local-settings.json\n'
    );
    runGit(['add', '.gitignore', '.wtlinkrc'], { cwd: mainDir });
    runGit(['commit', '-m', 'chore: configure manifest'], { cwd: mainDir });

    runGit(['worktree', 'add', featureDir, '-b', 'feature/e2e'], { cwd: mainDir });

    fs.mkdirSync(path.join(mainDir, 'config'), { recursive: true });
    fs.writeFileSync(
      path.join(mainDir, 'config/local-settings.json'),
      '{"source":true}\n'
    );

    jest.resetModules();
    jest.doMock('child_process', () => {
      const actual = jest.requireActual('child_process');
      return {
        ...actual,
        spawnSync: jest.fn((command: string, args?: ReadonlyArray<string>, options?: SpawnSyncOptions) => {
          if (command !== 'git' || !args) {
            return (actual.spawnSync as typeof spawnSync)(command, args as any, options);
          }

          const joined = args.join(' ');

          if (joined === '--version') {
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

          if (joined === 'rev-parse --show-toplevel') {
            const cwd = options?.cwd ?? process.cwd();
            const root = path.resolve(cwd as string);
            return {
              pid: 0,
              output: ['', root, ''],
              stdout: root,
              stderr: '',
              status: 0,
              signal: null,
              error: undefined,
            } as unknown as SpawnSyncReturns<string>;
          }

          if (joined === 'worktree list --porcelain') {
            const payload = `worktree ${mainDir}\nHEAD abc\nbranch refs/heads/main\n\nworktree ${featureDir}\nHEAD def\nbranch refs/heads/feature/e2e\n`;
            return {
              pid: 0,
              output: ['', payload, ''],
              stdout: payload,
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

          return (actual.spawnSync as typeof spawnSync)(command, args as any, options);
        }),
      };
    });

    ({ run: linkRun } = require('../src/link-configs'));
    ({ run: validateRun } = require('../src/validate-manifest'));
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('links ignored configs using auto-detected worktrees and validates manifest', () => {
    const originalCwd = process.cwd();
    try {
      process.chdir(featureDir);
      const rootCheck = spawnSync('git', ['rev-parse', '--show-toplevel'], {
        cwd: featureDir,
        encoding: 'utf-8',
      });
      expect(rootCheck.status).toBe(0);
      const versionCheck = spawnSync('git', ['--version'], {
        cwd: featureDir,
        encoding: 'utf-8',
      });
      expect(versionCheck.status).toBe(0);
      linkRun({
        manifestFile: '.wtlinkrc',
        dryRun: false,
        type: 'symbolic',
        yes: true,
      });
    } finally {
      process.chdir(originalCwd);
    }

    const destinationFile = path.join(featureDir, 'config/local-settings.json');
    expect(fs.existsSync(destinationFile)).toBe(true);
    expect(fs.lstatSync(destinationFile).isSymbolicLink()).toBe(true);
    expect(fs.readFileSync(destinationFile, 'utf-8')).toBe('{"source":true}\n');

    try {
      process.chdir(mainDir);
      validateRun({
        manifestFile: '.wtlinkrc',
      });
    } finally {
      process.chdir(originalCwd);
    }
  });
});
