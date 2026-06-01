import { useState } from 'react';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { toast as toastHot } from 'react-hot-toast';
import { Mail, Lock, UserPlus, Eye, EyeOff, Sparkles, LogIn } from 'lucide-react';
import { vibrate, HAPITCS } from '../lib/haptics';

interface SignupProps {
  onLoginClick: () => void;
  onSuccess: () => void;
}

export function Signup({ onLoginClick, onSuccess }: SignupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toastHot.error("الرجاء ملء جميع الحقول ⚠️");
      return;
    }

    if (password !== confirmPassword) {
      toastHot.error("كلمتا المرور غير متطابقتين ❌");
      return;
    }

    if (password.length < 6) {
      toastHot.error("يجب أن تكون كلمة المرور 6 أحرف على الأقل 🔒");
      return;
    }
    
    setLoading(true);
    vibrate(HAPITCS.MAJOR_CLICK);
    
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toastHot.success("تم إنشاء الحساب بنجاح! 🎉");
      onSuccess();
    } catch (error: any) {
      console.error(error);
      let message = "حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.";
      if (error.code === 'auth/email-already-in-use') {
        message = "هذا البريد الإلكتروني مستخدم بالفعل ❌";
      } else if (error.code === 'auth/invalid-email') {
        message = "صيغة البريد الإلكتروني غير صالحة ⚠️";
      } else if (error.code === 'auth/weak-password') {
        message = "كلمة المرور ضعيفة للغاية من فضلك استخدم كلمة أقوى 💪";
      } else if (error.code === 'auth/admin-restricted-operation') {
        message = "إنشاء الحسابات معطل حالياً من إعدادات Firebase (يرجى تفعيل خيار Sign-up في الـ Console) ⚙️";
      }
      toastHot.error(message);
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
        <div className="w-16 h-16 border-2 border-indigo-950 flex items-center justify-center rounded-3xl bg-indigo-50/50 shadow-sm mb-4">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-indigo-950">
            <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="2" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke="currentColor" strokeWidth="2" />
            <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">إنشاء حساب</h2>
        <p className="text-sm font-medium text-slate-500 text-center">
          انضم إلينا اليوم وابدأ رحلتك التفاعلية بكل سهولة
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4 relative z-10">
        <div className="space-y-1">
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
              className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-100 focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-medium text-slate-800 transition-all text-sm shadow-sm"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
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
              className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-sans text-slate-800 transition-all text-sm shadow-sm"
              required
            />
            <button
              type="button"
              onClick={() => {
                vibrate(HAPITCS.GUIDANCE);
                setShowPassword(!showPassword);
              }}
              className="absolute inset-y-0 left-4 flex items-center text-slate-400 hover:text-indigo-900 transition-colors border-none bg-transparent cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black text-slate-600 mr-2 block">
            تأكيد كلمة المرور
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 right-4 flex items-center text-slate-400 pointer-events-none">
              <Lock className="w-5 h-5" />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-sans text-slate-800 transition-all text-sm shadow-sm"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-indigo-700 to-slate-900 text-white font-bold rounded-2xl shadow-lg hover:brightness-110 active:scale-[0.98] disabled:opacity-50 transition-all border-none cursor-pointer text-sm"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              <span>إنشاء حساب جديد</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-4 border-t border-slate-100">
        <p className="text-center text-sm text-slate-500 font-medium">
          لديك حساب بالفعل؟{" "}
          <button
            onClick={() => {
              vibrate(HAPITCS.GUIDANCE);
              onLoginClick();
            }}
            className="text-indigo-950 font-black hover:underline bg-transparent border-none cursor-pointer"
          >
            تسجيل الدخول
          </button>
        </p>
      </div>
    </div>
  );
}
