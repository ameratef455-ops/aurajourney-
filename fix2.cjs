const fs = require('fs');
const currentMaps = fs.readFileSync('src/components/Maps.tsx', 'utf-8').split('\n');

const hookLines = fs.readFileSync('src/hooks/useAuraJourney.ts', 'utf-8').split('\n');

const returnStarts = [];
for (let i = 0; i < hookLines.length; i++) {
   if (hookLines[i].includes('return {')) {
       returnStarts.push(i);
   }
}

// Last return statement is the main exports
const returnIdx = returnStarts[returnStarts.length - 1];
console.log('Return idx', returnIdx);

const endIdxHook = hookLines.findIndex((l, idx) => idx > returnIdx && (l.includes('};') || l.trim() === '}'));

const exportsList = hookLines.slice(returnIdx + 1, endIdxHook).map(l => l.replace(',', '').trim()).filter(Boolean);
console.log('Found exports', exportsList);

let startMapIdx = currentMaps.findIndex(l => l.includes('export function Maps'));
let endMapIdx = currentMaps.findIndex(l => l.includes('const treeNodeTemplate'));

if (startMapIdx !== -1 && endMapIdx !== -1) {
    const importStr = `import { useAuraJourney } from "../hooks/useAuraJourney";`;
    const newComponentTop = `export function Maps({ onBack, tripId }: { onBack?: () => void; tripId?: string | null }) {\n  const toast = useRef<Toast>(null);\n  const { \n    ${exportsList.join(',\n    ')}\n  } = useAuraJourney({ tripId, toast });\n`;

    const newLines = [
        ...currentMaps.slice(0, startMapIdx),
        newComponentTop,
        ...currentMaps.slice(endMapIdx)
    ];

    fs.writeFileSync('src/components/Maps.tsx', newLines.join('\n'));
    console.log('Fixed Maps.tsx with ' + exportsList.length + ' exports!');
} else {
    console.log('Boundaries not found');
}
