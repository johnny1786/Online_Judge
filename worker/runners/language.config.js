/**
 * Language configurations for the Docker sandbox runner.
 *
 * Each entry specifies:
 *   - image: Docker image to use for this language
 *   - filename: source file name inside the container
 *   - buildCmd: optional compile command (null for interpreted languages)
 *   - runCmd: execute command (receives 'input.txt' as stdin when input exists)
 */
export const LANGUAGE_CONFIG = {
  cpp: {
    image: 'gcc:latest',
    filename: 'solution.cpp',
    buildCmd: ['g++', '-O2', '-std=c++17', '-o', '/code/solution', '/code/solution.cpp'],
    runCmd: ['/code/solution'],
  },
  python: {
    image: 'python:3.12-alpine',
    filename: 'solution.py',
    buildCmd: null,
    runCmd: ['python3', '/code/solution.py'],
  },
  javascript: {
    image: 'node:20-alpine',
    filename: 'solution.js',
    buildCmd: null,
    runCmd: ['node', '/code/solution.js'],
  },
};
