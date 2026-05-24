const fs = require('fs');
const content = fs.readFileSync('src/components/Maps.tsx', 'utf-8');
const lines = content.split('\n');

let startIdx = lines.findIndex(l => l.includes('export function Maps'));
let endIdx = lines.findIndex(l => l.includes('const treeNodeTemplate'));

if (startIdx !== -1 && endIdx !== -1) {
    const exportsFile = fs.readFileSync('src/hooks/useAuraJourney.ts', 'utf-8');
    const exportsMatch = exportsFile.match(/return\s*\{([\s\S]*)\}\s*;/);
    let exportsList = [];
    if (exportsMatch) {
       const block = exportsMatch[1];
       exportsList = block.split('\n').filter(l => l.trim()).map(l => l.replace(',', '').trim());
       // eliminate any non-valid identifiers
       exportsList = exportsList.filter(l => /^[a-zA-Z0-9_]+$/.test(l));
    }
    
    // add import
    const importStr = `import { useAuraJourney } from "../hooks/useAuraJourney";`;
    const newComponentTop = `export function Maps({ onBack, tripId }: { onBack?: () => void; tripId?: string | null }) {\n  const toast = useRef<Toast>(null);\n  const { \n    ${exportsList.join(',\n    ')}\n  } = useAuraJourney({ tripId, toast });\n`;
    
    const newLines = [
        ...lines.slice(0, startIdx),
        newComponentTop,
        ...lines.slice(endIdx)
    ];
    
    // add import only if missing
    if (!newLines.join('\n').includes('useAuraJourney')) {
        newLines.splice(2, 0, importStr);
    }
    
    fs.writeFileSync('src/components/Maps.tsx', newLines.join('\n'));
    console.log('Replaced successfully ' + exportsList.length);
} else {
    console.log('Could not find boundaries');
}
