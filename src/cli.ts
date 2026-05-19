import { createRequire } from 'node:module';

import { Command } from 'commander';

import { initProject } from './commands/init.js';
import { setupProject } from './commands/setup.js';
import { formatExplain } from './commands/explain.js';
import { doctorProject } from './commands/doctor.js';
import { CLAUDE_HOOKS, PROJECT_FILES } from './config/paths.js';

function readVersion(): string {
  const req = createRequire(import.meta.url);
  for (const rel of ['../package.json', '../../package.json']) {
    try {
      return (req(rel) as { version: string }).version;
    } catch {
      /* try next */
    }
  }
  return '0.0.0';
}

const DEFAULT_PLUGIN_DATA_DIR = PROJECT_FILES.generatedCacheDir;
const NOT_CONFIGURED_MESSAGE = 'claude-remote-config is not configured for this project.\n';
const SETUP_COMPLETE_MESSAGE = 'claude-remote-config setup complete.\n';

interface GlobalOptions {
  project?: string;
  pluginData?: string;
  offline?: boolean;
  frozenLockfile?: boolean;
  gitignore?: boolean;
  verbose?: boolean;
}

const program = new Command();

program
  .name('claude-remote-config')
  .description('Materialize shared versioned Claude Code configuration into local generated project files.')
  .version(readVersion());

function addCommonOptions(command: Command): Command {
  return command
    .option('--project <path>', 'project directory', process.cwd())
    .option('--plugin-data <path>', 'plugin data directory', DEFAULT_PLUGIN_DATA_DIR)
    .option('--offline', 'use cached remote only', false)
    .option('--frozen-lockfile', 'fail if lockfile would change', false)
    .option('--no-gitignore', 'do not update .gitignore')
    .option('--verbose', 'print verbose output', false);
}

addCommonOptions(program.command('init'))
  .option('--hook-mode', 'format output for Claude Code hook usage', false)
  .action(async (options: GlobalOptions & { hookMode?: boolean }) => {
    await run(async () => {
      const result = await initProject({
        projectDir: options.project ?? process.cwd(),
        pluginDataDir: options.pluginData ?? DEFAULT_PLUGIN_DATA_DIR,
        hookMode: options.hookMode,
        offline: options.offline,
        frozenLockfile: options.frozenLockfile,
        gitignore: options.gitignore,
        verbose: options.verbose,
      });

      if (options.hookMode) {
        if (result.summary) {
          process.stdout.write(
            JSON.stringify({
              hookSpecificOutput: {
                hookEventName: CLAUDE_HOOKS.sessionStart,
                additionalContext: result.summary,
              },
            }) + '\n',
          );
        }
      } else {
        process.stdout.write(result.summary || NOT_CONFIGURED_MESSAGE);
      }
    }, options.hookMode);
  });

addCommonOptions(program.command('sync')).action(async (options: GlobalOptions) => {
  await run(async () => {
    const result = await initProject({
      projectDir: options.project ?? process.cwd(),
      pluginDataDir: options.pluginData ?? DEFAULT_PLUGIN_DATA_DIR,
      offline: options.offline,
      frozenLockfile: options.frozenLockfile,
      gitignore: options.gitignore,
      verbose: options.verbose,
    });
    process.stdout.write(result.summary || NOT_CONFIGURED_MESSAGE);
  });
});

program
  .command('setup')
  .option('--project <path>', 'project directory', process.cwd())
  .requiredOption('--remote <remote>', 'remote rules repository')
  .option('--ref <ref>', 'remote ref (tag, branch, or SHA; defaults to origin/HEAD)')
  .action(async (options: { project: string; remote: string; ref?: string }) => {
    await run(async () => {
      await setupProject({ projectDir: options.project, remote: options.remote, ref: options.ref });
      process.stdout.write(SETUP_COMPLETE_MESSAGE);
    });
  });

addCommonOptions(program.command('explain')).action(async (options: GlobalOptions) => {
  await run(async () => {
    const result = await initProject({
      projectDir: options.project ?? process.cwd(),
      pluginDataDir: options.pluginData ?? DEFAULT_PLUGIN_DATA_DIR,
      offline: options.offline,
      frozenLockfile: options.frozenLockfile,
      gitignore: false,
      dryRun: true,
      verbose: options.verbose,
    });
    process.stdout.write(formatExplain(result));
  });
});

program
  .command('doctor')
  .option('--project <path>', 'project directory', process.cwd())
  .action(async (options: { project: string }) => {
    await run(async () => {
      process.stdout.write(await doctorProject(options.project));
    });
  });

addCommonOptions(program.command('print')).action(async (options: GlobalOptions) => {
  await run(async () => {
    const result = await initProject({
      projectDir: options.project ?? process.cwd(),
      pluginDataDir: options.pluginData ?? DEFAULT_PLUGIN_DATA_DIR,
      offline: options.offline,
      frozenLockfile: options.frozenLockfile,
      gitignore: false,
      dryRun: true,
      verbose: options.verbose,
    });
    process.stdout.write(result.summary || NOT_CONFIGURED_MESSAGE);
  });
});

async function run(fn: () => Promise<void>, hookMode = false): Promise<void> {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (hookMode) {
      process.stdout.write(`claude-remote-config warning: ${message}\n`);
      process.exitCode = 0;
      return;
    }

    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}

await program.parseAsync(process.argv);
