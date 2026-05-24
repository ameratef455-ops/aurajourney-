const cp = require('child_process');
const fs = require('fs');
fs.writeFileSync('src/components/Maps.tsx', cp.execSync('git show HEAD:src/components/Maps.tsx'));
console.log('Restored map from git show');
