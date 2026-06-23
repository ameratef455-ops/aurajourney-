const fs = require('fs');
let maps = fs.readFileSync('src/components/Maps.tsx', 'utf-8');
maps = maps.replace(/import\('\.\.\/lib\/haptics'\)\.then\(\(\{ playTickSound \}\) => playTickSound\(\)\);/g, 'playTickSound();');
maps = maps.replace(/import \{ vibrate, HAPITCS \} from "\.\.\/lib\/haptics";/g, 'import { vibrate, HAPITCS, playTickSound } from "../lib/haptics";');
fs.writeFileSync('src/components/Maps.tsx', maps);
console.log('Fixed Maps.tsx dynamic imports');
