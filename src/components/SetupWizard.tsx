import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../db';
import { vibrate, HAPITCS } from '../lib/haptics';
import { WizardState } from '../types';
import { Plus, X } from 'lucide-react';
import { TabMenu } from 'primereact/tabmenu';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { safeRandomUUID } from '../lib/uuid';

interface SetupWizardProps {
  onComplete: (tripId: string) => void;
  onCancel?: () => void;
  editingTripId?: string | null;
}

export function SetupWizard({ onComplete, onCancel, editingTripId }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [state, setState] = useState<WizardState>({
    learningGoal: '',
    psychology: { reason: '', motivation: '', target: '', anxieties: '' },
    stations: [],
    dailyDuration: 30,
    learningDays: [0, 1, 2, 3, 4],
    theme: 'cards'
  });

  useEffect(() => {
    if (editingTripId) {
      const loadTripData = async () => {
        try {
          const trip = await db.userSettings.get(editingTripId);
          if (trip) {
            const dbStations = await db.stations.orderBy('order').toArray();
            const dbTasks = await db.tasks.toArray();

            const mappedStations = dbStations.map(st => ({
              id: st.id,
              icon: st.icon || 'pi pi-flag-fill',
              name: st.name,
              description: st.description,
              targetDate: st.targetDate,
              tasks: dbTasks
                .filter(t => t.stationId === st.id)
                .map(t => ({ id: t.id, title: t.title, type: t.type, isCompleted: t.isCompleted, parentId: t.parentId }))
            }));

            setState({
              learningGoal: trip.learningGoal,
              psychology: trip.psychology || { reason: '', motivation: '', target: '', anxieties: '' },
              stations: mappedStations,
              dailyDuration: trip.dailyDuration || 30,
              learningDays: trip.learningDays || [0, 1, 2, 3, 4],
              theme: trip.theme || 'cards'
            });
          }
        } catch (error) {
          console.error("Error loading trip data", error);
        }
      };
      loadTripData();
    }
  }, [editingTripId]);

  const nextStep = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    if (step < 6) setStep(step + 1);
  };

  const prevStep = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    if (step > 1) setStep(step - 1);
  };

  const handleSave = async () => {
    vibrate(HAPITCS.COMPLETE);
    const uid = editingTripId || safeRandomUUID();
    
    // Load metadata to retain game performance variables
    const existingTrip = editingTripId ? await db.userSettings.get(editingTripId) : null;
    const gameData = existingTrip?.gameData || {
      fuel: 100,
      xp: 0,
      keys: 0,
      lastReflectionDate: ''
    };

    // Save / update Settings
    await db.userSettings.put({
      id: uid,
      learningGoal: state.learningGoal,
      psychology: state.psychology,
      dailyDuration: state.dailyDuration || 30,
      learningDays: state.learningDays || [0, 1, 2, 3, 4],
      theme: state.theme || 'cards',
      gameData,
      notes: existingTrip?.notes || {},
      timeCapsules: existingTrip?.timeCapsules || {}
    });

    // Delete old stations and tasks to avoid orphans
    if (editingTripId) {
      await db.stations.clear();
      await db.tasks.clear();
    }

    for (let i = 0; i < state.stations.length; i++) {
      const st = state.stations[i];
      const stationId = st.id || safeRandomUUID();
      await db.stations.put({
        id: stationId,
        name: st.name || `خطة ${i + 1}`,
        icon: st.icon || 'pi pi-flag-fill',
        description: st.description,
        targetDate: st.targetDate,
        order: i
      });

      for (const t of st.tasks) {
        if (!t.title.trim()) continue;
        await db.tasks.put({
          id: t.id || safeRandomUUID(),
          title: t.title,
          type: t.type,
          stationId,
          parentId: t.parentId || undefined,
          isCompleted: (t as any).isCompleted || false,
        });
      }
    }
    
    onComplete(uid);
  };

  return (
    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center p-6 z-40">
      <div className="w-[850px] max-w-full h-[92vh] bg-white border border-gray-100 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
         {/* Header */}
         <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
             <div className="flex gap-2" dir="ltr">
               {[1,2,3,4,5,6].map(s => (
                 <div key={s} className={`w-2 h-2 rounded-full transition-all duration-300 ${s === step ? 'bg-blue-900' : 'bg-gray-200'}`} />
               ))}
             </div>
             
             <span className="text-blue-900 font-bold text-sm tracking-widest uppercase">Step 0{step} / 06</span>
         </div>

         {/* Content Area */}
         <div className="flex-1 overflow-y-auto p-6 md:p-12 relative no-scrollbar">
            <AnimatePresence mode="wait">
               <motion.div
                 key={step}
                 initial={{ opacity: 0, scale: 0.98 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.98 }}
                 transition={{ duration: 0.3, ease: 'easeOut' }}
                 className="h-full flex flex-col"
               >
                 {step === 1 && <Step1 state={state} setState={setState} />}
                 {step === 2 && <Step2 state={state} setState={setState} />}
                 {step === 3 && <Step4 state={state} setState={setState} />}
                 {step === 4 && <Step5 state={state} setState={setState} />}
                  {step === 5 && <Step6 state={state} setState={setState} />}
                 {step === 6 && (
                    <div className="flex flex-col h-full overflow-y-auto no-scrollbar pr-1">
                       <StepTheme state={state} setState={setState} />
                       <div className="mt-4 flex flex-col items-center">
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-blue-50 text-blue-900 px-6 py-4 rounded-2xl border border-blue-100 text-center mb-2"
                          >
                             <p className="font-black text-[11px]">✨ رحلتك جاهزة للانطلاق! اضغط حفظ لبدء المغامرة.</p>
                          </motion.div>
                       </div>
                    </div>
                  )}
               </motion.div>
            </AnimatePresence>

            {/* Cancel/Exit Confirmation Dialog */}
            <Dialog
              visible={showCancelConfirm}
              onHide={() => setShowCancelConfirm(false)}
              header={
                <div
                  className="flex items-center gap-2 text-rose-600 font-extrabold pr-4 text-2xl font-sans"
                  dir="rtl"
                >
                  <i className="pi pi-exclamation-triangle text-2xl text-rose-500 animate-bounce"></i>
                  <span>تأكيد الإغلاق</span>
                </div>
              }
              className="w-[98vw] max-w-sm font-sans mx-4 text-xl"
              closable
              dismissableMask
            >
              <div className="space-y-5 pt-2 text-right font-sans mb-1" dir="rtl">
                <p className="text-xl font-medium text-gray-800 leading-snug">
                  هل تريد إلغاء إعداد الرحلة والعودة؟
                  <br />
                  <span className="text-base text-rose-500 block mt-2 font-bold bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                    ⚠️ ستفقد تقدمك الحالي.
                  </span>
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    label="نعم، إلغاء"
                    icon="pi pi-trash"
                    className="flex-1 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 text-white rounded-xl py-3 text-lg font-bold border-none hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                    onClick={() => {
                      setShowCancelConfirm(false);
                      if (onCancel) onCancel();
                    }}
                  />
                  <Button
                    label="تراجع ومتابعة"
                    icon="pi pi-check"
                    className="flex-1 bg-gray-105 text-gray-750 rounded-xl py-3 text-lg font-semibold border-none hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
                    onClick={() => setShowCancelConfirm(false)}
                  />
                </div>
              </div>
            </Dialog>
         </div>

         {/* Footer Action */}
         <div className="px-6 md:px-12 py-8 bg-gray-50/50 flex justify-between items-center border-t border-gray-100">
             {step > 1 ? (
               <button onClick={prevStep} className="text-gray-400 font-medium hover:text-gray-700 transition">ارجع</button>
             ) : <div className="w-10"></div>}
             
             {step === 6 ? (
                <button onClick={handleSave} className="px-10 py-4 bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-950 hover:brightness-110 text-white rounded-xl font-bold shadow-lg shadow-blue-950/20 active:scale-95 transition-all outline-none border-none cursor-pointer">
                  حفظ وابدأ الرحلة
                </button>
             ) : (
                <div className="flex gap-3 items-center">
                  {step === 1 && (
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(true)}
                      className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all outline-none border-none cursor-pointer"
                    >
                      رجوع
                    </button>
                  )}
                  <button 
                    onClick={nextStep} 
                    disabled={step === 1 && !state.learningGoal.trim()}
                    className="px-10 py-4 bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-950 hover:brightness-110 text-white disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:shadow-none rounded-xl font-bold shadow-lg shadow-blue-950/20 active:scale-95 transition-all outline-none border-none cursor-pointer"
                  >المتابعة</button>
                </div>
             )}
         </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// STEP COMPONENTS
