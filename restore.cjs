const cp = require('child_process');
cp.execSync('git restore src/components/Maps.tsx');
console.log('Restored');
