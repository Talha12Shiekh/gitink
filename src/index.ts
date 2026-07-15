#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import { loadConfig } from './config.js';
import { getPullRequestDiff, updatePullRequest, filterAndTruncateDiff } from './github.js';
import { generatePRContent } from './gemini.js';

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    // If stdin is interactive (TTY), resolve immediately with empty string
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', () => {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        data += chunk;
      }
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
  });
}

export async function runCLI() {
  const program = new Command();

  program
    .name('gitink')
    .description('Auto-generate GitHub PR titles and descriptions using Gemini AI')
    .version('1.0.0')
    .option('-k, --key <key>', 'Gemini API Key')
    .option('-t, --token <token>', 'GitHub Token')
    .option('-r, --repo <repo>', 'GitHub Repository (owner/repo)')
    .option('-p, --pr <number>', 'PR Number', parseInt)
    .option('-c, --config <path>', 'Path to config JSON file')
    .option('-d, --dry-run', 'Generate and print description without updating GitHub')
    .option('-m, --model <model>', 'Gemini model to use (default: gemini-2.5-flash)')
    .parse(process.argv);

  const options = program.opts();

  // Load config (merging environment and config file)
  const config = loadConfig(options.config);

  // CLI overrides
  if (options.key) config.geminiApiKey = options.key;
  if (options.token) config.githubToken = options.token;
  if (options.repo) config.repository = options.repo;
  if (options.pr) config.prNumber = options.pr;
  if (options.model) config.prompt = options.model; // wait, let's pass model separately below

  const modelName = options.model || 'gemini-2.5-flash';

  // Read diff from stdin first (to support piping)
  let diffText = await readStdin();

  if (!diffText) {
    // If no stdin diff, verify GitHub config is present to fetch it
    if (!config.githubToken) {
      console.error('Error: GitHub Token is required. Set GITHUB_TOKEN environment variable or pass --token.');
      process.exit(1);
    }
    if (!config.repository) {
      console.error('Error: GitHub Repository is required. Set GITHUB_REPOSITORY environment variable or pass --repo.');
      process.exit(1);
    }
    if (config.prNumber === undefined || isNaN(config.prNumber)) {
      console.error('Error: PR Number is required. Set PR_NUMBER environment variable or pass --pr.');
      process.exit(1);
    }

    console.log(`Fetching diff for PR #${config.prNumber} on ${config.repository}...`);
    diffText = await getPullRequestDiff(config.githubToken, config.repository, config.prNumber);
  } else {
    console.log('Read git diff from stdin.');
  }

  if (!diffText || diffText.trim().length === 0) {
    console.warn('Warning: Diff is empty. No changes detected.');
    process.exit(0);
  }

  // Pre-process and filter diff
  const filteredDiff = filterAndTruncateDiff(diffText, config.exclude, config.maxDiffLength);

  if (!config.geminiApiKey) {
    console.error('Error: Gemini API Key is required. Set GEMINI_API_KEY environment variable or pass --key.');
    process.exit(1);
  }

  console.log(`Analyzing diff and generating content with Gemini (${modelName})...`);
  const result = await generatePRContent(config.geminiApiKey, filteredDiff, config.prompt, modelName);

  if (options.dryRun) {
    console.log('\n--- DRY RUN OUTPUT ---');
    console.log(`Title: ${result.title}`);
    console.log(`Description:\n${result.description}`);
    console.log('----------------------');
  } else {
    // If we used stdin, we can't update a PR unless repo and PR number are also provided
    if (!config.githubToken || !config.repository || config.prNumber === undefined) {
      console.error('Error: Cannot update PR because GitHub repository/PR details were not provided.');
      process.exit(1);
    }
    console.log(`Updating PR #${config.prNumber} on ${config.repository}...`);
    await updatePullRequest(config.githubToken, config.repository, config.prNumber, result.title, result.description);
    console.log('PR successfully updated!');
  }
}

// Check if run directly
const isMain = process.argv[1] && (
  process.argv[1].endsWith('index.js') || 
  process.argv[1].endsWith('index.ts') ||
  process.argv[1].endsWith('gitink')
);

if (isMain) {
  runCLI().catch((err) => {
    console.error('Execution failed:', err.message);
    process.exit(1);
  });
}
