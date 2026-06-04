import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../db';
import { vibrate, HAPITCS } from '../lib/haptics';
import { WizardState, parseLearningResources, serializeLearningResources } from '../types';
import { Plus, X, Sparkles, Youtube, FileText } from 'lucide-react';
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
                .map(t => ({ 
                  id: t.id, 
                  title: t.title, 
                  type: t.type, 
                  isCompleted: t.isCompleted, 
                  parentId: t.parentId, 
                  description: t.description || "",
                  learningResources: t.learningResources || "",
                  youtubeUrl: t.youtubeUrl || "",
                  googleDriveUrl: t.googleDriveUrl || "",
                  youglishKeyword: t.youglishKeyword || "",
                  startMessage: t.startMessage || "",
                  endMessage: t.endMessage || "",
                  activities: t.activities || [],
                }))
            }));

            setState({
              learningGoal: trip.learningGoal,
              psychology: trip.psychology || { reason: '', motivation: '', target: '', anxieties: '' },
              stations: mappedStations,
              dailyDuration: trip.dailyDuration || 30,
              learningDays: trip.learningDays || [0, 1, 2, 3, 4],
              theme: trip.theme || 'cards',
              incentiveTime: trip.incentiveTime || '',
              incentiveDesc: trip.incentiveDesc || ''
            });
          }
        } catch (error) {
          console.error("Error loading trip data", error);
        }
      };
      loadTripData();
    }
  }, [editingTripId]);

  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<any>(null);
  const [editingStationIdx, setEditingStationIdx] = useState<number | null>(null);

  const openTaskModal = (stationIdx: number, type: 'main' | 'sub' | 'side' | 'practical' | 'project' = 'main', taskIdx?: number) => {
    setEditingStationIdx(stationIdx);
    if (taskIdx !== undefined) {
      setTaskToEdit({ ...state.stations[stationIdx].tasks[taskIdx], _idx: taskIdx });
    } else {
      setTaskToEdit({
        id: safeRandomUUID(),
        title: '',
        description: '',
        type,
        startMessage: '',
        endMessage: '',
        activities: [],
        learningResources: '',
        youtubeUrl: '',
        googleDriveUrl: '',
        youglishKeyword: '',
        parentId: undefined
      });
    }
    setIsTaskModalVisible(true);
  };

  const saveTaskFromModal = (updatedTask: any) => {
    if (editingStationIdx === null) return;
    const arr = [...state.stations];
    const { _idx, ...taskData } = updatedTask;
    
    if (_idx !== undefined) {
      arr[editingStationIdx].tasks[_idx] = taskData;
    } else {
      arr[editingStationIdx].tasks.push(taskData);
    }
    
    setState({ ...state, stations: arr });
    setIsTaskModalVisible(false);
    setTaskToEdit(null);
  };

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
      incentiveTime: state.incentiveTime || '',
      incentiveDesc: state.incentiveDesc || '',
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
        order: i,
        generalNotes: st.generalNotes || ""
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
          description: t.description || "",
          learningResources: t.learningResources || "",
          youtubeUrl: t.youtubeUrl || "",
          googleDriveUrl: t.googleDriveUrl || "",
          youglishKeyword: t.youglishKeyword || "",
          startMessage: t.startMessage || "",
          endMessage: t.endMessage || "",
          activities: t.activities || [],
        });
      }
    }
    
    onComplete(uid);
  };

  return (
    <div className="absolute inset-0 bg-white flex flex-col z-40 overflow-hidden">
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
                 {step === 4 && <Step5 state={state} setState={setState} openTaskModal={openTaskModal} />}
                 {step === 5 && <Step6 state={state} setState={setState} />}
                 {step === 6 && (
                    <div className="flex flex-col h-full overflow-y-auto no-scrollbar pr-1">
                       <StepTheme state={state} setState={setState} />
                       <div className="mt-8 flex flex-col items-center">
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

            <TaskEditorModal 
              visible={isTaskModalVisible}
              onHide={() => setIsTaskModalVisible(false)}
              task={taskToEdit}
              mainTasks={editingStationIdx !== null ? state.stations[editingStationIdx].tasks.filter((t: any) => t.type === 'main') : []}
              onSave={saveTaskFromModal}
            />
         </div>

         {/* Footer Action */}
         <div className="px-6 md:px-12 py-8 bg-gray-50/50 flex justify-between items-center border-t border-gray-100">
             {step > 1 ? (
               <button onClick={prevStep} className="text-gray-400 font-medium hover:text-gray-700 transition border-none bg-transparent cursor-pointer">ارجع</button>
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
  );
}

// -------------------------------------------------------------
// TASK EDITOR COMPONENT
// -------------------------------------------------------------

const TaskEditorModal = ({ visible, onHide, task, onSave, mainTasks }: any) => {
  const [localTask, setLocalTask] = useState<any>(null);

  useEffect(() => {
    if (visible && task) {
       setLocalTask(JSON.parse(JSON.stringify(task)));
    }
  }, [visible, task]);

  if (!localTask) return null;

  const updateField = (field: string, val: any) => setLocalTask({ ...localTask, [field]: val });

  const addActivity = () => {
    const acts = [...(localTask.activities || [])];
    acts.push({
      id: safeRandomUUID(),
      title: '',
      guidance: '',
      duration: 15,
      isCompleted: false,
      steps: []
    });
    updateField('activities', acts);
  };

  const updateActivity = (idx: number, field: string, val: any) => {
    const acts = [...localTask.activities];
    acts[idx] = { ...acts[idx], [field]: val };
    updateField('activities', acts);
  };

  const removeActivity = (idx: number) => {
    const acts = localTask.activities.filter((_: any, i: number) => i !== idx);
    updateField('activities', acts);
  };

  const addStep = (actIdx: number) => {
    const acts = [...localTask.activities];
    if (!acts[actIdx].steps) acts[actIdx].steps = [];
    acts[actIdx].steps.push({ id: safeRandomUUID(), title: '', isCompleted: false });
    updateField('activities', acts);
  };

  const updateStep = (actIdx: number, stepIdx: number, val: string) => {
    const acts = [...localTask.activities];
    acts[actIdx].steps[stepIdx].title = val;
    updateField('activities', acts);
  };

  const removeStep = (actIdx: number, stepIdx: number) => {
    const acts = [...localTask.activities];
    acts[actIdx].steps.splice(stepIdx, 1);
    updateField('activities', acts);
  };

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const typeLabels: any = {
    main: { label: 'مهمة أساسية', color: 'bg-blue-600', icon: 'pi pi-bolt' },
    sub: { label: 'مهمة فرعية', color: 'bg-indigo-600', icon: 'pi pi-link' },
    side: { label: 'مهارة جانبية', color: 'bg-amber-600', icon: 'pi pi-sparkles' },
    practical: { label: 'مشروع عملي', color: 'bg-emerald-600', icon: 'pi pi-briefcase' },
    project: { label: 'مشروع الخطة', color: 'bg-purple-600', icon: 'pi pi-folder' }
  };

  const currentType = typeLabels[localTask.type] || typeLabels.main;

  return (
    <Dialog 
      visible={visible} 
      onHide={onHide} 
      header={<div className="flex items-center justify-between w-full pl-8" dir="rtl">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl ${currentType.color} text-white flex items-center justify-center shadow-lg transform rotate-3`}>
            <i className={`${currentType.icon} text-lg`}></i>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-blue-950">إعداد المهمة الشامل</span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full text-white ${currentType.color} uppercase tracking-tighter`}>
                 {currentType.label}
              </span>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">ADVANCED TASK CONFIGURATOR</span>
          </div>
        </div>
      </div>}
      className="w-[95vw] md:w-[750px] font-sans"
      modal
      closable
      dismissableMask
      style={{ borderRadius: '32px' }}
    >
      <div className="flex flex-col gap-6 py-4 px-2" dir="rtl">
        <TabView className="custom-wizard-tabs">
          <TabPanel header="📑 البيانات الأساسية">
            <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black text-blue-900 px-1 flex items-center gap-2">
                        <i className="pi pi-bookmark-fill text-[10px]" />
                        <span>عنوان المهمة</span>
                      </label>
                      <input 
                        className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-[20px] font-bold outline-none focus:ring-4 ring-blue-900/5 focus:bg-white focus:border-blue-100 transition-all text-blue-950 placeholder-slate-300" 
                        placeholder="ماذا سننجز اليوم؟" 
                        value={localTask.title} 
                        onChange={e => updateField('title', e.target.value)} 
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black text-blue-900 px-1 flex items-center gap-2">
                        <i className="pi pi-align-right text-[10px]" />
                        <span>الوصف التفصيلي</span>
                      </label>
                      <textarea 
                        rows={4}
                        className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-[20px] font-medium outline-none focus:ring-4 ring-blue-900/5 focus:bg-white focus:border-blue-100 transition-all text-blue-800 text-sm resize-none placeholder-slate-300" 
                        placeholder="اشرح الهدف من هذه المهمة بوضوح..." 
                        value={localTask.description} 
                        onChange={e => updateField('description', e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-5 bg-violet-50/50 border-2 border-violet-100/30 rounded-[24px] space-y-3">
                       <label className="text-xs font-black text-violet-900 px-1 flex items-center gap-2">
                          <i className="pi pi-comment text-[10px]" />
                          <span>رسالة البدء (التحفيز)</span>
                       </label>
                       <textarea 
                        rows={3}
                        className="w-full p-3 bg-white border border-violet-100 rounded-2xl text-xs font-bold text-violet-900 outline-none focus:ring-4 ring-violet-500/5 transition-all resize-none"
                        placeholder="هيا بنا لنبدأ رحلة التعلم اليوم..."
                        value={localTask.startMessage}
                        onChange={e => updateField('startMessage', e.target.value)}
                      />
                    </div>

                    <div className="p-5 bg-emerald-50/50 border-2 border-emerald-100/30 rounded-[24px] space-y-3">
                       <label className="text-xs font-black text-emerald-900 px-1 flex items-center gap-2">
                          <i className="pi pi-check-circle text-[10px]" />
                           <span>رسالة الإنجاز (المكافأة)</span>
                       </label>
                       <textarea 
                        rows={3}
                        className="w-full p-3 bg-white border border-emerald-100 rounded-2xl text-xs font-bold text-emerald-900 outline-none focus:ring-4 ring-emerald-500/5 transition-all resize-none"
                        placeholder="أحسنت صنعاً! لقد أتممت المهمة بنجاح..."
                        value={localTask.endMessage}
                        onChange={e => updateField('endMessage', e.target.value)}
                      />
                    </div>
                  </div>
               </div>

              {localTask.type === 'sub' && (
                <div className="flex flex-col gap-2 p-4 bg-indigo-50/30 rounded-[20px] border-2 border-indigo-100/50">
                  <label className="text-xs font-black text-indigo-900 px-1 flex items-center gap-2">
                     <i className="pi pi-paperclip text-[10px]" />
                     <span>تابعة للمهمة الرئيسية:</span>
                  </label>
                  <select 
                    className="w-full p-3.5 bg-white border-2 border-indigo-100 rounded-xl font-bold outline-none text-indigo-900 cursor-pointer text-sm"
                    value={localTask.parentId || ''}
                    onChange={e => updateField('parentId', e.target.value)}
                  >
                    <option value="">-- اختر المهمة الأب --</option>
                    {mainTasks.map((mt: any) => (
                      <option key={mt.id} value={mt.id}>{mt.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </TabPanel>

          <TabPanel header="⚡ الأنشطة التنفيذية">
             <div className="space-y-4 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-2">
                   <div>
                     <h4 className="text-base font-black text-blue-950">خطوات التنفيذ العملي</h4>
                     <p className="text-[10px] text-gray-400 font-bold">كل نشاط يحتوي على مجموعة من المهام الإجرائية المحددة</p>
                   </div>
                   <button 
                    onClick={addActivity}
                    className="px-5 py-3 bg-blue-950 text-white rounded-2xl text-[11px] font-black shadow-lg hover:shadow-blue-900/20 transition-all flex items-center gap-2 border-none cursor-pointer active:scale-95"
                   >
                     <Plus size={16} />
                     <span>إضافة نشاط رئيسي</span>
                   </button>
                </div>

                <div className="space-y-6 max-h-[450px] overflow-y-auto no-scrollbar pb-6 pr-1">
                   {localTask.activities?.map((act: any, aIdx: number) => (
                     <div key={act.id} className="p-6 bg-slate-50/40 border-2 border-slate-100/50 rounded-[32px] relative group hover:border-blue-100/50 transition-colors">
                        <button 
                          onClick={() => removeActivity(aIdx)}
                          className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-rose-500 text-white shadow-lg flex items-center justify-center transition-all border-none cursor-pointer opacity-0 group-hover:opacity-100 hover:scale-110 z-10"
                        >
                           <X size={14} />
                        </button>

                        <div className="flex flex-col gap-5">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black flex-none">
                                 {aIdx + 1}
                              </div>
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                 <div className="md:col-span-2 flex flex-col gap-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">عنوان النشاط الإجرائي</label>
                                    <input 
                                     className="w-full p-3 bg-white border-none rounded-xl text-xs font-black text-blue-950 outline-none shadow-3xs"
                                     placeholder="ماذا سنفعل تحديداً؟"
                                     value={act.title}
                                     onChange={e => updateActivity(aIdx, 'title', e.target.value)}
                                    />
                                 </div>
                                 <div className="flex flex-col gap-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">المدة (دقائق)</label>
                                    <div className="relative">
                                       <input 
                                        type="number"
                                        className="w-full p-3 bg-white border-none rounded-xl text-xs font-black text-blue-950 outline-none shadow-3xs text-center pl-8"
                                        value={act.duration}
                                        onChange={e => updateActivity(aIdx, 'duration', parseInt(e.target.value) || 0)}
                                       />
                                       <i className="pi pi-clock absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-[10px]" />
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="flex flex-col gap-1.5 bg-amber-50/30 p-4 rounded-[20px] border border-amber-100/50">
                              <label className="text-[10px] font-black text-amber-600 flex items-center gap-1.5">
                                 <i className="pi pi-info-circle text-[10px]" />
                                 <span>توجيهات التنفيذ (How to Perform)</span>
                              </label>
                              <textarea 
                                rows={2}
                                className="w-full p-2 bg-transparent border-none rounded-xl text-[10px] font-bold text-amber-950 outline-none resize-none placeholder-amber-400/50"
                                placeholder="صفات النشاط وكيفية تنفيذه بأفضل شكل لتحقيق أفضل نتيجة..."
                                value={act.guidance}
                                onChange={e => updateActivity(aIdx, 'guidance', e.target.value)}
                              />
                           </div>

                           <div className="space-y-3 bg-white/50 p-4 rounded-[20px] border border-slate-100">
                              <div className="flex items-center justify-between px-1">
                                 <label className="text-[10px] font-black text-indigo-500 flex items-center gap-2">
                                    <i className="pi pi-list text-[10px]" />
                                    <span>خطوات العمل المحددة (List of Actions)</span>
                                 </label>
                                 <button 
                                  onClick={() => addStep(aIdx)}
                                  className="text-[9px] font-black text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1 transition-all cursor-pointer"
                                 >
                                    + إضافة خطوة تنفيذية
                                 </button>
                              </div>
                              <div className="space-y-2">
                                 {act.steps?.map((step: any, sIdx: number) => (
                                   <div key={step.id} className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 flex-none" />
                                      <input 
                                        className="flex-1 p-2.5 bg-white border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-200 transition-all shadow-3xs"
                                        placeholder="خطوة محددة..."
                                        value={step.title}
                                        onChange={e => updateStep(aIdx, sIdx, e.target.value)}
                                      />
                                      <button 
                                        onClick={() => removeStep(aIdx, sIdx)}
                                        className="w-7 h-7 flex items-center justify-center text-rose-300 hover:text-rose-500 transition-all bg-transparent border-none cursor-pointer"
                                      >
                                         <X size={12} />
                                      </button>
                                   </div>
                                 ))}
                                 {(!act.steps || act.steps.length === 0) && (
                                    <p className="text-[9px] text-slate-300 italic text-center py-2">لا توجد خطوات مضافة لهذا النشاط بعد.</p>
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}

                   {(!localTask.activities || localTask.activities.length === 0) && (
                     <div className="text-center py-16 text-slate-400 font-bold border-4 border-dashed border-slate-50 rounded-[40px] flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                           <i className="pi pi-inbox text-2xl text-slate-200" />
                        </div>
                        <p>هل نبدأ بإضافة أول نشاط تنفيذي لهذه المهمة؟</p>
                     </div>
                   )}
                </div>
             </div>
          </TabPanel>

          <TabPanel header="🔗 مصادر التعلم">
             <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-rose-600 px-1 flex items-center gap-2">
                           <Youtube className="w-4 h-4" />
                           <span>رابط فيديو يوتيوب (Embedded)</span>
                        </label>
                        <input 
                          className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-[20px] font-bold outline-none focus:ring-4 ring-rose-500/5 focus:bg-white focus:border-rose-100 transition-all text-blue-950 text-xs placeholder-slate-300" 
                          placeholder="ألصق رابط الفيديو هنا..." 
                          value={localTask.youtubeUrl} 
                          onChange={e => updateField('youtubeUrl', e.target.value)} 
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-indigo-600 px-1 flex items-center gap-2">
                           <FileText className="w-4 h-4" />
                           <span>رابط Google Drive أو ملف خارجي</span>
                        </label>
                        <input 
                          className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-[20px] font-bold outline-none focus:ring-4 ring-indigo-500/5 focus:bg-white focus:border-indigo-100 transition-all text-blue-950 text-xs placeholder-slate-300" 
                          placeholder="رابط ملف الدرايف أو المصدر النصي..." 
                          value={localTask.googleDriveUrl} 
                          onChange={e => updateField('googleDriveUrl', e.target.value)} 
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-amber-600 px-1 flex items-center gap-2">
                           <Sparkles className="w-4 h-4" />
                           <span>كلمة بحث YouGlish (للنطق واللكنة)</span>
                        </label>
                        <input 
                          className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-[20px] font-bold outline-none focus:ring-4 ring-amber-500/5 focus:bg-white focus:border-amber-100 transition-all text-blue-950 text-xs placeholder-slate-300" 
                          placeholder="الكلمة التي تود سماعها من متحدثين حقيقيين..." 
                          value={localTask.youglishKeyword} 
                          onChange={e => updateField('youglishKeyword', e.target.value)} 
                        />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-xs font-black text-rose-300 px-1 mb-2 block">معاينة مرئية</label>
                      <div className="rounded-[24px] overflow-hidden border-2 border-slate-50 aspect-video bg-slate-900 flex items-center justify-center relative">
                        {getYoutubeId(localTask.youtubeUrl) ? (
                          <iframe 
                            src={`https://www.youtube.com/embed/${getYoutubeId(localTask.youtubeUrl)}`}
                            className="w-full h-full border-none"
                            allowFullScreen
                            title="video preview"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-3 text-slate-600">
                             <Youtube size={48} className="opacity-20" />
                             <p className="text-[10px] font-bold">لا يوجد معاينة متاحة ليوتيوب حالياً</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-5 bg-white border-2 border-slate-50 rounded-[24px] flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center ${localTask.googleDriveUrl ? 'text-indigo-600' : 'text-slate-200'}`}>
                            <FileText size={24} />
                         </div>
                         <div>
                            <h5 className="text-[11px] font-black text-slate-800">المصدر المرفق</h5>
                            <p className="text-[9px] text-slate-400 font-bold truncate max-w-[150px]">
                               {localTask.googleDriveUrl || "لم يتم إرفاق ملف بعد"}
                            </p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="md:col-span-2 space-y-2 mt-4 pt-4 border-t border-slate-100/50">
                  <label className="text-sm font-black text-blue-900 px-1 flex items-center gap-2">
                     <i className="pi pi-book text-lg text-blue-500" />
                     <span>المراجع الإضافية والملاحظات</span>
                  </label>
                  <p className="text-[10px] text-blue-400 font-bold px-1">أضف المصادر والمستندات العامة التي سيتم عرضها كدليل عند بدء تنفيذ المهمة.</p>
                  <textarea 
                    rows={6}
                    className="w-full p-5 bg-white border border-blue-100 rounded-[20px] text-sm font-bold text-blue-950 outline-none focus:ring-4 ring-blue-500/10 transition-all resize-y min-h-[150px] shadow-inner"
                    placeholder="روابط لمقالات، ملفات مهمة، أو مراجع إضافية يجب قراءتها..."
                    value={localTask.learningResources}
                    onChange={e => updateField('learningResources', e.target.value)}
                  />
                </div>
             </div>
          </TabPanel>
        </TabView>

        <div className="flex gap-4 pt-8 border-t border-slate-100/50">
           <button 
            onClick={() => onSave(localTask)}
            className="flex-1 py-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-blue-900/30 hover:brightness-110 transition-all active:scale-[0.98] border-none cursor-pointer flex items-center justify-center gap-3"
           >
              <span>حفظ كافة التعديلات وعودة</span>
              <i className="pi pi-check-circle text-lg" />
           </button>
           <button 
            onClick={onHide}
            className="px-10 py-5 bg-slate-100 text-slate-500 rounded-[24px] font-black text-base hover:bg-slate-200 transition-all border-none cursor-pointer"
           >
              تجاهل
           </button>
        </div>
      </div>

      <style>{`
        .custom-wizard-tabs .p-tabview-nav {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid #f8fafc;
          background: transparent;
          justify-content: center;
          padding-bottom: 4px;
        }
        .custom-wizard-tabs .p-tabview-nav li .p-tabview-nav-link {
          padding: 14px 24px;
          font-weight: 900;
          font-size: 12px;
          color: #94a3b8;
          background: transparent;
          border: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          outline: none !important;
          box-shadow: none !important;
        }
        .custom-wizard-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link {
          color: #1e3a8a;
          border-bottom-color: #1e3a8a;
          transform: translateY(-2px);
        }
        .custom-wizard-tabs .p-tabview-panels {
          background: transparent;
          padding: 0;
        }
      `}</style>
    </Dialog>
  );
};

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
        { title: 'اساسيات الذكاء الاصطناعي', desc: 'أهم المفاهيم، Prompt Engineering، وبناء روبوتات ذكية' },
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
           rows={4}
           className="w-full border border-slate-100 hover:border-blue-200 shadow-3xs rounded-2xl p-4 bg-gray-50/50 focus:bg-white outline-none focus:ring-4 ring-blue-900/5 transition-all resize-y min-h-[120px] placeholder-gray-300 font-medium text-blue-950 text-sm"
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
    <div className="flex flex-col gap-8 pb-10 pr-1">
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
              rows={3}
              className="w-full p-4 bg-gray-50/50 border border-slate-100 hover:border-blue-200 focus:bg-white shadow-3xs rounded-xl outline-none text-sm resize-y min-h-[100px] focus:ring-4 ring-blue-950/5 transition-all text-blue-950 placeholder-gray-300 font-medium" 
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

const Step5 = ({ state, setState, openTaskModal }: any) => {
  const [selectedStation, setSelectedStation] = useState(0);

  if (state.stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-4 animate-fade-in">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
           <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <p className="text-gray-500 font-medium font-sans">من فضلك عُد للخطوة الرابعة وأضف خطة واحدة على الأقل.</p>
      </div>
    );
  }

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
  const mainTasks = currentStation.tasks.filter((t: any) => (t as any).type === 'main');
  const subTasks = currentStation.tasks.filter((t: any) => (t as any).type === 'sub');
  const sideTasks = currentStation.tasks.filter((t: any) => (t as any).type === 'side');
  const practicalTasks = currentStation.tasks.filter((t: any) => (t as any).type === 'practical');
  const projectTasks = currentStation.tasks.filter((t: any) => (t as any).type === 'project');

  return (
    <div className="flex flex-col h-auto font-sans text-right" dir="rtl">
      <div className="mb-4 flex items-center justify-between px-1">
        <h2 className="text-xl md:text-2xl font-black text-blue-950">توزيع المهام المنظم</h2>
      </div>
      
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
        {state.stations.map((st: any, idx: number) => (
          <button
            key={idx}
            onClick={() => setSelectedStation(idx)}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all border-none cursor-pointer ${selectedStation === idx ? "bg-blue-900 text-white shadow-md scale-105" : "bg-slate-100 text-slate-500"}`}
          >
            {st.name || `خطة ${idx + 1}`}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 pb-10">
        <TabView className="custom-wizard-tabs">
          <TabPanel header="🔋 المهام الأساسية">
            <div className="flex flex-col gap-6 bg-blue-50/10 p-6 rounded-3xl border border-blue-100/30 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-blue-950">المهام الأساسية</h3>
                <button onClick={() => openTaskModal(selectedStation, 'main')} className="w-10 h-10 rounded-xl bg-blue-950 text-white flex items-center justify-center border-none shadow-md hover:bg-blue-900 transition-all cursor-pointer"><Plus size={20} /></button>
              </div>
              <div className="space-y-4">
                {mainTasks.length === 0 && (
                   <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white/50">
                     لا يوجد مهام رئيسية مضافة. اضغط على (+) للبدء.
                   </div>
                )}
                {mainTasks.map((t: any) => {
                  const absoluteIdx = currentStation.tasks.findIndex((ts: any) => ts.id === t.id);
                  return (
                    <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <div onClick={() => openTaskModal(selectedStation, 'main', absoluteIdx)} className="flex-1 cursor-pointer">
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-[8px] font-black bg-blue-50 text-blue-900 px-1.5 py-0.5 rounded uppercase">MAIN</span>
                              <h4 className="text-sm font-black text-blue-950">{t.title || "عنوان المهمة..."}</h4>
                           </div>
                           <p className="text-[10px] text-slate-400 line-clamp-1">{t.description || "أضف وصفاً مختصراً للمهمة..."}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => openTaskModal(selectedStation, 'main', absoluteIdx)} className="p-2 bg-slate-50 text-blue-600 rounded-xl border-none cursor-pointer"><i className="pi pi-pencil text-xs"/></button>
                           <button onClick={() => removeTask(selectedStation, absoluteIdx)} className="p-2 bg-rose-50 text-rose-500 rounded-xl border-none cursor-pointer"><i className="pi pi-trash text-xs"/></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabPanel>

          <TabPanel header="🧩 المهام الفرعية">
             <div className="flex flex-col gap-6 bg-indigo-50/10 p-6 rounded-3xl border border-indigo-100/30 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-indigo-950">المهام الفرعية والتفصيلية</h3>
                <button onClick={() => openTaskModal(selectedStation, 'sub')} className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center border-none shadow-md hover:bg-indigo-700 transition-all cursor-pointer"><Plus size={20} /></button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {subTasks.map((t: any) => {
                  const absoluteIdx = currentStation.tasks.findIndex((ts: any) => ts.id === t.id);
                  const parentTask = mainTasks.find((mt: any) => mt.id === t.parentId);
                  return (
                    <div key={t.id} className="bg-white p-4 rounded-2xl border border-indigo-100/50 shadow-3xs flex flex-col gap-2 group">
                       <div onClick={() => openTaskModal(selectedStation, 'sub', absoluteIdx)} className="flex items-center justify-between cursor-pointer">
                          <div className="flex flex-col gap-1">
                             <span className="text-[9px] font-black text-indigo-400 uppercase">SUB-TASK {parentTask ? `OF: ${parentTask.title}` : ''}</span>
                             <h4 className="text-xs font-black text-indigo-950">{t.title || "عنوان المهمة الفرعية..."}</h4>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={(e) => { e.stopPropagation(); removeTask(selectedStation, absoluteIdx); }} className="p-2 text-rose-500 border-none bg-transparent cursor-pointer"><i className="pi pi-trash text-xs"/></button>
                          </div>
                       </div>
                    </div>
                  );
                })}
                {subTasks.length === 0 && (
                   <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white/50">
                     لا توجد مهام فرعية مضافة.
                   </div>
                )}
              </div>
            </div>
          </TabPanel>

          <TabPanel header="🎨 المهارات الجانبية">
             <div className="flex flex-col gap-6 bg-amber-50/10 p-6 rounded-3xl border border-amber-100/30 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-amber-950">بناء المهارات الإضافية</h3>
                <button onClick={() => openTaskModal(selectedStation, 'side')} className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center border-none shadow-md hover:bg-amber-700 transition-all cursor-pointer"><Plus size={20} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sideTasks.map((t: any) => {
                  const absoluteIdx = currentStation.tasks.findIndex((ts: any) => ts.id === t.id);
                  return (
                    <div key={t.id} className="bg-white p-4 rounded-2xl border border-amber-100/50 shadow-3xs flex items-center justify-between group">
                       <div onClick={() => openTaskModal(selectedStation, 'side', absoluteIdx)} className="flex-1 cursor-pointer">
                          <h4 className="text-xs font-black text-amber-955">{t.title || "مهارة جانبية..."}</h4>
                       </div>
                       <button onClick={() => removeTask(selectedStation, absoluteIdx)} className="p-2 text-rose-500 opacity-0 group-hover:opacity-100 border-none bg-transparent cursor-pointer"><i className="pi pi-trash text-xs"/></button>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabPanel>

          <TabPanel header="🛠️ مهام تطبيقية">
             <div className="flex flex-col gap-6 bg-emerald-50/10 p-6 rounded-3xl border border-emerald-100/30 mt-4 text-right font-sans" dir="rtl">
              <div className="flex items-center justify-between">
                 <div>
                    <h3 className="font-black text-emerald-950">المهام التطبيقية</h3>
                    <p className="text-[10px] text-emerald-600 font-bold">إضافة وإدارة المهام التطبيقية للمحطة</p>
                 </div>
                <button onClick={() => openTaskModal(selectedStation, 'practical')} className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center border-none shadow-md hover:bg-emerald-700 transition-all cursor-pointer"><Plus size={20} /></button>
              </div>
              <div className="space-y-3">
                 {practicalTasks.map((t: any) => {
                   const absoluteIdx = currentStation.tasks.findIndex((ts: any) => ts.id === t.id);
                   return (
                     <div key={t.id} className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-3xs flex items-center justify-between group">
                        <div onClick={() => openTaskModal(selectedStation, 'practical', absoluteIdx)} className="flex items-center gap-4 flex-1 cursor-pointer">
                           <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">#</div>
                           <h4 className="text-sm font-black text-emerald-950">{t.title || "عنوان المشروع..."}</h4>
                        </div>
                        <button onClick={() => removeTask(selectedStation, absoluteIdx)} className="p-2 text-rose-500 opacity-0 group-hover:opacity-100 border-none bg-transparent cursor-pointer"><i className="pi pi-trash text-xs"/></button>
                     </div>
                   );
                 })}
                 {practicalTasks.length === 0 && (
                   <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white/50">
                     لا توجد مشاريع مضافة. أضف تطبيقك الأول!
                   </div>
                 )}
              </div>
            </div>
          </TabPanel>

          <TabPanel header="📁 مشروع الخطة">
            <div className="flex flex-col gap-6 bg-purple-50/10 p-6 rounded-3xl border border-purple-100/30 mt-4 text-right font-sans" dir="rtl">
              <div className="flex items-center justify-between font-sans">
                 <div>
                    <h3 className="font-black text-purple-900 font-sans">مشروع الخطة</h3>
                    <p className="text-[10px] text-purple-600 font-bold font-sans">تحديد مشروع الخطة المتكامل لمحطة السعي</p>
                 </div>
                 <button onClick={() => openTaskModal(selectedStation, 'project')} className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center border-none shadow-md hover:bg-purple-700 transition-all cursor-pointer"><Plus size={20} /></button>
              </div>
              <div className="space-y-3">
                  {projectTasks.map((t: any) => {
                    const absoluteIdx = currentStation.tasks.findIndex((ts: any) => ts.id === t.id);
                    return (
                      <div key={t.id} className="bg-white p-5 rounded-2xl border border-purple-100 shadow-3xs flex items-center justify-between group font-sans">
                         <div onClick={() => openTaskModal(selectedStation, 'project', absoluteIdx)} className="flex items-center gap-4 flex-1 cursor-pointer">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">📁</div>
                            <h4 className="text-sm font-black text-purple-950 font-sans">{t.title || "عنوان مشروع الخطة..."}</h4>
                         </div>
                         <button onClick={() => removeTask(selectedStation, absoluteIdx)} className="p-2 text-rose-500 opacity-0 group-hover:opacity-100 border-none bg-transparent cursor-pointer"><i className="pi pi-trash text-xs"/></button>
                      </div>
                    );
                  })}
                  {projectTasks.length === 0 && (
                    <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white/50 font-sans">
                      لا توجد مشاريع مضافة. أضف مشروع الخطة الأول!
                    </div>
                  )}
              </div>
            </div>
          </TabPanel>

          <TabPanel header="📚 ملاحظات الموجه العامة">
            <div className="flex flex-col gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-200/50 mt-4 text-right font-sans" dir="rtl">
               <div>
                  <h3 className="font-black text-slate-900 font-sans">ملاحظات والتوجيهات العامة</h3>
                  <p className="text-[10px] text-slate-500 font-bold font-sans mt-1">توجيهات مساعدة وتذكيرات مهمة لك ولعملية التعلم في هذه المحطة (الخطة).</p>
               </div>
               
               <textarea
                 className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-y min-h-[140px]"
                 placeholder="اكتب توجيهاتك أو روابط أو أية ملاحظات عامة لهذه الخطة..."
                 value={currentStation.generalNotes || ""}
                 onChange={(e) => {
                   const arr = [...state.stations];
                   arr[selectedStation] = { ...arr[selectedStation], generalNotes: e.target.value };
                   setState({ ...state, stations: arr });
                 }}
               />
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

      {/* Incentive Section */}
      <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
        <label className="text-sm font-extrabold text-blue-950 flex items-center gap-2">
          <span>🎁 حافز التعلم والالتزام اليومي</span>
        </label>
        <p className="text-[11px] font-medium text-slate-400 leading-relaxed font-sans">
          أضف حافزاً ومكافأة لنفسك تلتزم بتلقيها بعد إنجاز هدفك اليومي مباشرةً (كوب قهوة، قطعة شوكولاتة، نصف ساعة ترفيه).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-black text-slate-550 pr-1">ساعة تلقي الحافز (مثلاً: 09:00 م) 🕒</label>
            <input
              type="text"
              placeholder="الساعة (مثلاً: 09:00 م)"
              value={state.incentiveTime || ''}
              onChange={e => setState({ ...state, incentiveTime: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 ring-blue-900/10 bg-white font-bold text-xs text-blue-950 transition-all text-right font-sans"
              dir="rtl"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-black text-slate-550 pr-1">وصف الحافز أو المكافأة اليومية 🍫</label>
            <input
              type="text"
              placeholder="كوب قهوة دافئ، 30 دقيقة لعب..."
              value={state.incentiveDesc || ''}
              onChange={e => setState({ ...state, incentiveDesc: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 ring-blue-900/10 bg-white font-bold text-xs text-blue-950 transition-all text-right font-sans"
              dir="rtl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
