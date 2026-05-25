import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Slider } from 'primereact/slider';
import { Checkbox } from 'primereact/checkbox';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Trophy, Lightbulb, Wrench, ListChecks, CheckCircle2 } from 'lucide-react';

interface TaskReflectionModalProps {
  visible: boolean;
  onHide: () => void;
  onSubmit: (data: any) => void;
  taskTitle: string;
}

export function TaskReflectionModal({ visible, onHide, onSubmit, taskTitle }: TaskReflectionModalProps) {
  const [focus, setFocus] = useState<number>(3);
  const [mastery, setMastery] = useState<number>(5);
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [learnings, setLearnings] = useState('');
  const [didPractical, setDidPractical] = useState(false);
  const [practicalIssues, setPracticalIssues] = useState('');

  const focusLevels = [
    { value: 1, color: 'bg-rose-100 text-rose-600', active: 'bg-rose-500 text-white shadow-rose-200' },
    { value: 2, color: 'bg-orange-100 text-orange-600', active: 'bg-orange-500 text-white shadow-orange-200' },
    { value: 3, color: 'bg-amber-100 text-amber-600', active: 'bg-amber-500 text-white shadow-amber-200' },
    { value: 4, color: 'bg-blue-100 text-blue-600', active: 'bg-blue-500 text-white shadow-blue-200' },
    { value: 5, color: 'bg-emerald-100 text-emerald-600', active: 'bg-emerald-500 text-white shadow-emerald-200' },
  ];

  const handleSubmit = () => {
    onSubmit({
      focus,
      mastery,
      strengths,
      weaknesses,
      learnings,
      didPractical,
      practicalIssues
    });
    onHide();
  };

  return (
    <Dialog 
      visible={visible} 
      onHide={onHide}
      header={<div className="flex flex-col gap-1">
        <span className="text-xl font-black text-indigo-950">تقييم إنجاز المهمة ✨</span>
        <span className="text-xs text-indigo-500 font-medium">{taskTitle}</span>
      </div>}
      className="w-full max-w-2xl font-sans"
      showHeader
      modal
      dismissableMask
      breakpoints={{ '960px': '75vw', '641px': '95vw' }}
    >
      <div className="space-y-8 py-4" dir="rtl">
        
        {/* Focus Level */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-black text-slate-700">
            <Brain className="w-5 h-5 text-indigo-500" />
            مدى التركيز أثناء المهمة:
          </label>
          <div className="flex justify-between gap-2">
            {focusLevels.map((lvl) => (
              <button
                key={lvl.value}
                onClick={() => setFocus(lvl.value)}
                className={`flex-1 py-3 px-2 rounded-xl text-lg font-black transition-all ${
                  focus === lvl.value ? lvl.active + ' scale-105 ring-2 ring-white ring-offset-2' : lvl.color + ' opacity-60 hover:opacity-100'
                }`}
              >
                {lvl.value}
              </button>
            ))}
          </div>
        </div>

        {/* Mastery Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-sm font-black text-slate-700">
              <Trophy className="w-5 h-5 text-amber-500" />
              مدى الإتقان والفهم:
            </label>
            <span className="text-xl font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
              {mastery} <span className="text-xs">/ 10</span>
            </span>
          </div>
          <div className="px-4 py-2">
            <Slider 
              value={mastery} 
              onChange={(e) => setMastery(e.value as number)} 
              min={1} 
              max={10} 
              className="h-2 rounded-full"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-3 px-1">
              <span>ضعيف جداً</span>
              <span>ممتاز جداً</span>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-emerald-600 uppercase tracking-wider block mr-1 flex items-center gap-1">
              💪 نقاط القوة:
            </label>
            <InputTextarea 
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="ما الذي ميز أداءك؟"
              className="w-full min-h-[60px] bg-emerald-50/30 border-emerald-100 rounded-2xl p-4 text-xs font-medium focus:bg-white transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-rose-600 uppercase tracking-wider block mr-1 flex items-center gap-1">
              🧨 نقاط الضعف:
            </label>
            <InputTextarea 
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              placeholder="ما الذي يحتاج لتطوير؟"
              className="w-full min-h-[60px] bg-rose-50/30 border-rose-100 rounded-2xl p-4 text-xs font-medium focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Key Learnings */}
        <div className="space-y-2">
          <label className="text-xs font-black text-blue-600 uppercase tracking-wider block mr-1 flex items-center gap-1">
            <Lightbulb className="w-4 h-4" />
            أهم الأفكار المكتسبة:
          </label>
          <InputTextarea 
            value={learnings}
            onChange={(e) => setLearnings(e.target.value)}
            placeholder="لخص أهم ما تعلمته اليوم في نقاط..."
            className="w-full min-h-[80px] bg-blue-50/30 border-blue-100 rounded-2xl p-4 text-xs font-medium focus:bg-white transition-colors"
          />
        </div>

        {/* Practical Application */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setDidPractical(!didPractical)}>
            <Checkbox checked={didPractical} className="scale-125" />
            <label className="text-sm font-black text-slate-700 cursor-pointer">هل طبقت ما تعلمته بشكل عملي؟</label>
          </div>

          <AnimatePresence>
            {didPractical && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 p-1">
                  <label className="text-xs font-black text-indigo-600 uppercase tracking-wider block mr-1 flex items-center gap-1">
                    <Wrench className="w-4 h-4 ml-1" />
                    المشاكل التي واجهتك وكيف حللتها:
                  </label>
                  <InputTextarea 
                    value={practicalIssues}
                    onChange={(e) => setPracticalIssues(e.target.value)}
                    placeholder="التحديات العملية وحلولك المبتكرة..."
                    className="w-full min-h-[60px] bg-indigo-50/30 border-indigo-100 rounded-2xl p-4 text-xs font-medium focus:bg-white transition-colors"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button 
            onClick={handleSubmit}
            className="w-full force-blue-gradient rounded-2xl py-5 flex items-center justify-center gap-3 shadow-xl"
          >
            <CheckCircle2 className="w-6 h-6" />
            <span className="text-lg font-black">حفظ التقييم وختم المهمة</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
