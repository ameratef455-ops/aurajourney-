const fs = require('fs');

const extractCode = fs.readFileSync('reflection_extract.txt', 'utf-8');

// These are the identified props from reviewing the Maps.tsx file manually/previously
const propsList = [
    'reflectionSidebar', 'setReflectionSidebar', 'reflectionActiveTab', 'setReflectionActiveTab',
    'createTabHeader', 'gData', 'hasReflectedToday', 'undertakeReflection', 'today', 'takeRestDay',
    'totalTasksWithSub', 'completedTasksCount', 'isAllTasksCompleted', 'totalWeeklyTasks',
    'completedWeeklyTasks', 'isAllWeeklyTasksCompleted', 'user', 'selectedStation', 'noteText',
    'setNoteText', 'setActiveNoteStationId', 'saveJournalNote', 'editingNote', 'setEditingNote',
    'cancelEditingNote', 'updateJournalNote', 'startEditingNote', 'deleteJournalNote', 'setSelectedStation',
    'takeMicroRest'
];

// build interface
const interfaceString = `
export interface ReflectionSidebarProps {
  reflectionSidebar: boolean;
  setReflectionSidebar: (val: boolean) => void;
  reflectionActiveTab: number;
  setReflectionActiveTab: (val: number) => void;
  createTabHeader: (icon: string, label: string) => (options: any) => JSX.Element;
  gData: any;
  hasReflectedToday: boolean;
  undertakeReflection: () => void;
  today: string;
  takeRestDay: () => void;
  takeMicroRest: (duration: number) => void;
  totalTasksWithSub: number;
  completedTasksCount: number;
  isAllTasksCompleted: boolean;
  totalWeeklyTasks: number;
  completedWeeklyTasks: number;
  isAllWeeklyTasksCompleted: boolean;
  user: any;
  selectedStation: string | null;
  noteText: string;
  setNoteText: (val: string) => void;
  setActiveNoteStationId: (val: string) => void;
  saveJournalNote: () => void;
  editingNote: { index: number; text: string } | null;
  setEditingNote: (val: { index: number; text: string } | null) => void;
  cancelEditingNote: () => void;
  updateJournalNote: (stationId: string) => void;
  startEditingNote: (index: number, text: string) => void;
  deleteJournalNote: (stationId: string, index: number) => void;
  setSelectedStation: (val: string | null) => void;
}
`;

const imports = `import React from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { motion, AnimatePresence } from 'motion/react';
`;

const componentStart = `export function ReflectionSidebar({
  ${propsList.join(',\n  ')}
}: ReflectionSidebarProps) {
  return (
`;

const componentCode = imports + interfaceString + componentStart + extractCode.replace('{/* FAB 2 - Compass and Reflection Utilities Sidebar (Tabbed) */}', '') + `\n  );\n}\n`;

fs.writeFileSync('src/components/ReflectionSidebar.tsx', componentCode);
console.log('ReflectionSidebar.tsx generated');

const mapsTsx = fs.readFileSync('src/components/Maps.tsx', 'utf-8');
const lines = mapsTsx.split('\n');

const reflectionStart = lines.findIndex(l => l.includes('{/* FAB 2 - Compass and Reflection Utilities Sidebar (Tabbed) */}'));
let reflectionEnd = -1;
for (let i = reflectionStart + 1; i < lines.length; i++) {
    if (lines[i].includes('</Dialog>')) {
        reflectionEnd = i;
        break; 
    }
}

if (reflectionStart !== -1 && reflectionEnd !== -1) {
    const propsSpread = propsList.map(p => \`\${p} = {\${p}}\`).join('\\n        ');
    const importStatement = \`import { ReflectionSidebar } from "./ReflectionSidebar";\`;
    const replaceStr = \`      {/* FAB 2 - Compass and Reflection Utilities Sidebar (Tabbed) */}
      <ReflectionSidebar 
        \${propsSpread}
      />\`;
      
    let newLines = [
        ...lines.slice(0, reflectionStart),
        replaceStr,
        ...lines.slice(reflectionEnd + 1)
    ];
    
    // Add import statement at line 20
    newLines.splice(20, 0, importStatement);
    fs.writeFileSync('src/components/Maps.tsx', newLines.join('\\n'));
    console.log('Maps.tsx updated successfully');
} else {
    console.log('Maps.tsx modification failed');
}

