# Concat Files CLI

## Overview
Concat Files CLI is a command-line utility to download and bundle files from a GitHub repository into a single output file. You can optionally include or exclude specific files using pattern matching, making it easy to gather and bundle only the files you need.

## Features
- Download files from a GitHub repository, including nested directories.
- Include or exclude files using pattern matching.
- Bundle all downloaded files into a single output file for easy access and sharing.

## Requirements
- Deno v2.x
- A GitHub account with access to the desired repository (optional)

## Installation
To use Concat Files CLI, clone this repository and install the required dependencies:

```bash
# Clone the repository
git clone <repository-url>

# Navigate into the project directory
cd github-repo-bundler

# Install dependencies
deno install
```

## Usage
To use the bundler, run the following command:

```bash
deno run --allow-read --allow-write --allow-net --allow-env main.ts <repo-url> <output-file> [options]
```

### Arguments
- `<repo-url>`: The URL of the GitHub repository you want to download files from. Example: `https://github.com/user/repository`.
- `<output-file>`: The path where you want to save the bundled output file.

### Options
- `-e, --exclude <patterns>`: Exclude files matching the provided comma-separated patterns.
- `-i, --include <patterns>`: Include only files matching the provided comma-separated patterns.

### Example
```bash
deno run --allow-read --allow-write --allow-net --allow-env main.ts https://github.com/user/repository output.txt -e "*.md,docs/*"
```
In the example above, the tool will download all files from the given GitHub repository, excluding Markdown files and anything inside the `docs` folder.


## Error Handling
- **Validation Errors**: User input is validated using Zod. Any invalid input will trigger a validation error, detailing what needs to be corrected.
- **GitHub API Errors**: Errors during the GitHub API interactions are logged to the console, providing details on what went wrong.


## Contributing
Feel free to open issues or submit pull requests to improve the functionality or fix any issues.

## Acknowledgements
- [Commander](https://github.com/tj/commander.js): For handling CLI commands.
- [Octokit](https://github.com/octokit/rest.js): For interacting with the GitHub API.
- [Zod](https://github.com/colinhacks/zod): For schema validation.
- [minimatch](https://github.com/isaacs/minimatch): For pattern matching of file paths.

