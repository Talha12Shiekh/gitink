import * as core from '@actions/core';
import { loadConfig } from './config.js';
import { getPullRequestDiff, updatePullRequest, filterAndTruncateDiff } from './github.js';
import { generatePRContent } from './gemini.js';

export async function runAction() {
  try {
    // Read GitHub Action Inputs
    const geminiKeyInput = core.getInput('gemini-api-key');
    const githubTokenInput = core.getInput('github-token');
    const configPathInput = core.getInput('config-path');

    // Load config (merging env variables & event data)
    const config = loadConfig(configPathInput || undefined);

    // Override with Action Inputs if provided
    if (geminiKeyInput) config.geminiApiKey = geminiKeyInput;
    if (githubTokenInput) config.githubToken = githubTokenInput;

    // Validate requirements
    if (!config.geminiApiKey) {
      core.setFailed('Missing Gemini API Key. Provide it via "gemini-api-key" input or GEMINI_API_KEY environment variable.');
      return;
    }
    if (!config.githubToken) {
      core.setFailed('Missing GitHub Token. Provide it via "github-token" input or GITHUB_TOKEN environment variable.');
      return;
    }
    if (!config.repository) {
      core.setFailed('Missing GITHUB_REPOSITORY environment variable.');
      return;
    }
    if (config.prNumber === undefined || isNaN(config.prNumber)) {
      core.setFailed('Missing PR Number. Ensure this action runs on a pull_request trigger.');
      return;
    }

    core.info(`Fetching diff for PR #${config.prNumber} in ${config.repository}...`);
    const diffText = await getPullRequestDiff(config.githubToken, config.repository, config.prNumber);

    if (!diffText || diffText.trim().length === 0) {
      core.warning('Pull Request diff is empty.');
      return;
    }

    core.info('Filtering and truncating diff if necessary...');
    const filteredDiff = filterAndTruncateDiff(diffText, config.exclude, config.maxDiffLength);

    core.info('Requesting PR analysis from Gemini...');
    const result = await generatePRContent(config.geminiApiKey, filteredDiff, config.prompt);

    core.info(`Generated PR Title: ${result.title}`);
    core.info('Updating Pull Request with generated title and description...');
    await updatePullRequest(config.githubToken, config.repository, config.prNumber, result.title, result.description);

    core.info('PR successfully updated by GitInk! 🚀');
  } catch (err: any) {
    core.setFailed(`Action execution failed: ${err.message}`);
  }
}

// Run action
runAction();
