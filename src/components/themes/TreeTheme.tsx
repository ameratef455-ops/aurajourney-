import { motion } from "motion/react";
import { vibrate, HAPITCS } from "../../lib/haptics";

interface Station {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

interface TreeThemeProps {
  stations: Station[];
  unlockedStations: string[];
  activeStationId: string | null;
  stationEnergy: Record<string, number>;
  onStationClick: (id: string, isUnlocked: boolean, i: number) => void;
}

export function TreeTheme({ stations, unlockedStations, activeStationId, stationEnergy, onStationClick }: TreeThemeProps) {
  return (
    <div className="w-full max-w-2xl px-6 py-12 flex flex-col items-center" dir="rtl">
      {/* Root/Goal node */}
      <div className="mb-12 relative flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-900 border-4 border-white shadow-2xl flex items-center justify-center text-white z-10">
          <i className="pi pi-compass text-3xl"></i>
        </div>
        <div className="mt-4 bg-white px-6 py-2 rounded-2xl shadow-lg border border-slate-100 z-10">
          <span className="font-black text-blue-900 text-sm">نقطة الانطلاق</span>
        </div>
        
        {/* Main trunk */}
        <div className="absolute top-20 w-1.5 h-16 bg-slate-100 -z-0" />
      </div>

      <div className="w-full flex flex-col items-center gap-16 relative">
        {stations.map((st, i) => {
          const isUnlocked = unlockedStations.includes(st.id);
          const isActive = st.id === activeStationId;
          const isCompleted = stationEnergy[st.id] >= 130;
          const isLeft = i % 2 === 0;

          return (
            <div key={st.id} className={`w-full flex ${isLeft ? 'justify-start md:pr-[50%]' : 'justify-end md:pl-[50%]'} relative`}>
              {/* Connector from trunk to node */}
              <div className={`absolute top-1/2 ${isLeft ? 'left-1/2 right-4 md:right-[50%] md:left-auto' : 'right-1/2 left-4 md:left-[50%] md:right-auto'} h-0.5 bg-slate-100 -translate-y-1/2 -z-10`} />
              
              {/* Node Card */}
              <motion.div
                whileHover={isUnlocked ? { scale: 1.03, y: -5 } : {}}
                whileTap={isUnlocked ? { scale: 0.98 } : {}}
                onClick={() => onStationClick(st.id, isUnlocked, i)}
                className={`w-full max-w-[280px] p-5 rounded-3xl border-2 transition-all cursor-pointer relative z-10 ${
                  isActive 
                  ? 'bg-gradient-to-br from-blue-900 to-indigo-950 border-blue-500 shadow-xl shadow-blue-500/20 text-white' 
                  : (isCompleted 
                    ? 'bg-white border-emerald-500 shadow-lg shadow-emerald-500/10 text-slate-800' 
                    : (isUnlocked 
                      ? 'bg-white border-blue-100 shadow-md text-slate-700' 
                      : 'bg-slate-50 border-slate-100 opacity-60 text-slate-400'))
                }`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-white/10' : (isUnlocked ? 'bg-blue-50' : 'bg-slate-100')
                  }`}>
                    <i className={`${st.icon || 'pi pi-flag-fill'} text-xl ${isActive ? 'text-blue-400' : (isUnlocked ? 'text-blue-600' : 'text-slate-400')}`}></i>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-blue-400' : 'text-blue-600/60'}`}>الخطة {i + 1}</span>
                    <h3 className="font-black text-sm line-clamp-1">{st.name}</h3>
                  </div>
                </div>

                {isUnlocked && (
                  <div className="mt-3 pt-3 border-t border-dashed border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400">بطارية الخطة:</span>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 shadow-inner border border-transparent ${
                      isActive 
                        ? 'bg-blue-600/25 border-blue-400/30 text-blue-300' 
                        : (isCompleted ? 'bg-emerald-100/60 border-emerald-300/40 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600')
                    }`}>
                      {stationEnergy[st.id] || 0}%
                    </div>
                  </div>
                )}

                {!isUnlocked && (
                  <div className="flex items-center gap-2 mt-2">
                    <i className="pi pi-lock text-[10px]"></i>
                    <span className="text-[10px] font-bold">بإنتظار الفتح</span>
                  </div>
                )}
              </motion.div>
            </div>
          );
        })}

        {/* Vertical Trunk Line */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1.5 bg-slate-50 -z-20 md:block hidden" />
      </div>
    </div>
  );
}
