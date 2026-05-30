import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  Mail, 
  Lock, 
  Sparkles, 
  UserPlus, 
  LogIn, 
  ShieldAlert, 
  KeyRound, 
  ArrowRight, 
  Compass, 
  ShieldCheck, 
  Fingerprint,
  X,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LoginProps {
  onSuccess: (sessionUser: any) => void;
  onBack: () => void;
  onTutorialRequest: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'setup';

export function Login({ onSuccess, onBack, onTutorialRequest }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setMode('setup');
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error('يرجى تهيئة إعدادات Supabase أولاً.');
      return;
    }

    if (mode === 'forgot-password') {
      if (!email) {
        toast.error('يرجى إدخال بريدك الإلكتروني.');
        return;
      }
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('تم إرسال رابط استعادة كلمة المرور.');
        setMode('login');
      }
      return;
    }

    if (!email || !password) {
      toast.error('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          toast.success(`مرحباً بك مجدداً! ✨`);
          onSuccess(data.user);
        }
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        if (data.user) {
          setShowVerificationModal(true);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ ما أثناء المصادقة.');
    } finally {
      setLoading(false);
    }
  };

  const renderSetup = () => (
    <div className="space-y-6 text-right">
      <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-[40px]">
        <h2 className="text-2xl font-black text-amber-400 mb-3 flex items-center gap-3">
          تحتاج لربط Supabase <ShieldAlert className="w-6 h-6" />
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed font-semibold">
          نظام المصادقة الفاخر يتطلب ربط مشروعك بـ Supabase. يرجى إضافة المتغيرات التالية في إعدادات المنصة (VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY).
        </p>
      </div>
      <button 
        onClick={onBack}
        className="text-sm font-black text-slate-400 hover:text-white transition-colors flex items-center gap-2 mx-auto"
      >
        <ArrowRight className="w-5 h-5" /> العودة للرئيسية
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-50/80 backdrop-blur-2xl flex items-center justify-center p-0 md:p-12 overflow-hidden" dir="rtl">
      {/* Background visual elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 blur-[140px] pointer-events-none rounded-full" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full h-full max-w-7xl max-h-[900px] grid grid-cols-1 lg:grid-cols-2 bg-white border border-slate-200/60 rounded-[64px] shadow-[0_60px_150px_rgba(30,41,59,0.15)] overflow-hidden relative"
      >
        {/* Close Button */}
        <button 
          onClick={onBack}
          className="absolute top-10 left-10 z-50 w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center border border-slate-200 transition-all cursor-pointer group shadow-sm active:scale-95"
        >
          <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Feature Sidebar (Right Half) */}
        <div className="hidden lg:flex bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-950 p-20 flex-col justify-between relative overflow-hidden text-white order-2">
          {/* Animated Background Textures */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] scale-150" />
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/5 rounded-full blur-[100px]" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-400/10 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)] pointer-events-none" />
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative z-10"
          >
            <div className="flex items-center gap-6 mb-16">
              <div className="w-20 h-20 rounded-[32px] bg-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/20">
                <Compass className="w-10 h-10 text-white stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight leading-none text-white">منصة VIA</h1>
                <p className="text-xs text-indigo-200 font-black tracking-[0.4em] mt-3 uppercase font-mono opacity-80 decoration-indigo-400/30 underline-offset-4 underline">VIRTUAL INTELLIGENCE ACCELERATOR</p>
              </div>
            </div>

            <div className="space-y-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={mode}
                className="space-y-4"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-400/20 text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                  <Sparkles className="w-3 h-3" /> 
                  {mode === 'signup' ? 'نظام العضوية المتميز' : 'بوابة العبور الآمنة'}
                </div>
                <h2 className="text-5xl xl:text-6xl font-black leading-[1.2] text-white tracking-tight">
                  {mode === 'signup' ? 'استعد للقفزة الكبرى في مسيرتك.' : 'استوطن المستقبل في كل خطوة.'}
                </h2>
              </motion.div>
              
              <div className="space-y-8 max-w-sm">
                {[
                  { icon: Compass, title: "رحلات معرفية", desc: "خارطة طريق مبنية على أحدث استراتيجيات التعلم النشط والمستمر." },
                  { icon: Sparkles, title: "عالم التلعيب", desc: "حول إنجازاتك اليومية لمكافآت، نقاط خبرة (XP) ومفاتيح تفتح آفاقاً جديدة." },
                  { icon: ShieldCheck, title: "حصن البيانات", desc: "بياناتك مشفرة ومحفوظة سحابياً لتكون معك في كل زمان ومكان." }
                ].map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                    key={i} 
                    className="flex gap-6 items-start group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/15 transition-all shrink-0 shadow-2xl">
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white group-hover:text-indigo-100 transition-colors uppercase tracking-wider">{item.title}</h4>
                      <p className="text-sm text-indigo-100/70 mt-2 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Heavy Platform Indicators */}
            <div className="mt-16 grid grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="text-xs font-black text-indigo-300/60 uppercase tracking-widest mb-1">المستخدمين النشطين</p>
                <div className="text-2xl font-black text-white">12.4K+</div>
              </div>
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="text-xs font-black text-indigo-300/60 uppercase tracking-widest mb-1">نسبة النجاح</p>
                <div className="text-2xl font-black text-white">98.2%</div>
              </div>
            </div>
          </motion.div>

          <div className="pt-16 border-t border-white/10 flex items-center justify-between text-xs text-white/40 font-black tracking-[0.3em] relative z-10">
            <span>PLATFORM CORE v4.5</span>
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.6)]" />
              ULTRA SECURE
            </div>
          </div>
        </div>

        {/* Auth Forms Area (Left Half) */}
        <div className="flex flex-col justify-start p-12 lg:p-24 relative bg-white order-1 overflow-y-auto custom-scrollbar h-full">
          <AnimatePresence mode="wait">
            {mode === 'setup' ? (
              <motion.div key="setup" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                {renderSetup()}
              </motion.div>
            ) : (
              <motion.div
                key={mode}
                initial={{ opacity: 0, scale: 0.98, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -15 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="w-full max-w-md mx-auto"
              >
                <div className="mb-16">
                  <motion.h3 
                    layoutId="auth-title"
                    className="text-5xl font-black text-slate-900 mb-6 tracking-tight"
                  >
                    {mode === 'login' ? 'أهلاً بك 👋' : mode === 'signup' ? 'رحلة جديدة ✨' : 'استعادة 🔑'}
                  </motion.h3>
                  <p className="text-lg text-slate-500 font-bold leading-relaxed">
                    {mode === 'login' ? 'يسعدنا عودتك لمواصلة بناء مستقبلك معنا اليوم.' : mode === 'signup' ? 'انضم لنخبة الرواد وافتح الأبواب لفرص لا محدودة.' : 'أدخل بريدك لنرسل لك سحر استعادة الدخول.'}
                  </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-8">
                  <AnimatePresence>
                    {mode === 'signup' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <div className="flex justify-between items-center px-2">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] opacity-80">الاسم واللقب</label>
                          <button 
                            type="button"
                            onClick={onTutorialRequest}
                            className="flex items-center gap-2 text-[10px] font-black text-indigo-600 hover:text-indigo-500 transition-colors uppercase tracking-widest"
                          >
                            <Sparkles className="w-3 h-3" /> جولة سريعة
                          </button>
                        </div>
                        <div className="relative group">
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full pl-6 pr-14 py-6 bg-gradient-to-br from-slate-950 to-indigo-950 border border-slate-800 rounded-[28px] text-sm font-bold text-white placeholder-slate-500 outline-none focus:ring-4 ring-indigo-500/10 transition-all text-right shadow-2xl"
                            placeholder="مثال: حسن العتيبي"
                            required
                          />
                          <UserPlus className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2.5">
                    <label className="text-xs font-black text-slate-500 mr-2 uppercase tracking-[0.2em] opacity-80">البريد الإلكتروني</label>
                    <div className="relative group">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-6 pr-14 py-6 bg-gradient-to-br from-slate-950 to-indigo-950 border border-slate-800 rounded-[28px] text-sm font-bold text-white placeholder-slate-500 outline-none focus:ring-4 ring-indigo-500/10 transition-all text-right shadow-2xl"
                        placeholder="name@example.com"
                        required
                      />
                      <Mail className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                  </div>

                  {mode !== 'forgot-password' && (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center mr-2 ml-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] opacity-80">كلمة المرور</label>
                        {mode === 'login' && (
                          <button 
                            type="button" 
                            onClick={() => setMode('forgot-password')}
                            className="text-xs font-black text-indigo-600 hover:text-indigo-500 bg-transparent border-none cursor-pointer transition-colors"
                          >
                            نسيتها؟
                          </button>
                        )}
                      </div>
                      <div className="relative group">
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-6 pr-14 py-6 bg-gradient-to-br from-slate-950 to-indigo-950 border border-slate-800 rounded-[28px] text-sm font-bold text-white placeholder-slate-500 outline-none focus:ring-4 ring-indigo-500/10 transition-all text-right shadow-2xl"
                          placeholder="••••••••"
                          required
                        />
                        <Lock className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-7 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:brightness-110 active:scale-[0.98] text-white font-black text-lg rounded-[32px] shadow-3xl shadow-indigo-600/40 border-none transition-all flex items-center justify-center gap-4 cursor-pointer disabled:opacity-50 mt-10 overflow-hidden relative group"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    {loading ? (
                      <i className="pi pi-spin pi-spinner text-2xl" />
                    ) : (
                      <>
                        {mode === 'login' ? <LogIn className="w-6 h-6" /> : mode === 'signup' ? <UserPlus className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
                        <span>{mode === 'login' ? 'الدخول لحسابك' : mode === 'signup' ? 'بدء الرحلة الآن' : 'إرسال الرابط'}</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-16 pt-12 border-t border-slate-100 text-center">
                  {mode === 'forgot-password' ? (
                    <button 
                      onClick={() => setMode('login')} 
                      className="flex items-center gap-3 text-sm font-black text-slate-500 hover:text-indigo-600 transition-all bg-transparent border-none cursor-pointer mx-auto group"
                    >
                      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> العودة للدخول
                    </button>
                  ) : (
                    <p className="text-base font-bold text-slate-500">
                      {mode === 'login' ? 'جديد في VIA؟' : 'تملك حساباً مسبقاً؟'}{' '}
                      <button
                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                        className="text-indigo-600 hover:text-indigo-500 font-black bg-transparent border-none cursor-pointer mr-2 transition-colors border-b-2 border-transparent hover:border-indigo-600"
                      >
                        {mode === 'login' ? 'افتح حسابك الآن' : 'سجل دخولك'}
                      </button>
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Verification Modal (Floating Glass) */}
      <AnimatePresence>
        {showVerificationModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[2100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="fixed z-[2110] w-[95%] max-w-xl bg-white p-12 rounded-[56px] shadow-[0_50px_100px_rgba(0,0,0,0.15)] text-center border border-slate-100"
            >
              <div className="w-24 h-24 rounded-[36px] bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-10 shadow-inner">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 4 }}
                >
                  <Mail className="w-10 h-10 text-indigo-600" />
                </motion.div>
              </div>

              <h2 className="text-4xl font-black text-slate-950 mb-6 tracking-tight">تحقق من بريدك 📩</h2>
              
              <div className="space-y-6 text-slate-600 font-bold mb-10">
                <p className="text-lg leading-relaxed">
                  أهلاً بك في عالمنا! لقد أرسلنا رسالة تفعيل هامة إلى بريدك الإلكتروني:
                </p>
                <div className="inline-block px-8 py-3 bg-slate-50 border border-slate-100 rounded-full text-indigo-600 font-black text-sm">
                  ameratef455@gmail.com
                </div>
                <p className="text-base">
                  يرجى النقر على الرابط الموجود في الرسالة لتأمين حسابك والبدء في رحلتك التعليمية الفريدة.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => {
                    setShowVerificationModal(false);
                    setMode('login');
                  }}
                  className="w-full py-6 bg-slate-950 text-white font-black text-base rounded-[28px] hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                >
                  تم، العودة للدخول
                </button>
                <button className="text-sm font-black text-slate-400 hover:text-indigo-600 transition-colors bg-transparent border-none">
                  لم تصلك الرسالة؟ أعد الإرسال
                </button>
              </div>

              <p className="mt-10 text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <ShieldAlert className="w-4 h-4" /> تأكد من صندوق الرسائل غير المرغوب فيها (SPAM)
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
