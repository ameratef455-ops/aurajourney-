import { execSync } from 'child_process';
try {
  console.log('--- GIT STATUS ---');
  console.log(execSync('git status').toString());
  console.log('--- GIT DIFF ---');
  console.log(execSync('git diff src/').toString());
} catch (err: any) {
  console.error('Error running git:', err.message, err.stdout?.toString(), err.stderr?.toString());
}
