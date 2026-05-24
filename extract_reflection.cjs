const fs = require('fs');

const content = fs.readFileSync('src/components/Maps.tsx', 'utf-8');
const lines = content.split('\n');

const reflectionStart = lines.findIndex(l => l.includes('{/* FAB 2 - Compass and Reflection Utilities Sidebar (Tabbed) */}'));
let reflectionEnd = -1;
for (let i = reflectionStart + 1; i < lines.length; i++) {
    if (lines[i].includes('</Dialog>')) {
        reflectionEnd = i;
        break; // first dialog end after start is the reflection sidebar dialog end
    }
}

if (reflectionStart !== -1 && reflectionEnd !== -1) {
    const sidebarCode = lines.slice(reflectionStart, reflectionEnd + 1).join('\n');
    console.log(sidebarCode.substring(0, 500)); // preview
    
    // We need to parse all the props used in this block
    const allMatches = Array.from(sidebarCode.matchAll(/\b([a-zA-Z0-9_]+)\b/g)).map(m => m[1]);
    const uniqueIdentifiers = [...new Set(allMatches)];
    fs.writeFileSync('reflection_extract_matches.txt', JSON.stringify(uniqueIdentifiers));
    fs.writeFileSync('reflection_extract.txt', sidebarCode);
} else {
    console.log('Not found boundaries. start:' + reflectionStart + ", end:" + reflectionEnd);
}