// -------------------------------------------------------------

const Step1 = ({ state, setState }: any) => (
  <div className="flex flex-col gap-10 mt-4">
    <div className="space-y-4">
      <label className="text-3xl font-bold text-blue-950 block">عايز تتعلم ايه؟</label>
      <p className="text-gray-400">حدد المجال الأساسي الذي ترغب في إتقانه خلال هذه الرحلة</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { title: 'تطوير الويب الكامل', desc: 'Next.js, TypeScript, React' },
        { title: 'تصميم تجربة المستخدم', desc: 'Figma, UX Research, UI Design' },
        { title: 'علوم البيانات والذكاء الاصطناعي', desc: 'Python, SQL, Machine Learning' },
        { title: 'اللغات الأجنبية', desc: 'English, German, Spanish' },
        { title: 'ريادة الأعمال والإدارة', desc: 'Marketing, Strategy, Leadership' },
        { title: 'التسويق الرقمي', desc: 'SEO, Content, Ads' },
        { title: 'كتابة المحتوى', desc: 'Storytelling, Copywriting' },
        { title: 'الأمن السيبراني', desc: 'Networking, Ethical Hacking' }
      ].map((item, idx) => (
         <div 
           key={idx} 
           onClick={() => setState({...state, learningGoal: item.title})}
           className={`p-6 border-2 rounded-2xl cursor-pointer transition-colors ${state.learningGoal === item.title ? 'border-blue-900 bg-blue-50/30' : 'border-gray-100 hover:border-blue-200'}`}
         >
           <span className={`text-xl font-bold ${state.learningGoal === item.title ? 'text-blue-900' : 'text-gray-700'}`}>{item.title}</span>
           <p className={`text-sm mt-1 ${state.learningGoal === item.title ? 'text-blue-800/60' : 'text-gray-400'}`}>{item.desc}</p>
         </div>
      ))}
    </div>

    <input 
      type="text"
      className="w-full p-4 bg-gray-50 border-0 rounded-xl text-lg outline-none focus:ring-2 ring-blue-900/10 placeholder-gray-300 transition-all font-bold text-blue-950 mt-4"
      placeholder="أو اكتب مجالاً مخصصاً هنا..."
      value={state.learningGoal}
      onChange={e => setState({...state, learningGoal: e.target.value})}
    />
  </div>
);

