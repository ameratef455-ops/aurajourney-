import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Slider } from 'primereact/slider';
import { Checkbox } from 'primereact/checkbox';
import { TabView, TabPanel } from 'primereact/tabview';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Trophy, 
  Lightbulb, 
  Wrench, 
  CheckCircle2, 
  Languages, 
  Mic, 
  Square,
  Volume2, 
  Plus, 
  Trash2, 
  ChevronRight,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { LAYERS } from '../constants/layers';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { vibrate, HAPITCS } from '../lib/haptics';
import { toast as toastHot } from "react-hot-toast";

interface TaskReflectionModalProps {
  visible: boolean;
  onHide: () => void;
  onSubmit: (data: any) => void;
  taskTitle: string;
  isReview?: boolean;
  baseZIndex?: number;
}

export function TaskReflectionModal({ visible, onHide, onSubmit, taskTitle, isReview, baseZIndex }: TaskReflectionModalProps) {
  const [focus, setFocus] = useState<number>(3);
  const [mastery, setMastery] = useState<number>(5);
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [learnings, setLearnings] = useState('');
  const [didPractical, setDidPractical] = useState(false);
  const [practicalIssues, setPracticalIssues] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    // Force load voices
    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
  }, []);

  // Language Learning State
  const [sentences, setSentences] = useState<{ text: string; notes: string; audioData?: string }[]>([]);
  const [accentRating, setAccentRating] = useState(3);
  const [dialectNotes, setDialectNotes] = useState('');
  const [pronunciationIssues, setPronunciationIssues] = useState('');

  const settings = useLiveQuery(() => db.userSettings.toArray());
  const isLanguageLearning = settings?.[0]?.learningGoal === 'اللغات الأجنبية';

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setFocus(3);
      setMastery(5);
      setStrengths('');
      setWeaknesses('');
      setLearnings('');
      setDidPractical(false);
      setPracticalIssues('');
      setActiveIndex(0);
      setSentences([]);
      setAccentRating(3);
      setDialectNotes('');
      setPronunciationIssues('');
    }
  }, [visible]);

  const focusLevels = [
    { value: 1, color: 'bg-rose-100 text-rose-600', active: 'bg-rose-500 text-white shadow-rose-200' },
    { value: 2, color: 'bg-orange-100 text-orange-600', active: 'bg-orange-500 text-white shadow-orange-200' },
    { value: 3, color: 'bg-amber-100 text-amber-600', active: 'bg-amber-500 text-white shadow-amber-200' },
    { value: 4, color: 'bg-blue-100 text-blue-600', active: 'bg-blue-500 text-white shadow-blue-200' },
    { value: 5, color: 'bg-emerald-100 text-emerald-600', active: 'bg-emerald-500 text-white shadow-emerald-200' },
  ];

  const handleSubmit = () => {
    // Validation
    if (mastery < 1 || focus < 1) {
      toastHot.error("يرجى إكمال التقييم العام أولاً (التركيز والإتقان)");
      setActiveIndex(0);
      return;
    }

    if (!strengths.trim() || !weaknesses.trim() || !learnings.trim()) {
      toastHot.error("يرجى ملئ التاب الثاني كاملاً (نقاط القوة، الضعف، والتعلم)");
      setActiveIndex(1);
      return;
    }

    if (isLanguageLearning && sentences.length === 0) {
      toastHot.error("يرجى إضافة جملة واحدة على الأقل في سجل اللغات");
      setActiveIndex(1);
      return;
    }

    vibrate(HAPITCS.COMPLETE);
    onSubmit({
      focus,
      mastery,
      strengths,
      weaknesses,
      learnings,
      didPractical,
      practicalIssues,
      languageLearning: isLanguageLearning ? {
        sentences,
        accentRating,
        dialectNotes,
        pronunciationIssues
      } : undefined
    });
    onHide();
  };

  const speak = (text: string) => {
    if (!text) return;
    vibrate(HAPITCS.GUIDANCE);
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language to Arabic if text contains Arabic characters, otherwise English
    const isArabic = /[\u0600-\u06FF]/.test(text);
    utterance.lang = isArabic ? 'ar-SA' : 'en-US';
    
    // Try to find a better voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferredVoice = voices.find(v => 
        (isArabic ? v.lang.includes('ar') : v.lang.includes('en')) && v.localService
      ) || voices.find(v => isArabic ? v.lang.includes('ar') : v.lang.includes('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  };

  const [isListening, setIsListening] = useState(false);
  const [listeningTargetIdx, setListeningTargetIdx] = useState<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTargetIdx, setRecordingTargetIdx] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async (idx: number) => {
    try {
      vibrate(HAPITCS.MAJOR_CLICK);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const newSentences = [...sentences];
          newSentences[idx].audioData = base64data;
          setSentences(newSentences);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTargetIdx(idx);
    } catch (err: any) {
      console.error("Microphone access denied or error:", err);
      if (err.name === 'NotAllowedError') {
        alert("يرجى تفعيل صلاحية الميكروفون من إعدادات المتصفح لاستخدام ميزة التسجيل.");
      } else {
        alert("حدث خطأ أثناء محاولة الوصول للميكروفون.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTargetIdx(null);
      vibrate(HAPITCS.SUCCESS);
    }
  };

  const startListening = (idx: number) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("متصفحك لا يدعم ميزة التعرف على الكلام.");
      return;
    }

    vibrate(HAPITCS.MAJOR_CLICK);
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // Default to English, ideally this should be configurable
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setListeningTargetIdx(idx);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const newSentences = [...sentences];
      newSentences[idx].text = transcript;
      setSentences(newSentences);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setListeningTargetIdx(null);
      if (event.error === 'not-allowed') {
        alert("صلاحية الميكروفون مرفوضة. يرجى تفعيلها من إعدادات المتصفح.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setListeningTargetIdx(null);
    };

    recognition.start();
  };

  const footer = (
    <div className="pt-2 pb-4 px-4 bg-white border-t border-slate-50">
      <Button 
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 rounded-xl py-2.5 flex items-center justify-center gap-2 shadow-lg border-none outline-none cursor-pointer transition-all active:scale-[0.98] hover:shadow-xl"
      >
        <CheckCircle2 className="w-4 h-4 text-white/90" />
        <span className="text-sm font-black text-white">حفظ التقييم وختم المهمة</span>
      </Button>
    </div>
  );

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  return (
    <>
      <Dialog 
        visible={visible} 
        onHide={() => {
          if (strengths || weaknesses || learnings || sentences.length > 0) {
            setShowExitConfirm(true);
          } else {
            onHide();
          }
        }}
      header={<div className="flex flex-col gap-1">
        <span className="text-xl font-black text-indigo-950">{isReview ? "تقييم بعد المراجعة 🔄" : "تقييم إنجاز المهمة ✨"}</span>
         <span className="text-xs text-indigo-500 font-medium">{taskTitle}</span>
       </div>}
      footer={footer}
      className="w-full max-w-2xl font-sans"
      showHeader
      modal
      dismissableMask
      breakpoints={{ '960px': '75vw', '641px': '95vw' }}
      baseZIndex={baseZIndex || LAYERS.TASK_REFLECTION}
    >
      <div className="py-2" dir="rtl">
        <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)} className="custom-reflection-tabs">
          <TabPanel header="التقييم العام" leftIcon="pi pi-check-circle mr-2 ml-2">
            <div className="space-y-8 py-4 mt-2 max-h-[55vh] overflow-y-auto px-1 custom-scrollbar">
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
            </div>
          </TabPanel>

          {isLanguageLearning && (
            <TabPanel header="سجل اللغات" leftIcon="pi pi-language mr-2 ml-2">
              <div className="space-y-8 py-4 mt-2 max-h-[55vh] overflow-y-auto px-1 custom-scrollbar">
                {/* Sentences Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                      <Languages className="w-5 h-5 text-indigo-500" />
                      الجمل والتعبيرات المكتسبة:
                    </label>
                    <Button 
                      icon={<Plus className="w-4 h-4" />} 
                      className="p-button-text p-button-rounded text-indigo-600 hover:bg-indigo-50" 
                      onClick={() => setSentences([...sentences, { text: '', notes: '' }])}
                    />
                  </div>

                  <div className="space-y-4">
                    {sentences.length === 0 && (
                      <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/10">
                        <p className="text-xs font-medium text-slate-400">أضف جملًا جديدة لتدوينها وممارستها ✨</p>
                      </div>
                    )}
                    {sentences.map((s, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-slate-100 p-4 rounded-2xl shadow-3xs space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                            <input 
                              value={s.text}
                              onChange={(e) => {
                                const newS = [...sentences];
                                newS[idx].text = e.target.value;
                                setSentences(newS);
                              }}
                              placeholder="اكتب الجملة هنا..."
                              className="w-full pl-24 pr-4 py-3 bg-slate-50/50 border-none rounded-xl text-xs font-bold text-slate-700 placeholder-slate-300 focus:bg-white focus:ring-1 ring-indigo-100 transition-all"
                            />
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              <Button 
                                icon={<Volume2 className="w-3.5 h-3.5" />} 
                                className={`w-8 h-8 p-button-rounded p-button-text ${s.text || s.audioData ? 'text-indigo-500' : 'text-slate-300'}`} 
                                disabled={!s.text && !s.audioData}
                                onClick={() => {
                                  if (s.audioData) {
                                    const audio = new Audio(s.audioData);
                                    audio.play();
                                  } else {
                                    speak(s.text);
                                  }
                                }}
                              />
                              <Button 
                                icon={<Mic className={`w-3.5 h-3.5 ${isListening && listeningTargetIdx === idx ? 'animate-pulse text-rose-500' : ''}`} />} 
                                className="w-8 h-8 p-button-rounded p-button-text text-slate-400" 
                                onClick={() => startListening(idx)}
                              />
                              <Button 
                                icon={isRecording && recordingTargetIdx === idx ? <Square className="w-3.5 h-3.5 text-rose-600 animate-pulse" /> : <Mic className="w-3.5 h-3.5 text-blue-500" />} 
                                className={`w-8 h-8 p-button-rounded p-button-text ${isRecording && recordingTargetIdx === idx ? 'bg-rose-50' : ''}`} 
                                onClick={() => isRecording ? stopRecording() : startRecording(idx)}
                              />
                            </div>
                          </div>
                          <Button 
                            icon={<Trash2 className="w-4 h-4" />} 
                            className="p-button-text p-button-rounded text-rose-300 hover:text-rose-500" 
                            onClick={() => setSentences(sentences.filter((_, i) => i !== idx))}
                          />
                        </div>
                        <InputTextarea 
                          value={s.notes}
                          onChange={(e) => {
                            const newS = [...sentences];
                            newS[idx].notes = e.target.value;
                            setSentences(newS);
                          }}
                          placeholder="ملاحظات حول النطق أو الاستخدام..."
                          className="w-full min-h-[40px] bg-slate-50/20 border-none rounded-xl p-3 text-[10px] font-medium text-slate-500"
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Pronunciation & Accent */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      تقييم اللكنة (Accent):
                    </label>
                    <div className="px-2">
                       <Slider value={accentRating} onChange={(e) => setAccentRating(e.value as number)} min={1} max={5} />
                       <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                         <span>مبتدئ</span>
                         <span>أصلي (Native)</span>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                      <MessageSquare className="w-5 h-5 text-sky-500" />
                      مشاكل النطق المكتشفة:
                    </label>
                    <InputTextarea 
                      value={pronunciationIssues}
                      onChange={(e) => setPronunciationIssues(e.target.value)}
                      placeholder="الأحرف أو المخارج الصعبة..."
                      className="w-full min-h-[60px] bg-sky-50/20 border-sky-100 rounded-xl p-3 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mr-1">
                    ملاحظات حول اللكنة واللهجة المستخدمة:
                  </label>
                  <InputTextarea 
                    value={dialectNotes}
                    onChange={(e) => setDialectNotes(e.target.value)}
                    placeholder="مثال: التدرب على اللكنة الأمريكية..."
                    className="w-full min-h-[60px] bg-slate-50/30 border-slate-100 rounded-xl p-3 text-xs font-medium"
                  />
                </div>
              </div>
            </TabPanel>
          )}
        </TabView>
      </div>
    </Dialog>

    <Dialog
        visible={showExitConfirm}
        onHide={() => setShowExitConfirm(false)}
        showHeader={false}
        className="w-full max-w-sm rounded-[24px] overflow-hidden border border-slate-100 shadow-2xl relative"
        modal
        dismissableMask
        contentClassName="p-0 bg-white"
    >
      <div className="p-7 text-center font-sans" dir="rtl">
        {/* Warning Icon Container */}
        <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-rose-50 text-rose-600 mb-4 border border-rose-100">
          <i className="pi pi-exclamation-triangle text-2xl animate-pulse duration-1000"></i>
        </div>
        
        {/* Title */}
        <h3 className="text-base font-black text-slate-900 mb-2">
          مغادرة نموذج التقييم؟ ⚠️
        </h3>
        
        {/* Description */}
        <p className="text-xs font-medium text-slate-500 leading-relaxed mb-6 px-1">
          هل أنت متأكد من رغبتك في الخروج؟ ستفقد كافة الملاحظات والبيانات والدرجات التي حددتها في هذه الجلسة.
        </p>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowExitConfirm(false)}
            className="flex-1 py-3 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl shadow-xs border border-slate-200 transition-all active:scale-[0.98] cursor-pointer"
          >
            تراجع ومتابعة التقييم
          </button>
          <button
            onClick={() => {
              setShowExitConfirm(false);
              onHide();
            }}
            className="flex-1 py-3 px-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-rose-200 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            نعم، خروج وإلغاء
          </button>
        </div>
      </div>
    </Dialog>

      <style>{`
        .p-dialog .p-dialog-footer {
           padding: 0 !important;
           border: none !important;
        }
        .custom-reflection-tabs .p-tabview-nav {
          background: transparent !important;
          border-bottom: 2px solid #f8fafc !important;
          display: flex !important;
          gap: 12px !important;
          justify-content: center !important;
        }
        .custom-reflection-tabs .p-tabview-nav li {
          margin-bottom: -2px !important;
        }
        .custom-reflection-tabs .p-tabview-nav li .p-tabview-nav-link {
          background: transparent !important;
          border: none !important;
          border-bottom: 2px solid transparent !important;
          padding: 12px 24px !important;
          font-weight: 900 !important;
          font-size: 14px !important;
          transition: all 0.2s !important;
          color: #94a3b8 !important;
          border-radius: 0 !important;
        }
        .custom-reflection-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link {
          color: #4f46e5 !important;
          border-bottom-color: #4f46e5 !important;
        }
        .custom-reflection-tabs .p-tabview-panels {
          padding: 0 !important;
          background: transparent !important;
        }
      `}</style>
    </>
  );
}
