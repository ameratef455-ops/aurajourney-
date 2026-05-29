import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { toast as toastHot } from 'react-hot-toast';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Edit2, Plus, Trash2, Tag, ChevronDown, Check, Download, FileText, BarChart2 } from 'lucide-react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { safeRandomUUID } from '../lib/uuid';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface EditorModeModalProps {
  visible: boolean;
  onHide: () => void;
}

export function EditorModeModal({ visible, onHide }: EditorModeModalProps) {
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState("");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSavedSuccess, setShowSavedSuccess] = useState(false);

  const settings = useLiveQuery(() => db.userSettings.toArray());
  const user = settings?.[0];
  const stations = useLiveQuery(() => db.stations.orderBy('order').toArray());
  const tasks = useLiveQuery(() => db.tasks.toArray());

  const handleCloseAttempt = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    setEditingNoteId(null);
    setSelectedStationId(null);
    setSelectedPlanId(null);
    setSelectedTaskId(null);
    toastHot.success("كل ملاحظاتك اتحفظت بأمان");
    onHide();
  };

  const handleSuccessClose = () => {
    setShowSavedSuccess(false);
    setEditingNoteId(null);
    setSelectedStationId(null);
    setSelectedPlanId(null);
    setSelectedTaskId(null);
    toastHot.success("كل ملاحظاتك اتحفظت بأمان");
    onHide();
  };

  // Filter tasks based on selected station
  const stationTasks = tasks?.filter(t => t.stationId === selectedStationId) || [];
  const plans = stationTasks.filter(t => t.type === 'main' || t.type === 'side');
  const subTasks = stationTasks.filter(t => t.parentId === selectedPlanId && t.type === 'sub');

  // Ground options for third dropdown (the specific missions or root plan)
  const subTaskOptions = selectedPlanId ? [
    { id: selectedPlanId, title: "الخطة كاملة (ملاحظة عامة)", type: "plan-root" },
    ...subTasks
  ] : [];

  // Get notes for the selected station and task
  const allNotes = user?.notes?.[selectedStationId || ''] || [];
  const taskNotes = selectedTaskId 
    ? allNotes.filter((n: any) => n.taskId === selectedTaskId)
    : allNotes;

  const completedTasks = stationTasks.filter(t => t.isCompleted);
  const completedTasksCount = completedTasks.length;
  const completedTasksWithNotesCount = completedTasks.filter(t => 
    allNotes.some((n: any) => n.taskId === t.id)
  ).length;
  const notesRatio = completedTasksCount > 0 
    ? Math.round((completedTasksWithNotesCount / completedTasksCount) * 100) 
    : 0;

  const addNote = async () => {
    if (!newNote.trim() || !user || !selectedStationId || !selectedTaskId) return;
    
    // Find matching task for metadata title
    const taskObj = tasks?.find(t => t.id === selectedTaskId) || plans.find(p => p.id === selectedTaskId);
    const noteObj = {
       id: safeRandomUUID(), // Add unique ID for easier editing
       text: newNote.trim(),
       date: new Date().toISOString(),
       taskId: selectedTaskId,
       taskTitle: taskObj?.title || "ملاحظة عامة"
    };

    const currentMap = user.notes || {};
    const stationNotes = currentMap[selectedStationId] || [];
    const updatedMap = {
      ...currentMap,
      [selectedStationId]: [...stationNotes, noteObj]
    };

    await db.userSettings.update(user.id, { notes: updatedMap });
    setNewNote("");
  };

  const deleteNote = async (noteId?: string, noteIndex?: number) => {
    if (!user || !selectedStationId) return;
    const currentMap = user.notes || {};
    const stationNotes = currentMap[selectedStationId] || [];
    
    let updatedStationNotes;
    if (noteId) {
      updatedStationNotes = stationNotes.filter((n: any) => n.id !== noteId);
    } else if (noteIndex !== undefined) {
      // Fallback if no ID is present on older notes
      updatedStationNotes = stationNotes.filter((_, i) => i !== noteIndex);
    } else {
      return;
    }

    const updatedMap = {
      ...currentMap,
      [selectedStationId]: updatedStationNotes
    };

    await db.userSettings.update(user.id, { notes: updatedMap });
  };

  const saveEdit = async () => {
    if (!user || !selectedStationId || !editingNoteId) return;
    const currentMap = user.notes || {};
    const stationNotes = currentMap[selectedStationId] || [];
    
    const updatedStationNotes = stationNotes.map((n: any) => {
      if (n.id === editingNoteId) {
        return { ...n, text: editNoteText, updatedAt: new Date().toISOString() };
      }
      return n;
    });

    const updatedMap = {
      ...currentMap,
      [selectedStationId]: updatedStationNotes
    };

    await db.userSettings.update(user.id, { notes: updatedMap });
    setEditingNoteId(null);
    setEditNoteText("");
  };

  // Prepare data for the distribution chart
  const chartData = useMemo(() => {
    if (!stations || !user?.notes) return [];
    return stations.map(station => ({
      name: station.name,
      count: (user.notes[station.id] || []).length,
      fullId: station.id
    })).filter(d => d.count > 0);
  }, [stations, user?.notes]);

  const exportPDF = async () => {
    if (!selectedStationId) {
      toastHot.error("الرجاء اختيار المحطة أولاً لإستخراج التقرير");
      return;
    }
    const element = document.getElementById('pdf-report-content');
    if (!element) return;
    
    toastHot.loading("جاري تجهيز التقرير...", { id: 'pdf-loading' });
    try {
      element.style.display = 'block'; // Make it visible temporarily for rendering
      
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff'
      });
      
      element.style.display = 'none'; // Hide it back
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // If the image is taller than one page, it will be scaled down. 
      // For a simple report, it's fine. For multi-page we'd need complex splitting.
      // We will just add it.
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`تقرير-المحطة-${selectedStationId}.pdf`);
      toastHot.success("تم التصدير بنجاح", { id: 'pdf-loading' });
    } catch (e) {
      console.error(e);
      toastHot.error("فشل التصدير", { id: 'pdf-loading' });
    }
  };

  return (
    <>
      <Dialog
        visible={visible}
        onHide={handleCloseAttempt}
        maximized={true}
        header={
          <div className="flex items-center justify-between w-full" dir="rtl">
            <div className="flex items-center gap-2 text-indigo-950 font-sans font-black text-base pr-2">
              <Edit2 className="w-5 h-5 text-indigo-600" /> 
              <span>وضع التدوين المتكامل (ملاحظات المحطات والخطط)</span>
            </div>
            <div className="flex items-center gap-3 ml-4">
              {selectedStationId && (
                <Button 
                  label="تصدير كـ PDF" 
                  icon={<Download className="w-4 h-4 ml-1.5" />} 
                  className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-black py-2 px-3 rounded-xl transition-all"
                  onClick={exportPDF}
                />
              )}
              <Button
                icon="pi pi-times"
                className="p-button-rounded p-button-text text-slate-400 hover:text-rose-600 cursor-pointer p-0"
                onClick={handleCloseAttempt}
              />
            </div>
          </div>
        }
        className="w-full h-full font-sans max-h-screen"
        closable={false}
        dismissableMask={false}
      >
        <div className="p-2 sm:p-6 max-w-5xl mx-auto" dir="rtl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 px-1 block">حقل اختيار الرحلة (المحطة)</label>
               <Dropdown 
                 value={selectedStationId} 
                 options={stations || []} 
                 optionLabel="name" 
                 optionValue="id"
                 onChange={(e) => { setSelectedStationId(e.value); setSelectedPlanId(null); setSelectedTaskId(null); }} 
                 placeholder="قم باختيار المحطة..." 
                 className="w-full text-xs sm:text-sm font-bold shadow-sm" 
                 itemTemplate={(opt) => (
                   <div className="flex items-center gap-2 text-xs font-bold">
                      <i className={opt.icon || 'pi pi-compass'}></i>
                      <span>{opt.name}</span>
                   </div>
                 )}
               />
            </div>
            
            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 px-1 block">حقل اختيار الخطة</label>
               <Dropdown 
                 value={selectedPlanId} 
                 options={plans} 
                 optionLabel="title" 
                 optionValue="id"
                 onChange={(e) => { setSelectedPlanId(e.value); setSelectedTaskId(e.value); }} 
                 placeholder={selectedStationId ? "قم باختيار الخطة..." : "اختر المحطة أولاً..."}
                 disabled={!selectedStationId || plans.length === 0}
                 emptyMessage={<span className="text-xs font-bold text-slate-400 p-2 block">لا توجد خطط لهذه المحطة</span>}
                 className="w-full text-xs sm:text-sm font-bold shadow-sm"
                 itemTemplate={(opt) => (
                    <div className="flex flex-col gap-0.5">
                       <span className="text-xs font-bold text-slate-800">{opt.title}</span>
                       <span className="text-[10px] font-black text-slate-400 uppercase">{opt.type === 'main' ? 'رئيسية' : 'جانبية'}</span>
                    </div>
                 )}
               />
            </div>

            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 px-1 block">حقل اختيار المهمة</label>
               <Dropdown 
                 value={selectedTaskId} 
                 options={subTaskOptions} 
                 optionLabel="title" 
                 optionValue="id"
                 onChange={(e) => setSelectedTaskId(e.value)} 
                 placeholder={selectedPlanId ? "قم باختيار المهمة..." : "اختر الخطة أولاً..."}
                 disabled={!selectedPlanId || subTaskOptions.length === 0}
                 emptyMessage={<span className="text-xs font-bold text-slate-400 p-2 block">لا توجد مهام فرعية لهذه الخطة</span>}
                 className="w-full text-xs sm:text-sm font-bold shadow-sm" 
                 itemTemplate={(opt) => (
                    <div className="flex flex-col gap-0.5">
                       <span className="text-xs font-bold text-slate-800">{opt.title}</span>
                       <span className="text-[10px] font-black text-slate-400 uppercase">{opt.type === 'plan-root' ? 'عام' : 'فرعية'}</span>
                    </div>
                 )}
               />
            </div>
          </div>

          {/* Notes Progress Indicator Card */}
          {selectedStationId && (
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
              <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-indigo-50/30 rounded-3xl border border-indigo-100 flex flex-col justify-between gap-4 shadow-sm">
                <div className="flex flex-col gap-1.5 text-right flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-xs sm:text-sm font-black text-indigo-950">
                      مؤشر تدوين الخواطر للمهام اللى خلصتها
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-xl">
                    {completedTasksCount > 0 
                      ? `عاش يا بطل! انت دونت خواطرك لـ ${completedTasksWithNotesCount} من أصل ${completedTasksCount} مهمة خلصتها فى المحطة دى! كمل كتابة عشان تثبت اللى اتعلمته ✍️✨` 
                      : "لسه مخلصتش مهام فى المحطة دى. خلص مهامك ودون اللى اتعلمته عشان متنساوش!"
                    }
                  </p>
                </div>
                <div className="w-full flex flex-col gap-1.5 bg-white p-3 rounded-2xl border border-indigo-100/40 shadow-inner">
                  <div className="flex justify-between items-center text-[10px] font-black text-indigo-700">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100/60 text-indigo-800">{notesRatio}%</span>
                    <span className="text-slate-600">المهام اللى اتكتب فيها: {completedTasksWithNotesCount} / {completedTasksCount}</span>
                  </div>
                  <div className="h-2.5 w-full bg-indigo-100/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500" 
                      style={{ width: `${notesRatio}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Note Distribution Chart */}
              <div className="p-4 sm:p-5 bg-white rounded-3xl border border-indigo-100 shadow-sm flex flex-col gap-3">
                 <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs sm:text-sm font-black text-slate-800">توزيع الخواطر على المحطات</span>
                 </div>
                 <div className="h-32 w-full">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barGap={8}>
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold', direction: 'rtl', textAlign: 'right' }}
                            itemStyle={{ color: '#4f46e5' }}
                            labelStyle={{ color: '#1e293b', marginBottom: '4px' }}
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]} name="عدد الملاحظات">
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.fullId === selectedStationId ? '#4f46e5' : '#e0e7ff'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[10px] text-slate-400 font-bold italic">
                         لسه مفيش ملاحظات عشان نعرضها هنا
                      </div>
                    )}
                 </div>
              </div>
            </div>
          )}

          {selectedStationId && selectedTaskId ? (
            <div className="space-y-6">
              <div className="bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100 flex flex-col gap-3">
                <InputTextarea 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="اكتب الملاحظات المرتبطة بهذه المهمة هنا..."
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-700 text-sm font-bold focus:border-indigo-400 transition-all resize-none shadow-sm"
                />
                <Button 
                  label="إضافة الملاحظة" 
                  icon={<Plus className="w-4 h-4 ml-2" />}
                  className="self-end py-3 px-6 bg-indigo-600 hover:bg-indigo-700 border-none rounded-xl font-black text-white text-xs shadow-md"
                  onClick={addNote}
                  disabled={!newNote.trim()}
                />
              </div>

              <div className="space-y-4">
                 <h4 className="text-xs font-black text-slate-500 tracking-widest flex items-center gap-2">
                   <Tag className="w-4 h-4" /> الملاحظات المحفوظة
                 </h4>
                 
                 <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 flex flex-col">
                   {taskNotes.length > 0 ? (
                     taskNotes.map((note: any, idx: number) => {
                       const isEditing = editingNoteId === (note.id || `temp-${idx}`);
                       return (
                         <div key={note.id || idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative group">
                           {isEditing ? (
                             <div className="flex flex-col gap-3">
                                <InputTextarea 
                                  value={editNoteText}
                                  onChange={e => setEditNoteText(e.target.value)}
                                  className="w-full border border-indigo-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-indigo-500 resize-none shadow-inner"
                                  rows={3}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button label="إلغاء" className="p-button-text text-slate-500 font-bold text-xs" onClick={() => setEditingNoteId(null)} />
                                  <Button label="حفظ التعديل" icon={<Check className="w-4 h-4 ml-1" />} className="py-2 bg-indigo-50 border-none hover:bg-indigo-100 text-indigo-700 font-black rounded-lg text-xs" onClick={saveEdit} />
                                </div>
                             </div>
                           ) : (
                             <div>
                               <div className="flex justify-between items-start mb-2">
                                 <div className="flex items-center gap-2 flex-wrap">
                                   {note.taskTitle && (
                                     <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight flex items-center gap-1">
                                       <Tag className="w-3 h-3" /> {note.taskTitle}
                                     </span>
                                   )}
                                   <span className="text-[10px] font-bold text-slate-400">
                                     {new Date(note.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                   </span>
                                 </div>
                                 <div className="flex items-center gap-1">
                                    <button onClick={() => {
                                      setEditingNoteId(note.id || `temp-${idx}`);
                                      setEditNoteText(note.text);
                                    }} className="w-7 h-7 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-400 hover:text-indigo-600 rounded-lg flex items-center justify-center transition-colors cursor-pointer" title="تعديل">
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => deleteNote(note.id, idx)} className="w-7 h-7 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-lg flex items-center justify-center transition-colors cursor-pointer" title="حذف">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                 </div>
                               </div>
                               <p className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                             </div>
                           )}
                         </div>
                       );
                     })
                   ) : (
                     <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center gap-3">
                        <Tag className="w-6 h-6 text-slate-300" />
                        <p className="text-slate-400 font-bold text-xs">لا يوجد ملاحظات مرتبطة بهذه المهمة بعد</p>
                     </div>
                   )}
                 </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-24 bg-slate-50 rounded-[32px] border border-dashed border-slate-200 flex flex-col items-center gap-4 max-w-lg mx-auto">
               <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                 <Edit2 className="w-6 h-6" />
               </div>
               <h3 className="text-sm font-black text-slate-800">ابدأ بإدخال وتعديل ملاحظاتك</h3>
               <p className="text-xs text-slate-500 font-bold max-w-xs leading-relaxed">
                  عند اختيار الرحلة، ثم الخطة، ثم المهمة، ستتمكن من تدوين الملاحظات المتعددة، تعديلها وحذفها وحفظها تلقائياً مع المزامنة الفورية.
               </p>
            </div>
          )}
        </div>
      </Dialog>

      <Dialog
        visible={showExitConfirm}
        onHide={() => setShowExitConfirm(false)}
        header={
          <div className="text-rose-700 font-sans font-black pr-2 text-sm" dir="rtl">
            ⚠️ تأكيد الخروج من وضع التحرير
          </div>
        }
        className="w-[90vw] max-w-md font-sans m-4 shadow-2xl rounded-3xl overflow-hidden"
        closable
        dismissableMask
      >
        <div className="p-4 flex flex-col gap-4 text-right font-sans" dir="rtl">
          <p className="text-slate-700 text-sm font-bold leading-relaxed">
            هل أنت متأكد من رغبتك في الخروج من وضع التحرير المتكامل؟
          </p>
          <p className="text-slate-500 text-xs font-semibold leading-relaxed">
            تأكد من حفظ جميع التعديلات قبل الخروج.
          </p>
          
          <div className="flex gap-2.5 mt-4">
            <Button
              label="تراجع ومتابعة التحرير"
              className="flex-1 bg-slate-100 hover:bg-slate-200 border-none rounded-2xl py-3 text-xs font-black text-slate-700 transition-all cursor-pointer"
              onClick={() => setShowExitConfirm(false)}
            />
            <Button
              label="نعم، تأكيد الخروج"
              className="flex-1 bg-rose-600 hover:bg-rose-700 border-none rounded-2xl py-3 text-xs font-black text-white transition-all cursor-pointer shadow-md"
              onClick={confirmExit}
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        visible={showSavedSuccess}
        onHide={handleSuccessClose}
        header={
          <div className="text-emerald-700 font-sans font-black pr-2 text-sm flex items-center gap-2" dir="rtl">
            <span>✨ تم الحفظ بنجاح</span>
          </div>
        }
        className="w-[90vw] max-w-md font-sans m-4 shadow-2xl rounded-3xl overflow-hidden"
        closable={true}
        dismissableMask={true}
      >
        <div className="p-4 flex flex-col items-center gap-4 text-center font-sans" dir="rtl">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800">كل ملاحظاتك اتحفظت</h3>
          <p className="text-xs text-slate-500 font-bold leading-relaxed">
            شكراً لمجهودك ووقتك في تنظيم وتدوين أفكارك وملاحظاتك! 🌸
          </p>
          
          <Button
            label="موافق"
            className="w-full bg-emerald-600 hover:bg-emerald-700 border-none rounded-2xl py-3 text-xs font-black text-white transition-all cursor-pointer shadow-md mt-2"
            onClick={handleSuccessClose}
          />
        </div>
      </Dialog>

      {/* Hidden Div for PDF Export */}
      {selectedStationId && (
        <div 
          id="pdf-report-content" 
          style={{ 
            display: 'none', 
            width: '800px', 
            padding: '40px', 
            background: '#ffffff', 
            color: '#1e293b', 
            direction: 'rtl',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          <div style={{ paddingBottom: '20px', borderBottom: '2px solid #e2e8f0', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText style={{ color: '#4f46e5' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '0 0 5px 0' }}>
                تقرير ملاحظات ومهام المحطة
              </h1>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                {stations?.find(s => s.id === selectedStationId)?.name || "محطة غير معروفة"}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#334155', marginBottom: '15px' }}>
              المهام المكتملة ({completedTasks.length})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {completedTasks.map(task => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <Check style={{ color: '#10b981', width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>{task.title}</span>
                </div>
              ))}
              {completedTasks.length === 0 && (
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>لا توجد مهام مكتملة في هذه المحطة بعد.</p>
              )}
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#334155', marginBottom: '15px' }}>
              الملاحظات المدوّنة
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {[...allNotes].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((note: any, idx) => (
                <div key={note.id || idx} style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                      {note.taskTitle || "ملاحظة عامة"}
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>
                      {new Date(note.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {note.text}
                  </p>
                </div>
              ))}
              {allNotes.length === 0 && (
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>لا توجد ملاحظات مدونة في هذه المحطة.</p>
              )}
            </div>
          </div>
          
          <div style={{ marginTop: '40px', borderTop: '1px solid #e2e8f0', paddingTop: '15px', textAlign: 'center' }}>
            <p style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 'bold', margin: 0 }}>
              تم إنشاء هذا التقرير تلقائياً عبر نظام الخطة
            </p>
          </div>
        </div>
      )}
    </>
  );
}
