const fs = require('fs');
const content = fs.readFileSync('src/components/Maps.tsx', 'utf-8');
const lines = content.split('\n');

const hookLines = fs.readFileSync('src/hooks/useAuraJourney.ts', 'utf-8').split('\n');
const returnIdx = hookLines.findIndex(l => l.trim() === 'return {');
const endIdxHook = hookLines.findIndex((l, idx) => idx > returnIdx && l.trim() === '};');

const exportsList = hookLines.slice(returnIdx + 1, endIdxHook).map(l => l.replace(',', '').trim());

let startMapIdx = lines.findIndex(l => l.includes('export function Maps'));
let endMapIdx = lines.findIndex(l => l.includes('const treeNodeTemplate'));

if (startMapIdx !== -1 && endMapIdx !== -1) {
    const importStr = `import { useAuraJourney } from "../hooks/useAuraJourney";`;
    const newComponentTop = `export function Maps({ onBack, tripId }: { onBack?: () => void; tripId?: string | null }) {\n  const toast = useRef<Toast>(null);\n  const { \n    ${exportsList.join(',\n    ')}\n  } = useAuraJourney({ tripId, toast });\n`;

    const newLines = [
        ...lines.slice(0, startMapIdx),
        newComponentTop,
        ...lines.slice(endMapIdx)
    ];

    fs.writeFileSync('src/components/Maps.tsx', newLines.join('\n'));
    console.log('Fixed Maps.tsx with ' + exportsList.length + ' exports!');
} else {
    console.log('Boundaries not found');
}
