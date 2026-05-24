const fs = require('fs');

const mapsTsx = fs.readFileSync('src/components/Maps.tsx', 'utf-8');

// The file was broken by replace(/\\n/g, '\\n')
// Maps.tsx currently looks like: 'import ...\\nexport function Maps ...' (literally escaped \n)
// Let's decode it.
const decoded = mapsTsx.replace(/\\n/g, '\n');

fs.writeFileSync('src/components/Maps.tsx', decoded);
console.log('Decoded Maps.tsx');
