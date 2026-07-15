# PRSmith 🛠️🤖

PRSmith is a highly configurable tool and GitHub Action designed to automatically generate professional and descriptive pull request titles and descriptions. By analyzing the git diff of your changes, PRSmith uses **Google Gemini AI** to produce structured, clean, and context-aware markdown content, completely eliminating the repetitive task of writing PR details manually.

It is designed to run either as a **custom GitHub Action** in your CI workflows or as a **CLI tool** anywhere (locally or on other CI providers).

---

## Features

- 🧠 **AI-Powered Analysis**: Uses Gemini (`gemini-2.5-flash` by default) to digest changes and write meaningful summaries.
- 🚀 **Hybrid Flow**: Can be run as a standard GitHub Action or globally via npm (`npx prsmith`).
- 📁 **Smart Diff Filtering**: Automatically ignores non-code files (images, binary files, lockfiles) to optimize processing and context sizes.
- ⚡ **Large Diff Optimizations**: Gracefully handles large diffs by truncating them and reporting omitted files to avoid rate or token limit errors.
- ⚙️ **Configurable**: Fully customizable via a `.prsmith.json` configuration file, letting you fine-tune the system prompt and exclude paths.
- 🏗️ **Conventional Commits**: Prompts the AI to format titles following conventional commits (e.g., `feat: ...`, `fix: ...`).

---

## 📦 GitHub Action Integration

To integrate PRSmith into your repository, add the following workflow file (e.g., `.github/workflows/prsmith.yml`):

```yaml
name: PRSmith - Auto Describe PRs

on:
  pull_request:
    types: [opened, reopened, synchronize]

jobs:
  describe-pr:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write # Required to allow updating the PR details

    steps:
      - name: PRSmith Generator
        uses: your-github-username/PRSmith@v1
        with:
          gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
          # github-token defaults to the automatically provided GITHUB_TOKEN environment variable.
```

### Action Inputs

| Input | Description | Required | Default |
| --- | --- | --- | --- |
| `gemini-api-key` | Google Gemini API Key. | No | Falls back to `GEMINI_API_KEY` env var |
| `github-token` | GitHub access token used to fetch the diff and update the PR. | No | Falls back to `GITHUB_TOKEN` env var |
| `config-path` | Path to a custom PRSmith JSON configuration file. | No | `.prsmith.json` in the root |

---

## 💻 CLI Usage

You can run PRSmith directly on your local machine or in custom pipeline scripting via `npm` / `npx`.

### 1. Local Dry Run (Pipe Diff)
Analyze your uncommitted changes without modifying any GitHub PR:
```bash
git diff main...HEAD | npx prsmith --dry-run --key "YOUR_GEMINI_API_KEY"
```

### 2. Full CLI Execution
Run the update against a specific GitHub repository and PR:
```bash
export GEMINI_API_KEY="your-gemini-api-key"
export GITHUB_TOKEN="your-github-token-with-pull-request-write-perms"

npx prsmith --repo "owner/repo" --pr 42
```

### CLI Arguments

```text
Usage: prsmith [options]

Auto-generate GitHub PR titles and descriptions using Gemini AI

Options:
  -V, --version        output the version number
  -k, --key <key>      Gemini API Key
  -t, --token <token>  GitHub Token
  -r, --repo <repo>    GitHub Repository (owner/repo)
  -p, --pr <number>    PR Number
  -c, --config <path>  Path to config JSON file
  -d, --dry-run        Generate and print description without updating GitHub
  -m, --model <model>  Gemini model to use (default: gemini-2.5-flash)
  -h, --help           display help for command
```

---

## 🛠️ Configuration File (`.prsmith.json`)

You can create a `.prsmith.json` file in the root of your project to customize PRSmith's behavior:

```json
{
  "exclude": [
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "dist/**",
    "build/**",
    "docs/**/*.pdf",
    "*.png",
    "*.jpg"
  ],
  "maxDiffLength": 60000,
  "prompt": "You are a professional developer. Analyze the changes in the diff and generate a markdown description that summarizes changes in a humorous, witty style, and a conventional commit title."
}
```

---

## 🏗️ Development & Building

To contribute or build the code from source:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/PRSmith.git
   cd PRSmith
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build and Bundle:**
   This project uses TypeScript and bundles the output using `@vercel/ncc` so that the action can run in GitHub environment without carrying `node_modules`.
   ```bash
   npm run build
   ```
   This will output the compiled files in `dist/` and the compiled action bundle in `dist/action-bundle/index.js`.
