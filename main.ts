import { program } from 'commander';
import { Octokit } from '@octokit/rest';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { minimatch } from 'minimatch';
import { z } from 'zod';
import process from 'node:process';

const inputSchema = z.object({
  repoUrl: z.string().url(),
  outputFile: z.string().min(1),
  exclude: z.array(z.string()).optional(),
  include: z.array(z.string()).optional(),
});

// Parse repository URL
function parseRepoUrl(repoUrl: string) {
  const [owner, repo] = repoUrl.replace('https://github.com/', '').split('/');
  return { owner, repo };
}

// Fetch repository content
async function fetchRepoContent(octokit: Octokit, owner: string, repo: string, dirPath: string = '') {
  return await octokit.repos.getContent({ owner, repo, path: dirPath });
}

// Fetch file content
async function fetchFileContent(octokit: Octokit, owner: string, repo: string, filePath: string) {
  return await octokit.repos.getContent({
    owner,
    repo,
    path: filePath,
    mediaType: {
      format: 'raw',
    },
  });
}

// Filter files based on include and exclude patterns
function shouldIncludeFile(filePath: string, options: { exclude: string[]; include: string[]; }) {
  const relativePath = path.relative('', filePath);

  if (options.exclude && options.exclude.some(pattern => minimatch(relativePath, pattern))) {
    return false; // Skip excluded files
  }

  if (options.include && !options.include.some(pattern => minimatch(relativePath, pattern))) {
    return false; // Skip files not included
  }

  return true;
}

// Write output to file
async function writeOutputToFile(outputFile: string, outputData: string) {
  await fs.writeFile(outputFile, outputData, 'utf8');
  console.log(`Files downloaded and written to ${outputFile}`);
}

// Download files from repository, including files in subdirectories
async function downloadFiles(octokit: Octokit, owner: string, repo: string, options: { exclude: string[]; include: string[]; }, dirPath: string = '') {
  const { data: files } = await fetchRepoContent(octokit, owner, repo, dirPath);
  let outputData = '';

  for (const file of Array.isArray(files) ? files : [files]) {
    if (file.type === 'file' && shouldIncludeFile(file.path, options)) {
      const { data: fileContent } = await fetchFileContent(octokit, owner, repo, file.path);
      outputData += `\n\n//file: ${file.path}\n${fileContent}`;
    } else if (file.type === 'dir') {
      // Recursively download files in subdirectories
      outputData += await downloadFiles(octokit, owner, repo, options, file.path);
    }
  }

  return outputData;
}

// Main function to download and prepend files
async function downloadAndPrepend(repoUrl: string, outputFile: string, options: { exclude: string[]; include: string[]; }) {
  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
    const { owner, repo } = parseRepoUrl(repoUrl);
    const outputData = await downloadFiles(octokit, owner, repo, options);
    await writeOutputToFile(outputFile, outputData);
  } catch (error) {
    console.error('Error downloading files:', error);
  }
}

program
  .version('0.0.1')
  .argument('<repo-url>', 'GitHub repository URL')
  .argument('<output-file>', 'Output file path')
  .option('-e, --exclude <patterns>', 'Exclude files matching patterns (comma-separated)', val => val.split(','))
  .option('-i, --include <patterns>', 'Include only files matching patterns (comma-separated)', val => val.split(','))
  .action((repoUrl, outputFile, options) => {
    try {
      // Validate arguments using the Zod schema
      inputSchema.parse({ repoUrl, outputFile, ...options });
      
      downloadAndPrepend(repoUrl, outputFile, options);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
      } else {
        console.error('Unexpected error:', error);
      }
      process.exit(1);
    }
  });

program.parse(process.argv);
