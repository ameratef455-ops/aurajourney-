const fs = require('fs');
let awm = fs.readFileSync('src/components/ActivityWizardModal.tsx', 'utf-8');
awm = awm.replace(/res\.title/g, 'res.name');
fs.writeFileSync('src/components/ActivityWizardModal.tsx', awm);
console.log('Fixed ActivityWizardModal TS');
