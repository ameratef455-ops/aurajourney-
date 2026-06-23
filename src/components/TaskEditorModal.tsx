import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { TabView, TabPanel } from "primereact/tabview";
import { Dropdown } from "primereact/dropdown";
import { Youtube, FileText, Sparkles, Plus, Trash2, X, AlertCircle } from "lucide-react";
import { safeRandomUUID } from "../lib/uuid";
import { vibrate, HAPITCS } from "../lib/haptics";
import { parseLearningResources, serializeLearningResources } from "../types";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "react-hot-toast";

interface ActivityResourcesEditorProps {
  activity: any;
  onChangeField: (field: string, value: any) => void;
  isSetupWizard?: boolean;
}

export function ActivityResourcesEditor({
  activity,
  onChangeField,
  isSetupWizard = false,
}: ActivityResourcesEditorProps) {
  const [newResName, setNewResName] = useState("");
  const [newResUrl, setNewResUrl] = useState("");
  const [newResDesc, setNewResDesc] = useState("");

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const currentResources = parseLearningResources(activity.learningResources);

  return (
    <div className="mt-4 p-4 bg-slate-100/60 border border-slate-205 rounded-[20px] space-y-4">
      <h5 className="text-[11px] font-black text-indigo-900 flex items-center gap-1.5 justify-start">
        <i className="pi pi-link text-xs" />
        <span>مراجع ومصادر هذا النشاط حصراً (مخصصة للنشاط لوحده)</span>
      </h5>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          {/* YouTube Video Link */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-rose-600 px-1 flex items-center gap-1.5 justify-start">
              <Youtube className="w-3.5 h-3.5" />
              <span>فيديو يوتيوب مخصص للنشاط</span>
            </label>
            <input
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-left"
              dir="ltr"
              placeholder="https://youtube.com/watch?v=..."
              value={activity.youtubeUrl || ""}
              onChange={(e) => onChangeField("youtubeUrl", e.target.value)}
            />
          </div>

          {/* Google Drive Link */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-indigo-600 px-1 flex items-center gap-1.5 justify-start">
              <FileText className="w-3.5 h-3.5" />
              <span>رابط Google Drive أو مستند تجربة</span>
            </label>
            <input
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-left"
              dir="ltr"
              placeholder="https://drive.google.com/..."
              value={activity.googleDriveUrl || ""}
              onChange={(e) => onChangeField("googleDriveUrl", e.target.value)}
            />
          </div>

          {/* YouGlish keyword */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-amber-600 px-1 flex items-center gap-1.5 justify-start">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>كلمة بحث للنطق (YouGlish)</span>
            </label>
            <input
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-right"
              placeholder="الكلمة الإنجليزية..."
              value={activity.youglishKeyword || ""}
              onChange={(e) => onChangeField("youglishKeyword", e.target.value)}
            />
          </div>
        </div>

        {/* Video Preview Aspect */}
        <div className="flex flex-col justify-center">
          <div className="rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-900 flex items-center justify-center relative">
            {getYoutubeId(activity.youtubeUrl) ? (
              <iframe
                src={`https://www.youtube.com/embed/${getYoutubeId(activity.youtubeUrl)}`}
                className="w-full h-full border-none"
                allowFullScreen
                title="video preview"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-slate-500">
                <Youtube size={24} className="opacity-30" />
                <p className="text-[9px] font-bold">لا توجد معاينة يوتيوب حالياً</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggested learning references */}
      <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-3">
        <label className="text-[10px] font-black text-blue-900 flex items-center justify-between">
          <span>📚 الروابط والمراجع المضافة لهذا النشاط</span>
        </label>

        {/* Inline Resource Inputs */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={newResName}
              onChange={(e) => setNewResName(e.target.value)}
              placeholder="اسم المرجع..."
              className="w-full p-2 bg-white border border-slate-200 rounded text-[11px] font-bold"
            />
            <input
              type="text"
              value={newResUrl}
              onChange={(e) => setNewResUrl(e.target.value)}
              placeholder="الرابط الإلكتروني..."
              className="w-full p-2 bg-white border border-slate-200 rounded text-[11px] font-bold text-left"
              dir="ltr"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newResDesc}
              onChange={(e) => setNewResDesc(e.target.value)}
              placeholder="وصف مبسط (اختياري)..."
              className="w-full p-2 bg-white border border-slate-200 rounded text-[11px] font-bold flex-1"
            />
            <button
              type="button"
              onClick={() => {
                if (!newResName.trim() || !newResUrl.trim()) return;
                vibrate(HAPITCS.SUCCESS);
                const newItem = {
                  id: safeRandomUUID(),
                  name: newResName.trim(),
                  url: newResUrl.trim(),
                  description: newResDesc.trim() || undefined,
                };
                const updated = [...currentResources, newItem];
                onChangeField("learningResources", serializeLearningResources(updated));
                setNewResName("");
                setNewResUrl("");
                setNewResDesc("");
              }}
              className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-black text-[10px] rounded border-none cursor-pointer whitespace-nowrap"
            >
              إضافة 🌐
            </button>
          </div>
        </div>

        <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
          {currentResources.map((item) => (
            <div key={item.id} className="p-2 bg-gradient-to-r from-slate-900 to-indigo-950 text-blue-100 rounded-lg flex items-center justify-between text-right">
              <div>
                <a href={item.url} target="_blank" rel="noreferrer" className="text-[11px] font-black text-blue-200 hover:underline">{item.name}</a>
                {item.description && <p className="text-[9px] text-slate-400 font-normal">{item.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => {
                  vibrate(HAPITCS.MAJOR_CLICK);
                  const updated = currentResources.filter(x => x.id !== item.id);
                  onChangeField("learningResources", serializeLearningResources(updated));
                }}
                className="bg-transparent border-none text-red-400 hover:text-red-300 font-bold cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {currentResources.length === 0 && (
            <p className="text-[9px] text-slate-400 text-center py-1">لا توجد مراجع تعليمية مضافة لهذا النشاط بعد.</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface TaskEditorModalProps {
  visible: boolean;
  onHide: () => void;
  task: any;
  onSave: (task: any) => void;
  mainTasks?: any[];
  isSetupWizard?: boolean;
  onDelete?: () => void;
}

export function TaskEditorModal({
  visible,
  onHide,
  task,
  onSave,
  mainTasks = [],
  isSetupWizard = false,
  onDelete,
}: TaskEditorModalProps) {
  const [localTask, setLocalTask] = useState<any>(null);
  const [selectedSubTaskForEdit, setSelectedSubTaskForEdit] = useState<any | null>(null);

  const trips = useLiveQuery(() => db.userSettings.toArray()) || [];
  const mainTrip = trips[0];
  const planGoals = mainTrip?.planGoals || "";

  const reviewPlans = useLiveQuery(() => {
    if (!localTask?.id) return Promise.resolve([]);
    return db.tasks.where("parentId").equals(localTask.id).toArray();
  }, [localTask?.id]) || [];

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
      guidance: "اكتب هنا كيفية القيام بالنشاط بوضوح للطلبة...",
      resources: "مثال: مقال أو رابط فيديو...",
      duration: 15,
      isCompleted: false,
      type: "cognitive",
      puzzleHint: "",
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
          <TabPanel header="📑 المهمة">
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

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-blue-900 px-1 flex items-center gap-2">
                      <i className="pi pi-briefcase text-[10.5px]" />
                      <span>الجزء التطبيقي الفعلي</span>
                    </label>
                    <textarea
                      rows={3}
                      className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-[20px] font-medium outline-none focus:ring-4 ring-blue-900/5 focus:bg-white focus:border-blue-100 transition-all text-blue-800 text-sm resize-none placeholder-slate-300"
                      placeholder="ما هي الممارسة أو التحدي التطبيقي العملي المطلوب تنفيذه في هذه المهمة؟..."
                      value={localTask.practicalPart || ""}
                      onChange={(e) => updateField("practicalPart", e.target.value)}
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

              {/* Merged Goals and Outcomes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="p-6 bg-emerald-50/20 border border-emerald-100 rounded-[24px] space-y-3">
                  <label className="text-xs font-black text-emerald-900 px-1 flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <span>الأهداف المستهدفة للمهمة</span>
                  </label>
                  <textarea
                    rows={4}
                    className="w-full p-4 bg-white border border-emerald-100 rounded-[20px] text-xs font-bold text-slate-800 outline-none focus:ring-4 ring-emerald-500/5 transition-all resize-none text-right"
                    placeholder="مثال:&#10;1. فهم بنية الجداول وطرق الربط بوضوح.&#10;2. تطبيق عملي لإنشاء قاعدة بيانات مصغرة."
                    value={localTask.taskGoals || ""}
                    onChange={(e) => updateField("taskGoals", e.target.value)}
                  />
                </div>

                <div className="p-6 bg-purple-50/20 border border-purple-100 rounded-[24px] space-y-3">
                  <label className="text-xs font-black text-purple-900 px-1 flex items-center gap-2">
                    <span className="text-lg">📈</span>
                    <span>المخرجات والنتائج المتوقعة للمهمة</span>
                  </label>
                  <textarea
                    rows={4}
                    className="w-full p-4 bg-white border border-purple-100 rounded-[20px] text-xs font-bold text-slate-800 outline-none focus:ring-4 ring-purple-500/5 transition-all resize-none text-right"
                    placeholder="مثال:&#10;- كتابة استعلامات JOIN دون أخطاء.&#10;- شرح المفاهيم لزميل آخر بثقة."
                    value={localTask.taskOutcomes || ""}
                    onChange={(e) => updateField("taskOutcomes", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel header="⚡ الأنشطة">
            <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-base font-black text-blue-955 font-sans">
                    أنشطة الجلسة والتعلم اليومي
                  </h4>
                  <p className="text-xs text-gray-400 font-bold">
                    أضف الأنشطة التعليمية المقترحة للمهمة وحدد مدة كل نشاط
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addActivity}
                  className="px-5 py-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-indigo-950 text-white rounded-2xl text-[11px] font-black shadow-lg hover:shadow-blue-900/40 transition-all flex items-center gap-2 border-none cursor-pointer active:scale-95 text-shadow-sm"
                >
                  <Plus size={16} />
                  <span>إضافة نشاط جديد للغرض 💎</span>
                </button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pb-6 pr-1">
                {localTask.activities && localTask.activities.length > 0 ? (
                  localTask.activities.map((act: any, aIdx: number) => (
                    <div
                      key={act.id}
                      className="p-5 bg-slate-50/60 border-2 border-slate-100 rounded-[24px] relative group hover:border-blue-100 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => removeActivity(aIdx)}
                        className="absolute -top-2 -left-2 w-10 h-10 rounded-2xl bg-white text-rose-500 shadow-xl border border-rose-100 flex flex-col items-center justify-center transition-all cursor-pointer hover:bg-rose-500 hover:text-white hover:scale-110 z-10 group/btn"
                      >
                        <Trash2 size={16} />
                        <span className="text-[7px] font-black -mt-0.5">حذف</span>
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div className="flex items-center gap-3 md:col-span-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-black text-sm">
                            {aIdx + 1}
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] font-black text-slate-400">اسم النشاط</label>
                            <input
                              className="w-full p-2.5 bg-white border border-slate-250 rounded-xl text-xs font-black text-blue-955 outline-none"
                              placeholder="مثال: قراءة الفصل الأول وفهم المفاهيم الرئيسية..."
                              value={act.title}
                              onChange={(e) =>
                                updateActivity(aIdx, "title", e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-400 mb-1 block">نوع النشاط</label>
                          <select
                            value={act.type || "cognitive"}
                            onChange={(e) => updateActivity(aIdx, "type", e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl text-xs font-black text-blue-950 flex items-center h-[38px] px-3 shadow-sm hover:border-blue-400 focus:border-blue-500 transition-all outline-none text-right"
                            dir="rtl"
                          >
                            <option value="cognitive">🧠 نشاط معرفي</option>
                            <option value="applied">⚡ نشاط تطبيقي</option>
                            <option value="interactive">🤝 نشاط تفاعلي</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-400 block mb-1">المدة بالدقائق</label>
                          <div className="relative">
                            <input
                              type="number"
                              className="w-full p-2.5 h-[38px] bg-white border border-slate-200 rounded-xl text-xs font-black text-blue-950 text-center shadow-sm"
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

                      {/* Integrated Activity Guidance & Resources inside card */}
                      <div className="space-y-4 mt-4 pt-4 border-t border-slate-100/80">
                        {/* Guidance text area */}
                        <div className="space-y-1.5 text-right w-full">
                          <label className="text-[10px] font-black text-amber-600 flex items-center gap-1.5 justify-start">
                            <i className="pi pi-compass text-[11px]" />
                            <span>التوجيهات والإرشادات للنشاط (Guidance)</span>
                          </label>
                          <textarea
                            rows={3}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-300 resize-none text-right"
                            placeholder="كيف ينبغي على الطالب أداء وتطبيق هذا النشاط؟..."
                            value={act.guidance || ""}
                            onChange={(e) =>
                              updateActivity(aIdx, "guidance", e.target.value)
                            }
                          />
                        </div>

                        {/* Interactive Activity-level Resources Manager */}
                        <ActivityResourcesEditor
                          activity={act}
                          onChangeField={(field, val) => updateActivity(aIdx, field, val)}
                          isSetupWizard={isSetupWizard}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 text-slate-400 font-bold bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl">
                    <p>يرجى إضافة الأنشطة أولاً في علامة تبويب "الأنشطة"</p>
                  </div>
                )}
              </div>
            </div>
          </TabPanel>



        </TabView>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 pb-2 border-t border-slate-100/50 sticky bottom-0 bg-white z-10 mx-[-8px] px-2 w-full">
          <button
            type="button"
            onClick={() => onSave(localTask)}
            className="px-6 py-2 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white rounded-xl font-black text-xs shadow-lg shadow-blue-900/20 hover:brightness-110 transition-all active:scale-[0.98] border-none cursor-pointer flex items-center justify-center gap-2"
          >
            <span>حفظ كافة التعديلات وعودة</span>
            <i className="pi pi-check-circle text-sm" />
          </button>
          <button
            type="button"
            onClick={onHide}
            className="px-6 py-2 bg-slate-100 text-slate-500 rounded-xl font-black text-xs hover:bg-slate-200 transition-all border-none cursor-pointer"
          >
            تجاهل
          </button>
        </div>
      </div>

      <style>{`
        .custom-light-dropdown .p-dropdown-label {
          color: #172554 !important;
          font-size: 11px;
          font-weight: 900;
          padding: 8px 12px;
          display: flex;
          align-items: center;
        }
        .custom-light-dropdown .p-dropdown-trigger {
          color: #94a3b8 !important;
          width: 2rem;
        }
        .custom-wizard-tabs .p-tabview-nav {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          border-bottom: 2px solid #f8fafc;
          background: transparent;
          justify-content: center;
          padding-bottom: 4px;
        }
        @media (min-width: 768px) {
          .custom-wizard-tabs .p-tabview-nav {
            gap: 8px;
          }
        }
        .custom-wizard-tabs .p-tabview-nav li .p-tabview-nav-link {
          padding: 8px 12px;
          font-weight: 900;
          font-size: 11px;
          color: #94a3b8;
          background: transparent;
          border: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          outline: none !important;
          box-shadow: none !important;
        }
        @media (min-width: 768px) {
          .custom-wizard-tabs .p-tabview-nav li .p-tabview-nav-link {
            padding: 14px 24px;
            font-size: 12px;
          }
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
      {selectedSubTaskForEdit && (
        <TaskEditorModal
          visible={!!selectedSubTaskForEdit}
          onHide={() => setSelectedSubTaskForEdit(null)}
          task={selectedSubTaskForEdit}
          onSave={async (updatedTask) => {
            await db.tasks.put(updatedTask);
            setSelectedSubTaskForEdit(null);
            toast.success("تم تشييد التعديلات على خطة المراجعة بنجاح! 💾 (0 XP)");
          }}
        />
      )}
    </Dialog>
  );
}
