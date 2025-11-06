import inquirer from 'inquirer';
import chalk from 'chalk';
import * as mainMenu from '../src/main-menu';
import * as manage from '../src/manage-manifest';
import * as link from '../src/link-configs';
import * as validate from '../src/validate-manifest';

jest.mock('inquirer');
jest.mock('../src/manage-manifest');
jest.mock('../src/link-configs');
jest.mock('../src/validate-manifest');

const mockedInquirer = inquirer as jest.Mocked<typeof inquirer>;
const mockedManage = manage as jest.Mocked<typeof manage>;
const mockedLink = link as jest.Mocked<typeof link>;
const mockedValidate = validate as jest.Mocked<typeof validate>;

describe('main-menu', () => {
  let consoleClearSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleClearSpy = jest.spyOn(console, 'clear').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleClearSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('showMainMenu', () => {
    it('should display the main menu and handle exit', async () => {
      mockedInquirer.prompt.mockResolvedValueOnce({ action: 'exit' });

      await mainMenu.showMainMenu();

      expect(consoleClearSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Worktree Config Link Manager')
      );
      expect(mockedInquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: expect.arrayContaining([
            expect.objectContaining({ value: 'manage' }),
            expect.objectContaining({ value: 'link' }),
            expect.objectContaining({ value: 'validate' }),
            expect.objectContaining({ value: 'help' }),
            expect.objectContaining({ value: 'exit' }),
          ]),
        }),
      ]);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        chalk.green('\nGoodbye!\n')
      );
    });

    it('should run manage command and prompt to link', async () => {
      mockedInquirer.prompt
        .mockResolvedValueOnce({ action: 'manage' }) // Main menu choice
        .mockResolvedValueOnce({ shouldLink: true }) // Link after manage
        .mockResolvedValueOnce({ continue: '' }) // Press Enter
        .mockResolvedValueOnce({ action: 'exit' }); // Exit

      mockedManage.run.mockResolvedValueOnce(undefined);
      mockedLink.run.mockResolvedValueOnce(undefined);

      await mainMenu.showMainMenu();

      expect(mockedManage.run).toHaveBeenCalledWith({
        nonInteractive: false,
        clean: false,
        dryRun: false,
        manifestFile: '.wtlinkrc',
        backup: false,
      });
      expect(mockedInquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'confirm',
          name: 'shouldLink',
          message: 'Would you like to link configs now?',
          default: true,
        }),
      ]);
      expect(mockedLink.run).toHaveBeenCalledWith({
        manifestFile: '.wtlinkrc',
        dryRun: false,
        type: 'hard',
        yes: false,
      });
    });

    it('should run manage command and skip linking when user declines', async () => {
      mockedInquirer.prompt
        .mockResolvedValueOnce({ action: 'manage' }) // Main menu choice
        .mockResolvedValueOnce({ shouldLink: false }) // Don't link
        .mockResolvedValueOnce({ continue: '' }) // Press Enter
        .mockResolvedValueOnce({ action: 'exit' }); // Exit

      mockedManage.run.mockResolvedValueOnce(undefined);

      await mainMenu.showMainMenu();

      expect(mockedManage.run).toHaveBeenCalled();
      expect(mockedLink.run).not.toHaveBeenCalled();
    });

    it('should run link command directly', async () => {
      mockedInquirer.prompt
        .mockResolvedValueOnce({ action: 'link' }) // Main menu choice
        .mockResolvedValueOnce({ continue: '' }) // Press Enter
        .mockResolvedValueOnce({ action: 'exit' }); // Exit

      mockedLink.run.mockResolvedValueOnce(undefined);

      await mainMenu.showMainMenu();

      expect(mockedLink.run).toHaveBeenCalledWith({
        manifestFile: '.wtlinkrc',
        dryRun: false,
        type: 'hard',
        yes: false,
      });
    });

    it('should run validate command', async () => {
      mockedInquirer.prompt
        .mockResolvedValueOnce({ action: 'validate' }) // Main menu choice
        .mockResolvedValueOnce({ continue: '' }) // Press Enter
        .mockResolvedValueOnce({ action: 'exit' }); // Exit

      mockedValidate.run.mockReturnValueOnce(undefined);

      await mainMenu.showMainMenu();

      expect(mockedValidate.run).toHaveBeenCalledWith({
        manifestFile: '.wtlinkrc',
      });
    });

    it('should display help and return to menu', async () => {
      mockedInquirer.prompt
        .mockResolvedValueOnce({ action: 'help' }) // Main menu choice
        .mockResolvedValueOnce({ continue: '' }) // Press Enter after help
        .mockResolvedValueOnce({ action: 'exit' }); // Exit

      await mainMenu.showMainMenu();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('wtlink Help')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('About wtlink:')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Common Workflow:')
      );
    });

    it('should handle errors and continue running', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockedInquirer.prompt
        .mockResolvedValueOnce({ action: 'manage' }) // Main menu choice
        .mockResolvedValueOnce({ shouldLink: false }) // No link after error (this won't be reached)
        .mockResolvedValueOnce({ continue: '' }) // Press Enter after error
        .mockResolvedValueOnce({ action: 'exit' }); // Exit

      mockedManage.run.mockRejectedValueOnce(new Error('Test error'));

      await mainMenu.showMainMenu();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        chalk.red('\nError:'),
        'Test error'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should loop through multiple actions before exit', async () => {
      mockedInquirer.prompt
        .mockResolvedValueOnce({ action: 'validate' }) // First action
        .mockResolvedValueOnce({ continue: '' }) // Press Enter after validate
        .mockResolvedValueOnce({ action: 'link' }) // Second action
        .mockResolvedValueOnce({ continue: '' }) // Press Enter after link
        .mockResolvedValueOnce({ action: 'exit' }); // Exit

      mockedValidate.run.mockReturnValue(undefined);
      mockedLink.run.mockResolvedValue(undefined);

      await mainMenu.showMainMenu();

      expect(mockedValidate.run).toHaveBeenCalledTimes(1);
      expect(mockedLink.run).toHaveBeenCalledTimes(1);
      // Should clear 3 times: initial + after validate + after link
      expect(consoleClearSpy).toHaveBeenCalled();
    });

    it('should clear console before each menu display', async () => {
      mockedInquirer.prompt
        .mockResolvedValueOnce({ action: 'help' })
        .mockResolvedValueOnce({ continue: '' })
        .mockResolvedValueOnce({ action: 'exit' });

      await mainMenu.showMainMenu();

      // Should clear at least twice (initial + after help + before exit)
      expect(consoleClearSpy).toHaveBeenCalled();
      expect(consoleClearSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });
});
