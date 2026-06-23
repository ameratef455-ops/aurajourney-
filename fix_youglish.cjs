const fs = require('fs');
let code = fs.readFileSync('src/components/LanguageTools.tsx', 'utf-8');
code = code.replace(/script.async = true;/g, 'script.async = true;\n        script.crossOrigin = "anonymous";\n        script.onerror = (e) => console.error("YouGlish script error", e);');
fs.writeFileSync('src/components/LanguageTools.tsx', code);
console.log('Fixed LanguageTools.tsx');
