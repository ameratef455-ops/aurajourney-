import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { db } from '../db';
import { safeRandomUUID } from '../lib/uuid';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Plus, BookOpen } from 'lucide-react';
import { toast as hotToast } from 'react-hot-toast';

interface FlashcardsModalProps {
  visible: boolean;
  onHide: () => void;
  task: any;
}

export function FlashcardsModal({ visible, onHide, task }: FlashcardsModalProps) {
  const [activeTab, setActiveTab] = useState<'add'|'saved'>('saved');
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  const settings = useLiveQuery(() => db.userSettings.toArray());
  const user = settings?.[0];

  const taskId = task?.id;
  const taskFlashcards = user?.flashcards?.[taskId] || [];

  const handleSaveCard = async () => {
    if (!question.trim() || !answer.trim()) return;
    
    if (user) {
      const newCard = { id: safeRandomUUID(), q: question, a: answer, status: 'none' };
      const currentCards = user.flashcards || {};
      const updatedCards = {
        ...currentCards,
        [taskId]: [...(currentCards[taskId] || []), newCard]
      };
      
      await db.userSettings.update(user.id, { flashcards: updatedCards });
      setQuestion("");
      setAnswer("");
      hotToast.success("تم إضافة الكارت بنجاح");
      setActiveTab("saved");
    }
  };

  const updateCardStatus = async (cardId: string, status: 'correct'|'wrong'|'none') => {
    if (user) {
       const cards = user.flashcards || {};
       const taskCards = cards[taskId] || [];
       const updatedTaskCards = taskCards.map(c => c.id === cardId ? { ...c, status } : c);
       const updatedCards = { ...cards, [taskId]: updatedTaskCards };
       await db.userSettings.update(user.id, { flashcards: updatedCards });
    }
  };

  const deleteCard = async (cardId: string) => {
    if (user) {
       const cards = user.flashcards || {};
       const taskCards = cards[taskId] || [];
       const updatedTaskCards = taskCards.filter(c => c.id !== cardId);
       const updatedCards = { ...cards, [taskId]: updatedTaskCards };
       await db.userSettings.update(user.id, { flashcards: updatedCards });
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={() => { setFlippedCardId(null); onHide(); }}
      header={
        <div className="flex items-center gap-2 text-indigo-900 font-black pr-2 text-sm" dir="rtl">
          <BookOpen className="w-5 h-5" /> كروت المراجعة: {task?.title}
        </div>
      }
      className="w-[95vw] sm:w-[85vw] max-w-2xl font-sans m-4"
      closable
      dismissableMask
    >
      <div className="p-2 sm:p-4" dir="rtl">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'saved' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
            }`}
          >
            <i className="pi pi-clone"></i> الكروت المحفوظة ({taskFlashcards.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'add' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
            }`}
          >
            <Plus className="w-4 h-4" /> إضافة كارت جديد
          </button>
        </div>

        {activeTab === 'add' && (
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-6 rounded-3xl border border-indigo-800 shadow-xl space-y-4">
             <div className="space-y-1">
               <label className="text-indigo-200 text-xs font-bold px-1">السؤال (وجه الكارت)</label>
               <textarea 
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="أدخل السؤال هنا..."
                  className="w-full bg-indigo-950/50 border border-indigo-700/50 rounded-2xl p-4 text-white text-sm font-bold focus:border-indigo-400 placeholder:text-indigo-400/30 transition-all resize-none min-h-[100px]"
               />
             </div>
             
             <div className="space-y-1">
               <label className="text-indigo-200 text-xs font-bold px-1">الإجابة (ظهر الكارت)</label>
               <textarea 
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="أدخل الإجابة هنا..."
                  className="w-full bg-indigo-950/50 border border-indigo-700/50 rounded-2xl p-4 text-white text-sm font-bold focus:border-indigo-400 placeholder:text-indigo-400/30 transition-all resize-none min-h-[100px]"
               />
             </div>

             <Button 
               label="حفظ الكارت" 
               className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 border-none rounded-2xl font-black text-white text-xs mt-2" 
               onClick={handleSaveCard} 
             />
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="space-y-4">
            {taskFlashcards.length === 0 ? (
               <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center gap-3">
                  <BookOpen className="w-8 h-8 text-slate-300" />
                  <p className="text-slate-400 font-bold text-xs">لم يتم إضافة كروت بعد لهذه المهمة</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {taskFlashcards.map((card: any) => {
                    const isFlipped = flippedCardId === card.id;
                    return (
                      <div key={card.id} className="relative group h-64 [perspective:1000px]">
                        {/* Delete Button */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}
                          className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <i className="pi pi-times text-[10px]"></i>
                        </button>
                        
                        <motion.div
                          className="w-full h-full cursor-pointer relative [transform-style:preserve-3d]"
                          animate={{ rotateY: isFlipped ? 180 : 0 }}
                          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                          onClick={() => setFlippedCardId(isFlipped ? null : card.id)}
                        >
                          {/* Front */}
                          <div className="absolute inset-0 [backface-visibility:hidden] bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 border border-indigo-800 flex flex-col justify-center items-center text-center shadow-lg">
                            <span className="absolute top-4 right-4 text-indigo-400/30 font-black text-[10px]">Q.</span>
                            {card.status === 'correct' && <div className="absolute top-4 left-4"><CheckCircle2 className="w-5 h-5 text-emerald-400" /></div>}
                            {card.status === 'wrong' && <div className="absolute top-4 left-4"><XCircle className="w-5 h-5 text-rose-400" /></div>}
                            <p className="text-white font-bold leading-relaxed">{card.q}</p>
                            <p className="absolute bottom-4 text-indigo-300 text-[10px]">اضغط لرؤية الإجابة</p>
                          </div>

                          {/* Back */}
                          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white rounded-3xl p-6 border-2 border-indigo-100 flex flex-col justify-center items-center text-center shadow-lg">
                             <span className="absolute top-4 right-4 text-slate-300 font-black text-[10px]">A.</span>
                             <div className="overflow-y-auto w-full max-h-[140px] no-scrollbar">
                                <p className="text-slate-800 font-bold leading-relaxed">{card.a}</p>
                             </div>
                             
                             <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-50 bg-slate-50/50 rounded-b-3xl">
                               <p className="text-[10px] font-black text-slate-500 mb-2">هل جاوبت صح ولا لا؟</p>
                               <div className="flex gap-2 justify-center">
                                  <button onClick={(e) => { e.stopPropagation(); updateCardStatus(card.id, 'correct'); setFlippedCardId(null); }} className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 flex items-center justify-center transition-colors">
                                    <CheckCircle2 className="w-5 h-5" />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); updateCardStatus(card.id, 'wrong'); setFlippedCardId(null); }} className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 flex items-center justify-center transition-colors">
                                    <XCircle className="w-5 h-5" />
                                  </button>
                               </div>
                             </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
               </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
