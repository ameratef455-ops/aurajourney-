import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { TabView, TabPanel } from "primereact/tabview";
import { Youtube, FileText, Sparkles, Plus, Trash2, X, AlertCircle } from "lucide-react";
import { safeRandomUUID } from "../lib/uuid";
import { vibrate, HAPITCS } from "../lib/haptics";
import { parseLearningResources, serializeLearningResources } from "../types";

interface TaskEditorModalProps {
  visible: boolean;
  onHide: () => void;
  task: any;
  onSave: (task: any) => void;
  mainTasks?: any[];
  isSetupWizard?: boolean;
}

export function TaskEditorModal({
  visible,
  onHide,
  task,
  onSave,
  mainTasks = [],
  isSetupWizard = false,
}: TaskEditorModalProps) {
  const [localTask, setLocalTask] = useState<any>(null);

  // States to add custom resources interactively
  const [newResName, setNewResName] = useState("");
  const [newResUrl, setNewResUrl] = useState("");
  const [newResDesc, setNewResDesc] = useState("");

  useEffect(() => {
    if (visible && task) {
      setLocalTask(JSON.parse(JSON.stringify(task)));
    }
  }, [visible, task]);

  if (!localTask) return null;

  const updateField = (field: string, val: any) =>
    setLocalTask({ ...localTask, [field]: val });

  const addActivity = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    const acts = [...(localTask.activities || [])];
    acts.push({
      id: safeRandomUUID(),
      title: "",
      guidance: "",
      duration: 15,
      isCompleted: false,
      steps: [],
    });
    updateField("activities", acts);
  };

  const updateActivity = (idx: number, field: string, val: any) => {
    const acts = [...localTask.activities];
    acts[idx] = { ...acts[idx], [field]: val };
    updateField("activities", acts);
  };

  const removeActivity = (idx: number) => {
    vibrate(HAPITCS.MAJOR_CLICK);
    const acts = localTask.activities.filter((_: any, i: number) => i !== idx);
    updateField("activities", acts);
  };

  const addStep = (actIdx: number) => {
    vibrate(HAPITCS.MAJOR_CLICK);
    const acts = [...localTask.activities];
    if (!acts[actIdx].steps) acts[actIdx].steps = [];
    acts[actIdx].steps.push({
      id: safeRandomUUID(),
      title: "",
      isCompleted: false,
    });
    updateField("activities", acts);
  };

  const updateStep = (actIdx: number, stepIdx: number, val: string) => {
    const acts = [...localTask.activities];
    acts[actIdx].steps[stepIdx].title = val;
    updateField("activities", acts);
  };

  const removeStep = (actIdx: number, stepIdx: number) => {
    vibrate(HAPITCS.MAJOR_CLICK);
    const acts = [...localTask.activities];
    acts[actIdx].steps.splice(stepIdx, 1);
    updateField("activities", acts);
  };

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const typeLabels: any = {
    main: { label: "مهمة أساسية", color: "bg-blue-600", icon: "pi pi-bolt" },
    sub: { label: "مهمة فرعية", color: "bg-indigo-600", icon: "pi pi-link" },
    side: { label: "مهارة جانبية", color: "bg-amber-600", icon: "pi pi-sparkles" },
    practical: {
      label: "مشروع عملي",
      color: "bg-emerald-600",
      icon: "pi pi-briefcase",
    },
    project: {
      label: "مشروع الخطة",
      color: "bg-purple-600",
      icon: "pi pi-folder",
    },
  };

  const currentType = typeLabels[localTask.type] || typeLabels.main;

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex items-center justify-between w-full pl-8" dir="rtl">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl ${currentType.color} text-white flex items-center justify-center shadow-lg transform rotate-3`}
            >
              <i className={`${currentType.icon} text-lg`}></i>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-blue-950">
                  إعداد المهمة الشامل
                </span>
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full text-white ${currentType.color} uppercase tracking-tighter`}
                >
                  {currentType.label}
                </span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">
                ADVANCED TASK CONFIGURATOR
              </span>
            </div>
          </div>
        </div>
      }
      className="w-[95vw] md:w-[750px] font-sans"
      modal
      closable
      dismissableMask
      style={{ borderRadius: "32px" }}
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
                      onChange={(e) => updateField("title", e.target.value)}
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
                      onChange={(e) => updateField("description", e.target.value)}
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
                      onChange={(e) =>
                        updateField("startMessage", e.target.value)
                      }
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
                      onChange={(e) => updateField("endMessage", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {localTask.type === "sub" && (
                <div className="flex flex-col gap-2 p-4 bg-indigo-50/30 rounded-[20px] border-2 border-indigo-100/50">
                  <label className="text-xs font-black text-indigo-900 px-1 flex items-center gap-2">
                    <i className="pi pi-paperclip text-[10px]" />
                    <span>تابعة للمهمة الرئيسية:</span>
                  </label>
                  <select
                    className="w-full p-3.5 bg-white border-2 border-indigo-100 rounded-xl font-bold outline-none text-indigo-900 cursor-pointer text-sm"
                    value={localTask.parentId || ""}
                    onChange={(e) => updateField("parentId", e.target.value)}
                  >
                    <option value="">-- اختر المهمة الأب --</option>
                    {mainTasks.map((mt: any) => (
                      <option key={mt.id} value={mt.id}>
                        {mt.title}
                      </option>
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
                  <h4 className="text-base font-black text-blue-950 font-sans">
                    خطوات التنفيذ العملي
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold">
                    كل نشاط يحتوي على مجموعة من المهام الإجرائية المحددة
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addActivity}
                  className="px-5 py-3 bg-blue-950 text-white rounded-2xl text-[11px] font-black shadow-lg hover:shadow-blue-900/20 transition-all flex items-center gap-2 border-none cursor-pointer active:scale-95"
                >
                  <Plus size={16} />
                  <span>إضافة نشاط رئيسي</span>
                </button>
              </div>

              <div className="space-y-6 max-h-[450px] overflow-y-auto no-scrollbar pb-6 pr-1">
                {localTask.activities?.map((act: any, aIdx: number) => (
                  <div
                    key={act.id}
                    className="p-6 bg-slate-50/40 border-2 border-slate-100/50 rounded-[32px] relative group hover:border-blue-100/50 transition-colors"
                  >
                    <button
                      type="button"
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
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                              عنوان النشاط الإجرائي
                            </label>
                            <input
                              className="w-full p-3 bg-white border-none rounded-xl text-xs font-black text-blue-950 outline-none shadow-3xs text-right"
                              placeholder="ماذا سنفعل تحديداً؟"
                              value={act.title}
                              onChange={(e) =>
                                updateActivity(aIdx, "title", e.target.value)
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                              المدة (دقائق)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                className="w-full p-3 bg-white border-none rounded-xl text-xs font-black text-blue-950 outline-none shadow-3xs text-center pl-8 text-right"
                                value={act.duration}
                                onChange={(e) =>
                                  updateActivity(
                                    aIdx,
                                    "duration",
                                    parseInt(e.target.value) || 0
                                  )
                                }
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
                          className="w-full p-2 bg-transparent border-none rounded-xl text-[10px] font-bold text-amber-950 outline-none resize-none placeholder-amber-400/50 text-right"
                          placeholder="صفات النشاط وكيفية تنفيذه بأفضل شكل لتحقيق أفضل نتيجة..."
                          value={act.guidance}
                          onChange={(e) =>
                            updateActivity(aIdx, "guidance", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-3 bg-white/50 p-4 rounded-[20px] border border-slate-100">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[10px] font-black text-indigo-500 flex items-center gap-2">
                            <i className="pi pi-list text-[10px]" />
                            <span>خطوات العمل المحددة (List of Actions)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => addStep(aIdx)}
                            className="text-[9px] font-black text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1 transition-all cursor-pointer"
                          >
                            + إضافة خطوة تنفيذية
                          </button>
                        </div>
                        <div className="space-y-2">
                          {act.steps?.map((step: any, sIdx: number) => (
                            <div
                              key={step.id}
                              className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 flex-none" />
                              <input
                                className="flex-1 p-2.5 bg-white border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-200 transition-all shadow-3xs text-right"
                                placeholder="خطوة محددة..."
                                value={step.title}
                                onChange={(e) =>
                                  updateStep(aIdx, sIdx, e.target.value)
                                }
                              />
                              <button
                                type="button"
                                onClick={() => removeStep(aIdx, sIdx)}
                                className="w-7 h-7 flex items-center justify-center text-rose-300 hover:text-rose-500 transition-all bg-transparent border-none cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                          {(!act.steps || act.steps.length === 0) && (
                            <p className="text-[9px] text-slate-300 italic text-center py-2">
                              لا توجد خطوات مضافة لهذا النشاط بعد.
                            </p>
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

          <TabPanel header="🔗 مصادر العامة">
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
                      value={localTask.youtubeUrl || ""}
                      onChange={(e) => updateField("youtubeUrl", e.target.value)}
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
                      value={localTask.googleDriveUrl || ""}
                      onChange={(e) =>
                        updateField("googleDriveUrl", e.target.value)
                      }
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
                      value={localTask.youglishKeyword || ""}
                      onChange={(e) =>
                        updateField("youglishKeyword", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-rose-300 px-1 mb-2 block">
                    معاينة مرئية للمصدر
                  </label>
                  <div className="rounded-[24px] overflow-hidden border-2 border-slate-50 aspect-video bg-slate-900 flex items-center justify-center relative">
                    {getYoutubeId(localTask.youtubeUrl) ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${getYoutubeId(
                          localTask.youtubeUrl
                        )}`}
                        className="w-full h-full border-none"
                        allowFullScreen
                        title="video preview"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-slate-600">
                        <Youtube size={48} className="opacity-20" />
                        <p className="text-[10px] font-bold">
                          لا يوجد معاينة مرئية يوتيوب حالياً
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-5 bg-white border-2 border-slate-50 rounded-[24px] flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center ${
                        localTask.googleDriveUrl
                          ? "text-indigo-600"
                          : "text-slate-200"
                      }`}
                    >
                      <FileText size={24} />
                    </div>
                    <div className="text-right">
                      <h5 className="text-[11px] font-black text-slate-800">
                        المصدر المرفق العام
                      </h5>
                      <p className="text-[9px] text-slate-400 font-bold truncate max-w-[150px]">
                        {localTask.googleDriveUrl || "لم يتم إرفاق ملف بعد"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4 mt-4 pt-4 border-t border-slate-100/50 text-right" dir="rtl">
                <label className="text-sm font-black text-blue-900 px-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <i className="pi pi-book text-lg text-blue-500" />
                    <span>📚 مصادر ومراجع التعلم المقترحة للمهمة</span>
                  </div>
                  {isSetupWizard && (
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-black border border-emerald-100">تحرير نشط في المعالج</span>
                  )}
                </label>

                {/* If isSetupWizard is true, we display the inputs to add new resources */}
                {isSetupWizard ? (
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-[24px] space-y-4">
                    <h5 className="text-xs font-black text-slate-800">➕ إضافة مصدر تعلم جديد للمهمة:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-right">
                        <label className="text-[10px] font-black text-slate-500">اسم المرجع/المصدر:</label>
                        <input
                          type="text"
                          value={newResName}
                          onChange={(e) => setNewResName(e.target.value)}
                          placeholder="مثال: مقال مدرسة الحكمة لقواعد البيانات"
                          className="w-full py-2.5 px-3 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/15"
                        />
                      </div>
                      <div className="space-y-1.5 text-right">
                        <label className="text-[10px] font-black text-slate-500">رابط المصدر:</label>
                        <input
                          type="text"
                          value={newResUrl}
                          onChange={(e) => setNewResUrl(e.target.value)}
                          placeholder="https://example.com/resource"
                          className="w-full py-2.5 px-3 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/15 text-left"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2 text-right">
                        <label className="text-[10px] font-black text-slate-500">الوصف التوضيحي للمصدر (اختياري/يظهر للطلاب):</label>
                        <input
                          type="text"
                          value={newResDesc}
                          onChange={(e) => setNewResDesc(e.target.value)}
                          placeholder="اكتب نبذة أو وصفاً مختصراً يوضح فائدة هذا المصدر..."
                          className="w-full py-2.5 px-3 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/15 text-right"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newResName.trim() || !newResUrl.trim()) return;
                        vibrate(HAPITCS.SUCCESS);
                        const current = parseLearningResources(localTask.learningResources);
                        const newItem = {
                          id: safeRandomUUID(),
                          name: newResName.trim(),
                          url: newResUrl.trim(),
                          description: newResDesc.trim() || undefined,
                        };
                        const updated = [...current, newItem];
                        updateField("learningResources", serializeLearningResources(updated));
                        setNewResName("");
                        setNewResUrl("");
                        setNewResDesc("");
                      }}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all border-none cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>تثبيت المصدر وإضافته للائحة 🌐</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl flex items-center gap-2.5 text-amber-800 text-[11px] font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>إضافة أو تعديل المصادر العامة مخصص ومشروط فقط داخل معالج التثبيت (Setup Wizard) لحماية تماسك الخطط المنهجية.</span>
                  </div>
                )}

                {/* Display existing learning resources in Dark Gradient Blue Cards! */}
                <div className="space-y-3 mt-3">
                  <h5 className="text-xs font-black text-slate-700">📚 قائمة المصادر المرفقة الحالية:</h5>
                  {parseLearningResources(localTask.learningResources).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {parseLearningResources(localTask.learningResources).map((item) => {
                        const isUrl = item.url.startsWith('http://') || item.url.startsWith('https://');
                        const displayName = item.name.trim() || item.url;
                        return (
                          <div
                            key={item.id}
                            className="p-4.5 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 border border-blue-500/20 text-blue-100 rounded-2xl flex flex-col justify-between gap-1.5 group transition-all duration-300 hover:border-blue-400 shadow-md shadow-blue-955/20"
                          >
                            <div className="flex items-center justify-between">
                              <a
                                href={isUrl ? item.url : undefined}
                                target={isUrl ? "_blank" : undefined}
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 text-xs font-black text-slate-150 hover:text-blue-300 transition-colors"
                              >
                                <i className={`pi ${isUrl ? 'pi-external-link' : 'pi-bookmark'} text-[10px] text-blue-400`}></i>
                                <span>{displayName}</span>
                              </a>

                              {isSetupWizard && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    vibrate(HAPITCS.MAJOR_CLICK);
                                    const current = parseLearningResources(localTask.learningResources);
                                    const updated = current.filter(x => x.id !== item.id);
                                    updateField("learningResources", serializeLearningResources(updated));
                                  }}
                                  className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-350 transition-colors flex items-center justify-center border-none cursor-pointer"
                                  title="حذف هذا المصدر"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            
                            {item.description && (
                              <p className="text-[10px] text-slate-300 font-normal leading-relaxed overflow-hidden font-sans mt-1 pr-2 border-r-2 border-blue-500/30">
                                {item.description}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs font-bold border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                      لا توجد مصادر مضافة حالياً لهذه المهمة.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel header="💬 ملاحظات الموجه العامة">
            <div className="space-y-4 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 bg-indigo-50/40 border-2 border-indigo-100/30 rounded-[32px] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
                     💬
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">توجيهات وملاحظات الموجه العامة للمهمة</h4>
                    <p className="text-[10px] text-slate-400">إرشادات تخصصية وإضافات يمليها الموجه لتفادي العقبات وتسريع الفهم والتحصيل العفوي.</p>
                  </div>
                </div>

                <textarea
                  rows={6}
                  className="w-full p-5 bg-white border border-indigo-100 rounded-[24px] text-sm font-bold text-indigo-950 outline-none focus:ring-4 ring-indigo-500/10 transition-all resize-y text-right"
                  placeholder="اكتب توجيهات الموجه الخاصة بهذه المحطة، أو نصائح المذاكرة الذهبية وطرق المراجعة الشغولة الفردية..."
                  value={localTask.mentorNotes || ""}
                  onChange={(e) => updateField("mentorNotes", e.target.value)}
                />
              </div>
            </div>
          </TabPanel>

          <TabPanel header="🎯 الأهداف والمخرجات المستهدفة للمهمة">
            <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Outlines: goals */}
                <div className="p-6 bg-emerald-50/40 border-2 border-emerald-100/30 rounded-[32px] space-y-3">
                  <label className="text-xs font-black text-emerald-900 px-1 flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <span>الأهداف المستهدفة للمهمة</span>
                  </label>
                  <p className="text-[10px] text-slate-400">ما هي الغايات والمهام الفرعية التي يسعى المتعلم لإتمامها في هذه المهمة؟</p>
                  <textarea
                    rows={6}
                    className="w-full p-4 bg-white border border-emerald-150 rounded-[20px] text-xs font-bold text-slate-800 outline-none focus:ring-4 ring-emerald-500/5 transition-all resize-none text-right"
                    placeholder="مثال:&#10;1. فهم بنية الجداول وطرق الربط بوضوح.&#10;2. تطبيق عملي لإنشاء قاعدة بيانات مصغرة.&#10;3. التمكن من صياغة استعلامات البحث الحيوية."
                    value={localTask.taskGoals || ""}
                    onChange={(e) => updateField("taskGoals", e.target.value)}
                  />
                </div>

                {/* Outcomes */}
                <div className="p-6 bg-purple-50/40 border-2 border-purple-100/30 rounded-[32px] space-y-3">
                  <label className="text-xs font-black text-purple-900 px-1 flex items-center gap-2">
                    <span className="text-lg">📈</span>
                    <span>المخرجات والنتائج المتوقعة للمهمة</span>
                  </label>
                  <p className="text-[10px] text-slate-400">المهارات الملموسة والنتائج القابلة للقياس التي سيتقنها المتعلم بعد إتمام المهمة.</p>
                  <textarea
                    rows={6}
                    className="w-full p-4 bg-white border border-purple-150 rounded-[20px] text-xs font-bold text-slate-800 outline-none focus:ring-4 ring-purple-500/5 transition-all resize-none text-right"
                    placeholder="مثال:&#10;- القدرة على تصميم رسم تخطيطي (ERD) للمشروع بمهارة.&#10;- كتابة استعلامات JOIN دون أخطاء برمجية.&#10;- شرح المفاهيم لزميل آخر بثقة تامة."
                    value={localTask.taskOutcomes || ""}
                    onChange={(e) => updateField("taskOutcomes", e.target.value)}
                  />
                </div>

              </div>
            </div>
          </TabPanel>

          <TabPanel header="🧩 لغز المحطة والتعلم الفائق" leftIcon="pi pi-key mr-2 ml-2">
            <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[50vh] overflow-y-auto px-1">
              <div className="p-4 bg-amber-50/60 border border-amber-150/40 rounded-2xl flex items-center gap-3">
                <span className="text-2xl">🧩</span>
                <div>
                  <h5 className="text-xs font-black text-amber-950">ألغاز المحطة الكبرى (The Station Riddles Engine)</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    من هنا يمكنك نسج تحديات ألغاز فكرية وربطها بمفاتيح كبسولات المعرفة الفائقة. لا يمكن فتح الكنز أو الكشف الكامل لروابط المصادر الخفية التابعة إلا بحل هذا التحدي الفكري المحبوك.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Riddle details */}
                <div className="p-6 bg-amber-50/10 border-2 border-amber-100/30 rounded-[32px] space-y-3">
                  <label className="text-xs font-black text-amber-900 px-1 flex items-center gap-2">
                    <span className="text-sm">❓</span>
                    <span>تفاصيل ومنطوق اللغز العام للمهمة</span>
                  </label>
                  <p className="text-[9px] text-slate-400">اطرح سؤلاً فكرياً أو تحدياً برمجياً يحفز ذهن المستهدف للمحاولة المكررة.</p>
                  <textarea
                    rows={4}
                    className="w-full p-4 bg-white border border-amber-150/50 rounded-[20px] text-xs font-bold text-slate-800 outline-none focus:ring-4 ring-amber-500/5 transition-all text-right"
                    placeholder="مثال: لغز منطقي عن ترتيب خوارزميات البحث أو صياغة كود استثنائي..."
                    value={localTask.riddleDetails || ""}
                    onChange={(e) => updateField("riddleDetails", e.target.value)}
                  />
                </div>

                {/* Riddle Answer & Hint */}
                <div className="p-6 bg-teal-50/10 border-2 border-teal-100/30 rounded-[32px] space-y-3 flex flex-col justify-between">
                  <div>
                    <label className="text-xs font-black text-teal-900 px-1 flex items-center gap-2">
                      <span className="text-sm">🔑</span>
                      <span>كلمة المرور / حل اللغز المعتمد</span>
                    </label>
                    <p className="text-[9px] text-slate-400">الإجابة الدقيقة أو الكلمة المفتاحية التي تفك تشفير المحطة وتمنح وسام النجاح.</p>
                    <input
                      type="text"
                      className="w-full p-4 bg-white border border-teal-150/50 rounded-[20px] text-xs font-bold text-slate-800 outline-none focus:ring-4 ring-teal-500/5 transition-all text-right"
                      placeholder="اكتب الإجابة المفتاحية أو كلمة السر المحددة..."
                      value={localTask.riddleAnswer || ""}
                      onChange={(e) => updateField("riddleAnswer", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-amber-600 px-1 mt-2 flex items-center gap-2">
                      <span className="text-sm">💡</span>
                      <span>تلميح اللغز العام للمهمة (Hint)</span>
                    </label>
                    <input
                      type="text"
                      className="w-full p-4 bg-white border border-amber-100/50 rounded-[20px] text-xs font-bold text-slate-800 outline-none focus:ring-4 ring-amber-500/5 transition-all text-right mt-1"
                      placeholder="اكتب تلميحاً يوجه انتباه الطالب للحل دون تبسيطه المفرط..."
                      value={localTask.riddleHint || ""}
                      onChange={(e) => updateField("riddleHint", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Hidden/Secret sources puzzle */}
              <div className="p-6 bg-purple-50/20 border-2 border-purple-100/30 rounded-[32px] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
                    🔮
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">اللغز الخفي الخاص بالمصادر الخفية</h4>
                    <p className="text-[10px] text-slate-400">لغز إضافي مخصص للمصادر والمستندات الخفية المودعة بالخطة.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 block">تفاصيل اللغز الخفي للمهمة:</label>
                    <textarea
                      rows={3}
                      className="w-full p-5 bg-white border border-purple-100 rounded-[24px] text-sm font-bold text-purple-950 outline-none focus:ring-4 ring-purple-500/10 transition-all text-right resize-y"
                      placeholder="اكتب لغز المصادر الخفية الذي يتعين على الطالب حله لرؤية المصار الكاملة الفائقة لهذه المحطة..."
                      value={localTask.hiddenRiddleDetails || ""}
                      onChange={(e) => updateField("hiddenRiddleDetails", e.target.value)}
                    />
                  </div>
                  <div className="space-y-3 flex flex-col justify-between">
                    <div>
                      <label className="text-xs font-black text-slate-700 block">إجابة اللغز الخفي المعتمدة:</label>
                      <input
                        type="text"
                        className="w-full p-4.5 bg-white border border-purple-100 rounded-[20px] text-sm font-bold text-purple-950 outline-none focus:ring-4 ring-purple-500/10 transition-all text-right"
                        placeholder="إجابة لغز المصادر الخفية..."
                        value={localTask.hiddenRiddleAnswer || ""}
                        onChange={(e) => updateField("hiddenRiddleAnswer", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-700 block mt-1">تلميح اللغز الخفي (Hint):</label>
                      <input
                        type="text"
                        className="w-full p-4.5 bg-white border border-purple-100 rounded-[20px] text-sm font-bold text-purple-950 outline-none focus:ring-4 ring-purple-500/10 transition-all text-right"
                        placeholder="تلميح لفك عقدة هذا اللغز..."
                        value={localTask.hiddenRiddleHint || ""}
                        onChange={(e) => updateField("hiddenRiddleHint", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </TabPanel>
        </TabView>

        <div className="flex gap-4 pt-6 pb-2 border-t border-slate-100/50 sticky bottom-0 bg-white z-10 mx-[-8px] px-2">
          <button
            type="button"
            onClick={() => onSave(localTask)}
            className="flex-1 py-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-blue-900/30 hover:brightness-110 transition-all active:scale-[0.98] border-none cursor-pointer flex items-center justify-center gap-3"
          >
            <span>حفظ كافة التعديلات وعودة</span>
            <i className="pi pi-check-circle text-lg" />
          </button>
          <button
            type="button"
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
}
