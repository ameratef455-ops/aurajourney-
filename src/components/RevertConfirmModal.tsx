import React from 'react';
import { Dialog } from 'primereact/dialog';
import { motion, AnimatePresence } from 'motion/react';

interface RevertConfirmModalProps {
  visible: boolean;
  onHide: () => void;
  onConfirm: () => void;
  taskTitle?: string;
}

export function RevertConfirmModal({ visible, onHide, onConfirm, taskTitle }: RevertConfirmModalProps) {
  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      showHeader={false}
      breakpoints={{ '960px': '75vw', '641px': '90vw' }}
      style={{ width: '450px' }}
      maskClassName="backdrop-blur-md bg-slate-950/60"
      className="p-0 border-none bg-transparent shadow-none overflow-hidden"
      contentClassName="p-0 bg-transparent border-none overflow-hidden"
      pt={{
        root: { className: 'border-none shadow-none bg-transparent p-0 overflow-hidden' },
        content: { className: 'border-none shadow-none bg-transparent p-0 overflow-hidden' }
      }}
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-slate-950 text-white rounded-[32px] p-8 border-none shadow-[0_24px_50px_rgba(0,0,0,0.7)] text-center relative overflow-hidden font-sans"
            dir="rtl"
          >
            {/* Background luxury gradient glowing circles */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Elegant warning icon header */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/20 border border-amber-500/30 flex items-center justify-center mb-6 shadow-inner">
              <span className="text-3xl select-none animate-pulse">⚠️</span>
            </div>

            <h2 className="text-xl font-black text-amber-400 mb-3 tracking-tight">
              تراجع عن إكمال المهمة؟
            </h2>
            
            <p className="text-sm text-slate-300 leading-relaxed mb-6 font-medium">
              هل أنت متأكد من التراجع عن إكمال مهمة <span className="text-white font-extrabold font-sans text-amber-100">« {taskTitle || "هذه المهمة"} »</span>؟ 
              سيتم إلغاء نقاط الخبرة والمفاتيح التي حصلت عليها منها.
            </p>

            <div className="flex flex-col sm:flex-row-reverse gap-3">
              <button
                onClick={() => {
                  onConfirm();
                  onHide();
                }}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-sm shadow-lg shadow-orange-500/20 active:scale-95 hover:scale-[1.02] transition-all duration-200 cursor-pointer border-none"
              >
                نعم، تراجع عن الإنجاز
              </button>
              
              <button
                type="button"
                onClick={onHide}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm border border-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                إلغاء وإبقاء المهمة
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
