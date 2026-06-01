import { useState, useEffect } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
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
  const [view, setView] = useState<'list' | 'tabs'>('list');
  const [repos, setRepos] = useState<LearningRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<LearningRepository | null>(null);
  
  // Creation Modal State
  const [creationVisible, setCreationVisible] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDate, setNewRepoDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Tab states for the selected repo
  const [sentence, setSentence] = useState({ text: '', translation: '', category: 'informal' });
  const [trick, setTrick] = useState({ title: '', videoUrl: '', trick: '' });
  const [errorGap, setErrorGap] = useState({ error: '', correction: '', area: '' });
  const [dailyContext, setDailyContext] = useState({ topic: '', paragraph: '' });
  const [sentenceFilter, setSentenceFilter] = useState<string>('all');

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
    setTrick({ title: '', videoUrl: '', trick: '' });
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
    setErrorGap({ error: '', correction: '', area: '' });
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
    setDailyContext({ topic: '', paragraph: '' });
    vibrate(HAPITCS.COMPLETE);
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
        position="right"
        header={
          <div className="flex items-center gap-3 pr-2 text-right w-full" dir="rtl">
            <Trees className="w-6 h-6 text-emerald-600" />
            <span className="text-xl font-black text-emerald-950">غابة المعرفة الخاصة بك</span>
          </div>
        }
        className="w-full md:w-[500px] lg:w-[600px] font-sans border-none shadow-2xl sidebar-rtl"
        dismissable
      >
        <div className="flex flex-col gap-6 py-2 h-full text-right" dir="rtl">
          {view === 'list' ? (
            <div className="flex flex-col gap-6 h-full overflow-hidden">
               <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-emerald-900 text-right">أشجارك المثمرة</h3>
                  <Button 
                    label="غرس شجرة جديدة" 
                    icon="pi pi-plus" 
                    onClick={() => {
                      vibrate(HAPITCS.MAJOR_CLICK);
                      setCreationVisible(true);
                    }}
                    className="bg-emerald-600 text-white rounded-2xl px-4 py-2 font-bold text-xs border-none shadow-md"
                  />
               </div>

               <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-10">
                  {repos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center gap-4 bg-emerald-50/30 rounded-3xl border-2 border-dashed border-emerald-100 mt-4">
                      <Sprout className="w-12 h-12 text-emerald-200" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-emerald-800">لا توجد أشجار في غابتك بعد</p>
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
                        className="group p-5 bg-white border border-slate-100 rounded-3xl shadow-3xs hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer flex items-center justify-between text-right"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                             <Trees className="w-6 h-6" />
                          </div>
                          <div className="space-y-1 text-right">
                             <h4 className="font-black text-slate-900">{r.name}</h4>
                             <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                               <Calendar className="w-3 h-3" />
                               {new Date(r.createdAt || '').toLocaleDateString('ar-EG')}
                             </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => deleteTree(r.id, e)}
                            className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all bg-transparent border-none"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                          <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                        </div>
                      </div>
                    ))
                  )}
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
                    className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all border-none flex items-center justify-center"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="flex-1 text-right">
                    <h3 className="text-lg font-black text-emerald-900">{selectedRepo?.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold">تاريخ الغرس: {new Date(selectedRepo?.createdAt || '').toLocaleDateString('ar-EG')}</p>
                  </div>
               </div>

               {isLanguageJourney ? (
                  <TabView className="flex-1 flex flex-col overflow-hidden custom-repo-tabs">
                    <TabPanel header="الجمل 💬" leftIcon="pi pi-comments ml-2">
                      <div className="flex flex-col gap-4 mt-4 h-full">
                        <div className="bg-white border-2 border-slate-100 p-4 rounded-2xl space-y-3 shadow-3xs text-right">
                          <InputText 
                            value={sentence.text} 
                            onChange={e => setSentence({ ...sentence, text: e.target.value })} 
                            placeholder="اكتب الجملة باللغة الأجنبية..." 
                            className="w-full border-none bg-slate-50 p-3 rounded-xl font-bold text-right"
                          />
                          <InputText 
                            value={sentence.translation} 
                            onChange={e => setSentence({ ...sentence, translation: e.target.value })} 
                            placeholder="الترجمة بالعربية (اختياري)..." 
                            className="w-full border-none bg-slate-50 p-3 rounded-xl font-medium text-right"
                          />
                          
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 block px-1">تصنيف الجملة</label>
                            <div className="flex flex-wrap gap-2">
                              {SENTENCE_CATEGORIES.map(cat => (
                                <button
                                  key={cat.value}
                                  onClick={() => setSentence({ ...sentence, category: cat.value })}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border-none transition-all active:scale-95 ${
                                    sentence.category === cat.value 
                                      ? `bg-${cat.color}-600 text-white shadow-sm` 
                                      : `bg-${cat.color}-50 text-${cat.color}-600 hover:bg-${cat.color}-100`
                                  }`}
                                >
                                  {cat.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <Button 
                            icon="pi pi-plus" 
                            label="إضافة جملة" 
                            onClick={addSentence}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold border-none mt-2"
                          />
                        </div>

                        {/* Filter Categories */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                          <button
                            onClick={() => setSentenceFilter('all')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-bold border-none transition-all whitespace-nowrap ${
                              sentenceFilter === 'all' 
                                ? 'bg-slate-800 text-white' 
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            الكل
                          </button>
                          {SENTENCE_CATEGORIES.map(cat => (
                            <button
                              key={cat.value}
                              onClick={() => setSentenceFilter(cat.value)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-bold border-none transition-all whitespace-nowrap ${
                                sentenceFilter === cat.value 
                                  ? `bg-${cat.color}-600 text-white` 
                                  : `bg-${cat.color}-50 text-${cat.color}-600 hover:bg-${cat.color}-100`
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-10">
                          {selectedRepo?.sentences?.filter(s => sentenceFilter === 'all' || s.category === sentenceFilter).map(item => (
                            <div key={item.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-start group relative border border-transparent hover:border-slate-200 transition-all">
                              <div className="space-y-1 text-right">
                                <div className="flex items-center gap-2 mb-1">
                                  {item.category && (
                                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter bg-${SENTENCE_CATEGORIES.find(c => c.value === item.category)?.color || 'slate'}-100 text-${SENTENCE_CATEGORIES.find(c => c.value === item.category)?.color || 'slate'}-600`}>
                                      {SENTENCE_CATEGORIES.find(c => c.value === item.category)?.label}
                                    </span>
                                  )}
                                  <p className="text-[10px] text-slate-300 font-mono">{new Date(item.date).toLocaleDateString('ar-EG')}</p>
                                </div>
                                <p className="font-bold text-indigo-900 text-lg">{item.text}</p>
                                {item.translation && <p className="text-sm text-slate-500 font-medium">{item.translation}</p>}
                              </div>
                              <button 
                                onClick={() => removeItem('sentences', item.id)}
                                className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all bg-transparent border-none cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabPanel>

                    <TabPanel header="الاستماع 🎧" leftIcon="pi pi-volume-up ml-2">
                      <div className="flex flex-col gap-4 mt-4 h-full">
                        <div className="bg-white border-2 border-slate-100 p-4 rounded-2xl space-y-3 shadow-3xs text-right">
                          <InputText 
                            value={trick.title} 
                            onChange={e => setTrick({ ...trick, title: e.target.value })} 
                            placeholder="عنوان الفيديو أو التريك..." 
                            className="w-full border-none bg-slate-50 p-3 rounded-xl font-bold text-right"
                          />
                          <InputText 
                            value={trick.videoUrl} 
                            onChange={e => setTrick({ ...trick, videoUrl: e.target.value })} 
                            placeholder="رابط الفيديو (اختياري)..." 
                            className="w-full border-none bg-slate-50 p-3 rounded-xl font-medium text-right"
                          />
                          <InputTextarea 
                            value={trick.trick} 
                            onChange={e => setTrick({ ...trick, trick: e.target.value })} 
                            placeholder="ما هي الملحوظة أو التريك الذي تعلمته؟" 
                            className="w-full border-none bg-slate-50 p-3 rounded-xl font-medium resize-none h-24 text-right"
                          />
                          <Button 
                            icon="pi pi-plus" 
                            label="إضافة للذاكرة" 
                            onClick={addTrick}
                            className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold border-none"
                          />
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-10">
                          {selectedRepo?.listeningTricks?.map(item => (
                            <div key={item.id} className="p-4 bg-sky-50/50 border border-sky-100 rounded-2xl flex justify-between items-start group">
                              <div className="space-y-2 text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  <Video className="w-4 h-4 text-sky-500" />
                                  <p className="font-bold text-sky-900">{item.title}</p>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed font-medium bg-white/60 p-3 rounded-xl">{item.trick}</p>
                                {item.videoUrl && (
                                  <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-600 hover:scale-105 transition-all inline-flex items-center gap-1 font-bold">
                                    رابط المراجعة <i className="pi pi-external-link text-[8px]"></i>
                                  </a>
                                )}
                              </div>
                              <button 
                                onClick={() => removeItem('listeningTricks', item.id)}
                                className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all bg-transparent border-none cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabPanel>

                    <TabPanel header="الثغرات ⚠️" leftIcon="pi pi-exclamation-triangle ml-2">
                      <div className="flex flex-col gap-4 mt-4 h-full">
                        <div className="bg-white border-2 border-slate-100 p-4 rounded-2xl space-y-3 shadow-3xs text-right">
                          <InputText 
                            value={errorGap.error} 
                            onChange={e => setErrorGap({ ...errorGap, error: e.target.value })} 
                            placeholder="ما هو الخطأ المتكرر؟" 
                            className="w-full border-none bg-slate-50 p-3 rounded-xl font-bold text-right"
                          />
                          <InputText 
                            value={errorGap.correction} 
                            onChange={e => setErrorGap({ ...errorGap, correction: e.target.value })} 
                            placeholder="ما هو التصحيح الصحيح؟" 
                            className="w-full border-none bg-slate-50 p-3 rounded-xl font-medium text-right"
                          />
                          <InputText 
                            value={errorGap.area} 
                            onChange={e => setErrorGap({ ...errorGap, area: e.target.value })} 
                            placeholder="مجال الخطأ (نطق، قواعد، ملحوظة)..." 
                            className="w-full border-none bg-slate-50 p-3 rounded-xl font-medium text-right"
                          />
                          <Button 
                            icon="pi pi-shield" 
                            label="رصيد الثغرات" 
                            onClick={addErrorGap}
                            className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold border-none"
                          />
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-10">
                          {selectedRepo?.errorsGaps?.map(item => (
                            <div key={item.id} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex justify-between items-start group">
                              <div className="space-y-2 text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                                  <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-black">{item.area}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <p className="font-bold text-rose-900 line-through decoration-rose-300 opacity-60 text-right">الخطأ: {item.error}</p>
                                  <p className="font-bold text-emerald-700 text-lg text-right">الصواب: {item.correction}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => removeItem('errorsGaps', item.id)}
                                className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all bg-transparent border-none cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabPanel>

                    <TabPanel header="سياق اليوم ✍️" leftIcon="pi pi-pencil ml-2">
                      <div className="flex flex-col gap-4 mt-4 h-full">
                        <div className="bg-white border-2 border-slate-100 p-4 rounded-2xl space-y-3 shadow-3xs text-right">
                          <InputText 
                            value={dailyContext.topic} 
                            onChange={e => setDailyContext({ ...dailyContext, topic: e.target.value })} 
                            placeholder="موضوع فقرة اليوم (عن ماذا ستكتب؟)..." 
                            className="w-full border-none bg-slate-50 p-3 rounded-xl font-bold text-right"
                          />
                          <InputTextarea 
                            value={dailyContext.paragraph} 
                            onChange={e => setDailyContext({ ...dailyContext, paragraph: e.target.value })} 
                            placeholder="اكتب فقرة كاملة اليوم توظف فيها ما تعلمته..." 
                            className="w-full border-none bg-slate-50 p-3 rounded-xl font-medium resize-none h-40 text-right"
                          />
                          <Button 
                            icon="pi pi-send" 
                            label="أرسل للذاكرة" 
                            onClick={addDailyContext}
                            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold border-none shadow-md shadow-emerald-100"
                          />
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-10">
                          {selectedRepo?.dailyContexts?.map(item => (
                            <div key={item.id} className="p-5 bg-white border border-slate-100 rounded-3xl space-y-3 shadow-3xs group relative text-right">
                              <div className="flex items-center justify-between">
                                 <p className="text-[10px] text-slate-400 font-mono">{new Date(item.date).toLocaleDateString('ar-EG')}</p>
                                 <div className="flex items-center gap-2">
                                   <PenTool className="w-4 h-4 text-emerald-500" />
                                   <h4 className="font-black text-slate-900">{item.topic}</h4>
                                 </div>
                              </div>
                              <p className="text-sm leading-relaxed text-slate-700 font-medium whitespace-pre-wrap bg-slate-50/50 p-4 rounded-2xl italic text-right">
                                {item.paragraph}
                              </p>
                              <button 
                                onClick={() => removeItem('dailyContexts', item.id)}
                                className="absolute top-4 left-4 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all bg-transparent border-none cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
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
            background: #f8fafc !important;
            border-radius: 20px !important;
            padding: 4px !important;
            display: flex !important;
            gap: 4px !important;
            border: 1px solid #e2e8f0 !important;
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
            color: #64748b !important;
            justify-content: center !important;
            border-radius: 16px !important;
            transition: all 0.3s !important;
            white-space: nowrap !important;
          }
          .custom-repo-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link {
            background: white !important;
            color: #4f46e5 !important;
            shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
          }
          .custom-repo-tabs .p-tabview-panels {
            padding: 0 !important;
            height: 500px !important;
          }
          .custom-repo-tabs .p-tabview-panel {
            height: 100% !important;
          }
        `}</style>
      </Sidebar>

      <Dialog
        header="غرس شجرة جديدة 🌱"
        visible={creationVisible}
        onHide={() => setCreationVisible(false)}
        className="w-full max-w-md font-sans mx-4"
        footer={
          <div className="flex gap-3 justify-end mt-4" dir="rtl">
             <Button label="إلغاء" onClick={() => setCreationVisible(false)} className="p-button-text text-slate-500 font-bold" />
             <Button label="غرس الآن" onClick={createNewTree} className="bg-emerald-600 text-white px-6 py-2 rounded-xl border-none font-bold shadow-md" />
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-4 text-right" dir="rtl">
           <div className="space-y-2">
              <label className="text-xs font-black text-slate-900 block text-right">اسم الشجرة</label>
              <InputText 
                value={newRepoName} 
                onChange={e => setNewRepoName(e.target.value)} 
                placeholder="مثال: لغتي الإنجليزية - المستوى الأول" 
                className="w-full p-3 rounded-xl bg-slate-50 border-none shadow-3xs font-bold text-right" 
              />
           </div>
           <div className="space-y-2">
              <label className="text-xs font-black text-slate-900 block text-right">تاريخ الإنشاء (بداية النمو)</label>
              <InputText 
                type="date"
                value={newRepoDate} 
                onChange={e => setNewRepoDate(e.target.value)} 
                className="w-full p-3 rounded-xl bg-slate-50 border-none shadow-3xs font-bold text-right" 
              />
           </div>
        </div>
      </Dialog>
    </>
  );
}
