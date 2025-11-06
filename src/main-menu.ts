import inquirer from 'inquirer';
import chalk from 'chalk';
import * as manage from './manage-manifest';
import * as link from './link-configs';
import * as validate from './validate-manifest';

const DEFAULT_MANIFEST = '.wtlinkrc';

export async function showMainMenu(): Promise<void> {
  let running = true;

  while (running) {
    console.clear();
    console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║') + chalk.bold('          Worktree Config Link Manager                             ') + chalk.cyan.bold('║'));
    console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════════════════════╝\n'));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          {
            name: 'Manage config manifest (discover and select files)',
            value: 'manage',
          },
          {
            name: 'Link configs (create links from manifest)',
            value: 'link',
          },
          {
            name: 'Validate manifest (check for issues)',
            value: 'validate',
          },
          new inquirer.Separator(),
          {
            name: 'Help',
            value: 'help',
          },
          {
            name: 'Exit',
            value: 'exit',
          },
        ],
      },
    ]);

    try {
      switch (action) {
        case 'manage':
          await runManage();
          break;
        case 'link':
          await runLink();
          break;
        case 'validate':
          await runValidate();
          break;
        case 'help':
          showHelp();
          await pressAnyKey();
          break;
        case 'exit':
          running = false;
          console.log(chalk.green('\nGoodbye!\n'));
          break;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('\nError:'), errorMessage);
      await pressAnyKey();
    }
  }
}

async function runManage(): Promise<void> {
  console.log('\n');
  await manage.run({
    nonInteractive: false,
    clean: false,
    dryRun: false,
    manifestFile: DEFAULT_MANIFEST,
    backup: false,
  });

  // Ask if user wants to link after managing
  const { shouldLink } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldLink',
      message: 'Would you like to link configs now?',
      default: true,
    },
  ]);

  if (shouldLink) {
    await runLink();
  } else {
    await pressAnyKey();
  }
}

async function runLink(): Promise<void> {
  console.log('\n');
  await link.run({
    manifestFile: DEFAULT_MANIFEST,
    dryRun: false,
    type: 'hard',
    yes: false,
  });
  await pressAnyKey();
}

async function runValidate(): Promise<void> {
  console.log('\n');
  validate.run({
    manifestFile: DEFAULT_MANIFEST,
  });
  await pressAnyKey();
}

function showHelp(): void {
  console.clear();
  console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║') + chalk.bold('          wtlink Help                                               ') + chalk.cyan.bold('║'));
  console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.bold('About wtlink:'));
  console.log('  wtlink helps you share configuration files between git worktrees');
  console.log('  by creating hard links or symbolic links.\n');

  console.log(chalk.bold('Common Workflow:'));
  console.log('  1. ' + chalk.green('Manage') + ' - Discover git-ignored files and select which to link');
  console.log('  2. ' + chalk.blue('Link') + ' - Create links from source worktree to destination\n');

  console.log(chalk.bold('Commands:'));
  console.log('  ' + chalk.green('wtlink') + '              Show this interactive menu');
  console.log('  ' + chalk.green('wtlink manage') + '       Manage manifest interactively');
  console.log('  ' + chalk.green('wtlink link') + '         Link configs between worktrees');
  console.log('  ' + chalk.green('wtlink validate') + '     Validate manifest file\n');

  console.log(chalk.bold('Manifest File:'));
  console.log(`  Default location: ${chalk.cyan('.wtlinkrc')} (in repository root)`);
  console.log(`  The manifest lists which files should be linked\n`);

  console.log(chalk.bold('Documentation:'));
  console.log('  For full documentation, see README.md in tools/wtlink/\n');
}

async function pressAnyKey(): Promise<void> {
  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: 'Press Enter to continue...',
    },
  ]);
}
