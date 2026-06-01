import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../db';
import { auth, db as firestore } from '../lib/firebase';
import { collection, doc, getDocs, updateDoc, setDoc, deleteDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import { toast as toastHot } from 'react-hot-toast';
import { vibrate, HAPITCS } from '../lib/haptics';
import { 
  Shield, Users, Compass, Check, X, Award, Map, UserPlus, 
  ToggleLeft, ToggleRight, Sparkles, Database, Trash2, Edit3, 
  FileJson, Search, ChevronRight, CornerDownLeft, Plus, Save, Copy, 
  BarChart2, PieChart as PieChartIcon, Activity, Star, Info
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'free' | 'premium';
  createdAt?: string;
  tripCount?: number;
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'trips' | 'firestore' | 'stats' | 'ads'>('users');
  const [assigningTrip, setAssigningTrip] = useState<any | null>(null);

  // Firestore Explorer State
  const [explorerCollection, setExplorerCollection] = useState<'users' | 'publicTrips' | 'ads'>('users');
  const [explorerUserId, setExplorerUserId] = useState<string | null>(null);
  const [explorerSubcollection, setExplorerSubcollection] = useState<'userSettings' | 'stations' | 'tasks' | 'reflections' | 'stumbles' | 'notifications' | 'feedbacks' | null>(null);
  const [explorerDocs, setExplorerDocs] = useState<any[]>([]);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [explorerSearch, setExplorerSearch] = useState('');
  
  // JSON Editor Modal State
  const [editingDoc, setEditingDoc] = useState<{
    id: string;
    path: string;
    data: any;
    isNew: boolean;
  } | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [newDocId, setNewDocId] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch users from Firestore
      const usersSnap = await getDocs(collection(firestore, 'users'));
      const fetchedUsers: UserProfile[] = [];
      
      for (const docSnap of usersSnap.docs) {
        const data = docSnap.data();
        let tripCount = 0;
        try {
          // Fetch trip count per user dynamically
          const tripsSnap = await getDocs(collection(firestore, `users/${docSnap.id}/userSettings`));
          tripCount = tripsSnap.size;
        } catch (_) {}

        fetchedUsers.push({
          uid: docSnap.id,
          email: data.email || '',
          role: data.role || 'free',
          createdAt: data.createdAt,
          tripCount
        });
      }
      setUsers(fetchedUsers);

      // Fetch trips from local Dexie database
      const localTrips = await db.userSettings.toArray();
      setTrips(localTrips);
    } catch (error: any) {
      console.error(error);
      toastHot.error("فشل تحميل بيانات لوحة التحكم ⚠️");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminData();
    }
  }, [isOpen]);

  // Reactive Explorer Refetch
  useEffect(() => {
    if (isOpen && activeTab === 'firestore') {
      fetchExplorerDocs();
    }
  }, [isOpen, activeTab, explorerCollection, explorerUserId, explorerSubcollection]);

  const fetchExplorerDocs = async () => {
    setExplorerLoading(true);
    setExplorerDocs([]);
    try {
      let path = '';
      if (explorerCollection === 'publicTrips') {
        if (explorerSubcollection) {
          path = `publicTrips/${explorerUserId}/${explorerSubcollection}`; // Here explorerUserId acts as the tripId
        } else {
          path = 'publicTrips';
        }
      } else {
        // 'users' collection
        if (explorerUserId) {
          if (explorerSubcollection) {
            path = `users/${explorerUserId}/${explorerSubcollection}`;
          } else {
            // Just the specific user profile
            const singleDoc = await getDoc(doc(firestore, 'users', explorerUserId));
            if (singleDoc.exists()) {
              setExplorerDocs([{ id: singleDoc.id, ...singleDoc.data() }]);
            }
            setExplorerLoading(false);
            return;
          }
        } else {
          path = 'users';
        }
      }

      const snap = await getDocs(collection(firestore, path));
      const docsList: any[] = [];
      snap.forEach((d) => {
        docsList.push({ id: d.id, ...d.data() });
      });
      setExplorerDocs(docsList);
    } catch (err: any) {
      console.error(err);
      toastHot.error("فشل جلب بيانات المستند من Firestore! 🔒 (تحقق من الصلاحيات)");
    } finally {
      setExplorerLoading(false);
    }
  };

  const handleRoleChange = async (userUid: string, currentEmail: string, newRole: 'admin' | 'free' | 'premium') => {
    if (currentEmail.toLowerCase() === 'ameratef455@gmail.com' && newRole !== 'admin') {
      toastHot.error("لا يمكن تغيير صلاحيات المدير الرئيسي للبريد الخاص بك! 🔒");
      return;
    }
    
    vibrate(HAPITCS.MAJOR_CLICK);
    try {
      setLoading(true);
      const userRef = doc(firestore, 'users', userUid);
      await updateDoc(userRef, { role: newRole });
      toastHot.success("تم تحديث صلاحيات العضو بنجاح! 🎓");
      
      // Update local state
      setUsers(prev => prev.map(u => u.uid === userUid ? { ...u, role: newRole } : u));
    } catch (error: any) {
      console.error(error);
      toastHot.error("فشل تحديث الصلاحيات");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المسار نهائياً من قاعدة البيانات العامة؟')) return;
    try {
      await deleteDoc(doc(firestore, "publicTrips", tripId));
      toastHot.success('تم حذف المسار بنجاح');
      fetchAdminData();
    } catch (e) {
      console.error(e);
      toastHot.error('فشل في حذف المسار');
    }
  };

  const handleToggleFreeTrip = async (trip: any) => {
    vibrate(HAPITCS.MAJOR_CLICK);
    const nextIsFree = !trip.isFree;
    
    try {
      setLoading(true);
      
      // 1. Update the local IndexedDB (which syncs to Firebase under Admin's path)
      await db.userSettings.update(trip.id, { isFree: nextIsFree });
      
      // 2. Map this trip to global publicTrips
      const publicRef = doc(firestore, 'publicTrips', trip.id);
      
      if (nextIsFree) {
        // Copy trip document to publicTrips
        await setDoc(publicRef, {
          id: trip.id,
          learningGoal: trip.learningGoal,
          psychology: trip.psychology || {},
          dailyDuration: trip.dailyDuration || 30,
          learningDays: trip.learningDays || [0, 1, 2, 3, 4],
          isFree: true,
          theme: trip.theme || 'cards',
          createdAt: new Date().toISOString()
        });
        
        // Copy related stations
        const stations = await db.stations.toArray();
        for (const st of stations) {
          await setDoc(doc(firestore, `publicTrips/${trip.id}/stations`, st.id), st);
        }
        
        // Copy related tasks
        const tasks = await db.tasks.toArray();
        for (const t of tasks) {
          await setDoc(doc(firestore, `publicTrips/${trip.id}/tasks`, t.id), t);
        }
        
        toastHot.success("تم تصنيف الرحلة كـ مجانية ونشرها كدليل تفاعلي عام! 🌟");
      } else {
        await deleteDoc(publicRef);
        toastHot.success("تم إلغاء مجانية الرحلة وسحب محتوياتها من الأرشيف العام! 🔒");
      }
      
      // Update local UI state
      setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, isFree: nextIsFree } : t));
    } catch (error: any) {
      console.error(error);
      toastHot.error("حدث خطأ أثناء تعديل تصنيف مجانية الرحلة");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTrip = async (targetUser: UserProfile) => {
    if (!assigningTrip) return;
    vibrate(HAPITCS.MAJOR_CLICK);
    
    try {
      setLoading(true);
      
      // Copy trip (UserSettings) to target user's path in Firestore
      const targetTripRef = doc(firestore, `users/${targetUser.uid}/userSettings`, assigningTrip.id);
      await setDoc(targetTripRef, {
        ...assigningTrip,
        isFree: !!assigningTrip.isFree
      });
      
      // Copy stations
      const stations = await db.stations.toArray();
      for (const st of stations) {
        await setDoc(doc(firestore, `users/${targetUser.uid}/stations`, st.id), st);
      }
      
      // Copy tasks
      const tasks = await db.tasks.toArray();
      for (const t of tasks) {
        await setDoc(doc(firestore, `users/${targetUser.uid}/tasks`, t.id), t);
      }
      
      toastHot.success(`تم تعيين الرحلة المنهجية لـ ${targetUser.email} بنجاح! 🚀`);
      setAssigningTrip(null);
    } catch (error: any) {
      console.error(error);
      toastHot.error("فشل تعيين الرحلة للمستخدم ⚠️");
    } finally {
      setLoading(false);
    }
  };

  // Firestore Document Delete
  const handleDeleteDoc = async (id: string) => {
    vibrate(HAPITCS.MAJOR_CLICK);
    if (!window.confirm("تحذير ⚠️: هل أنت متأكد من حذف هذا المستند وبنيته نهائياً من سحابة Firestore؟ لا يمكن النكوص عن هذا الإجراء.")) {
      return;
    }

    setExplorerLoading(true);
    let path = '';
    if (explorerCollection === 'publicTrips') {
      if (explorerSubcollection) {
        path = `publicTrips/${explorerUserId}/${explorerSubcollection}`;
      } else {
        path = 'publicTrips';
      }
    } else {
      if (explorerUserId) {
        if (explorerSubcollection) {
          path = `users/${explorerUserId}/${explorerSubcollection}`;
        } else {
          path = `users/${explorerUserId}`;
        }
      } else {
        path = 'users';
      }
    }

    try {
      await deleteDoc(doc(firestore, path, id));
      toastHot.success("تم الحذف بنجاح من قاعدة البيانات! 🗑️");
      fetchExplorerDocs();
    } catch (err: any) {
      console.error(err);
      toastHot.error(`فشل حذف المستند: ${err.message || "صلاحيات غير كافية"}`);
    } finally {
      setExplorerLoading(false);
    }
  };

  // Open JSON Editor for existing doc
  const handleOpenEditDoc = (docId: string, currentData: any) => {
    vibrate(HAPITCS.MAJOR_CLICK);
    let path = '';
    if (explorerCollection === 'publicTrips') {
      if (explorerSubcollection) {
        path = `publicTrips/${explorerUserId}/${explorerSubcollection}/${docId}`;
      } else {
        path = `publicTrips/${docId}`;
      }
    } else {
      if (explorerUserId) {
        if (explorerSubcollection) {
          path = `users/${explorerUserId}/${explorerSubcollection}/${docId}`;
        } else {
          path = `users/${explorerUserId}`;
        }
      } else {
        path = `users/${docId}`;
      }
    }

    // copy data excluding id to edit
    const cleanData = { ...currentData };
    delete cleanData.id;

    setEditingDoc({
      id: docId,
      path,
      data: cleanData,
      isNew: false
    });
    setJsonInput(JSON.stringify(cleanData, null, 2));
    setJsonError(null);
    setNewDocId('');
  };

  // Open JSON Editor for new doc
  const handleOpenCreateDoc = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    let path = '';
    let template: any = {};

    if (explorerCollection === 'publicTrips') {
      if (explorerSubcollection === 'stations') {
        template = { 
          name: "محطة جديدة", 
          description: "وصف المحطة", 
          icon: "Compass", 
          order: 1, 
          targetDate: "2026-06-01", 
          isPremium: false, 
          completionMessage: "برافو! لقد أنهيت هذه المحطة. هل أنت مستعد للغوص أعمق في المحتوى المميز؟ 💎" 
        };
        path = `publicTrips/${explorerUserId}/stations`;
      } else if (explorerSubcollection === 'tasks') {
        template = { stationId: "أدخل معرف المحطة هنا", title: "مهمة تدريبية جديدة", type: "theory", duration: 15, isCompleted: false, activities: ["نشاط تجريبي أول"] };
        path = `publicTrips/${explorerUserId}/tasks`;
      } else {
        template = { 
          learningGoal: "العنوان التعليمي للرحلة العامة", 
          dailyDuration: 25, 
          isFree: true, 
          theme: "cards",
          completionMessage: "لقد أتممت الرحلة المجانية بنجاح! ننتظرك في الجانب الآخر حيث المحتوى الاحترافي. 🚀"
        };
        path = 'publicTrips';
      }
    } else if (explorerCollection === 'ads') {
      template = { title: "عنوان الإعلان", text: "تفاصيل الإعلان الممول...", imageUrl: "https://", targetUrl: "https://", position: "top", isActive: true };
      path = 'ads';
    } else {
      if (explorerSubcollection === 'userSettings') {
        template = { 
          learningGoal: "عنوان المسار التعليمي", 
          dailyDuration: 30, 
          psychology: {}, 
          theme: "cards", 
          isFree: false,
          role: "free",
          completionMessage: "أنت تقوم بعمل رائع! الرحلة تقترب من ذروتها."
        };
        path = `users/${explorerUserId}/userSettings`;
      } else if (explorerSubcollection === 'stations') {
        template = { name: "محطة جديدة للمشترك", description: "وصف المحطة", order: 1, isPremium: false, completionMessage: "رسالة تشجيعية مجانية..." };
        path = `users/${explorerUserId}/stations`;
      } else if (explorerSubcollection === 'tasks') {
        template = { stationId: "معرف المحطة", title: "نشاط مخصص للمشترك", isCompleted: false };
        path = `users/${explorerUserId}/tasks`;
      } else if (explorerSubcollection === 'reflections') {
        template = { taskId: "taskId_123", taskTitle: "ترجمة جمل شائعة", stationId: "stationId_123", stationName: "المحطة الأولى", focus: 5, mastery: 4, learnings: "تعلمت استخدام المصطلحات بشكل طبيعي.", strengths: "مخارج الحروف جيدة", weaknesses: "الحاجة للتكرار", didPractical: true, practicalIssues: "", createdAt: new Date().toISOString() };
        path = `users/${explorerUserId}/reflections`;
      } else if (explorerSubcollection === 'stumbles') {
        template = { stationId: "stationId_123", stationName: "اسم المحطة", reason: "عقبة في النطق أو عدم تذكر الكلمات", createdAt: new Date().toISOString() };
        path = `users/${explorerUserId}/stumbles`;
      } else if (explorerSubcollection === 'notifications') {
        template = { title: "تنبيه إداري جديد", message: "رسالة هامة من الإدارة حول الرحلة والمستوى", isRead: false, createdAt: new Date().toISOString(), type: "info" };
        path = `users/${explorerUserId}/notifications`;
      } else if (explorerSubcollection === 'feedbacks') {
        template = { userId: explorerUserId, rating: 5, comment: "تجربة رائعة!", type: "rating", createdAt: new Date().toISOString() };
        path = `users/${explorerUserId}/feedbacks`;
      } else {
        template = { email: "user@example.com", role: "free", createdAt: new Date().toISOString() };
        path = 'users';
      }
    }

    setEditingDoc({
      id: '',
      path,
      data: template,
      isNew: true
    });
    setJsonInput(JSON.stringify(template, null, 2));
    setJsonError(null);
    setNewDocId(`doc_${Math.random().toString(36).substr(2, 9)}`);
  };

  const handleSaveJsonDoc = async () => {
    if (!editingDoc) return;
    vibrate(HAPITCS.MAJOR_CLICK);

    let parsedData: any = null;
    try {
      parsedData = JSON.parse(jsonInput);
    } catch (e: any) {
      setJsonError(`خطأ في معالجة الـ JSON: ${e.message}`);
      return;
    }

    const docId = editingDoc.isNew ? newDocId.trim() : editingDoc.id;
    if (!docId) {
      setJsonError("يرجى إدخال معرف فريد للمستند (Document ID)");
      return;
    }

    setExplorerLoading(true);
    let path = '';
    if (explorerCollection === 'publicTrips') {
      if (explorerSubcollection) {
        path = `publicTrips/${explorerUserId}/${explorerSubcollection}`;
      } else {
        path = 'publicTrips';
      }
    } else {
      if (explorerUserId) {
        if (explorerSubcollection) {
          path = `users/${explorerUserId}/${explorerSubcollection}`;
        } else {
          path = `users/${explorerUserId}`;
        }
      } else {
        path = 'users';
      }
    }

    try {
      // Create document in Firestore
      await setDoc(doc(firestore, path, docId), parsedData);
      toastHot.success(editingDoc.isNew ? "تم إنشاء المستند بنجاح! 🎉" : "تم حفظ وتحديث المستند في Firestore! 💾");
      setEditingDoc(null);
      fetchExplorerDocs();
    } catch (err: any) {
      console.error(err);
      toastHot.error(`فشل حفظ المستند: ${err.message || "خطأ في الصلاحيات"}`);
    } finally {
      setExplorerLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toastHot.success("تم نسخ المعرف إلى الحافظة! 📋");
  };

  const filteredDocs = explorerDocs.filter(d => {
    if (!explorerSearch) return true;
    const searchLower = explorerSearch.toLowerCase();
    const idMatches = d.id.toLowerCase().includes(searchLower);
    const contentMatches = JSON.stringify(d).toLowerCase().includes(searchLower);
    return idMatches || contentMatches;
  });

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div key="admin-overlay" className="fixed inset-0 bg-slate-950 z-[200] flex flex-col" dir="rtl">
        <motion.div
          key="admin-layout"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="w-full h-full flex flex-col bg-slate-950 text-right font-sans"
        >
          {/* Dashboard Header */}
          <header className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/40 backdrop-blur-3xl shrink-0">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-700 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20">
                <Shield className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-white tracking-tighter">لوحة التحكم المركزية</h1>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">Aura HQ • v2.1</span>
                  <div className="w-1 h-1 rounded-full bg-slate-700" />
                  <p className="text-xs font-bold text-slate-500">إدارة القنوات، العضويات، ومستودعات Firestore</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="w-14 h-14 rounded-3xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center border border-white/5 transition-all cursor-pointer active:scale-95 group"
              >
                <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
              </button>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Navigation */}
            <nav className="w-80 border-l border-white/5 bg-slate-900/20 p-8 flex flex-col gap-2 shrink-0">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 pr-2">القوائم الأساسية</p>
              {[
                { id: 'users', label: 'إدارة الأعضاء', icon: Users, color: 'indigo', desc: 'تعديل الرتب والصلاحيات' },
                { id: 'trips', label: 'المسارات العامة', icon: Compass, color: 'blue', desc: 'إدارة المحتوى المتاح للجميع' },
                { id: 'ads', label: 'إدارة الإعلانات', icon: Sparkles, color: 'rose', desc: 'اللافتات العلوية والسفلية' },
                { id: 'stats', label: 'إحصائيات النمو', icon: PieChartIcon, color: 'amber', desc: 'توزيع الباقات والنشاط' },
                { id: 'firestore', label: 'مستكشف البيانات', icon: Database, color: 'emerald', desc: 'معاينة مباشرة للجداول' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { vibrate(HAPITCS.MAJOR_CLICK); setActiveTab(tab.id as any); }}
                  className={`p-4 rounded-3xl flex flex-col gap-1 transition-all text-right group ${
                    activeTab === tab.id 
                      ? `bg-${tab.color}-500/10 border border-${tab.color}-500/20 text-${tab.color}-400` 
                      : 'hover:bg-white/5 text-slate-500 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? `text-${tab.color}-400` : 'text-slate-600 group-hover:text-slate-400'}`} />
                    <span className="font-black text-sm">{tab.label}</span>
                  </div>
                  <span className="text-[10px] font-bold opacity-60 pr-7">{tab.desc}</span>
                </button>
              ))}
            </nav>

            {/* Main Workspace */}
            <main className="flex-1 overflow-y-auto p-12 bg-slate-950 custom-scrollbar">
              <div className="max-w-6xl mx-auto w-full">
                {loading && (
                  <div className="flex flex-col items-center justify-center py-32 space-y-6">
                    <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="text-center space-y-1">
                      <p className="text-lg font-black text-white animate-pulse">جاري سحب البيانات...</p>
                      <p className="text-xs font-bold text-slate-500">نقوم بمزامنة التغييرات من السحابة</p>
                    </div>
                  </div>
                )}

                {!loading && activeTab === 'stats' && (
                  <div className="grid grid-cols-1 gap-12 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="p-8 bg-slate-900/50 border border-white/5 rounded-[40px] text-right space-y-4 shadow-xl">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                            <Users className="w-6 h-6 text-indigo-400" />
                          </div>
                          <div>
                            <h4 className="text-4xl font-black text-white leading-none">{users.length}</h4>
                            <p className="text-xs text-slate-500 font-bold mt-2">إجمالي الأعضاء النشطين</p>
                          </div>
                       </div>
                       <div className="p-8 bg-slate-900/50 border border-amber-500/10 rounded-[40px] text-right space-y-4 shadow-xl">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                            <Star className="w-6 h-6 text-amber-500" />
                          </div>
                          <div>
                            <h4 className="text-4xl font-black text-white leading-none">{users.filter(u => u.role === 'premium').length}</h4>
                            <p className="text-xs text-slate-500 font-bold mt-2">العضويات البريميوم ✨</p>
                          </div>
                       </div>
                       <div className="p-8 bg-slate-900/50 border border-emerald-500/10 rounded-[40px] text-right space-y-4 shadow-xl">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                            <Compass className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div>
                            <h4 className="text-4xl font-black text-white leading-none">{trips.length}</h4>
                            <p className="text-xs text-slate-500 font-bold mt-2">الرحلات المنشورة</p>
                          </div>
                       </div>
                    </div>

                    <div className="p-10 bg-slate-900/50 border border-white/5 rounded-[48px] space-y-10">
                       <div className="flex justify-between items-center">
                          <div className="space-y-1">
                             <h4 className="text-xl font-black text-white">توزيع الخطط والقاعدة الجماهيرية</h4>
                             <p className="text-xs text-slate-500 font-bold">نظرة عامة على اشتراكات المستخدمين في الوقت الفعلي</p>
                          </div>
                          <BarChart2 className="w-6 h-6 text-indigo-400" />
                       </div>
                       
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                          <div className="h-[350px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                   <Pie
                                      data={[
                                         { name: 'مجاني', value: users.filter(u => u.role === 'free').length || 0.1 },
                                         { name: 'بريميوم', value: users.filter(u => u.role === 'premium').length || 0.1 },
                                         { name: 'إدارة', value: users.filter(u => u.role === 'admin').length || 0.1 }
                                      ]}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={80}
                                      outerRadius={120}
                                      paddingAngle={8}
                                      dataKey="value"
                                      stroke="none"
                                   >
                                      <Cell fill="#6366f1" />
                                      <Cell fill="#f59e0b" />
                                      <Cell fill="#10b981" />
                                   </Pie>
                                   <Tooltip 
                                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '16px' }}
                                      itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: '900' }}
                                   />
                                   <Legend 
                                     iconType="circle"
                                     wrapperStyle={{ fontSize: '13px', fontWeight: '900', paddingTop: '32px', color: '#64748b' }} 
                                   />
                                </PieChart>
                             </ResponsiveContainer>
                          </div>
                          
                          <div className="space-y-8">
                             <div className="p-8 bg-white/5 rounded-[32px] border border-white/5 space-y-3">
                                <h5 className="text-sm font-black text-indigo-400">ملاحظة الذكاء الاصطناعي</h5>
                                <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                                   يبدو أن {Math.round((users.filter(u => u.role === 'free').length / (users.length || 1)) * 100)}% من المستخدمين حالياً على الخطة المجانية. يمكنك تحسين التحويل عن طريق إضافة محطات "بريميوم" مشوقة داخل مساراتهم التعليمية.
                                </p>
                             </div>
                             <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-white/5 rounded-3xl text-center border border-white/5">
                                   <span className="text-[10px] font-black text-slate-500 block mb-1 uppercase tracking-widest">تحويل</span>
                                   <span className="text-2xl font-black text-white">{Math.round((users.filter(u => u.role === 'premium').length / (users.length || 1)) * 100)}%</span>
                                </div>
                                <div className="p-6 bg-white/5 rounded-3xl text-center border border-white/5">
                                   <span className="text-[10px] font-black text-slate-500 block mb-1 uppercase tracking-widest">إشراف</span>
                                   <span className="text-2xl font-black text-white">{users.filter(u => u.role === 'admin').length}</span>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {!loading && activeTab === 'ads' && (
                  <div className="space-y-8 animate-fade-in">
                    <div className="flex justify-between items-center bg-slate-900 border border-white/5 p-8 rounded-[48px] shadow-xl">
                      <div className="text-right space-y-1">
                        <h4 className="text-xl font-black text-white">إدارة الحملات الإعلانية</h4>
                        <p className="text-xs font-bold text-slate-500">تحكم باللافتات الدعائية التي تظهر للمستخدمين</p>
                      </div>
                      <button
                        onClick={() => {
                          vibrate(HAPITCS.MAJOR_CLICK);
                          setExplorerCollection('ads');
                          setExplorerSubcollection(null);
                          setActiveTab('firestore');
                        }}
                        className="px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-3xl font-black text-sm transition-all shadow-xl shadow-rose-900/20 active:scale-95 flex items-center gap-3 border-none cursor-pointer"
                      >
                        <Plus className="w-5 h-5" />
                        <span>إضافة إعلان جديد</span>
                      </button>
                    </div>

                    <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-[40px] flex items-center gap-6">
                       <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                          <Info className="w-6 h-6" />
                       </div>
                       <div className="space-y-1">
                          <p className="text-sm font-black text-amber-400 leading-tight">توجيه ذكي</p>
                          <p className="text-[10px] font-bold text-slate-400">الإعلانات تظهر للمستخدمين المجانيين فقط لزيادة العائدات أو تشجيعهم على الترقية.</p>
                       </div>
                    </div>
                  </div>
                )}

            {!loading && activeTab === 'users' && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex justify-between items-end">
                   <div className="space-y-1">
                      <h3 className="text-xl font-black text-white">قاعدة بيانات الأعضاء</h3>
                      <p className="text-xs font-bold text-slate-500">إدارة صلاحيات المستخدمين والوصول المباشر لسجلاتهم</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {users.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white/5 rounded-[40px] border border-dashed border-white/10">
                       <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                       <p className="text-slate-500 font-bold">لا يوجد مستخدمون مسجلون حالياً.</p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.uid}
                        className="p-8 bg-slate-900/40 border border-white/5 hover:border-indigo-500/20 rounded-[40px] flex flex-col gap-6 transition-all group hover:shadow-2xl hover:shadow-indigo-500/5"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-5">
                            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-xl text-white shadow-lg shrink-0 transition-transform group-hover:scale-110 ${
                              user.role === 'admin' ? 'bg-indigo-600 shadow-indigo-500/20' : user.role === 'premium' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-slate-700'
                            }`}>
                              {user.role === 'admin' ? 'A' : user.role === 'premium' ? 'P' : 'F'}
                            </div>
                            <div className="space-y-1">
                              <p className="font-black text-white text-lg truncate max-w-[200px]">{user.email}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">{user.uid.substring(0, 12)}...</span>
                                {user.tripCount !== undefined && (
                                  <div className="flex items-center gap-1 text-indigo-400">
                                    <Compass className="w-3 h-3" />
                                    <span className="text-[10px] font-black">{user.tripCount} رحلات</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                             user.role === 'premium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
                             user.role === 'admin' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 
                             'bg-slate-500/10 border-slate-500/20 text-slate-500'
                          }`}>
                             {user.role === 'premium' ? 'Premium 💎' : user.role === 'admin' ? 'Admin 🛡️' : 'Free ⚙️'}
                          </div>
                        </div>

                        <div className="h-px bg-white/5" />

                        {/* Quick Access UI */}
                        <div className="grid grid-cols-3 gap-3">
                           {[
                             { id: 'userSettings', label: 'الرحلات', icon: Map, color: 'indigo' },
                             { id: 'stations', label: 'المحطات', icon: Compass, color: 'blue' },
                             { id: 'tasks', label: 'المهام', icon: Check, color: 'emerald' },
                             { id: 'reflections', label: 'التقييمات', icon: Award, color: 'amber' },
                             { id: 'stumbles', label: 'العثرات', icon: X, color: 'rose' },
                             { id: 'notifications', label: 'تنبيهات', icon: Plus, color: 'teal' }
                           ].map(tool => (
                             <button
                               key={tool.id}
                               onClick={() => {
                                 vibrate(HAPITCS.MAJOR_CLICK);
                                 setExplorerCollection('users');
                                 setExplorerUserId(user.uid);
                                 setExplorerSubcollection(tool.id as any);
                                 setActiveTab('firestore');
                               }}
                               className={`flex flex-col items-center justify-center py-3 bg-white/5 hover:bg-${tool.color}-500/10 rounded-2xl border border-transparent hover:border-${tool.color}-500/20 transition-all group/btn cursor-pointer`}
                             >
                                <tool.icon className={`w-4 h-4 mb-1 text-slate-500 group-hover/btn:text-${tool.color}-400 transition-colors`} />
                                <span className={`text-[9px] font-black text-slate-400 group-hover/btn:text-${tool.color}-300`}>{tool.label}</span>
                             </button>
                           ))}
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                           <p className="text-[10px] font-black text-slate-500 pr-2">تعديل صلاحيات العضو</p>
                           <div className="grid grid-cols-3 gap-2">
                               <button
                                 onClick={() => handleRoleChange(user.uid, user.email, 'free')}
                                 className={`py-2.5 rounded-2xl text-[10px] font-black transition-all border ${user.role === 'free' ? 'bg-slate-800 border-indigo-500/50 text-white shadow-lg' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-white hover:bg-slate-800'}`}
                               >
                                 مجاني
                               </button>
                               <button
                                 onClick={() => handleRoleChange(user.uid, user.email, 'premium')}
                                 className={`py-2.5 rounded-2xl text-[10px] font-black transition-all border ${user.role === 'premium' ? 'bg-amber-600 border-amber-400/50 text-white shadow-lg' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-white hover:bg-slate-800'}`}
                               >
                                 بريميوم
                               </button>
                               <button
                                 onClick={() => handleRoleChange(user.uid, user.email, 'admin')}
                                 className={`py-2.5 rounded-2xl text-[10px] font-black transition-all border ${user.role === 'admin' ? 'bg-indigo-600 border-indigo-400/50 text-white shadow-lg' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-white hover:bg-slate-800'}`}
                               >
                                 إدارة
                               </button>
                           </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {!loading && activeTab === 'trips' && (
              <div className="space-y-10 animate-fade-in">
                {assigningTrip ? (
                  <div className="bg-slate-900 border border-indigo-500/30 p-12 rounded-[56px] space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[80px]" />
                    
                    <div className="flex justify-between items-center relative">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black text-white">
                          تعيين الرحلة: <span className="text-indigo-400">{assigningTrip.learningGoal}</span>
                        </h3>
                        <p className="text-xs font-bold text-slate-500">اختر العضو المستلم لنقل كامل هيكل الرحلة إليه</p>
                      </div>
                      <button
                        onClick={() => setAssigningTrip(null)}
                        className="w-12 h-12 rounded-2xl bg-white/5 text-white flex items-center justify-center hover:bg-white/10 cursor-pointer border-none transition-all active:scale-90"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                      {users
                        .filter(u => u.role !== 'admin')
                        .map(u => (
                          <button
                            key={u.uid}
                            onClick={() => handleAssignTrip(u)}
                            className="p-6 bg-white/5 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/30 text-right rounded-3xl flex items-center justify-between transition-all cursor-pointer group"
                          >
                            <div className="space-y-1">
                              <span className="font-black text-white text-sm block group-hover:text-indigo-400 transition-colors uppercase truncate max-w-[150px]">{u.email.split('@')[0]}</span>
                              <span className="text-[9px] font-bold text-slate-500 group-hover:text-indigo-300/50 truncate max-w-[150px] block">{u.email}</span>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] ${u.role === 'premium' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-700/50 text-slate-400'}`}>
                               {u.role === 'premium' ? '⭐' : '⚙️'}
                            </div>
                          </button>
                        ))}
                      {users.filter(u => u.role !== 'admin').length === 0 && (
                        <p className="col-span-full text-center font-bold text-sm text-slate-500 py-12">لا يوجد مستخدمون متاحون.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center bg-slate-900 border border-white/5 p-8 rounded-[48px] shadow-xl">
                      <div className="text-right space-y-1">
                        <h4 className="text-xl font-black text-white">إدارة المسارات المفتوحة</h4>
                        <p className="text-xs font-bold text-slate-500">تحكم بالرحلات العامة المنشورة من مستودع Firestore الرئيسي</p>
                      </div>
                      <button
                        onClick={() => {
                          setExplorerCollection('publicTrips');
                          setExplorerUserId(null);
                          setExplorerSubcollection(null);
                          setActiveTab('firestore');
                        }}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-sm transition-all shadow-xl shadow-indigo-900/20 active:scale-95 flex items-center gap-3 border-none cursor-pointer"
                      >
                        <Plus className="w-5 h-5" />
                        <span>إنشاء مسار جديد</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {trips.length === 0 ? (
                         <div className="col-span-full py-20 text-center bg-white/5 rounded-[40px] border border-dashed border-white/10">
                            <Compass className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-500 font-bold">لا يوجد رحلات بريميوم حالياً.</p>
                         </div>
                      ) : (
                        trips.map((trip) => (
                        <div
                          key={trip.id}
                          className="p-8 bg-slate-900/40 border border-white/5 hover:border-indigo-500/20 rounded-[48px] flex flex-col gap-6 shadow-xl transition-all group hover:shadow-indigo-500/5"
                        >
                          <div className="flex justify-between items-start">
                            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Map className="w-8 h-8 text-indigo-400" />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                               <button
                                 onClick={() => handleToggleFreeTrip(trip)}
                                 className={`px-4 py-1.5 rounded-full text-[9px] font-black border tracking-widest uppercase transition-all ${trip.isFree ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-700/10 border-white/10 text-slate-400'}`}
                               >
                                  {trip.isFree ? 'Public Access ✅' : 'Restricted 🔒'}
                               </button>
                               <span className="text-[10px] font-mono text-slate-600">{trip.id.substring(0, 10)}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h5 className="text-xl font-black text-white leading-tight">{trip.learningGoal}</h5>
                            <p className="text-xs font-bold text-slate-500">المدة اليومية: {trip.dailyDuration} دقيقة • السمة: {trip.theme}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-4">
                            <button
                              onClick={() => setAssigningTrip(trip)}
                              className="px-4 py-3 bg-indigo-600/10 hover:bg-indigo-600 transition-all text-indigo-400 hover:text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 border border-indigo-500/20 cursor-pointer"
                            >
                              <UserPlus className="w-4 h-4" />
                              <span>تعيين للعضو</span>
                            </button>
                            <button
                              onClick={() => {
                                vibrate(HAPITCS.MAJOR_CLICK);
                                setExplorerCollection('publicTrips');
                                setExplorerUserId(trip.id);
                                setExplorerSubcollection('stations');
                                setActiveTab('firestore');
                              }}
                              className="px-4 py-3 bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 border border-white/5 cursor-pointer"
                            >
                              <Database className="w-4 h-4" />
                              <span>البنية</span>
                            </button>
                            <button
                               onClick={() => handleDeleteTrip(trip.id)}
                               className="col-span-2 py-3 bg-rose-500/10 hover:bg-rose-600 transition-all text-rose-500 hover:text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 border border-rose-500/20 cursor-pointer"
                            >
                               <Trash2 className="w-4 h-4" />
                               <span>حذف المسار النهائى</span>
                            </button>
                          </div>
                        </div>
                      )))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && activeTab === 'firestore' && (
              <div className="space-y-6">
                
                {/* Clean Path Breadcrumbs Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/40 p-4 rounded-3xl border border-white/5">
                  <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-[11px] md:text-xs font-extrabold text-slate-400">
                    <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                    
                    <button 
                      onClick={() => {
                        vibrate(HAPITCS.MAJOR_CLICK);
                        setExplorerUserId(null);
                        setExplorerSubcollection(null);
                        setExplorerCollection('users');
                      }}
                      className="hover:text-white transition-all border-none bg-transparent cursor-pointer"
                    >
                      Firestore Index
                    </button>
                    
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    
                    <select
                      value={explorerCollection}
                      onChange={(e) => {
                        vibrate(HAPITCS.MAJOR_CLICK);
                        const val = e.target.value as any;
                        setExplorerCollection(val);
                        setExplorerUserId(null);
                        setExplorerSubcollection(null);
                      }}
                      className="bg-slate-900 border border-white/10 rounded-xl text-white px-2 py-1 text-xs outline-none cursor-pointer"
                    >
                      <option value="users">المستخدمين (users)</option>
                      <option value="publicTrips">الرحلات العامة (publicTrips)</option>
                    </select>

                    {explorerUserId && (
                      <>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <button 
                          onClick={() => {
                            vibrate(HAPITCS.MAJOR_CLICK);
                            setExplorerSubcollection(null);
                          }}
                          className="hover:text-white transition-all text-indigo-400 border-none bg-transparent cursor-pointer font-mono text-xs max-w-[130px] truncate"
                          title={explorerUserId}
                        >
                          {explorerCollection === 'users' ? (users.find(u => u.uid === explorerUserId)?.email || explorerUserId) : explorerUserId}
                        </button>
                      </>
                    )}

                    {explorerSubcollection && (
                      <>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <span className="text-emerald-400 bg-emerald-900/10 px-2.5 py-1 rounded-xl font-bold font-mono">
                          {explorerSubcollection}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Add action */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenCreateDoc}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-1 shadow-md border-none cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة مستند جديد +</span>
                    </button>
                    
                    {explorerUserId && (
                      <button
                        onClick={() => {
                          vibrate(HAPITCS.MAJOR_CLICK);
                          setExplorerUserId(null);
                          setExplorerSubcollection(null);
                        }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs transition border-none cursor-pointer flex items-center gap-1"
                        title="رجوع للخلف"
                      >
                        <CornerDownLeft className="w-3.5 h-3.5" />
                        <span>رجوع</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Subcollection Navigator for standard explorer depth */}
                {explorerUserId && !explorerSubcollection && (
                  <div className="p-6 bg-indigo-950/20 rounded-3xl border border-indigo-500/10 text-right space-y-4 animate-fade-in">
                    <h4 className="font-extrabold text-white text-base">استكشاف المجلدات الفرعية لـ {explorerCollection === 'users' ? 'المستخدم' : 'الرحلة'}</h4>
                    <p className="text-xs text-slate-400">اختر أحد فهارس التخزين السحابية للمعاينة الكاملة والتعديل الكلي:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {explorerCollection === 'users' ? (
                        <>
                          <button
                            onClick={() => { vibrate(HAPITCS.MAJOR_CLICK); setExplorerSubcollection('userSettings'); }}
                            className="p-4 bg-slate-900 hover:bg-slate-800 rounded-2xl border border-white/5 text-right font-black text-sm text-indigo-300 hover:text-white flex flex-col gap-1 transition-all"
                          >
                            <span className="text-white text-base">userSettings</span>
                            <span className="text-[10px] text-slate-400 font-normal">إعدادات الرحلة والمسار وخزان غاميفكشن</span>
                          </button>
                          <button
                            onClick={() => { vibrate(HAPITCS.MAJOR_CLICK); setExplorerSubcollection('stations'); }}
                            className="p-4 bg-slate-900 hover:bg-slate-800 rounded-2xl border border-white/5 text-right font-black text-sm text-indigo-300 hover:text-white flex flex-col gap-1 transition-all"
                          >
                            <span className="text-white text-base">stations</span>
                            <span className="text-[10px] text-slate-400 font-normal">محطات الخارطة والتواريخ والأيقونات</span>
                          </button>
                          <button
                            onClick={() => { vibrate(HAPITCS.MAJOR_CLICK); setExplorerSubcollection('tasks'); }}
                            className="p-4 bg-slate-900 hover:bg-slate-800 rounded-2xl border border-white/5 text-right font-black text-sm text-indigo-300 hover:text-white flex flex-col gap-1 transition-all"
                          >
                            <span className="text-white text-base">tasks</span>
                            <span className="text-[10px] text-slate-400 font-normal">تاسكات المهام، الأنشطة، والتشيك-بوكس</span>
                          </button>
                          <button
                            onClick={() => { vibrate(HAPITCS.MAJOR_CLICK); setExplorerSubcollection('reflections'); }}
                            className="p-4 bg-slate-900 hover:bg-slate-800 rounded-2xl border border-white/5 text-right font-black text-sm text-indigo-300 hover:text-white flex flex-col gap-1 transition-all"
                          >
                            <span className="text-white text-base">reflections</span>
                            <span className="text-[10px] text-slate-400 font-normal">استمارات التقييم الذاتي وتفاصيل الدروس اللغوية</span>
                          </button>
                          <button
                            onClick={() => { vibrate(HAPITCS.MAJOR_CLICK); setExplorerSubcollection('stumbles'); }}
                            className="p-4 bg-slate-900 hover:bg-slate-800 rounded-2xl border border-white/5 text-right font-black text-sm text-indigo-300 hover:text-white flex flex-col gap-1 transition-all"
                          >
                            <span className="text-white text-base">stumbles</span>
                            <span className="text-[10px] text-slate-400 font-normal">العثرات والشكاوى التدريبية المسجلة مسبقاً</span>
                          </button>
                          <button
                            onClick={() => { vibrate(HAPITCS.MAJOR_CLICK); setExplorerSubcollection('notifications'); }}
                            className="p-4 bg-slate-900 hover:bg-slate-800 rounded-2xl border border-white/5 text-right font-black text-sm text-indigo-300 hover:text-white flex flex-col gap-1 transition-all"
                          >
                            <span className="text-white text-base">notifications</span>
                            <span className="text-[10px] text-slate-400 font-normal">أرشيف الإشعارات والرسائل التفاعلية للإدارة والعضو</span>
                          </button>
                          <button
                            onClick={() => { vibrate(HAPITCS.MAJOR_CLICK); setExplorerSubcollection('feedbacks'); }}
                            className="p-4 bg-slate-900 hover:bg-slate-800 rounded-2xl border border-white/5 text-right font-black text-sm text-indigo-300 hover:text-white flex flex-col gap-1 transition-all"
                          >
                            <span className="text-white text-base">feedbacks</span>
                            <span className="text-[10px] text-slate-400 font-normal">شكاوى وقيمنا - تعليقات المستخدمين الإدارية</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { vibrate(HAPITCS.MAJOR_CLICK); setExplorerSubcollection('stations'); }}
                            className="p-4 bg-slate-900 hover:bg-slate-800 rounded-2xl border border-white/5 text-right font-black text-sm text-indigo-300 hover:text-white flex flex-col gap-1 transition-all"
                          >
                            <span className="text-white text-base">stations</span>
                            <span className="text-[10px] text-slate-400 font-normal">محطات الرحلة العامة</span>
                          </button>
                          <button
                            onClick={() => { vibrate(HAPITCS.MAJOR_CLICK); setExplorerSubcollection('tasks'); }}
                            className="p-4 bg-slate-900 hover:bg-slate-800 rounded-2xl border border-white/5 text-right font-black text-sm text-indigo-300 hover:text-white flex flex-col gap-1 transition-all"
                          >
                            <span className="text-white text-base">tasks</span>
                            <span className="text-[10px] text-slate-400 font-normal">مهام الرحلة العامة والأنشطة المرتبطة</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Explorer Search */}
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={explorerSearch}
                    onChange={(e) => setExplorerSearch(e.target.value)}
                    placeholder="ابحث بواسطة معرف المستند (Document ID) أو القيم الداخلية..."
                    className="w-full pr-10 pl-4 py-3 bg-slate-950 border border-white/5 hover:border-white/10 rounded-2xl text-xs font-bold text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50 transition-all text-right"
                  />
                </div>

                {/* Docs Grid */}
                {explorerLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-slate-400 mt-2">جاري استيراد تراكيب من سحابة Firestore...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredDocs.length === 0 ? (
                      <div className="p-12 text-center bg-white/5 rounded-3xl border border-white/5">
                        <FileJson className="w-12 h-12 text-slate-500 mx-auto mb-2 opacity-50" />
                        <p className="text-slate-400 text-sm font-bold">لا يوجد مستندات مطابقة للمسار أو البحث المجرى حالياً.</p>
                      </div>
                    ) : (
                      filteredDocs.map((docItem) => {
                        const displays: [string, any][] = Object.entries(docItem)
                          .filter(([k]) => k !== 'id' && (typeof docItem[k] !== 'object' || docItem[k] === null))
                          .slice(0, 4);

                        const hasSubcollections = explorerCollection === 'users' && !explorerUserId;
                        const hasPublicTripSubcollections = explorerCollection === 'publicTrips' && !explorerSubcollection;

                        return (
                          <div
                            key={docItem.id}
                            className="p-6 bg-slate-950/40 hover:bg-slate-950/80 border border-white/5 hover:border-emerald-500/20 rounded-[32px] transition-all flex flex-col gap-4 text-right transform hover:-translate-y-0.5"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className="p-3 bg-emerald-900/10 rounded-2xl text-emerald-400 shrink-0">
                                  <FileJson className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-mono text-xs font-black text-white bg-slate-900 px-3 py-1 rounded-xl border border-white/5">
                                      ID: {docItem.id}
                                    </h4>
                                    <button 
                                      onClick={() => handleCopyToClipboard(docItem.id)}
                                      className="p-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all border-none cursor-pointer"
                                      title="نسخ المعرف"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  
                                  {/* Render small metadata snippets */}
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-400">
                                    {displays.map(([key, val]) => (
                                      <div key={`${docItem.id}-${key}`} className="flex gap-1">
                                        <span className="text-slate-500 font-mono">{key}:</span>
                                        <span className="font-extrabold text-slate-300 max-w-[200px] truncate">{String(val)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Firestore Doc Actions */}
                              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                                {hasSubcollections && (
                                  <button
                                    onClick={() => {
                                      vibrate(HAPITCS.MAJOR_CLICK);
                                      setExplorerUserId(docItem.id);
                                    }}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-black rounded-xl transition-all border-none cursor-pointer flex items-center gap-1 shadow-md"
                                  >
                                    <Compass className="w-3.5 h-3.5" />
                                    <span>تحليل الجداول الفرعية</span>
                                  </button>
                                )}

                                {hasPublicTripSubcollections && (
                                  <button
                                    onClick={() => {
                                      vibrate(HAPITCS.MAJOR_CLICK);
                                      setExplorerUserId(docItem.id);
                                    }}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-black rounded-xl transition-all border-none cursor-pointer flex items-center gap-1 shadow-md"
                                  >
                                    <Map className="w-3.5 h-3.5" />
                                    <span>محطات ومهام الرحلة العامة</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleOpenEditDoc(docItem.id, docItem)}
                                  className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded-xl transition-all border-none cursor-pointer"
                                  title="تعديل تراكيب الـ JSON"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteDoc(docItem.id)}
                                  className="p-2 bg-red-950/50 hover:bg-red-900/30 text-rose-400 hover:text-rose-300 rounded-xl transition-all border-none cursor-pointer"
                                  title="حذف كلي من الكلود"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Collapsible raw data viewer */}
                            <details className="mt-1">
                              <summary className="text-[10px] text-slate-500 hover:text-slate-400 cursor-pointer outline-none select-none font-bold">
                                عرض تركيبة المستند الكاملة (JSON)
                              </summary>
                              <pre className="mt-2 p-4 bg-slate-950 rounded-2xl font-mono text-[11px] text-indigo-400 overflow-x-auto text-left" dir="ltr">
                                {JSON.stringify(docItem, null, 2)}
                              </pre>
                            </details>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* JSON DOCUMENT EDITOR MODAL */}
      <AnimatePresence mode="wait">
        {editingDoc && (
          <div key="json-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[300] flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
            <motion.div
              key="json-modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="w-full max-w-2xl bg-slate-900 border border-emerald-500/20 rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col text-right"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 bg-slate-900/80 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-900/20 text-emerald-400 rounded-xl">
                    <Database className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      {editingDoc.isNew ? "إنشاء مستند جديد كلياً" : "تعديل مستند بنية JSON السحابية"}
                    </h3>
                    <p className="text-[10px] font-mono text-emerald-400">{editingDoc.path}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setEditingDoc(null)}
                  className="w-8 h-8 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/10 cursor-pointer border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                
                {editingDoc.isNew && (
                  <div className="space-y-1">
                    <label className="text-xs font-black text-emerald-400">معرف المستند الجديد (Document ID) *</label>
                    <input
                      type="text"
                      value={newDocId}
                      onChange={(e) => {
                        setNewDocId(e.target.value.replace(/\s+/g, '_'));
                        setJsonError(null);
                      }}
                      placeholder="مثال: trip_premium_99"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs font-bold font-mono text-emerald-300 outline-none focus:border-emerald-500 transition text-left"
                      dir="ltr"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-400">محتوى المستند والخصائص بصيغة JSON</label>
                    <span className="text-[10px] text-slate-500 font-mono">UTF-8 Encoded</span>
                  </div>
                  
                  <textarea
                    value={jsonInput}
                    onChange={(e) => {
                      setJsonInput(e.target.value);
                      try {
                        JSON.parse(e.target.value);
                        setJsonError(null);
                      } catch (err: any) {
                        setJsonError(`خطأ في الترميز: ${err.message}`);
                      }
                    }}
                    rows={12}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl text-xs font-mono p-4 text-emerald-300 outline-none focus:border-emerald-500 transition text-left leading-relaxed"
                    dir="ltr"
                    placeholder={`{\n  "key": "value"\n}`}
                  />
                </div>

                {/* Live validation feedback */}
                {jsonError ? (
                  <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-xs text-rose-400 font-bold flex items-center gap-2">
                    <X className="w-4 h-4 shrink-0" />
                    <span className="leading-snug">{jsonError}</span>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>صيغة JSON صحيحة ومطابقة للهياكل الإدارية! ✅</span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/5 bg-slate-900/60 flex justify-end gap-2 shrink-0">
                <button
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border-none cursor-pointer transition-all"
                >
                  إلغاء الأمر
                </button>
                <button
                  onClick={handleSaveJsonDoc}
                  disabled={!!jsonError}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-md border-none cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingDoc.isNew ? "إنشاء وتصدير للكلود" : "حفظ التغييرات السحابية"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
