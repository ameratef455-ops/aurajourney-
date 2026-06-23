const fs = require('fs');

let awm = fs.readFileSync('src/components/ActivityWizardModal.tsx', 'utf-8');
awm = awm.replace(/import \{ parseLearningResources \} from '\.\.\/utils\/resourceParser';/g, "import { parseLearningResources } from '../types';");
fs.writeFileSync('src/components/ActivityWizardModal.tsx', awm);

let tdm = fs.readFileSync('src/components/TaskDetailsModal.tsx', 'utf-8');
tdm = tdm.replace(/duration: activitiesToMove\.reduce\(\(acc, curr\) => acc \+ \(curr\.duration \|\| 0\), 0\) \|\| 30,/g, '');
fs.writeFileSync('src/components/TaskDetailsModal.tsx', tdm);
console.log('Fixed more TS errors');
