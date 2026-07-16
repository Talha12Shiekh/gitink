import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load local .env file if it exists
dotenv.config();

export interface GitInkConfig {
  geminiApiKey?: string;
  githubToken?: string;
  repository?: string; // Format: "owner/repo"
  prNumber?: number;
  exclude: string[];
  maxDiffLength: number;
  prompt: string;
}

export const DEFAULT_EXCLUDE_PATTERNS = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'cargo.lock',
  'composer.lock',
  'go.sum',
  'poetry.lock',
  'mix.lock',
  '*.png',
  '*.jpg',
  '*.jpeg',
  '*.gif',
  '*.svg',
  '*.ico',
  '*.pdf',
  '*.zip',
  '*.gz',
  '*.tar',
  '*.mp4',
  '*.mp3',
  'dist/**',
  'build/**',
  'node_modules/**'
];

export const DEFAULT_PROMPT = `You are an expert software engineer and code reviewer.
Analyze the git diff of a Pull Request provided below, and generate:
1. A clear, concise, and descriptive Pull Request title (recommended to follow Conventional Commits format, e.g., 'feat: ...', 'fix: ...', 'refactor: ...').
2. A structured, professional pull request description in Markdown format.

The description should include:
- **Summary**: A brief overview of the purpose and goals of these changes.
- **Key Changes**: A detailed bulleted list of modifications, grouped logically (e.g., by module or component), highlighting important file modifications.
- **Type of Change**: A classification (e.g., Feature, Bug Fix, Refactoring, Documentation, Performance).

You MUST respond with a raw JSON object matching the following structure:
{
  "title": "Generated PR Title",
  "description": "Generated PR Description in Markdown format"
}

Do not wrap the JSON output in markdown blocks (like \`\`\`json ... \`\`\`). The response must be a single, valid JSON object containing exactly the "title" and "description" keys.`;

export function loadConfig(configPath?: string): GitInkConfig {
  const defaults: GitInkConfig = {
    geminiApiKey: process.env.GEMINI_API_KEY,
    githubToken: process.env.GITHUB_TOKEN,
    repository: process.env.GITHUB_REPOSITORY,
    prNumber: process.env.PR_NUMBER ? parseInt(process.env.PR_NUMBER, 10) : undefined,
    exclude: DEFAULT_EXCLUDE_PATTERNS,
    maxDiffLength: 60000, // Safe default character length for diff context
    prompt: DEFAULT_PROMPT
  };

  // If GITHUB_EVENT_PATH is set (running in GitHub Action), extract PR number and repository
  if (process.env.GITHUB_EVENT_PATH && fs.existsSync(process.env.GITHUB_EVENT_PATH)) {
    try {
      const eventData = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
      if (eventData.pull_request) {
        defaults.prNumber = eventData.pull_request.number;
      }
      if (eventData.repository) {
        defaults.repository = eventData.repository.full_name;
      }
    } catch (err) {
      console.warn('Failed to parse GitHub Action event payload:', err);
    }
  }

  // Resolve config file path (default to .gitink.json in current directory if not specified)
  const resolvedConfigPath = configPath || path.join(process.cwd(), '.gitink.json');

  if (fs.existsSync(resolvedConfigPath)) {
    try {
      const fileContent = fs.readFileSync(resolvedConfigPath, 'utf8');
      const userConfig = JSON.parse(fileContent);
      
      return {
        geminiApiKey: userConfig.geminiApiKey || defaults.geminiApiKey,
        githubToken: userConfig.githubToken || defaults.githubToken,
        repository: userConfig.repository || defaults.repository,
        prNumber: userConfig.prNumber !== undefined ? userConfig.prNumber : defaults.prNumber,
        exclude: Array.isArray(userConfig.exclude) ? userConfig.exclude : defaults.exclude,
        maxDiffLength: typeof userConfig.maxDiffLength === 'number' ? userConfig.maxDiffLength : defaults.maxDiffLength,
        prompt: userConfig.prompt || defaults.prompt
      };
    } catch (err) {
      console.warn(`Warning: Failed to parse config file at ${resolvedConfigPath}. Using default config.`, err);
    }
  }

  return defaults;
}
