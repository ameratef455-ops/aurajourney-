import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Sparkles, 
  ShieldCheck, 
  Rocket, 
  ChevronLeft, 
  ChevronRight,
  Target,
  Trophy,
  Zap
} from 'lucide-react';

interface TutorialProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "مرحباً بك في VIA",
    description: "بوابتك الذكية لتعلم المستقبل. نحن هنا لنأخذ بيدك في رحلة معرفية لا مثيل لها، مصممة خصيصاً لتناسب طموحاتك.",
    icon: Compass,
    color: "from-indigo-500 to-blue-600",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "نظام الرحلات الذكي",
    description: "لا مزيد من التشتت. قمنا بتقسيم المعرفة إلى 'رحلات' منظمة، كل رحلة تحتوي على محطات تفاعلية تضمن لك الإتقان.",
    icon: Target,
    color: "from-purple-500 to-indigo-600",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "تعلّم واستمتع",
    description: "حوّل تعلمك إلى لعبة! اكسب نقاط الخبرة (XP)، وافتح الإنجازات، وتنافس مع نفسك ومع الآخرين في نظام التلعيب المتطور.",
    icon: Trophy,
    color: "from-amber-400 to-orange-600",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "أمان وخصوصية تامة",
    description: "تقدمك وبياناتك تحت حماية فائقة. مع تقنيات VIA السحابية، يمكنك الوصول لرحلاتك من أي مكان وفي أي وقت بكل حرية.",
    icon: ShieldCheck,
    color: "from-emerald-500 to-teal-600",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop"
  }
];

export function Tutorial({ onComplete }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-white flex items-center justify-center overflow-hidden" dir="rtl">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50 blur-[140px] pointer-events-none rounded-full" />

      <div className="w-full h-full max-w-7xl max-h-[850px] grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[64px] border border-slate-100 shadow-[0_40px_100px_rgba(0,0,0,0.05)] overflow-hidden relative m-4 md:m-12">
        
        {/* Left Side: Visual Content */}
        <div className="hidden lg:block relative overflow-hidden bg-slate-50">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent z-10" />
              <img 
                src={steps[currentStep].image} 
                alt={steps[currentStep].title}
                className="w-full h-full object-cover grayscale-[0.2] brightness-110"
                referrerPolicy="no-referrer"
              />
              
              {/* Floating Decorative Elements */}
              <div className="absolute bottom-16 right-16 z-20 text-indigo-950">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-4 bg-white/60 backdrop-blur-3xl border border-white/40 p-6 rounded-3xl shadow-2xl"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${steps[currentStep].color} flex items-center justify-center shadow-lg`}>
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-900/60 mb-1">التقنية المستخدمة</p>
                    <p className="text-lg font-black tracking-tight text-indigo-950">محرك VIA الذكي</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          <div className="absolute top-10 right-10 z-20">
            <div className="flex items-center gap-4 bg-white/40 backdrop-blur-lg px-6 py-3 rounded-2xl border border-white/50">
              <Compass className="w-6 h-6 text-indigo-600" />
              <span className="text-indigo-950 font-black text-lg tracking-tight">VIA JOURNEY</span>
            </div>
          </div>
        </div>

        {/* Right Side: Step Content */}
        <div className="p-10 md:p-20 flex flex-col justify-between bg-white relative">
          <div>
            <div className="flex justify-between items-center mb-16">
              <button 
                onClick={onComplete}
                className="px-6 py-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 font-black text-[10px] rounded-2xl transition-all uppercase tracking-widest"
              >
                تخطي الجولة
              </button>
              
              <div className="flex gap-2">
                {steps.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-100'}`}
                  />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="max-w-md"
              >
                <div className={`w-20 h-20 rounded-[28px] bg-gradient-to-br ${steps[currentStep].color} flex items-center justify-center shadow-xl mb-10`}>
                  {React.createElement(steps[currentStep].icon, { className: "w-10 h-10 text-white" })}
                </div>
                
                <h2 className="text-5xl font-black text-slate-950 mb-8 leading-[1.1] tracking-tight">
                  {steps[currentStep].title}
                </h2>
                
                <p className="text-xl font-bold leading-relaxed bg-gradient-to-br from-indigo-900 to-blue-800 bg-clip-text text-transparent">
                  {steps[currentStep].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between pt-10">
            <div className="flex gap-4">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`w-14 h-14 rounded-2xl border border-slate-100 flex items-center justify-center transition-all ${currentStep === 0 ? 'opacity-0' : 'hover:bg-slate-50 hover:border-slate-200 group'}`}
              >
                <ChevronRight className="w-7 h-7 text-slate-400 group-hover:text-slate-900" />
              </button>
              <button
                onClick={handleNext}
                className="h-14 px-10 rounded-2xl bg-indigo-600 text-white font-black text-base flex items-center gap-4 hover:bg-indigo-700 transition-all shadow-lg active:scale-95 group"
              >
                <span>{currentStep === steps.length - 1 ? 'ابدأ رحلتك' : 'التالي'}</span>
                {currentStep === steps.length - 1 ? (
                  <Rocket className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
