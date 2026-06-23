import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Compass, Link as LinkIcon, Youtube, HardDrive, Target, Zap, Sparkles } from 'lucide-react';
import { parseLearningResources } from '../types';

interface ActivityWizardModalProps {
  visible: boolean;
  onHide: () => void;
  activity: any | null;
  onSuspend: (activity: any) => void;
}

export function ActivityWizardModal({
  visible,
  onHide,
  activity,
  onSuspend
}: ActivityWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
    }
  }, [visible, activity]);

  if (!activity) return null;

  // Build steps array
  const steps: { type: string; title: string; content: React.ReactNode }[] = [];

  // Step 1: Guidance
  steps.push({
    type: 'guidance',
    title: 'توجيه النشاط',
    content: (
      <div className="space-y-6 text-right">
        <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl text-indigo-400 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500" />
          <div className="flex items-center gap-3">
            <Compass className="w-8 h-8 shrink-0 text-indigo-400" />
            <h3 className="text-xl font-black text-white px-2">التوجيه والتعليمات</h3>
          </div>
          <div className="text-indigo-100/90 text-lg md:text-xl font-bold leading-relaxed bg-black/40 p-6 rounded-2xl border border-white/5 whitespace-pre-wrap">
            {activity.guidance || activity.description || "لا توجد توجيهات محددة لهذا النشاط. ابدأ مستعيناً بالله."}
          </div>
        </div>
      </div>
    )
  });

  // Step 2...N: Resources
  const resources = parseLearningResources(activity.learningResources || '');
  resources.forEach((res, index) => {
    steps.push({
      type: 'resource',
      title: `المصدر ${index + 1}`,
      content: (
        <div className="space-y-6 text-right w-full">
          <div className="p-6 bg-slate-800/40 border border-slate-700/50 rounded-3xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <LinkIcon className="w-8 h-8 text-blue-400" />
              <h3 className="text-xl font-black text-white">مصدر تعليمي</h3>
            </div>
            <a 
              href={res.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-4 p-6 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl flex items-center justify-between transition-all group"
            >
               <div className="flex flex-col gap-2">
                 <h4 className="text-lg font-bold text-blue-300 group-hover:text-blue-200">{res.name}</h4>
                 <span className="text-sm text-slate-400 font-mono break-all line-clamp-1">{res.url}</span>
               </div>
               <ChevronLeft className="w-6 h-6 text-slate-500 group-hover:text-white transition-all transform group-hover:-translate-x-2 shrink-0" />
            </a>
          </div>
        </div>
      )
    });
  });

  if (activity.youtubeUrl) {
    steps.push({
      type: 'youtube',
      title: 'فيديو توضيحي',
      content: (
        <div className="space-y-6 text-right w-full">
           <div className="p-6 bg-slate-800/40 border border-slate-700/50 rounded-3xl flex flex-col gap-4">
             <div className="flex items-center gap-3">
               <Youtube className="w-8 h-8 text-red-500" />
               <h3 className="text-xl font-black text-white">فيديو يوتيوب</h3>
             </div>
             <a 
               href={activity.youtubeUrl.includes('youtube.com') || activity.youtubeUrl.includes('youtu.be') ? activity.youtubeUrl : `https://youtube.com/results?search_query=${encodeURIComponent(activity.youtubeUrl)}`}
               target="_blank"
               rel="noopener noreferrer"
               className="mt-4 p-6 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl flex items-center justify-between transition-all group"
             >
                <div className="flex flex-col gap-2">
                  <span className="text-lg font-bold text-red-400 group-hover:text-red-300">شاهد الفيديو</span>
                  <span className="text-sm text-slate-400 font-mono line-clamp-1 break-all" dir="ltr">{activity.youtubeUrl}</span>
                </div>
                <ChevronLeft className="w-6 h-6 text-slate-500 group-hover:text-white transition-all transform group-hover:-translate-x-2 shrink-0" />
             </a>
           </div>
        </div>
      )
    });
  }

  if (activity.googleDriveUrl) {
     steps.push({
      type: 'drive',
      title: 'ملفات مرفقة',
      content: (
        <div className="space-y-6 text-right w-full">
           <div className="p-6 bg-slate-800/40 border border-slate-700/50 rounded-3xl flex flex-col gap-4">
             <div className="flex items-center gap-3">
               <HardDrive className="w-8 h-8 text-emerald-500" />
               <h3 className="text-xl font-black text-white">ملف جوجل درايف</h3>
             </div>
             <a 
               href={activity.googleDriveUrl}
               target="_blank"
               rel="noopener noreferrer"
               className="mt-4 p-6 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl flex items-center justify-between transition-all group"
             >
                <div className="flex flex-col gap-2">
                  <span className="text-lg font-bold text-emerald-400 group-hover:text-emerald-300">افتح المرفق</span>
                  <span className="text-sm text-slate-400 font-mono line-clamp-1 break-all" dir="ltr">{activity.googleDriveUrl}</span>
                </div>
                <ChevronLeft className="w-6 h-6 text-slate-500 group-hover:text-white transition-all transform group-hover:-translate-x-2 shrink-0" />
             </a>
           </div>
        </div>
      )
    });
  }

  // Final Step: Suspend Activity
  steps.push({
    type: 'suspend',
    title: 'تأكيد التنفيذ',
    content: (
      <div className="space-y-8 flex flex-col items-center justify-center text-center py-8">
        <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse shadow-2xl shadow-amber-500/10">
          <Zap className="w-12 h-12 text-amber-400" />
        </div>
        <div className="space-y-4 max-w-xl text-center">
          <h3 className="text-3xl font-black text-white">استعد للتنفيذ 🚀</h3>
          <p className="text-slate-300 text-lg leading-relaxed font-bold bg-black/40 p-6 rounded-3xl border border-white/5">
            عند تعليق النشاط، ستبدأ رحلتك في التنفيذ الفعلي بعيداً عن المشتتات. بعد إنهائك للعمل، قم بالضغط على زر 
            <span className="text-emerald-400 mx-2">"إنهاء"</span>
             الموجود على كارت النشاط لتسجيل الإنجاز والمراجعة.
          </p>
        </div>
        <button
          onClick={() => {
            onSuspend(activity);
            onHide();
          }}
          className="py-5 px-10 rounded-2xl w-full max-w-xs bg-gradient-to-r from-amber-500 to-indigo-500 text-white text-lg font-black shadow-xl shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all outline-none"
        >
          تعليق وبدء التنفيذ 🧭
        </button>
      </div>
    )
  });

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      className="w-full max-w-4xl mx-4 m-0 custom-dialog-no-padding custom-transparent-dialog mt-20"
      closable={false}
      showHeader={false}
      contentStyle={{ padding: 0, borderRadius: '24px', overflow: 'hidden', background: '#080d26', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div className="flex flex-col min-h-[70vh] bg-[#080d26] relative overflow-hidden" dir="rtl">
        {/* Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1A2B6B_0%,transparent_50%)] opacity-30 pointer-events-none" />
        
        {/* Header */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-white/10 bg-black/20 z-10">
          <div className="flex flex-col">
             <h2 className="text-xs font-black text-indigo-400 tracking-widest uppercase mb-1">خطوات النشاط</h2>
             <h1 className="text-xl md:text-2xl font-black text-white">{activity.title}</h1>
          </div>
          <button
             onClick={onHide}
             className="w-10 h-10 rounded-full bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex w-full h-1.5 bg-black/40 z-10">
          {steps.map((st, i) => (
             <div 
               key={i} 
               className={`flex-1 transition-all duration-500 ${i <= currentStep ? 'bg-indigo-500' : 'bg-transparent border-r border-white/5'}`} 
             />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-12 overflow-y-auto z-10 flex flex-col justify-center relative custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl mx-auto"
            >
              {steps[currentStep].content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="p-6 md:p-8 border-t border-white/10 bg-black/20 z-10 flex justify-between items-center">
           <button
             onClick={prevStep}
             disabled={currentStep === 0}
             className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition-all cursor-pointer ${currentStep === 0 ? 'opacity-30 cursor-not-allowed bg-transparent text-slate-500' : 'bg-white/5 hover:bg-white/10 text-white'}`}
           >
             <ChevronRight className="w-5 h-5" />
             السابق
           </button>
           
           <div className="text-slate-400 font-bold text-sm">
             {currentStep + 1} / {steps.length}
           </div>

           <button
             onClick={nextStep}
             className={`flex items-center gap-2 px-8 py-4 rounded-xl font-black transition-all cursor-pointer ${currentStep === steps.length - 1 ? 'opacity-0 pointer-events-none' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'}`}
           >
             التالي
             <ChevronLeft className="w-5 h-5" />
           </button>
        </div>
      </div>
    </Dialog>
  );
}
