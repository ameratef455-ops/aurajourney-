const fs = require('fs');

let tdm = fs.readFileSync('src/components/TaskDetailsModal.tsx', 'utf-8');
tdm = tdm.replace(/vibrate\(HAPITCS\.LIGHT_CLICK\)/g, 'vibrate(HAPITCS.MAJOR_CLICK)');
tdm = tdm.replace(/title: \`أنشطة مؤجلة - \$\{todayShort\}\`,/g, 'name: `أنشطة مؤجلة - ${todayShort}`,');

// we'll just do a basic string replacement instead of regex since string is easier for multi-line
const oldStationObj = `        deferStation = {
          id: todayStationId,
          name: \`أنشطة مؤجلة - \${todayShort}\`,
          description: "الأنشطة التي قمت بتأجيلها و ترحيلها ليوم إجازتك.",
          type: "custom",
          focusLevel: "متوسط",
          energyLevel: "متوسط",
          category: "مؤجلة",
          order: 9999,
          minMinutes: 30,
          generalNotes: "هذه المحطة تم توليدها تلقائيا للأنشطة المرحلة."
        } as Station;
        await db.stations.put(deferStation);
        if (userSettings) {
          const mapState = userSettings.mapState || { nodes: [], edges: [] };
          mapState.nodes.push({
            id: deferStation.id,
            position: { x: 50, y: 500 },
            data: { label: deferStation.title, type: deferStation.type }
          });
          await db.userSettings.update(userSettings.id, { mapState });
        }`;

const newStationObj = `        deferStation = {
          id: todayStationId,
          name: \`أنشطة مؤجلة - \${todayShort}\`,
          icon: "pi-clock",
          description: "الأنشطة التي قمت بتأجيلها و ترحيلها ليوم إجازتك.",
          generalNotes: "هذه المحطة تم توليدها تلقائيا للأنشطة المرحلة."
        } as Station;
        await db.stations.put(deferStation);
`;

tdm = tdm.replace(oldStationObj, newStationObj);

tdm = tdm.replace(/type: "practice",/g, 'type: "practical",');
tdm = tdm.replace(/energyRequired: task.energyRequired,/g, '');
tdm = tdm.replace(/\{station \? station.title : 'جاري التحميل...'\}/g, '{station ? station.name : \'جاري التحميل...\'}');

fs.writeFileSync('src/components/TaskDetailsModal.tsx', tdm);
console.log('Fixed TaskDetailsModal TS');
