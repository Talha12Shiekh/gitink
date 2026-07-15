# GitInk

[![Build Status](https://img.shields.io/github/actions/workflow/status/Talha12Shiekh/PRSmith/gitlink.yml)](https://github.com/Talha12Shiekh/PRSmith/actions)
[![Coverage Status](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/Talha12Shiekh/PRSmith)
[![npm version](https://img.shields.io/npm/v/gitink)](https://www.npmjs.com/package/gitink)
[![License](https://img.shields.io/npm/l/gitink)](https://github.com/Talha12Shiekh/PRSmith/blob/main/LICENSE)

Automatically generate pull request titles and descriptions using AI.

```text
$ git diff | npx gitink --dry-run
Read git diff from stdin.
Analyzing diff and generating content...

Title: feat: add local storage caching for session validation

Description:
## Summary
This pull request introduces local storage caching for user sessions to reduce redundant verification requests.

## Key Changes
- Modified src/auth.ts to check cache before calling verify endpoint.
- Added session expiration validation helper in src/utils.ts.
```

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Usage](#usage)
  - [CLI Mode](#cli-mode)
  - [GitHub Action Mode](#github-action-mode)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Hybrid Workflow**: Use it as a terminal CLI tool during local development or drop it directly into your GitHub Action workflows.
- **Diff Optimization**: Automatically ignores noisy file changes (such as package lockfiles, assets, and compiled directories) to keep analysis clean.
- **Smart Truncation**: Handles large pull requests safely by truncating excessive diff chunks and listing omitted files in the final analysis.
- **Configurable Prompting**: Allows you to customize the AI's generation instructions and output formatting via a simple configuration file.
- **Structured Output**: Enforces valid JSON schema responses from the API to guarantee error-free formatting.

---

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- An API key for Google Gemini (obtainable from Google AI Studio)

### Installation

You can run GitInk on demand without permanent installation:

```bash
npx gitink --help
```

Alternatively, install it globally on your system:

```bash
npm install -g gitink
```

---

## Usage

### CLI Mode

To run a dry run locally and test GitInk's AI analysis without modifying GitHub, set your API key in your terminal session and pipe the appropriate git diff command:

**For Windows (PowerShell):**
```powershell
$env:GEMINI_API_KEY="your_api_key_here"
```

**For macOS / Linux (Bash):**
```bash
export GEMINI_API_KEY="your_api_key_here"
```

Choose the command that matches the state of your git repository:

* **Analyze unstaged changes only** (local file edits that have not been staged with `git add`):
  ```bash
  git diff | npx gitink --dry-run
  ```

* **Analyze staged changes only** (files you staged with `git add` but have not committed yet):
  ```bash
  git diff --staged | npx gitink --dry-run
  ```

* **Analyze all uncommitted changes** (combines both staged and unstaged edits):
  ```bash
  git diff HEAD | npx gitink --dry-run
  ```

* **Analyze committed changes on your branch** (compares all commits made on your branch since splitting from `main`):
  ```bash
  git diff main...HEAD | npx gitink --dry-run
  ```

To update a specific open pull request on GitHub directly from your terminal:

**For Windows (PowerShell):**
```powershell
$env:GEMINI_API_KEY="your_api_key_here"
$env:GITHUB_TOKEN="your_github_personal_access_token"

npx gitink --repo "owner/repo" --pr 42
```

**For macOS / Linux (Bash):**
```bash
export GEMINI_API_KEY="your_api_key_here"
export GITHUB_TOKEN="your_github_personal_access_token"

npx gitink --repo "owner/repo" --pr 42
```

### CLI Options

You can customize the execution of the CLI using the following options:

```text
Usage: gitink [options]

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

### GitHub Action Mode

To automate PR descriptions on every commit, add this workflow file to your repository at `.github/workflows/gitink.yml`:

```yaml
name: GitInk PR Auto-Describer

on:
  pull_request:
    types: [opened, reopened, synchronize]

jobs:
  describe-pr:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Run GitInk Generator
        uses: Talha12Shiekh/PRSmith@main
        with:
          gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### GitHub Environment Setup

To run GitInk in your repository's actions, you need to configure access credentials:

1. **Set up GEMINI_API_KEY**:
   - Go to your repository on GitHub.
   - Navigate to **Settings** -> **Secrets and variables** -> **Actions**.
   - Click on **New repository secret**.
   - Set the name to `GEMINI_API_KEY` and paste your Gemini API key from Google AI Studio as the value.

2. **Set up GITHUB_TOKEN**:
   - The `GITHUB_TOKEN` is a built-in token automatically created by GitHub for every workflow run. You do not need to manually define it in your secrets.
   - Ensure the workflow has the `permissions: pull-requests: write` property configured (this is already included in the YAML template above) to grant the token access to update your pull request.

---

## Configuration

You can customize GitInk's files validation and prompt settings by creating a `.prsmith.json` file in the root of your project:

```json
{
  "exclude": [
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "dist/**",
    "*.png",
    "*.jpg"
  ],
  "maxDiffLength": 60000,
  "prompt": "Analyze the changes and write a pull request description in a concise, bulleted format. Keep the tone technical and direct."
}
```

---

## Contributing

We welcome community contributions. To set up the project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/Talha12Shiekh/PRSmith.git
   cd PRSmith
   ```
2. Install development dependencies:
   ```bash
   npm install
   ```
3. Compile TypeScript files:
   ```bash
   npm run build
   ```

For detailed coding standards and pull request workflows, please read our [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
