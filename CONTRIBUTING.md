# Contributing to GitInk

Thank you for your interest in contributing to GitInk! We welcome contributions of all kinds, including bug fixes, feature requests, documentation improvements, and feedback.

Please take a moment to review this document to ensure a smooth contribution process.

---

## Development Setup

To set up a local development environment for GitInk:

### Prerequisites
* [Node.js](https://nodejs.org/) (Version >= 20 is recommended)
* npm (Version >= 10)
* A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/).

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Talha12Shiekh/gitink.git
   cd gitink
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

---

## Local Development Workflow

All source files are written in TypeScript and located in the `src/` directory.

### Building the Project
Before submitting changes, compile the TypeScript code and bundle the GitHub Action executable:
```bash
npm run build
```
This runs `tsc` to compile TypeScript to JS, and uses `@vercel/ncc` to generate the compiled standalone action bundle in the `dist/action-bundle` directory.

### Testing Locally
You can test the CLI functionality locally by piping code diffs into the entry point file:
```bash
# Pipe unstaged git diffs directly into the local runner in dry-run mode
git diff | npm start -- --dry-run
```

---

## Code Guidelines
* **TypeScript**: Ensure all new files and modifications are fully typed. Avoid using `any` unless absolutely necessary.
* **Code Style**: We use ESLint to maintain code quality. Run code compilation to verify there are no syntax or linter warnings.
* **Configurations**: Ensure default local files like `.gitink.json` are handled cleanly without breaking backward compatibility.

---

## Submitting Pull Requests

1. **Fork and Branch**: Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Build and Commit**: Stage and commit your changes. Ensure you run `npm run build` so that the bundled output in `dist/` is updated to include your changes.
3. **Describe Your PR**: We highly encourage using GitInk itself (or the dry-run CLI output) to generate your pull request title and description!
4. **Submit**: Open a Pull Request on GitHub targeting the `main` branch. A maintainer will review your changes shortly.
