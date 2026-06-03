import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

let currentDir = process.cwd();
console.log('Starting search for .git from:', currentDir);

while (currentDir && currentDir !== '/') {
  const gitPath = path.join(currentDir, '.git');
  if (fs.existsSync(gitPath)) {
    console.log('Found .git folder at:', currentDir);
    try {
      console.log('--- GIT STATUS at', currentDir, '---');
      console.log(execSync('git status', { cwd: currentDir }).toString());
      console.log('--- GIT DIFF (showing last commit changes or uncommitted) ---');
      console.log(execSync('git diff HEAD', { cwd: currentDir }).toString());
    } catch (err: any) {
      console.error('Error running git at', currentDir, err.message);
    }
    break;
  }
  currentDir = path.dirname(currentDir);
}
