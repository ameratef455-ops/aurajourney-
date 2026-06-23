const fs = require('fs');
let content = fs.readFileSync('src/components/ReviewPathSession.tsx', 'utf-8');

const targetStart = '{localActivities && localActivities.length > 0 ? (';
const targetEnd = '</AnimatePresence>';

const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  // Find where <h3 className="...text-yellow-400">...الأنشطة والخطوات التنفيذية...</h3> is to replace it too
  const h3Start = content.lastIndexOf('<h3', startIndex);
  const executionDivStart = content.lastIndexOf('<motion.div\n                        key="execution"', h3Start);
  
  if(executionDivStart !== -1) {
    const replacement = `<motion.div
                        key="execution"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 md:p-10 shadow-2xl"
                      >
                         <div className="flex items-center justify-between mb-8">
                           <h3 className="text-white font-black text-xl flex items-center gap-3">
                             <Target className="w-6 h-6 text-indigo-400" />
                             الأنشطة التنفيذية
                           </h3>
                           <span className="text-slate-400 font-bold text-sm bg-black/20 px-4 py-2 rounded-xl">{(localActivities || []).length} نشاط</span>
                         </div>

                         {task?.isCompleted && (
                          <div className="mb-6 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[24px] flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3 text-emerald-400 text-right">
                              <CheckCircle2 className="w-6 h-6 shrink-0" />
                              <div>
                                <div className="font-extrabold text-white text-base">
                                  رائع! هذه المهمة مكتملة بالكامل 🏆
                                </div>
                                <div className="text-xs font-semibold text-[#A0B4E8]">
                                  أنجزت كافة الخطوات التنفيذية لتعزيز الفهم والتمكين.
                                </div>
                              </div>
                            </div>
                          </div>
                         )}

                         {(localActivities || []).length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center bg-black/20 border border-dashed border-white/10 rounded-3xl">
                              <Sparkles className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                              <p className="text-slate-500 font-black">
                                لا توجد أنشطة إجرائية مضافة لهذه المهمة.
                              </p>
                            </div>
                         ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(localActivities || []).map((act: any) => (
                                <div key={act.id} className="p-5 rounded-2xl bg-[#0a0f2c]/50 border border-white/10 flex flex-col justify-between hover:border-indigo-500/50 transition-all group shadow-xl">
                                   <div className="space-y-3 mb-6">
                                     <div className="flex items-start justify-between">
                                        <h4 className={\`text-lg font-black leading-tight \${act.isCompleted ? 'text-slate-500 line-through' : 'text-white group-hover:text-indigo-300'} transition-all\`}>
                                          {act.title}
                                        </h4>
                                        {act.isCompleted && (
                                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-4 h-4" />
                                          </div>
                                        )}
                                     </div>
                                     
                                     {act.isSuspended && !act.isCompleted && (
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                                           <Zap className="w-3.5 h-3.5" />
                                           <span className="text-xs font-black tracking-wide">قيد التنفيذ 🧭</span>
                                        </div>
                                     )}
                                   </div>
                                   
                                   <div className="mt-auto">
                                      {act.isCompleted ? (
                                         <button
                                           onClick={(e) => {
                                             e.stopPropagation();
                                             startGuidedActivity(act, false);
                                           }}
                                           className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-slate-700 text-slate-300 text-sm font-black transition-all cursor-pointer"
                                         >
                                           تم الإنجاز (انقر للاستعراض)
                                         </button>
                                      ) : act.isSuspended ? (
                                         <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              finalizeCompletedActivity(act.id);
                                            }}
                                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black text-sm font-black shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                                         >
                                           <CheckCircle2 className="w-4 h-4" />
                                           إنهاء وتقييم النشاط
                                         </button>
                                      ) : (
                                         <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              startGuidedActivity(act, true);
                                            }}
                                            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-indigo-500/20 cursor-pointer"
                                         >
                                           <Play className="w-4 h-4" />
                                           استعراض خطوات التوجيه
                                         </button>
                                      )}
                                   </div>
                                </div>
                              ))}
                            </div>
                         )}
                      </motion.div>\n                    `;
    content = content.substring(0, executionDivStart) + replacement + content.substring(endIndex);
    fs.writeFileSync('src/components/ReviewPathSession.tsx', content);
    console.log('Patched grid successfully');
  } else {
    console.log('Failed to find execution div');
  }
} else {
  console.log('Failed to find markers');
}
