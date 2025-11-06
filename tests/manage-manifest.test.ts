import { run } from '../src/manage-manifest';
import { execSync } from 'child_process';
import fs from 'fs';
import inquirer from 'inquirer';

// Mock the external dependencies
jest.mock('child_process');
jest.mock('fs');
jest.mock('inquirer', () => ({
  prompt: jest.fn(),
}));

// Cast mocked functions for type safety
const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedInquirer = inquirer as jest.Mocked<typeof inquirer>;

// Silence console.log during tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

const GIT_ROOT = '/home/chris/workspace/syrf';
const DEFAULT_MANIFEST = '.wtlinkrc';

const baseArgv = {
  nonInteractive: false,
  clean: false,
  dryRun: false,
  manifestFile: DEFAULT_MANIFEST,
  backup: false,
};

describe('manage-manifest', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    mockedExecSync.mockImplementation((command: string) => {
      if (command.includes('rev-parse')) return Buffer.from(GIT_ROOT);
      if (command.includes('ls-files')) return Buffer.from('');
      if (command.includes('check-ignore')) return Buffer.from('ignored');
      return Buffer.from('');
    });

    mockedFs.existsSync.mockReturnValue(false);
    mockedFs.readFileSync.mockReturnValue('');
    mockedFs.writeFileSync.mockClear();
    mockedFs.copyFileSync.mockClear();

    // Ensure inquirer.prompt is properly mocked
    if (mockedInquirer.prompt && 'mockClear' in mockedInquirer.prompt) {
      mockedInquirer.prompt.mockClear();
    }
  });

  it('should do nothing if manifest is up to date', async () => {
    mockedExecSync.mockImplementation((command: string) => {
      if (command.includes('rev-parse')) return Buffer.from(GIT_ROOT);
      if (command.includes('ls-files')) return Buffer.from('existing-file.json');
      if (command.includes('check-ignore')) return Buffer.from('existing-file.json');
      return Buffer.from('');
    });
    mockedFs.readFileSync.mockReturnValue('existing-file.json');
    mockedFs.existsSync.mockReturnValue(true);

    await run({ ...baseArgv });

    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should add a new file as commented out in non-interactive mode', async () => {
    mockedExecSync.mockImplementation((command: string) => {
      if (command.includes('rev-parse')) return Buffer.from(GIT_ROOT);
      if (command.includes('ls-files')) return Buffer.from('new-file.json');
      return Buffer.from('');
    });

    await run({ ...baseArgv, nonInteractive: true });

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining(DEFAULT_MANIFEST),
      expect.stringContaining('# new-file.json')
    );
  });

  it('should create a backup file when modifying an existing manifest', async () => {
    mockedExecSync.mockImplementation((command: string) => {
      if (command.includes('rev-parse')) return Buffer.from(GIT_ROOT);
      if (command.includes('ls-files')) return Buffer.from('new-file.json');
      if (command.includes('check-ignore')) return Buffer.from('new-file.json');
      return Buffer.from('');
    });
    mockedFs.existsSync.mockImplementation((filePath: fs.PathLike) => {
      if (typeof filePath !== 'string') return false;
      return filePath.endsWith(DEFAULT_MANIFEST);
    });
    mockedFs.readFileSync.mockReturnValue('');

    await run({ ...baseArgv, nonInteractive: true, backup: true });

    expect(mockedFs.copyFileSync).toHaveBeenCalledWith(
      expect.stringContaining(DEFAULT_MANIFEST),
      expect.stringContaining(DEFAULT_MANIFEST + '.bak')
    );
  });

  it('should not write any files in dry-run mode', async () => {
    mockedExecSync.mockImplementation((command: string) => {
      if (command.includes('rev-parse')) return Buffer.from(GIT_ROOT);
      if (command.includes('ls-files')) return Buffer.from('new-file.json');
      return Buffer.from('');
    });
    mockedFs.existsSync.mockReturnValue(true);

    await run({ ...baseArgv, dryRun: true });

    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    expect(mockedFs.copyFileSync).not.toHaveBeenCalled();
  });
});
