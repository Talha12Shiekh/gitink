import { getOctokit } from '@actions/github';

/**
 * Parses the file path from a git diff chunk header.
 */
function getFilePathFromChunk(chunk: string): string | null {
  const lines = chunk.split('\n');
  for (const line of lines) {
    if (line.startsWith('--- a/')) {
      const p = line.substring(6).trim();
      if (p !== '/dev/null') return p;
    }
    if (line.startsWith('+++ b/')) {
      const p = line.substring(6).trim();
      if (p !== '/dev/null') return p;
    }
  }
  // Fallback to parsing first line if ---/+++ are not found
  const firstLine = lines[0];
  const parts = firstLine.split(' b/');
  if (parts.length > 1) {
    let aPart = parts[0];
    if (aPart.startsWith('a/')) {
      return aPart.substring(2);
    }
  }
  return null;
}

/**
 * Checks if a file path matches any of the exclude glob-like patterns.
 */
function shouldExcludeFile(filePath: string, excludePatterns: string[]): boolean {
  for (const pattern of excludePatterns) {
    // Treat pattern as glob-like regex
    if (pattern.includes('*')) {
      const escaped = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex chars
        .replace(/\*\*/g, '.*')               // double star matches anything
        .replace(/\*/g, '[^/]*');             // single star matches segment
      const regex = new RegExp(`^${escaped}$`);
      if (regex.test(filePath)) return true;
    } else {
      // Direct prefix, suffix, or exact match
      if (filePath === pattern || filePath.startsWith(pattern) || filePath.endsWith(pattern)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Filter and truncate diff text according to configurations.
 */
export function filterAndTruncateDiff(diffText: string, excludePatterns: string[], maxLength: number): string {
  // Split by the git diff header pattern
  const chunks = diffText.split(/^diff --git /m);
  const header = chunks[0] || '';
  
  let currentLength = header.length;
  const includedChunks: string[] = [];
  const omittedFiles: string[] = [];

  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i];
    const fullChunk = 'diff --git ' + chunk;
    const filePath = getFilePathFromChunk(fullChunk);

    if (filePath && shouldExcludeFile(filePath, excludePatterns)) {
      continue;
    }

    if (currentLength + fullChunk.length < maxLength) {
      includedChunks.push(fullChunk);
      currentLength += fullChunk.length;
    } else {
      if (filePath) {
        omittedFiles.push(filePath);
      }
    }
  }

  let finalDiff = includedChunks.join('');
  if (omittedFiles.length > 0) {
    finalDiff += `\n\n... [Diff truncated by PRSmith due to size limits. The following files were omitted from the diff analysis: ${omittedFiles.join(', ')}]`;
  }
  return finalDiff;
}

/**
 * Fetch pull request diff from GitHub.
 */
export async function getPullRequestDiff(
  githubToken: string,
  repository: string,
  prNumber: number
): Promise<string> {
  const [owner, repo] = repository.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid repository format: "${repository}". Expected "owner/repo".`);
  }

  const octokit = getOctokit(githubToken);

  try {
    const response = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
      headers: {
        accept: 'application/vnd.github.v3.diff'
      }
    });

    // In vnd.github.v3.diff mode, response.data is returned as a string diff
    return response.data as unknown as string;
  } catch (err: any) {
    throw new Error(`Failed to fetch diff for PR #${prNumber} on ${repository}: ${err.message}`);
  }
}

/**
 * Update pull request title and description in GitHub.
 */
export async function updatePullRequest(
  githubToken: string,
  repository: string,
  prNumber: number,
  title: string,
  description: string
): Promise<void> {
  const [owner, repo] = repository.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid repository format: "${repository}". Expected "owner/repo".`);
  }

  const octokit = getOctokit(githubToken);

  try {
    await octokit.rest.pulls.update({
      owner,
      repo,
      pull_number: prNumber,
      title: title,
      body: description
    });
  } catch (err: any) {
    throw new Error(`Failed to update PR #${prNumber} on ${repository}: ${err.message}`);
  }
}
