import { useState, useEffect } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { db, LearningRepository } from '../db';
import { safeRandomUUID } from '../lib/uuid';
import { vibrate, HAPITCS } from '../lib/haptics';
import { toast } from 'react-hot-toast';
import { 
  BookOpen, MessageSquare, Video, AlertTriangle, PenTool, Plus, Trash2, Calendar, ChevronLeft, ArrowRight, Sprout, Trees
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LearningRepoModalProps {
  visible: boolean;
  onHide: () => void;
  tripId: string;
  isLanguageJourney: boolean;
}

export function LearningRepoModal({ visible, onHide, tripId, isLanguageJourney }: LearningRepoModalProps) {
  const [view, setView] = useState<'list' | 'tabs' | 'addContext'>('list');
  const [repos, setRepos] = useState<LearningRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<LearningRepository | null>(null);
  
  // Creation Modal State
  const [creationVisible, setCreationVisible] = useState(false);
  const [addSentenceVisible, setAddSentenceVisible] = useState(false);
  const [addTrickVisible, setAddTrickVisible] = useState(false);
  const [addErrorVisible, setAddErrorVisible] = useState(false);
  const [addContextVisible, setAddContextVisible] = useState(false);
  
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDate, setNewRepoDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Tab states for the selected repo
  const [sentence, setSentence] = useState({ text: '', translation: '', category: 'informal' });
  const [trick, setTrick] = useState({ title: '', videoUrl: '', trick: '', category: 'informal' });
  const [errorGap, setErrorGap] = useState({ error: '', correction: '', area: '', category: 'informal' });
  const [dailyContext, setDailyContext] = useState({ topic: '', paragraph: '', category: 'informal' });
  
  const [sentenceFilter, setSentenceFilter] = useState<string>('all');
  const [trickFilter, setTrickFilter] = useState<string>('all');
  const [errorFilter, setErrorFilter] = useState<string>('all');
  const [contextFilter, setContextFilter] = useState<string>('all');

  const SENTENCE_CATEGORIES = [
    { value: 'formal', label: 'رسمي', color: 'blue' },
    { value: 'informal', label: 'غير رسمي', color: 'emerald' },
    { value: 'academic', label: 'أكاديمي', color: 'indigo' },
    { value: 'business', label: 'أعمال', color: 'slate' },
    { value: 'medical', label: 'طبي', color: 'rose' }
  ];

  useEffect(() => {
    if (visible && tripId) {
      loadRepos();
      setView('list');
    }
  }, [visible, tripId]);

  const loadRepos = async () => {
    const existing = await db.learningRepositories.where('tripId').equals(tripId).toArray();
    setRepos(existing);
  };

  const createNewTree = async () => {
    if (!newRepoName.trim()) {
      toast.error('يرجى إدخال اسم الشجرة');
      return;
    }

    const newId = safeRandomUUID();
    const newRepo: LearningRepository = {
      id: newId,
      tripId,
      name: newRepoName,
      createdAt: new Date(newRepoDate).toISOString(),
      sentences: [],
      listeningTricks: [],
      errorsGaps: [],
      dailyContexts: []
    };

    await db.learningRepositories.add(newRepo);
    toast.success('تم غرس شجرتك الجديدة بنجاح! 🌱');
    setCreationVisible(false);
    setNewRepoName('');
    await loadRepos();
    
    // Auto open it
    setSelectedRepo(newRepo);
    setView('tabs');
    vibrate(HAPITCS.COMPLETE);
  };

  const deleteTree = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذه الشجرة وجميع محتوياتها؟')) return;
    
    vibrate(HAPITCS.MAJOR_CLICK);
    await db.learningRepositories.delete(id);
    await loadRepos();
    if (selectedRepo?.id === id) {
      setSelectedRepo(null);
      setView('list');
    }
    toast.success('تم حذف الشجرة');
  };

  const addSentence = async () => {
    if (!sentence.text.trim() || !selectedRepo) return;
    
    const updated = {
      ...selectedRepo,
      sentences: [
        ...(selectedRepo.sentences || []),
        { id: safeRandomUUID(), ...sentence, date: new Date().toISOString() }
      ]
    };
    await db.learningRepositories.update(selectedRepo.id, { sentences: updated.sentences });
    setSelectedRepo(updated);
    setSentence({ text: '', translation: '', category: 'informal' });
    setAddSentenceVisible(false);
    vibrate(HAPITCS.COMPLETE);
  };

  const addTrick = async () => {
    if (!trick.trick.trim() || !trick.title.trim() || !selectedRepo) return;

    const updated = {
      ...selectedRepo,
      listeningTricks: [
        ...(selectedRepo.listeningTricks || []),
        { id: safeRandomUUID(), ...trick, date: new Date().toISOString() }
      ]
    };
    await db.learningRepositories.update(selectedRepo.id, { listeningTricks: updated.listeningTricks });
    setSelectedRepo(updated);
    setTrick({ title: '', videoUrl: '', trick: '', category: 'informal' });
    setAddTrickVisible(false);
    vibrate(HAPITCS.COMPLETE);
  };

  const addErrorGap = async () => {
    if (!errorGap.error.trim() || !selectedRepo) return;

    const updated = {
      ...selectedRepo,
      errorsGaps: [
        ...(selectedRepo.errorsGaps || []),
        { id: safeRandomUUID(), ...errorGap, date: new Date().toISOString() }
      ]
    };
    await db.learningRepositories.update(selectedRepo.id, { errorsGaps: updated.errorsGaps });
    setSelectedRepo(updated);
    setErrorGap({ error: '', correction: '', area: '', category: 'informal' });
    setAddErrorVisible(false);
    vibrate(HAPITCS.COMPLETE);
  };

  const addDailyContext = async () => {
    if (!dailyContext.paragraph.trim() || !dailyContext.topic.trim() || !selectedRepo) return;

    const updated = {
      ...selectedRepo,
      dailyContexts: [
        ...(selectedRepo.dailyContexts || []),
        { id: safeRandomUUID(), ...dailyContext, date: new Date().toISOString() }
      ]
    };
    await db.learningRepositories.update(selectedRepo.id, { dailyContexts: updated.dailyContexts });
    setSelectedRepo(updated);
    setDailyContext({ topic: '', paragraph: '', category: 'informal' });
    setAddContextVisible(false);
    setView('tabs');
    vibrate(HAPITCS.COMPLETE);
    toast.success('تمت إضافة سجل سياق جديد بنجاح! ✨');
  };

  const removeItem = async (type: keyof LearningRepository, id: string) => {
    if (!selectedRepo) return;
    vibrate(HAPITCS.MAJOR_CLICK);
    const updatedRepo = { ...selectedRepo };
    const list = updatedRepo[type] as any[];
    if (Array.isArray(list)) {
      const newList = list.filter(item => item.id !== id);
      (updatedRepo as any)[type] = newList;
      await db.learningRepositories.update(selectedRepo.id, { [type]: newList } as any);
      setSelectedRepo(updatedRepo);
    }
  };

  return (
    <>
      <Sidebar
        visible={visible}
        onHide={onHide}
        fullScreen
        header={
          <div className="flex items-center gap-3 pr-2 text-right w-full" dir="rtl">
            <Trees className="w-6 h-6 text-blue-400 animate-pulse" />
            <span className="text-xl font-black text-white">غابة المعرفة الخاصة بك</span>
          </div>
        }
        className="font-sans border-none shadow-2xl sidebar-rtl dark-blue-repo-sidebar"
        dismissable
      >
        <div className="flex flex-col gap-6 py-2 h-full text-right" dir="rtl">
          {view === 'list' ? (
            <div className="flex flex-col gap-6 h-full overflow-hidden">
               <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-blue-300 text-right flex items-center gap-2">
                    <Trees className="w-5 h-5 text-blue-400" />
                    أشجارك المثمرة
                  </h3>
                  <Button 
                    label="غرس شجرة جديدة" 
                    icon="pi pi-plus" 
                    onClick={() => {
                      vibrate(HAPITCS.MAJOR_CLICK);
                      setCreationVisible(true);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl px-5 py-2.5 font-bold text-xs border-none shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                  />
               </div>

               <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-10">
                  {repos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center gap-4 bg-blue-950/20 rounded-3xl border-2 border-dashed border-blue-900/40 mt-4">
                      <Sprout className="w-12 h-12 text-blue-300" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-blue-200">لا توجد أشجار في غابتك بعد</p>
                        <p className="text-[10px] text-slate-400 font-medium">ابدأ الآن وغرس أول شجرة لتعلمك!</p>
                      </div>
                    </div>
                  ) : (
                    repos.map(r => (
                      <div 
                        key={r.id} 
                        onClick={() => {
                          vibrate(HAPITCS.COMPLETE);
                          setSelectedRepo(r);
                          setView('tabs');
                        }}
                        className="group p-5 bg-slate-900/40 border border-slate-800/85 rounded-3xl shadow-lg hover:border-blue-500/40 hover:bg-slate-900/70 transition-all cursor-pointer flex items-center justify-between text-right"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-950/50 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                             <Trees className="w-6 h-6" />
                          </div>
                          <div className="space-y-1 text-right">
                             <h4 className="font-black text-slate-100 group-hover:text-blue-300 transition-colors">{r.name}</h4>
                             <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                                <Calendar className="w-3 h-3" />
                                {new Date(r.createdAt || '').toLocaleDateString('ar-EG')}
                             </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => deleteTree(r.id, e)}
                            className="p-2 text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all bg-transparent border-none cursor-pointer"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                          <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          ) : view === 'addContext' ? (
             <div className="flex flex-col gap-6 h-full overflow-y-auto no-scrollbar animate-in fade-in duration-300 max-w-2xl mx-auto w-full px-4 py-6 text-right" dir="rtl">
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                   <button 
                     onClick={() => {
                       vibrate(HAPITCS.MAJOR_CLICK);
                       setView('tabs');
                     }}
                     className="p-3 rounded-2xl bg-slate-900/85 text-slate-300 hover:bg-slate-800 hover:text-white transition-all border border-slate-800 flex items-center justify-center cursor-pointer"
                   >
                     <ArrowRight className="w-5 h-5 font-bold" />
                   </button>
                   <div className="flex-1 text-right">
                     <h3 className="text-xl font-black text-white flex items-center gap-2">
                       <PenTool className="w-5 h-5 text-blue-400" />
                       إضافة سجل سياق جديد
                     </h3>
                     <p className="text-xs text-slate-400">وظّف الكلمات والتراكيب التي رسخت في ذهنك اليوم في سياق عملي متناسق.</p>
                   </div>
                </div>

                <div className="flex flex-col gap-6 py-4 text-right" dir="rtl">
                  <div className="space-y-2">
                    <label className="text-xs font-black block px-1 text-slate-300">عنوان موضوع اليوم ✍️</label>
                    <InputText 
                      value={dailyContext.topic} 
                      onChange={e => setDailyContext({ ...dailyContext, topic: e.target.value })} 
                      placeholder="مثال: تجربتي مع العمل الجماعي، نقاش هادف..." 
                      className="w-full border border-white/10 bg-slate-900/60 p-4 rounded-2xl font-bold text-white text-right placeholder-slate-500 focus:border-blue-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-300 block px-1">الفقرة / النص الكامل</label>
                    <InputTextarea 
                      value={dailyContext.paragraph} 
                      onChange={e => setDailyContext({ ...dailyContext, paragraph: e.target.value })} 
                      placeholder="اكتب فقرتك المتكاملة هنا بدقة مع توظيف مرونة القاموس والتراكيب المحفوظة..." 
                      className="w-full border border-white/10 bg-slate-900/60 p-4 rounded-2xl font-medium resize-none h-48 text-white text-right placeholder-slate-500 focus:border-blue-500/50 leading-relaxed"
                    />
                  </div>
                  
                  <div className="space-y-3 mt-1">
                    <label className="text-xs font-black text-slate-300 block px-1">تصنيف السياق</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {SENTENCE_CATEGORIES.map(cat => (
                        <button
                          key={cat.value}
                          onClick={() => {
                            vibrate(HAPITCS.MAJOR_CLICK);
                            setDailyContext({ ...dailyContext, category: cat.value });
                          }}
                          className={`px-3 py-2.5 rounded-xl text-[11px] font-black border transition-all active:scale-95 cursor-pointer flex-1 text-center ${
                            dailyContext.category === cat.value 
                              ? `bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20` 
                              : `bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-900/80 hover:text-white`
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (!dailyContext.paragraph.trim() || !dailyContext.topic.trim()) {
                        toast.error('يرجى كتابة العنوان والفقرة لحفظ سجل السياق ✨');
                        return;
                      }
                      addDailyContext();
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-black text-sm border-none mt-6 shadow-xl shadow-blue-600/30 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    حفظ سجل السياق والمتابعة ✨
                  </button>
                </div>
             </div>
          ) : (
             <div className="flex flex-col gap-6 h-full animate-in fade-in slide-in-from-left-4 duration-500">
               <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      vibrate(HAPITCS.MAJOR_CLICK);
                      setView('list');
                    }}
                    className="p-2.5 rounded-xl bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800 transition-all flex items-center justify-center cursor-pointer"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <div className="flex-1 text-right">
                    <h3 className="text-lg font-black text-white">{selectedRepo?.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold">تاريخ الغرس: {new Date(selectedRepo?.createdAt || '').toLocaleDateString('ar-EG')}</p>
                  </div>
               </div>

               {isLanguageJourney ? (
                  <TabView className="flex-1 flex flex-col overflow-hidden custom-repo-tabs">
                    <TabPanel header="الجمل 💬" leftIcon="pi pi-comments ml-2">
                      <div className="flex flex-col gap-4 mt-4 h-full relative">
                        {/* Filter Categories */}
                        <div className="flex items-center justify-between gap-4 py-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">تصفية حسب التصنيف</label>
                          <Dropdown 
                            value={sentenceFilter} 
                            options={[{ value: 'all', label: 'الكل' }, ...SENTENCE_CATEGORIES]} 
                            onChange={(e) => setSentenceFilter(e.value)} 
                            optionLabel="label" 
                            placeholder="اختر التصنيف..."
                            className="flex-1 max-w-[200px] border border-white/10 bg-slate-900/60 text-white font-bold text-xs rounded-xl" 
                            dir="rtl"
                          />
                        </div>

                        {/* Top Add Button representing + */}
                        <button
                          onClick={() => {
                            vibrate(HAPITCS.MAJOR_CLICK);
                            setAddSentenceVisible(true);
                          }}
                          className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 border-none shadow-md cursor-pointer transition-all active:scale-98"
                        >
                          <Plus className="w-4 h-4 text-white" />
                          <span>إضافة جملة جديدة 💬</span>
                        </button>

                        <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-24">
                          {selectedRepo?.sentences?.filter(s => sentenceFilter === 'all' || s.category === sentenceFilter).map(item => (
                            <div key={item.id} className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex justify-between items-start group relative hover:border-blue-500/30 transition-all text-right">
                              <div className="space-y-1 text-right">
                                <div className="flex items-center gap-2 mb-1">
                                  {item.category && (
                                    <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter bg-blue-950 text-blue-300 border border-blue-900">
                                      {SENTENCE_CATEGORIES.find(c => c.value === item.category)?.label}
                                    </span>
                                  )}
                                  <p className="text-[10px] text-slate-400 font-mono">{new Date(item.date).toLocaleDateString('ar-EG')}</p>
                                </div>
                                <p className="font-bold text-white text-lg">{item.text}</p>
                                {item.translation && <p className="text-sm text-slate-400 font-medium">{item.translation}</p>}
                              </div>
                              <button 
                                onClick={() => removeItem('sentences', item.id)}
                                className="p-2 text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all bg-transparent border-none cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {(!selectedRepo?.sentences || selectedRepo.sentences.length === 0) && (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 mt-10">
                              <MessageSquare className="w-12 h-12 text-slate-600 mb-4" />
                              <p className="font-bold text-sm text-slate-300">لا توجد جمل بعد.</p>
                              <p className="text-[10px] text-slate-500">انقر على الزر بالأسفل لإضافة جملة جديدة!</p>
                            </div>
                          )}
                        </div>

                        <Button 
                          icon="pi pi-plus" 
                          onClick={() => setAddSentenceVisible(true)}
                          className="absolute bottom-6 left-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 border-none transition-transform hover:scale-105 active:scale-95 z-10 p-button-rounded flex items-center justify-center cursor-pointer"
                        />
                      </div>
                    </TabPanel>

                    <TabPanel header="الاستماع 🎧" leftIcon="pi pi-volume-up ml-2">
                      <div className="flex flex-col gap-4 mt-4 h-full relative">
                        {/* Filter Categories */}
                        <div className="flex items-center justify-between gap-4 py-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">تصفية حسب التصنيف</label>
                          <Dropdown 
                            value={trickFilter} 
                            options={[{ value: 'all', label: 'الكل' }, ...SENTENCE_CATEGORIES]} 
                            onChange={(e) => setTrickFilter(e.value)} 
                            optionLabel="label" 
                            placeholder="اختر التصنيف..."
                            className="flex-1 max-w-[200px] border border-white/10 bg-slate-900/60 text-white font-bold text-xs rounded-xl" 
                            dir="rtl"
                          />
                        </div>

                        {/* Top Add Button representing + */}
                        <button
                          onClick={() => {
                            vibrate(HAPITCS.MAJOR_CLICK);
                            setAddTrickVisible(true);
                          }}
                          className="w-full bg-gradient-to-r from-sky-700 to-blue-700 hover:from-sky-600 hover:to-blue-655 text-white py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 border-none shadow-md cursor-pointer transition-all active:scale-98"
                        >
                          <Plus className="w-4 h-4 text-white" />
                          <span>إضافة ملاحظة استماع جديدة 🎧</span>
                        </button>

                        <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-24">
                          {selectedRepo?.listeningTricks?.filter(s => trickFilter === 'all' || s.category === trickFilter).map(item => (
                            <div key={item.id} className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col gap-2 group relative hover:border-sky-500/35 transition-all text-right">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] text-slate-400 font-mono text-left">{new Date(item.date).toLocaleDateString('ar-EG')}</p>
                                <div className="flex items-center gap-2">
                                  {item.category && (
                                    <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter bg-blue-950 text-blue-300 border border-blue-900">
                                      {SENTENCE_CATEGORIES.find(c => c.value === item.category)?.label}
                                    </span>
                                  )}
                                  <Video className="w-4 h-4 text-sky-400" />
                                  <p className="font-bold text-white mb-0">{item.title}</p>
                                </div>
                              </div>
                              <p className="text-sm text-slate-200 leading-relaxed font-medium bg-slate-950/60 p-3 rounded-xl border border-white/5">{item.trick}</p>
                              {item.videoUrl && (
                                <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-450 hover:text-sky-300 hover:scale-105 transition-all inline-flex items-center gap-1 font-bold">
                                  رابط المراجعة <i className="pi pi-external-link text-[8px]"></i>
                                </a>
                              )}
                              <button 
                                onClick={() => removeItem('listeningTricks', item.id)}
                                className="p-2 text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all bg-transparent border-none cursor-pointer absolute bottom-3 left-3"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {(!selectedRepo?.listeningTricks || selectedRepo.listeningTricks.length === 0) && (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 mt-10">
                              <Video className="w-12 h-12 text-slate-600 mb-4" />
                              <p className="font-bold text-sm text-slate-300">لا توجد ملاحظات استماع بعد.</p>
                              <p className="text-[10px] text-slate-500">انقر على الزر بالأسفل لإضافة ملاحظة جديدة!</p>
                            </div>
                          )}
                        </div>

                        <Button 
                          icon="pi pi-plus" 
                          onClick={() => setAddTrickVisible(true)}
                          className="absolute bottom-6 left-6 w-14 h-14 rounded-full bg-sky-600 text-white shadow-xl shadow-sky-600/30 border-none transition-transform hover:scale-105 active:scale-95 z-10 p-button-rounded flex items-center justify-center cursor-pointer"
                        />
                      </div>
                    </TabPanel>

                    <TabPanel header="الثغرات ⚠️" leftIcon="pi pi-exclamation-triangle ml-2">
                      <div className="flex flex-col gap-4 mt-4 h-full relative">
                        {/* Filter Categories */}
                        <div className="flex items-center justify-between gap-4 py-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">تصفية حسب التصنيف</label>
                          <Dropdown 
                            value={errorFilter} 
                            options={[{ value: 'all', label: 'الكل' }, ...SENTENCE_CATEGORIES]} 
                            onChange={(e) => setErrorFilter(e.value)} 
                            optionLabel="label" 
                            placeholder="اختر التصنيف..."
                            className="flex-1 max-w-[200px] border border-white/10 bg-slate-900/60 text-white font-bold text-xs rounded-xl" 
                            dir="rtl"
                          />
                        </div>

                        {/* Top Add Button representing + */}
                        <button
                          onClick={() => {
                            vibrate(HAPITCS.MAJOR_CLICK);
                            setAddErrorVisible(true);
                          }}
                          className="w-full bg-gradient-to-r from-rose-700 to-pink-700 hover:from-rose-600 hover:to-pink-650 text-white py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 border-none shadow-md cursor-pointer transition-all active:scale-98"
                        >
                          <Plus className="w-4 h-4 text-white" />
                          <span>رصد ثغرة جديدة ⚠️</span>
                        </button>

                        <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-24">
                          {selectedRepo?.errorsGaps?.filter(s => errorFilter === 'all' || s.category === errorFilter).map(item => (
                            <div key={item.id} className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col gap-2 group relative hover:border-rose-500/35 transition-all text-right">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] text-slate-400 font-mono text-left">{new Date(item.date).toLocaleDateString('ar-EG')}</p>
                                <div className="flex items-center gap-2">
                                  {item.category && (
                                    <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter bg-blue-950 text-blue-300 border border-blue-900">
                                      {SENTENCE_CATEGORIES.find(c => c.value === item.category)?.label}
                                    </span>
                                  )}
                                  <span className="bg-rose-950 text-rose-300 px-2 py-0.5 rounded text-[10px] font-black border border-rose-900/60">{item.area}</span>
                                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 w-full relative">
                                <p className="font-bold text-rose-400 line-through decoration-rose-650 opacity-60 text-right">الخطأ: {item.error}</p>
                                <p className="font-bold text-emerald-400 text-lg text-right w-[90%]">الصواب: {item.correction}</p>
                              </div>
                              <button 
                                onClick={() => removeItem('errorsGaps', item.id)}
                                className="p-2 text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all bg-transparent border-none cursor-pointer absolute bottom-3 left-3"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {(!selectedRepo?.errorsGaps || selectedRepo.errorsGaps.length === 0) && (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 mt-10">
                              <AlertTriangle className="w-12 h-12 text-slate-600 mb-4" />
                              <p className="font-bold text-sm text-slate-300">لا توجد ثغرات تم رصدها بعد.</p>
                              <p className="text-[10px] text-slate-500">انقر لالتقاط الأخطاء وتصحيحها!</p>
                            </div>
                          )}
                        </div>

                        <Button 
                          icon="pi pi-plus" 
                          onClick={() => setAddErrorVisible(true)}
                          className="absolute bottom-6 left-6 w-14 h-14 rounded-full bg-rose-600 text-white shadow-xl shadow-rose-600/30 border-none transition-transform hover:scale-105 active:scale-95 z-10 p-button-rounded flex items-center justify-center cursor-pointer"
                        />
                      </div>
                    </TabPanel>

                    <TabPanel header="سياق اليوم ✍️" leftIcon="pi pi-pencil ml-2">
                      <div className="flex flex-col gap-4 mt-4 h-full relative">
                        {/* Filter Categories */}
                        <div className="flex items-center justify-between gap-4 py-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">تصفية حسب التصنيف</label>
                          <Dropdown 
                            value={contextFilter} 
                            options={[{ value: 'all', label: 'الكل' }, ...SENTENCE_CATEGORIES]} 
                            onChange={(e) => setContextFilter(e.value)} 
                            optionLabel="label" 
                            placeholder="اختر التصنيف..."
                            className="flex-1 max-w-[200px] border border-white/10 bg-slate-900/60 text-white font-bold text-xs rounded-xl" 
                            dir="rtl"
                          />
                        </div>

                        {/* Top Add Button representing + */}
                        <button
                          onClick={() => {
                            vibrate(HAPITCS.MAJOR_CLICK);
                            setView('addContext');
                          }}
                          className="w-full bg-gradient-to-r from-indigo-700 to-violet-750 hover:from-indigo-650 hover:to-violet-700 text-white py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 border-none shadow-md cursor-pointer transition-all active:scale-98"
                        >
                          <Plus className="w-4 h-4 text-white" />
                          <span>كتابة سجل سياق اليوم ✍️</span>
                        </button>

                        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-24">
                          {selectedRepo?.dailyContexts?.filter(s => contextFilter === 'all' || s.category === contextFilter).map(item => (
                            <div key={item.id} className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl space-y-3 group relative text-right transition-all hover:border-blue-500/35">
                              <div className="flex items-center justify-between">
                                 <p className="text-[10px] text-slate-400 font-mono text-left">{new Date(item.date).toLocaleDateString('ar-EG')}</p>
                                 <div className="flex items-center gap-2">
                                   {item.category && (
                                     <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter bg-blue-950 text-blue-300 border border-blue-900">
                                       {SENTENCE_CATEGORIES.find(c => c.value === item.category)?.label}
                                     </span>
                                   )}
                                   <PenTool className="w-4 h-4 text-blue-400" />
                                   <h4 className="font-black text-white">{item.topic}</h4>
                                 </div>
                              </div>
                              <p className="text-sm leading-relaxed text-slate-250 font-medium whitespace-pre-wrap bg-slate-950/40 p-4 rounded-2xl border border-white/5 italic text-right text-slate-200">
                                {item.paragraph}
                              </p>
                              <button 
                                onClick={() => removeItem('dailyContexts', item.id)}
                                className="absolute top-4 left-4 p-2 text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all bg-transparent border-none cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {(!selectedRepo?.dailyContexts || selectedRepo.dailyContexts.length === 0) && (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 mt-10">
                              <PenTool className="w-12 h-12 text-slate-600 mb-4" />
                              <p className="font-bold text-sm text-slate-300">لا توجد سجلات يومية بعد.</p>
                              <p className="text-[10px] text-slate-500">اكتب فقرتك الأولى اليوم!</p>
                            </div>
                          )}
                        </div>

                        <Button 
                          icon="pi pi-plus" 
                          onClick={() => setView('addContext')}
                          className="absolute bottom-6 left-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 border-none transition-transform hover:scale-105 active:scale-95 z-10 p-button-rounded flex items-center justify-center cursor-pointer"
                        />
                      </div>
                    </TabPanel>
                  </TabView>
                ) : (
                  <div className="flex flex-col items-center justify-center p-20 text-center gap-4 animate-fade-in bg-slate-50/50 rounded-3xl border border-dashed border-indigo-200">
                     <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <BookOpen className="w-8 h-8" />
                     </div>
                     <div className="space-y-1">
                        <h3 className="text-lg font-black text-indigo-950">مستودع المادة الأكاديمية</h3>
                        <p className="text-xs text-slate-500 font-bold">يمكنك استخدام هذه الشجرة لتخزين الملاحظات العامة والملخصات الخاصة بهذه الرحلة.</p>
                     </div>
                  </div>
                )}
            </div>
          )}
        </div>

        <style>{`
          .sidebar-rtl {
            direction: rtl !important;
          }
          .custom-repo-tabs .p-tabview-nav {
            background: rgba(15, 23, 42, 0.8) !important;
            border-radius: 20px !important;
            padding: 4px !important;
            display: flex !important;
            gap: 4px !important;
            border: 1px solid rgba(255, 255, 255, 0.07) !important;
          }
          .custom-repo-tabs .p-tabview-nav li {
            flex: 1 !important;
          }
          .custom-repo-tabs .p-tabview-nav li .p-tabview-nav-link {
            background: transparent !important;
            border: none !important;
            padding: 10px 4px !important;
            font-weight: 900 !important;
            font-size: 11px !important;
            color: #94a3b8 !important;
            justify-content: center !important;
            border-radius: 16px !important;
            transition: all 0.3s !important;
            white-space: nowrap !important;
          }
          .custom-repo-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link {
            background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
            color: #ffffff !important;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25) !important;
          }
          .custom-repo-tabs .p-tabview-panels {
            background: transparent !important;
            padding: 0 !important;
            height: 500px !important;
          }
          .custom-repo-tabs .p-tabview-panel {
            background: transparent !important;
            height: 100% !important;
          }
          
          /* Custom Sidebar styling */
          .dark-blue-repo-sidebar {
            background: linear-gradient(180deg, #090e1a 0%, #03050a 100%) !important;
            color: #f8fafc !important;
            border-left: 1px solid rgba(255, 255, 255, 0.05) !important;
          }
          .dark-blue-repo-sidebar .p-sidebar-header {
            background: #090e1a !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
            padding: 1.25rem 1.75rem !important;
          }
          .dark-blue-repo-sidebar .p-sidebar-content {
            background: transparent !important;
            padding: 1.5rem 1.75rem !important;
            color: #f8fafc !important;
          }
          .dark-blue-repo-sidebar .p-sidebar-close, .dark-blue-repo-sidebar .p-sidebar-icon {
            color: #94a3b8 !important;
            background: rgba(255, 255, 255, 0.04) !important;
            border-radius: 50% !important;
            width: 2.25rem !important;
            height: 2.25rem !important;
            border: none !important;
            transition: all 0.2s !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .dark-blue-repo-sidebar .p-sidebar-close:hover {
            background: rgba(255, 255, 255, 0.12) !important;
            color: #ffffff !important;
          }

          /* General Dialog styling override to match dark blue gradient theme */
          .p-dialog {
            background: linear-gradient(135deg, #090e1b 0%, #020409 100%) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-radius: 24px !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6) !important;
            color: #ffffff !important;
          }
          .p-dialog .p-dialog-header {
            background: rgba(255, 255, 255, 0.01) !important;
            color: #ffffff !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            padding: 1.25rem 1.5rem !important;
          }
          .p-dialog .p-dialog-content {
            background: transparent !important;
            color: #ffffff !important;
            padding: 1.5rem !important;
          }
          .p-dialog .p-dialog-footer {
            background: rgba(255, 255, 255, 0.01) !important;
            border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
            padding: 1rem 1.5rem !important;
          }
          .p-dialog .p-dialog-header-close {
            color: #94a3b8 !important;
            background: rgba(255, 255, 255, 0.04) !important;
            border-radius: 50% !important;
            width: 2rem !important;
            height: 2rem !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border: none !important;
            transition: all 0.2s !important;
          }
          .p-dialog .p-dialog-header-close:hover {
            background: rgba(255, 255, 255, 0.12) !important;
            color: #ffffff !important;
          }
        `}</style>
      </Sidebar>

      <Dialog
        header={
          <div className="flex items-center gap-2 text-white" dir="rtl">
            <span className="font-black text-lg">غرس شجرة جديدة 🌱</span>
          </div>
        }
        visible={creationVisible}
        onHide={() => setCreationVisible(false)}
        className="w-full max-w-md font-sans mx-4"
        footer={
          <div className="flex gap-3 justify-end mt-4" dir="rtl">
             <Button 
               label="إلغاء" 
               onClick={() => setCreationVisible(false)} 
               className="bg-transparent text-slate-400 hover:text-white font-bold border-none cursor-pointer" 
             />
             <Button 
               label="غرس الآن" 
               onClick={createNewTree} 
               className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl border-none font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer" 
             />
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-4 text-right" dir="rtl">
           <div className="space-y-2">
              <label className="text-xs font-black text-slate-300 block text-right">اسم الشجرة</label>
              <InputText 
                value={newRepoName} 
                onChange={e => setNewRepoName(e.target.value)} 
                placeholder="مثال: لغتي الإنجليزية - المستوى الأول" 
                className="w-full p-4 rounded-xl bg-slate-950/60 border border-white/10 text-white shadow-inner font-bold text-right placeholder-slate-500 focus:border-blue-500/50" 
              />
           </div>
           <div className="space-y-2">
              <label className="text-xs font-black text-slate-300 block text-right">تاريخ الإنشاء (بداية النمو)</label>
              <InputText 
                type="date"
                value={newRepoDate} 
                onChange={e => setNewRepoDate(e.target.value)} 
                className="w-full p-4 rounded-xl bg-slate-950/60 border border-white/10 text-white shadow-inner font-bold text-right placeholder-slate-500 focus:border-blue-500/50" 
              />
           </div>
        </div>
      </Dialog>

      <Dialog
        header={
          <div className="flex items-center gap-2 text-blue-300" dir="rtl">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-lg">إضافة جملة جديدة</span>
          </div>
        }
        visible={addSentenceVisible}
        onHide={() => setAddSentenceVisible(false)}
        className="w-full max-w-md font-sans mx-4 shadow-2xl"
        dismissableMask
        position="bottom"
      >
        <div className="flex flex-col gap-4 py-4 text-right bg-transparent" dir="rtl">
          <InputText 
            value={sentence.text} 
            onChange={e => setSentence({ ...sentence, text: e.target.value })} 
            placeholder="اكتب الجملة باللغة الأجنبية..." 
            className="w-full bg-slate-950/60 border border-white/10 text-white p-4 rounded-2xl font-bold text-right placeholder-slate-500 focus:border-blue-500/50"
          />
          <InputText 
            value={sentence.translation} 
            onChange={e => setSentence({ ...sentence, translation: e.target.value })} 
            placeholder="الترجمة بالعربية (اختياري)..." 
            className="w-full bg-slate-950/60 border border-white/10 text-white p-4 rounded-2xl font-medium text-right placeholder-slate-500 focus:border-blue-500/50"
          />
          
          <div className="space-y-2 mt-2">
            <label className="text-[10px] font-black text-slate-300 block px-1">تصنيف الجملة</label>
            <div className="flex flex-wrap gap-2">
              {SENTENCE_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => {
                    vibrate(HAPITCS.MAJOR_CLICK);
                    setSentence({ ...sentence, category: cat.value });
                  }}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all active:scale-95 cursor-pointer flex-1 text-center min-w-[70px] ${
                    sentence.category === cat.value 
                      ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20" 
                      : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-900/80 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <Button 
            icon="pi pi-plus" 
            label="حفظ الجملة والمتابعة" 
            onClick={addSentence}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-black text-sm border-none mt-4 shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
          />
        </div>
      </Dialog>

      <Dialog
        header={
          <div className="flex items-center gap-2 text-sky-400" dir="rtl">
            <Video className="w-5 h-5 text-sky-400" />
            <span className="font-bold text-lg">إضافة ملاحظة استماع</span>
          </div>
        }
        visible={addTrickVisible}
        onHide={() => setAddTrickVisible(false)}
        className="w-full max-w-md font-sans mx-4 shadow-2xl"
        dismissableMask
        position="bottom"
      >
        <div className="flex flex-col gap-4 py-4 text-right bg-transparent" dir="rtl">
          <InputText 
            value={trick.title} 
            onChange={e => setTrick({ ...trick, title: e.target.value })} 
            placeholder="عنوان الفيديو أو الملاحظة..." 
            className="w-full bg-slate-950/60 border border-white/10 text-white p-4 rounded-2xl font-bold text-right placeholder-slate-500 focus:border-blue-500/50"
          />
          <InputText 
            value={trick.videoUrl} 
            onChange={e => setTrick({ ...trick, videoUrl: e.target.value })} 
            placeholder="رابط الفيديو (اختياري)..." 
            className="w-full bg-slate-950/60 border border-white/10 text-white p-4 rounded-2xl font-medium text-right placeholder-slate-500 focus:border-blue-500/50"
          />
          <InputTextarea 
            value={trick.trick} 
            onChange={e => setTrick({ ...trick, trick: e.target.value })} 
            placeholder="ما هي الملحوظة أو التريك الذي تعلمته؟" 
            className="w-full bg-slate-950/60 border border-white/10 text-white p-4 rounded-2xl font-medium resize-none h-24 text-right placeholder-slate-500 focus:border-blue-500/50 leading-relaxed"
          />
          
          <div className="space-y-2 mt-2">
            <label className="text-[10px] font-black text-slate-300 block px-1">تصنيف الملاحظة</label>
            <div className="flex flex-wrap gap-2">
              {SENTENCE_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => {
                    vibrate(HAPITCS.MAJOR_CLICK);
                    setTrick({ ...trick, category: cat.value });
                  }}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all active:scale-95 cursor-pointer flex-1 text-center min-w-[70px] ${
                    trick.category === cat.value 
                      ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20" 
                      : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-900/80 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <Button 
            icon="pi pi-plus" 
            label="حفظ الملاحظة والمتابعة" 
            onClick={addTrick}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-black text-sm border-none mt-4 shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
          />
        </div>
      </Dialog>

      <Dialog
        header={
          <div className="flex items-center gap-2 text-rose-400" dir="rtl">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span className="font-bold text-lg">رصد ثغرة</span>
          </div>
        }
        visible={addErrorVisible}
        onHide={() => setAddErrorVisible(false)}
        className="w-full max-w-md font-sans mx-4 shadow-2xl"
        dismissableMask
        position="bottom"
      >
        <div className="flex flex-col gap-4 py-4 text-right bg-transparent" dir="rtl">
          <InputText 
            value={errorGap.error} 
            onChange={e => setErrorGap({ ...errorGap, error: e.target.value })} 
            placeholder="ما هو الخطأ المتكرر؟" 
            className="w-full bg-slate-950/60 border border-white/10 text-white p-4 rounded-2xl font-bold text-right placeholder-slate-500 focus:border-blue-500/50"
          />
          <InputText 
            value={errorGap.correction} 
            onChange={e => setErrorGap({ ...errorGap, correction: e.target.value })} 
            placeholder="ما هو التصحيح الصحيح؟" 
            className="w-full bg-slate-950/60 border border-white/10 text-white p-4 rounded-2xl font-medium text-right placeholder-slate-500 focus:border-blue-500/50"
          />
          <InputText 
            value={errorGap.area} 
            onChange={e => setErrorGap({ ...errorGap, area: e.target.value })} 
            placeholder="مجال الخطأ (طق، قواعد، اصطلاح)..." 
            className="w-full bg-slate-950/60 border border-white/10 text-white p-4 rounded-2xl font-medium text-right placeholder-slate-500 focus:border-blue-500/50"
          />
          
          <div className="space-y-2 mt-2">
            <label className="text-[10px] font-black text-slate-300 block px-1">تصنيف الثغرة</label>
            <div className="flex flex-wrap gap-2">
              {SENTENCE_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => {
                    vibrate(HAPITCS.MAJOR_CLICK);
                    setErrorGap({ ...errorGap, category: cat.value });
                  }}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all active:scale-95 cursor-pointer flex-1 text-center min-w-[70px] ${
                    errorGap.category === cat.value 
                      ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20" 
                      : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-900/80 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <Button 
            icon="pi pi-shield" 
            label="حفظ الثغرة والمتابعة" 
            onClick={addErrorGap}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-black text-sm border-none mt-4 shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
          />
        </div>
      </Dialog>

      <Dialog
        header={
          <div className="flex items-center gap-2 text-white" dir="rtl">
            <PenTool className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-lg">إضافة سجل سياق</span>
          </div>
        }
        visible={addContextVisible}
        onHide={() => setAddContextVisible(false)}
        className="w-full max-w-md font-sans mx-4 shadow-2xl"
        dismissableMask
        position="bottom"
      >
        <div className="flex flex-col gap-4 py-4 text-right bg-transparent" dir="rtl">
          <InputText 
            value={dailyContext.topic} 
            onChange={e => setDailyContext({ ...dailyContext, topic: e.target.value })} 
            placeholder="موضوع فقرة اليوم (عن ماذا ستكتب؟)..." 
            className="w-full bg-slate-950/60 border border-white/10 text-white p-4 rounded-2xl font-bold text-right placeholder-slate-500 focus:border-blue-500/50"
          />
          <InputTextarea 
            value={dailyContext.paragraph} 
            onChange={e => setDailyContext({ ...dailyContext, paragraph: e.target.value })} 
            placeholder="اكتب فقرة كاملة اليوم توظف فيها ما تعلمته..." 
            className="w-full bg-slate-950/60 border border-white/10 text-white p-4 rounded-2xl font-medium resize-none h-40 text-right placeholder-slate-500 focus:border-blue-500/50 leading-relaxed"
          />
          
          <div className="space-y-2 mt-2">
            <label className="text-[10px] font-black text-slate-300 block px-1">تصنيف السياق</label>
            <div className="flex flex-wrap gap-2">
              {SENTENCE_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => {
                    vibrate(HAPITCS.MAJOR_CLICK);
                    setDailyContext({ ...dailyContext, category: cat.value });
                  }}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all active:scale-95 cursor-pointer flex-1 text-center min-w-[70px] ${
                    dailyContext.category === cat.value 
                      ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20" 
                      : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-900/80 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <Button 
            icon="pi pi-send" 
            label="إرسال للسجل والمتابعة" 
            onClick={addDailyContext}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-black text-sm border-none mt-4 shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
          />
        </div>
      </Dialog>
    </>
  );
}
