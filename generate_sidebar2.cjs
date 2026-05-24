const fs = require('fs');

const extractCode = fs.readFileSync('reflection_extract.txt', 'utf-8');

const propsList = [
    'reflectionSidebar', 'setReflectionSidebar', 'reflectionActiveTab', 'setReflectionActiveTab',
    'createTabHeader', 'gData', 'hasReflectedToday', 'undertakeReflection', 'takeRestDay',
    'user', 'activeStationId', 'tasks', 'stations', 'unlockedStations', 'stationEnergy'
];

const interfaceString = `
export interface ReflectionSidebarProps {
  reflectionSidebar: boolean;
  setReflectionSidebar: (val: boolean) => void;
  reflectionActiveTab: number;
  setReflectionActiveTab: (val: number) => void;
  createTabHeader: (icon: string, label: string) => (options: any) => JSX.Element;
  gData: { xp: number; keys: number; fuel: number };
  hasReflectedToday: boolean;
  undertakeReflection: () => void;
  takeRestDay: () => void;
  user: any;
  activeStationId: string | null;
  tasks: any[];
  stations: any[];
  unlockedStations: string[];
  stationEnergy: Record<string, number>;
}
`;

const imports = `import React from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { motion } from 'motion/react';
`;

const componentStart = `export function ReflectionSidebar({
  ${propsList.join(',\n  ')}
}: ReflectionSidebarProps) {
  return (
`;

let componentCode = imports + interfaceString + componentStart + extractCode.replace('{/* FAB 2 - Compass and Reflection Utilities Sidebar (Tabbed) */}', '') + `\n  );\n}\n`;

// Clean up Math usage if it misses any import? No, Math is global in JS.
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
    if (!newLines.join('\\n').includes('ReflectionSidebar')) {
        newLines.splice(20, 0, importStatement);
    }
    fs.writeFileSync('src/components/Maps.tsx', newLines.join('\\n'));
    console.log('Maps.tsx updated successfully');
} else {
    console.log('Maps.tsx modification failed');
}
