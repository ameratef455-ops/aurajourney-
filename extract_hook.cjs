const fs = require('fs');
const content = fs.readFileSync('src/components/Maps.tsx', 'utf-8');
const lines = content.split('\n');

const imports = [];
let i = 0;
while (i < lines.length && (lines[i].startsWith('import') || lines[i].trim() === '')) {
    if (lines[i].includes('lucide-react') || lines[i].includes('confetti') || lines[i].includes('haptics') || lines[i].includes('uuid') || lines[i].includes('db') || lines[i].includes('dexie') || lines[i].includes('react')) {
       if (!lines[i].includes('primereact') && !lines[i].includes('motion/react')) {
          imports.push(lines[i]);
       }
    }
    i++;
}

let startIdx = lines.findIndex(l => l.includes('export function Maps'));
let hookBody = [];
let j = startIdx + 1;
// we read until treeNodeTemplate
while (j < lines.length && !lines[j].includes('const treeNodeTemplate')) {
    hookBody.push(lines[j]);
    j++;
}

// remove const toast = useRef<Toast>(null); from hookBody because it's passed in
hookBody = hookBody.filter(l => !l.includes('const toast = useRef'));

// find all exported names
const exportedNames = new Set();
// match const [a, b] = useState
// match const func = 
// match const val = useMemo
for (const line of hookBody) {
    const stateMatch = line.match(/^\s*const\s+\[(.*?)\]\s*=\s*useState/);
    if (stateMatch) {
       const parts = stateMatch[1].split(',').map(s => s.trim());
       exportedNames.add(parts[0]);
       exportedNames.add(parts[1]);
    }
    const funcMatch = line.match(/^\s*const\s+([a-zA-Z0-9_]+)\s*=\s*(async\s+)?(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/);
    if (funcMatch) {
       exportedNames.add(funcMatch[1]);
    }
    const memoMatch = line.match(/^\s*const\s+([a-zA-Z0-9_]+)\s*=\s*useMemo/);
    if (memoMatch) {
       exportedNames.add(memoMatch[1]);
    }
    const valMatch = line.match(/^\s*const\s+([a-zA-Z0-9_]+)\s*=\s*useLiveQuery/);
    if (valMatch) {
       exportedNames.add(valMatch[1]);
    }
}
exportedNames.add('gData');
exportedNames.add('today');
exportedNames.add('hasReflectedToday');
exportedNames.add('stationEnergy');
exportedNames.add('totalTasksWithSub');
exportedNames.add('completedTasksCount');
exportedNames.add('isAllTasksCompleted');
exportedNames.add('totalWeeklyTasks');
exportedNames.add('completedWeeklyTasks');
exportedNames.add('isAllWeeklyTasksCompleted');

// write hook
let hookCode = `import { useState, useMemo, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { vibrate, HAPITCS } from "../lib/haptics";
import { safeRandomUUID } from "../lib/uuid";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { 
  Atom, BookOpen, Cpu, Brain, Globe, Compass, Music, Palette, Calculator, Code, Rocket, Landmark, Microscope, Telescope, Languages, Binary, Lightbulb, Sigma
} from "lucide-react";

export function useAuraJourney({ tripId, toast }: { tripId?: string | null, toast: any }) {
`;

hookCode += hookBody.join('\n');
hookCode += `
  return {
    ${Array.from(exportedNames).join(',\n    ')}
  };
}
`;

fs.mkdirSync('src/hooks', { recursive: true });
fs.writeFileSync('src/hooks/useAuraJourney.ts', hookCode);
console.log('Hook generated with ' + Array.from(exportedNames).length + ' exports');
