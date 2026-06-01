import { useState } from 'react';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { toast as toastHot } from 'react-hot-toast';
import { Mail, Lock, LogIn, Eye, EyeOff, Sparkles, UserCheck } from 'lucide-react';
import { vibrate, HAPITCS } from '../lib/haptics';

interface LoginProps {
  onRegisterClick: () => void;
  onSuccess: () => void;
}

export function Login({ onRegisterClick, onSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toastHot.error("الرجاء ملء جميع الحقول ⚠️");
      return;
    }
    
    setLoading(true);
    vibrate(HAPITCS.MAJOR_CLICK);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toastHot.success("تم تسجيل الدخول بنجاح! 🚀");
      onSuccess();
    } catch (error: any) {
      console.error(error);
      let message = "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        message = "البريد الإلكتروني أو كلمة المرور غير صحيحة ❌";
      } else if (error.code === 'auth/invalid-email') {
        message = "صيغة البريد الإلكتروني غير صالحة ⚠️";
      } else if (error.code === 'auth/admin-restricted-operation') {
        message = "دخول المستخدمين معطل في إعدادات مشروع الـ Firebase. يرجى مراجعة وتفعيل خيار (Email/Password) ومستندات تفعيل التسجيل ⚙️";
      }
      toastHot.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    vibrate(HAPITCS.MAJOR_CLICK);
    try {
      await signInAnonymously(auth);
      toastHot.success("تم الدخول كمستكشف زائر بنجاح! ✨");
      onSuccess();
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/admin-restricted-operation') {
        toastHot.error("الدخول كزائر معطل في إعدادات Firebase. الرجاء تمكين Anonymous Sign-in من لوحة التحكم ⚙️");
      } else {
        toastHot.error("فشل تسجيل الدخول كزائر.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white/90 backdrop-blur-md border border-slate-100/80 rounded-[40px] shadow-[0_30px_70px_rgba(30,58,138,0.06)] mx-auto relative overflow-hidden" dir="rtl">
      {/* Small Ambient Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

      <div className="flex flex-col items-center justify-center mb-8">
        <div className="w-16 h-16 border-2 border-blue-900 flex items-center justify-center rounded-3xl bg-blue-50/50 shadow-sm mb-4">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-900">
            <circle cx="12" cy="6" r="2.5" fill="currentColor" />
            <circle cx="6" cy="18" r="2.5" fill="currentColor" />
            <circle cx="18" cy="18" r="2.5" fill="currentColor" />
            <path d="M12 8.5L7.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 8.5L16.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M8.5 18H15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 className="text-3xl font-black text-blue-950 tracking-tight mb-2">تسجيل الدخول</h2>
        <p className="text-sm font-medium text-slate-500 text-center">
          أهلاً بك مجدداً في رحلتك التعليمية والتطبيقية
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5 relative z-10">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-600 mr-2 block">
            البريد الإلكتروني
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 right-4 flex items-center text-slate-400 pointer-events-none">
              <Mail className="w-5 h-5" />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-100 focus:border-blue-600 focus:bg-white rounded-2xl outline-none font-medium text-slate-800 transition-all text-sm shadow-sm"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-600 mr-2 block">
            كلمة المرور
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 right-4 flex items-center text-slate-400 pointer-events-none">
              <Lock className="w-5 h-5" />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 focus:border-blue-600 focus:bg-white rounded-2xl outline-none font-sans text-slate-800 transition-all text-sm shadow-sm"
              required
            />
            <button
              type="button"
              onClick={() => {
                vibrate(HAPITCS.GUIDANCE);
                setShowPassword(!showPassword);
              }}
              className="absolute inset-y-0 left-4 flex items-center text-slate-400 hover:text-blue-900 transition-colors border-none bg-transparent cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-800 to-blue-950 text-white font-bold rounded-2xl shadow-lg hover:brightness-110 active:scale-[0.98] disabled:opacity-50 transition-all border-none cursor-pointer text-sm"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>تسجيل الدخول</span>
            </>
          )}
        </button>
      </form>

      <div className="relative flex py-6 items-center">
        <div className="flex-grow border-t border-slate-100"></div>
        <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold">أو</span>
        <div className="flex-grow border-t border-slate-100"></div>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleGuestLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold rounded-2xl hover:bg-indigo-100 active:scale-[0.98] transition-all cursor-pointer text-xs"
        >
          <Sparkles className="w-4 h-4" />
          <span>الدخول كزائر (بدون حساب)</span>
        </button>

        <p className="text-center text-sm text-slate-500 font-medium">
          ليس لديك حساب؟{" "}
          <button
            onClick={() => {
              vibrate(HAPITCS.GUIDANCE);
              onRegisterClick();
            }}
            className="text-blue-900 font-black hover:underline bg-transparent border-none cursor-pointer"
          >
            إنشاء حساب جديد
          </button>
        </p>
      </div>
    </div>
  );
}