const Step2 = ({ state, setState }: any) => (
  <div className="flex flex-col gap-8 pb-10">
     <div>
       <h2 className="text-3xl font-extrabold text-blue-950 mb-2">الاستعداد النفسي</h2>
       <p className="text-gray-400 font-medium">الوضوح النفسي جزء من النجاح.</p>
     </div>
     {[
       { key: 'reason', label: 'السبب (ليه عايز تعمل ده؟)' },
       { key: 'motivation', label: 'الدافع (ايه اللي بيحمسك؟)' },
       { key: 'target', label: 'الهدف النهائي' },
       { key: 'anxieties', label: 'المخاوف (ايه اللي مقلقك؟)' }
     ].map((item, idx) => (
       <div key={item.key} className="flex flex-col gap-3">
         <label className="text-sm font-bold text-gray-700">{item.label}</label>
         <textarea
           className="w-full border-0 rounded-2xl p-4 bg-gray-50 outline-none focus:ring-2 ring-blue-900/10 transition-all resize-none h-24 placeholder-gray-300 font-medium text-blue-950"
           value={state.psychology[item.key]}
           onChange={e => setState({ ...state, psychology: { ...state.psychology, [item.key]: e.target.value }})}
         />
       </div>
     ))}
  </div>
);

const StepTheme = ({ state, setState }: any) => {
  const themes = [
    { 
      id: 'cards', 
      name: 'ثيم الكروت', 
      desc: 'يعرض الخطط كبطاقات متتالية بتصميم عصري وأنيق.',
      icon: 'pi pi-clone'
    },
    { 
      id: 'calendar', 
      name: 'ثيم التقويم', 
      desc: 'يعرض الخطط والمهام بتنسيق تقويمي منظم.',
      icon: 'pi pi-calendar' 
    }
  ];

  return (
    <div className="flex flex-col gap-6 pb-6 text-right font-sans" dir="rtl">
      <div>
        <h2 className="text-2xl font-black text-blue-950 mb-2">اختر الثيم المفضل</h2>
        <p className="text-slate-400 font-bold text-xs">خصص مظهر رحلتك بالطريقة التي تفضل رؤية خططك بها.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-4">
        {themes.map(t => (
          <div 
            key={t.id}
            onClick={() => {
              vibrate(HAPITCS.MAJOR_CLICK);
              setState({...state, theme: t.id});
            }}
            className={`p-6 border-2 rounded-3xl cursor-pointer transition-all flex items-center gap-6 ${
              state.theme === t.id 
              ? 'border-blue-900 bg-blue-50/50 shadow-lg scale-[1.01]' 
              : 'border-slate-100 hover:border-blue-200 bg-white shadow-sm'
            }`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
              state.theme === t.id ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              <i className={`${t.icon} text-2xl`}></i>
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-black mb-1 ${state.theme === t.id ? 'text-blue-900' : 'text-slate-800'}`}>
                {t.name}
              </h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                {t.desc}
              </p>
            </div>
            {state.theme === t.id && (
              <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center">
                 <i className="pi pi-check text-[10px] font-black"></i>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const PRESTIGIOUS_ICONS = [
  { value: 'pi pi-flag-fill', label: 'علم البداية' },
  { value: 'pi pi-star-fill', label: 'نجمة المجد' },
  { value: 'pi pi-code', label: 'برمجة وتطوير' },
  { value: 'pi pi-book', label: 'كتاب المعرفة' },
  { value: 'pi pi-send', label: 'انطلاق صاروخي' },
  { value: 'pi pi-trophy', label: 'كأس البطولة' },
  { value: 'pi pi-briefcase', label: 'عمل واحتراف' },
  { value: 'pi pi-compass', label: 'بوصلة توجيه' },
  { value: 'pi pi-bolt', label: 'طاقة وحماس' },
  { value: 'pi pi-lightbulb', label: 'فكرة متميزة' },
  { value: 'pi pi-key', label: 'مفتاح النجاح' },
  { value: 'pi pi-chart-line', label: 'تقدم تصاعدي' },
  { value: 'pi pi-shield', label: 'قوة وحماية' },
  { value: 'pi pi-heart-fill', label: 'شغف وعزيمة' },
  { value: 'pi pi-globe', label: 'عالمي' },
  { value: 'pi pi-palette', label: 'فن وإبداع' },
  { value: 'pi pi-camera', label: 'توثيق اللحظة' },
  { value: 'pi pi-cloud', label: 'حوسبة سحابية' },
  { value: 'pi pi-megaphone', label: 'تسويق وانتشار' },
  { value: 'pi pi-map', label: 'تخطيط جغرافي' },
  { value: 'pi pi-pencil', label: 'تحرير النصوص' },
  { value: 'pi pi-wallet', label: 'إدارة مالية' },
  { value: 'pi pi-cog', label: 'إعدادات هندسية' },
  { value: 'pi pi-database', label: 'قواعد بيانات' },
];

const Step4 = ({ state, setState }: any) => {
  const [activeSelectIdx, setActiveSelectIdx] = useState<number | null>(null);

  const addStation = () => setState({
    ...state, 
    stations: [...state.stations, { id: safeRandomUUID(), icon: 'pi pi-flag-fill', name: '', description: '', targetDate: '', tasks: [] }]
  });
  const updateStation = (i: number, field: string, val: string) => {
    const arr = [...state.stations];
    arr[i] = { ...arr[i], [field]: val };
    setState({...state, stations: arr});
  };
  const removeStation = (i: number) => {
    const arr = state.stations.filter((_, idx) => idx !== i);
    setState({...state, stations: arr});
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-extrabold text-blue-950">تخطيط الخطط</h2>
        <button 
          onClick={addStation} 
          className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center hover:bg-blue-800 transition-all shadow-md active:scale-95 cursor-pointer border-none"
          title="إضافة خطة جديدة"
        >
          <Plus size={20} />
        </button>
      </div>
      
      <div className="flex flex-col gap-4">
        {state.stations.map((st: any, i: number) => (
          <div key={st.id} className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm flex flex-col gap-4 relative">
            <button onClick={() => removeStation(i)} className="absolute top-5 left-5 text-gray-300 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer">
              <X size={20} />
            </button>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  vibrate(HAPITCS.MAJOR_CLICK);
                  setActiveSelectIdx(i);
                }}
                className="w-14 h-14 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 rounded-xl outline-none transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                title="اضغط لتغيير الأيقونة الفخمة"
              >
                {st.icon && st.icon.startsWith('pi ') ? (
                  <i className={`${st.icon} text-2xl`}></i>
                ) : (
                  <span className="text-2xl select-none">{st.icon || '📍'}</span>
                )}
              </button>
              <input 
                className="flex-1 px-4 bg-gray-50 border-0 rounded-xl font-bold outline-none focus:ring-2 ring-blue-900/10 transition-colors text-blue-950 placeholder-gray-300" 
                placeholder="اسم الخطة" 
                value={st.name} 
                onChange={e => updateStation(i, 'name', e.target.value)} 
              />
            </div>
            
            <textarea 
              className="w-full p-4 bg-gray-50 border-0 rounded-xl outline-none text-sm resize-none h-24 focus:ring-2 ring-blue-900/10 transition-colors text-blue-950 placeholder-gray-300 font-medium" 
              placeholder="وصف قصير للخطة" 
              value={st.description} 
              onChange={e => updateStation(i, 'description', e.target.value)} 
            />
            
            <input 
              type="date" 
              className="w-full p-4 bg-gray-50 border-0 rounded-xl outline-none text-sm focus:ring-2 ring-blue-900/10 transition-colors text-gray-500 font-medium" 
              value={st.targetDate} 
              onChange={e => updateStation(i, 'targetDate', e.target.value)} 
            />
          </div>
        ))}
      </div>
      
      {/* Prestigious Icons Picker Dialog */}
      <Dialog
        header={
          <div className="flex items-center gap-2 text-blue-950 font-extrabold pr-4 text-sm" dir="rtl">
            🌟 اختر أيقونة فخمة للخطة
          </div>
        }
        visible={activeSelectIdx !== null}
        onHide={() => setActiveSelectIdx(null)}
        className="w-[90vw] max-w-sm font-sans mx-4"
        closable
        dismissableMask
      >
        <div className="grid grid-cols-4 gap-3 p-2 text-right font-sans" dir="rtl">
          {PRESTIGIOUS_ICONS.map((icon, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (activeSelectIdx !== null) {
                  vibrate(HAPITCS.GUIDANCE);
                  updateStation(activeSelectIdx, 'icon', icon.value);
                  setActiveSelectIdx(null);
                }
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 hover:bg-blue-600 hover:text-white transition-all cursor-pointer border border-transparent shadow-xs text-blue-900 group"
              title={icon.label}
            >
              <i className={`${icon.value} text-2xl group-hover:scale-110 group-hover:text-white transition-all`}></i>
              <span className="text-[9px] text-gray-400 mt-1.5 truncate max-w-full group-hover:text-white transition-colors">{icon.label}</span>
            </button>
          ))}
        </div>
      </Dialog>
    </div>
  );
};

const Step5 = ({ state, setState }: any) => {
  const [selectedStation, setSelectedStation] = useState(0);

  if (state.stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-4 animate-fade-in">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
           <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <p className="text-gray-500 font-medium font-sans">من فضلك عُد للخطوة ارجعة وأضف خطة واحدة على الأقل.</p>
      </div>
    );
  }

  const addTask = (stationIdx: number, type: 'main' | 'sub' | 'side', parentId?: string) => {
    const arr = [...state.stations];
    arr[stationIdx].tasks.push({ 
      id: safeRandomUUID(), 
      title: '', 
      type,
      parentId: parentId || undefined
    });
    setState({...state, stations: arr});
  };

  const updateTask = (stationIdx: number, taskIdx: number, title: string) => {
    const arr = [...state.stations];
    arr[stationIdx].tasks[taskIdx].title = title;
    setState({...state, stations: arr});
  };

  const removeTask = (stationIdx: number, taskIdx: number) => {
    const arr = [...state.stations];
    const taskToRemove = arr[stationIdx].tasks[taskIdx];
    if (taskToRemove.type === 'main') {
      arr[stationIdx].tasks = arr[stationIdx].tasks.filter(
        (t: any) => t.id !== taskToRemove.id && t.parentId !== taskToRemove.id
      );
    } else {
      arr[stationIdx].tasks.splice(taskIdx, 1);
    }
    setState({...state, stations: arr});
  };

  const currentStation = state.stations[selectedStation];
  const mainTasks = currentStation.tasks.filter((t: any) => t.type === 'main');
  const sideTasks = currentStation.tasks.filter((t: any) => t.type === 'side');

  return (
    <div className="flex flex-col h-full font-sans text-right" dir="rtl">
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h2 className="text-xl md:text-2xl font-black text-blue-950">توزيع المهام المنظم</h2>
        </div>
        
        <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full font-black text-slate-500 flex items-center gap-2">
           <i className="pi pi-map-marker text-[9px]"></i>
           تخطيط المسار
        </span>
      </div>
      
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 px-1 no-scrollbar shrink-0" dir="rtl">
        {state.stations.map((st: any, idx: number) => {
          const isActive = selectedStation === idx;
          return (
            <button
              key={idx}
              onClick={() => setSelectedStation(idx)}
              className={`relative flex items-center justify-center whitespace-nowrap transition-all rounded-xl ${
                isActive
                  ? "p-[2.5px] bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 shadow-md scale-[1.02]"
                  : "p-[1.5px] bg-slate-200 hover:bg-slate-300 active:scale-95"
              }`}
            >
              <div className={`w-full h-full rounded-[9.5px] px-5 py-2.5 flex items-center justify-center ${isActive ? "bg-white" : "bg-slate-50"}`}>
                <span className={`font-bold text-sm transition-colors ${isActive ? "text-blue-950" : "text-slate-600"}`}>
                  {st.name || `خطة ${idx + 1}`}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto pb-10 flex flex-col gap-4 pl-1 pr-1">
        <TabView className="custom-wizard-tabs">
          {/* Tab 1: Core & Sub Tasks */}
          <TabPanel 
            header="🔋 المهام الأساسية" 
            headerClassName="font-sans font-black text-xs"
          >
            <div className="flex flex-col gap-6 bg-gradient-to-br from-blue-50/20 via-slate-50/10 to-transparent p-6 rounded-3xl border border-blue-900/5 shadow-sm mt-4">
              <div className="flex items-center justify-between pb-4 border-b border-blue-900/10">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shadow-3xs">
                    <i className="pi pi-bolt text-sm"></i>
                  </span>
                  <h3 className="font-extrabold text-blue-950 text-base">المهام الأساسية والفرعية</h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2.5 py-1 bg-blue-50 text-blue-900 rounded-lg border border-blue-100/50">الأساسية (+30 XP) | الفرعية (+15 XP)</span>
                  <button 
                    onClick={() => addTask(selectedStation, 'main')}
                    className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center hover:bg-blue-800 transition-all shadow-md active:scale-95 cursor-pointer border-none shrink-0"
                    title="أضف مهمة رئيسية جديدة"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                {mainTasks.length === 0 && (
                  <div className="text-center py-8 text-xs text-gray-400 font-medium border border-dashed border-gray-200 rounded-xl bg-gray-50/20">
                    لا يوجد مهام رئيسية مضافة لهذه الخطة بعد. اضغط على زر (+) أعلاه لإضافة أول مهمة!
                  </div>
                )}

                {mainTasks.map((t: any) => {
                  const absoluteIdx = currentStation.tasks.findIndex((ts: any) => ts.id === t.id);
                  const subTasks = currentStation.tasks.filter((sub: any) => sub.type === 'sub' && sub.parentId === t.id);

                  return (
                    <div key={t.id} className="bg-white border border-slate-100 p-4 rounded-xl shadow-3xs space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="flex-none text-[10px] font-extrabold bg-blue-50 text-blue-900 rounded-md px-2 py-1 select-none">أساسية</span>
                        <input 
                          className="flex-1 p-3 border border-slate-100 bg-slate-50/40 rounded-xl outline-none focus:ring-2 ring-blue-900/10 transition-all text-xs font-bold text-blue-950 placeholder-gray-300" 
                          placeholder="مثال: كتابة مراجعة شاملة لأساسيات اللغة..." 
                          value={t.title} 
                          onChange={e => updateTask(selectedStation, absoluteIdx, e.target.value)} 
                        />
                        <button 
                          onClick={() => removeTask(selectedStation, absoluteIdx)} 
                          className="p-3 text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-100 rounded-xl transition-all shrink-0 cursor-pointer"
                        >
                          <i className="pi pi-trash text-xs"></i>
                        </button>
                      </div>

                      <div className="mr-6 pr-4 border-r-2 border-dashed border-slate-100/80 space-y-3">
                        {subTasks.map((sub: any) => {
                          const absoluteSubIdx = currentStation.tasks.findIndex((ts: any) => ts.id === sub.id);
                          return (
                            <div key={sub.id} className="flex items-center gap-2">
                              <span className="flex-none text-[9px] font-bold bg-indigo-50 text-indigo-700 rounded-md px-1.5 py-0.5 select-none">فرعية</span>
                              <input 
                                className="flex-1 p-2 border border-slate-100 bg-white rounded-lg outline-none focus:ring-2 ring-indigo-600/10 transition-all text-xs font-medium text-gray-700 placeholder-gray-300" 
                                placeholder="اكتب تفصيلاً فرعياً..." 
                                value={sub.title} 
                                onChange={e => updateTask(selectedStation, absoluteSubIdx, e.target.value)} 
                              />
                              <button 
                                onClick={() => removeTask(selectedStation, absoluteSubIdx)} 
                                className="p-2 text-gray-300 hover:text-rose-500 rounded-lg transition-colors shrink-0 cursor-pointer"
                              >
                                <i className="pi pi-times text-[10px]"></i>
                              </button>
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => addTask(selectedStation, 'sub', t.id)}
                          className="flex items-center gap-1.5 text-[10px] text-indigo-700 font-bold hover:text-indigo-900 hover:bg-indigo-50/50 transition-all py-1.5 px-3 bg-transparent rounded-lg border border-dashed border-indigo-200/50 cursor-pointer font-sans"
                        >
                          <i className="pi pi-plus text-[8px] font-black"></i>
                          <span>إضافة مهمة فرعية 🧩</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabPanel>

          {/* Tab 2: Side Tasks (Skills/Bonus) */}
          <TabPanel 
            header="🧠 مهارات جانبية" 
            headerClassName="font-sans font-black text-xs"
          >
            <div className="flex flex-col gap-5 bg-gradient-to-br from-amber-50/10 to-transparent p-6 rounded-3xl border border-amber-900/5 shadow-sm mt-4">
              <div className="flex items-center justify-between pb-4 border-b border-amber-900/10">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-3xs">
                    <i className="pi pi-sparkles text-sm"></i>
                  </span>
                  <h3 className="font-extrabold text-blue-950 text-base">مهارات وقدرات جانبية (بونص)</h3>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-100/50">مفاتيح إضافية (+25 XP)</span>
                  <button 
                    onClick={() => addTask(selectedStation, 'side')}
                    className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700 transition-all shadow-md active:scale-95 cursor-pointer border-none shrink-0"
                    title="إضافة مهمة جانبية إضافية"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 mt-2">
                {sideTasks.length === 0 && (
                  <div className="text-center py-10 text-xs text-gray-400 font-medium border border-dashed border-amber-100/40 rounded-xl bg-amber-50/10">
                    لا توجد مهارات جانبية مضافة للخطة الحالية بعد. اضغط على زر (+) أعلاه لإضافة مهارة!
                  </div>
                )}
                {sideTasks.map((t: any) => {
                  const absoluteIdx = currentStation.tasks.findIndex((ts: any) => ts.id === t.id);
                  return (
                    <div key={t.id} className="flex gap-2">
                      <span className="flex-none text-[10px] font-extrabold bg-amber-50 text-amber-700 rounded-md px-2 py-3 select-none flex items-center">جانبية</span>
                      <input 
                        className="flex-1 p-3 border border-slate-100 bg-white rounded-xl outline-none focus:ring-2 ring-amber-600/10 transition-colors text-xs font-medium text-gray-700 placeholder-gray-300 shadow-3xs" 
                        placeholder="مثال: التدرب على المفردات لمدة 15 دقيقة إضافية..." 
                        value={t.title} 
                        onChange={e => updateTask(selectedStation, absoluteIdx, e.target.value)} 
                      />
                      <button 
                        onClick={() => removeTask(selectedStation, absoluteIdx)} 
                        className="p-3 text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-100 rounded-xl transition-all shrink-0 cursor-pointer font-sans"
                      >
                        <i className="pi pi-trash text-xs"></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>

      <style>{`
        .custom-wizard-tabs .p-tabview-nav {
          background: transparent !important;
          border-bottom: 2px solid #f8fafc !important;
          display: flex !important;
          gap: 12px !important;
        }
        .custom-wizard-tabs .p-tabview-nav li {
          margin-bottom: -2px !important;
        }
        .custom-wizard-tabs .p-tabview-nav li .p-tabview-nav-link {
          background: transparent !important;
          border: none !important;
          border-bottom: 2px solid transparent !important;
          padding: 12px 24px !important;
          font-weight: 900 !important;
          font-size: 13px !important;
          transition: all 0.2s !important;
          color: #94a3b8 !important;
          border-radius: 0 !important;
        }
        .custom-wizard-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link {
          color: #1e3a8a !important;
          border-bottom-color: #1e3a8a !important;
        }
        .custom-wizard-tabs .p-tabview-panels {
          padding: 0 !important;
          background: transparent !important;
        }
      `}</style>
      <div className="hidden" />

    </div>
  );
};

const Step6 = ({ state, setState }: any) => {
  const arabicDays = [
    { name: 'الأحد', val: 0 },
    { name: 'الاثنين', val: 1 },
    { name: 'الثلاثاء', val: 2 },
    { name: 'الأربعاء', val: 3 },
    { name: 'الخميس', val: 4 },
    { name: 'الجمعة', val: 5 },
    { name: 'السبت', val: 6 }
  ];

  const presets = [15, 30, 45, 60, 90];

  const toggleDay = (dayVal: number) => {
    vibrate(HAPITCS.GUIDANCE);
    const currentDays = state.learningDays || [];
    let updated;
    if (currentDays.includes(dayVal)) {
      if (currentDays.length > 1) {
        updated = currentDays.filter((d: number) => d !== dayVal);
      } else {
        updated = currentDays;
      }
    } else {
      updated = [...currentDays, dayVal];
    }
    setState({ ...state, learningDays: updated });
  };

  return (
    <div className="flex flex-col gap-6 pb-6 text-right font-sans" dir="rtl">
      <div>
        <h2 className="text-2xl font-black text-blue-950 mb-2">منهجية وروتين التعلم</h2>
        <p className="text-slate-400 font-bold text-xs">حدد مدة تعهدك بالتعلم اليومي وجدول تكرارك المخصص للحفاظ على تقدمك المتتالي.</p>
      </div>

      {/* Daily Duration */}
      <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
        <label className="text-sm font-extrabold text-blue-950 flex items-center gap-2">
          <span>🕒 مدة التعلم اليومية (بالدقائق)</span>
        </label>
        
        <div className="flex items-center gap-4">
          <input
            type="number"
            min="5"
            max="480"
            className="w-24 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 ring-blue-900/10 bg-white text-center font-bold text-base text-blue-950 transition-all font-mono"
            value={state.dailyDuration || ''}
            onChange={e => {
              const val = parseInt(e.target.value) || 0;
              setState({ ...state, dailyDuration: val });
            }}
          />
          <span className="text-xs font-bold text-slate-400">دقيقة في اليوم</span>
        </div>

        {/* Duration Quick Presets */}
        <div className="flex flex-wrap gap-2 mt-1 font-sans">
          {presets.map(min => {
            const isActive = state.dailyDuration === min;
            return (
              <button
                key={min}
                type="button"
                onClick={() => {
                  vibrate(HAPITCS.MAJOR_CLICK);
                  setState({ ...state, dailyDuration: min });
                }}
                className={`px-3 py-1.5 rounded-xl border text-[11px] font-black transition-all cursor-pointer font-sans ${
                  isActive 
                    ? 'border-blue-900 bg-blue-50 text-blue-900 shadow-3xs hover:brightness-105' 
                    : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300'
                }`}
              >
                {min} دقيقة
              </button>
            );
          })}
        </div>
      </div>

      {/* Frequency - Custom Days */}
      <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-extrabold text-blue-950 flex items-center gap-2">
            <span>📅 تكرار التعلم الأسبوعي (مخصص)</span>
          </label>
          <span className="text-[10px] font-black px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100/50 rounded-full">
            جدول مخصص
          </span>
        </div>
        <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
          الأيام المحددة هي أيام التعلم الإلزامية الخاصة بك. وسيكون التزامك سليماً طالما أنك تنجز المهام/التقييمات في أيام التعلم، بينما تمنحك الأيام الأخرى فرصة للاستراحة دون كسر تقدمك المتتالي (Streak).
        </p>

        {/* Weekdays Selector */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-2">
          {arabicDays.map(day => {
            const isSelected = (state.learningDays || []).includes(day.val);
            return (
              <button
                key={day.val}
                type="button"
                onClick={() => toggleDay(day.val)}
                className={`py-3 rounded-xl font-bold flex flex-col items-center justify-center transition-all cursor-pointer select-none border ${
                  isSelected
                    ? 'bg-gradient-to-br from-blue-800 via-indigo-700 to-indigo-900 border-indigo-700 text-white shadow-sm'
                    : 'bg-white border-slate-200 hover:border-indigo-200 text-slate-600'
                }`}
              >
                <span className="text-xs font-black">{day.name}</span>
                <span className={`text-[8px] mt-0.5 block font-medium ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {isSelected ? 'تعلم' : 'راحة'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
