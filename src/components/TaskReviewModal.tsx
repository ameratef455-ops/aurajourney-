import React from 'react';
import { Dialog } from 'primereact/dialog';
import { CheckCircle2, Clock } from 'lucide-react';
import { LAYERS } from '../constants/layers';
import { TaskActivity } from '../db';

interface TaskReviewModalProps {
  visible: boolean;
  onHide: () => void;
  task: any;
  onFinishReview: () => void;
  onUndo?: (task: any) => void;
}

export function TaskReviewModal({ visible, onHide, task, onFinishReview, onUndo }: TaskReviewModalProps) {
  if (!task) return null;

  const renderActivity = (act: TaskActivity) => (
    <div key={act.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-3">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-sm text-blue-950 flex items-center gap-2">
           {act.isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300" />}
           {act.title}
        </span>
        {act.duration && (
          <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {act.duration} د
          </span>
        )}
      </div>
      {act.children && act.children.length > 0 && (
        <div className="pl-4 border-l-2 border-slate-200 ml-2 mt-3 space-y-2">
           {act.children.map(renderActivity)}
        </div>
      )}
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={<div className="flex justify-between items-center w-full pr-4" dir="rtl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
             <span className="text-xl font-black text-indigo-950">مراجعة المهام والأنشطة 🔎</span>
             <span className={`text-[10px] px-2 py-0.5 rounded border border-transparent font-black ${
               task.type === 'main' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
               task.type === 'side' ? 'bg-amber-100 text-amber-800 border-amber-200' :
               'bg-purple-100 text-purple-800 border-purple-200'
             }`}>
               {task.type === 'main' ? 'مهمة رئيسية' : task.type === 'side' ? 'مهمة جانبية' : 'مهمة فرعية'}
             </span>
          </div>
          <span className="text-xs text-indigo-500 font-medium">{task.title}</span>
        </div>
        {onUndo && (
          <button 
            onClick={() => onUndo(task)}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-black transition-all border border-rose-100 flex items-center gap-2 cursor-pointer shadow-sm ml-4"
          >
            <i className="pi pi-refresh text-[10px]" />
            تراجع عن الإنجاز
          </button>
        )}
      </div>}
      className="w-full max-w-xl font-sans"
      modal
      dismissableMask
      baseZIndex={LAYERS.TASK_REVIEW}
    >
      <div className="py-4 font-sans" dir="rtl">
         <p className="text-sm text-slate-500 mb-6 font-bold">هذه هي الأنشطة التي قمت بتسجيلها لهذه المهمة. راجعها بعناية قبل التقييم النهائي:</p>
         
         <div className="mb-6 max-h-[50vh] overflow-y-auto pl-2">
           {task.activities && task.activities.length > 0 ? (
             task.activities.map(renderActivity)
           ) : (
             <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
               <span className="text-slate-400 font-bold block mb-2">لم تقم بتسجيل أنشطة فرعية لهذه المهمة</span>
               <span className="text-xs tracking-wider opacity-60 text-indigo-500 uppercase">AURA JOURNEY</span>
             </div>
           )}
         </div>

         <div className="flex justify-end mt-4">
           <button 
             onClick={() => {
                onFinishReview();
             }}
             className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
           >
             <CheckCircle2 className="w-5 h-5" />
             تمت المراجعة - تقييم أخير
           </button>
         </div>
      </div>
    </Dialog>
  );
}
