import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Grid3X3, Search, Sparkles, BookOpen, Keyboard, CheckCircle, 
  TrendingUp, HelpCircle, Trophy, CornerDownLeft, Info, HelpCircle as HelpIcon, FileSpreadsheet, Star
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { vibrate, HAPITCS } from '../lib/haptics';
import { db } from '../db';

interface GoogleSheetsLearningProps {
  visible: boolean;
  onHide: () => void;
  user?: any;
}

// Simple and safe built-in formula parser for our interactive spreadsheet playground
function parseAndEvaluateFormula(formula: string, grid: Record<string, string>): string {
  const clean = formula.trim();
  if (!clean.startsWith('=')) return clean;
  
  const upper = clean.toUpperCase();
  const inner = upper.substring(1); // strip '='
  
  // Try 1: SUM(range) or AVERAGE(range)
  // e.g. SUM(A1:C1)
  const rangeMatch = inner.match(/^(SUM|AVERAGE)\(([A-C][1-3]):([A-C][1-3])\)$/);
  if (rangeMatch) {
    const [_, func, startCell, endCell] = rangeMatch;
    const startCol = startCell.charCodeAt(0);
    const startRow = parseInt(startCell.substring(1));
    const endCol = endCell.charCodeAt(0);
    const endRow = parseInt(endCell.substring(1));
    
    // gather list of numbers
    const values: number[] = [];
    for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
      for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++) {
        const cellId = String.fromCharCode(c) + r;
        const val = parseFloat(grid[cellId] || '0');
        if (!isNaN(val)) {
          values.push(val);
        }
      }
    }
    
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    if (func === 'SUM') {
      return String(sum);
    } else {
      return String(values.length > 0 ? (sum / values.length).toFixed(1) : 0);
    }
  }

  // Try 2: Simple addition, subtraction, etc between cells
  // e.g. A1 + B1
  const basicMathMatch = inner.match(/^([A-C][1-3])\s*([\+\-\*\/])\s*([A-C][1-3])$/);
  if (basicMathMatch) {
    const [_, cellA, op, cellB] = basicMathMatch;
    const valA = parseFloat(grid[cellA] || '0');
    const valB = parseFloat(grid[cellB] || '0');
    if (isNaN(valA) || isNaN(valB)) return '#VALUE!';
    switch (op) {
      case '+': return String(valA + valB);
      case '-': return String(valA - valB);
      case '*': return String(valA * valB);
      case '/': return valB !== 0 ? String(valA / valB) : '#DIV/0!';
      default: return '#ERROR!';
    }
  }

  // Try 3: IF condition
  // e.g. IF(A1>20, "كبير", "صغير") or IF(A1>B1, "A كبير", "B كبير")
  if (inner.startsWith('IF(') && inner.endsWith(')')) {
    const content = inner.substring(3, inner.length - 1);
    // split by comma, respecting string literals if possible. Let's do simple comma splitting.
    const parts = content.split(',');
    if (parts.length >= 2) {
      const conditionStr = parts[0].trim();
      let isTrue = false;
      
      const comparisonMatch = conditionStr.match(/^([A-C][1-3])\s*(>|<|=)\s*([A-C][1-3]|\d+)$/);
      if (comparisonMatch) {
        const [_, lhs, op, rhs] = comparisonMatch;
        const valL = parseFloat(grid[lhs] || '0');
        const valR = rhs.match(/^\d+$/) ? parseFloat(rhs) : parseFloat(grid[rhs] || '0');
        
        switch (op) {
          case '>': isTrue = valL > valR; break;
          case '<': isTrue = valL < valR; break;
          case '=': isTrue = valL === valR; break;
        }
      } else {
        return '#COND_ERR!';
      }
      
      const rawTrueVal = parts[1].trim().replace(/^["']|["']$/g, '');
      const rawFalseVal = parts[2] ? parts[2].trim().replace(/^["']|["']$/g, '') : '';
      return isTrue ? rawTrueVal : rawFalseVal;
    }
  }

  // Try 4: CONCATENATE or CONCAT
  // e.g. CONCATENATE(A2, " ", B2)
  if (inner.startsWith('CONCATENATE(') && inner.endsWith(')')) {
    const content = inner.substring(12, inner.length - 1);
    const parts = content.split(',');
    let finalStr = '';
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        finalStr += trimmed.substring(1, trimmed.length - 1);
      } else if (grid[trimmed] !== undefined) {
        finalStr += grid[trimmed];
      } else {
        finalStr += trimmed;
      }
    }
    return finalStr;
  }

  return '#NAME?';
}

export function GoogleSheetsLearning({ visible, onHide, user }: GoogleSheetsLearningProps) {
  const [activeTab, setActiveTab] = useState<'lessons' | 'playground' | 'shortcuts' | 'challenges'>('lessons');
  const [shortcutSearch, setShortcutSearch] = useState('');
  const [shortcutOS, setShortcutOS] = useState<'win' | 'mac'>('win');

  // Interactive Sandbox state
  const [playgroundGrid, setPlaygroundGrid] = useState<Record<string, string>>({
    A1: '10', B1: '25', C1: '15',
    A2: 'أحمد', B2: 'المهندس', C2: 'خبير',
    A3: '30', B3: '20', C3: '50'
  });
  const [playgroundFormulaInput, setPlaygroundFormulaInput] = useState('=SUM(A1:C1)');
  const [playgroundOutputCell, setPlaygroundOutputCell] = useState('D1');
  const [computedOutput, setComputedOutput] = useState('50');

  // Challenges State
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [challengeFormulaInput, setChallengeFormulaInput] = useState('');
  const [challengeFeedback, setChallengeFeedback] = useState<{ status: 'idle' | 'success' | 'error'; msg: string }>({ status: 'idle', msg: '' });

  // Grid editing states
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const lessons = [
    {
      id: "basics",
      title: "1. أساسيات فرز وهيكلة البيانات",
      description: "تعرف على الأعمدة، الصفوف، وتسميات الخلايا، وبناء الجداول بطرق احترافية وسهلة القراءة.",
      videoPlaceholder: "شرح هيكل الـ Spreadsheet المتقدم",
      xp: 15,
      tips: [
        "كل خلية يتم تمثيلها بحرف العمود متبوعاً برقم الصف مثل (A1).",
        "تنسيق البيانات كشرائح عريضة أو تلوين خلايا الرؤوس بلون غامق يمنح جدولك نظرة مهنية.",
        "استخدم اختصار تنسيق العملات أو التواريخ بدقة من شريط الأدوات الرئيسي."
      ]
    },
    {
      id: "formulas_intro",
      title: "2. عمالقة الحساب (SUM, AVERAGE, SUMIF)",
      description: "صناعة المعادلات الحسابية المتقاطعة وجمع البيانات تلقائياً وتصفية المجاميع بشروط ذكية.",
      videoPlaceholder: "=SUM, =AVERAGE & =IF  الشرح التطبيقي",
      xp: 20,
      tips: [
        "أي معادلة تبدأ دائماً بـ علامة (=) وإلا ستكون مجرد نص جامد.",
        "الرمز (:) يعني مدى واسع، مثال: A1:D1 يجمع كل الخلايا من عمود A إلى عمود D.",
        "لشرط تصفية معين استخدم دالة COUNTIF أو SUMIF."
      ]
    },
    {
      id: "lookup_magic",
      title: "3. سحر البحث والربط (VLOOKUP & XLOOKUP)",
      description: "كيف تبحث عن بيانات جدول آخر وربط المفاتيح المشتركة للمبيعات والموظفين بنقرة واحدة.",
      videoPlaceholder: "شرح دالة VLOOKUP بالتفصيل العملي",
      xp: 25,
      tips: [
        "تبحث VLOOKUP دائماً في العمود الأول لليسار أو اليمين بحسب اتجاه الورقة.",
        "تأكد من اختيار الرمز FALSE للاسترجاع الدقيق للمطابقات الخلوية.",
        "دالة XLOOKUP الحديثة تحميك من مشاكل حذف الأعمدة بالكامل وتدعم اتجاهات حرة."
      ]
    },
    {
      id: "clean_data",
      title: "4. تصفية وتصميم القوائم (FILTER & Pivot Tables)",
      description: "تنظيف الجداول الكبيرة، إزالة الفراغات، وبناء لوحات التلخيص المحورية الديناميكية بالتفصيل.",
      videoPlaceholder: "هندسة التقارير والـ Pivot Tables في دقيقة",
      xp: 30,
      tips: [
        "الجداول المحورية تختصر آلاف الأسطر في جدول صغير يلخص المتوسطات والمجاميع.",
        "استخدم FILTER لإنشاء قائمة منسدلة ديناميكية تعتمد على حقول معينة.",
        "التنسيق الشرطي (Conditional Formatting) يبرز القيم الشاذة والأرباح الاستثنائية تلقائياً بحسب القيمة."
      ]
    }
  ];

  const shortcuts = [
    { win: "Ctrl + Space", mac: "Ctrl + Space", desc: "تحديد العمود بالكامل (Select Entire Column)", cat: "التنقل والتحديد" },
    { win: "Shift + Space", mac: "Shift + Space", desc: "تحديد الصف بالكامل (Select Entire Row)", cat: "التنقل والتحديد" },
    { win: "Ctrl + A", mac: "Cmd + A", desc: "تحديد ورقة العمل كلها (Select All)", cat: "التنقل والتحديد" },
    { win: "Ctrl + K", mac: "Cmd + K", desc: "إدراج رابط تشعبي خلوي (Insert Hyperlink)", cat: "إدخال وتنسيق" },
    { win: "Ctrl + Shift + 1", mac: "Ctrl + Shift + 1", desc: "تنسيق كـ رقم عشري منسق (Decimal Number)", cat: "إدخال وتنسيق" },
    { win: "Ctrl + Shift + 4", mac: "Ctrl + Shift + 4", desc: "تنسيق كـ عملة مالية محددة (Currency Format)", cat: "إدخال وتنسيق" },
    { win: "Alt + Shift + 5", mac: "Cmd + Shift + X", desc: "وضع خط بمنتصف النص (Strikethrough)", cat: "إدخال وتنسيق" },
    { win: "F4", mac: "F4 or Fn + F4", desc: "تثبيت الخلايا بالمعادلة بإشارة $ (Absolute Reference)", cat: "المعادلات" },
    { win: "Ctrl + `", mac: "Ctrl + `", desc: "عرض الصيغ والمعادلات داخل الخلايا (Toggle Formulas)", cat: "المعادلات" },
    { win: "Ctrl + Alt + M", mac: "Cmd + Alt + M", desc: "إدراج تعليق وملاحظة (Insert Comment)", cat: "عام" },
    { win: "Ctrl + H", mac: "Cmd + Shift + H", desc: "البحث والاستبدال المتقدم (Find & Replace)", cat: "عام" }
  ];

  const filteredShortcuts = useMemo(() => {
    return shortcuts.filter(s => 
      s.desc.toLowerCase().includes(shortcutSearch.toLowerCase()) ||
      s.win.toLowerCase().includes(shortcutSearch.toLowerCase()) ||
      s.mac.toLowerCase().includes(shortcutSearch.toLowerCase()) ||
      s.cat.includes(shortcutSearch)
    );
  }, [shortcutSearch]);

  const challengesList = [
    {
      id: "ch_sum",
      title: "تحدي المجموع الكلي (=SUM)",
      description: "المطلوب كتابة معادلة لجمع الأعداد في عمود A من الصف الأول حتى الصف الثالث.",
      previewGrid: { A1: '10', A2: '20', A3: '30' },
      expectedAnswers: ["=SUM(A1:A3)", "=A1+A2+A3", "=SUM(A1:A3)"],
      expectedOutput: "60",
      hint: "اكتب معادلة المجموع المدى من A1 لغاية A3 مسبوقة بـ ="
    },
    {
      id: "ch_average",
      title: "تحدي متوسط الأرباح (=AVERAGE)",
      description: "اكتب معادلة لحساب متوسط القيم الرقمية في الصف الأول من العمود A للعمود C.",
      previewGrid: { A1: '10', B1: '25', C1: '10' },
      expectedAnswers: ["=AVERAGE(A1:C1)", "=(A1+B1+C1)/3", "=AVERAGE(A1:C1)"],
      expectedOutput: "15",
      hint: "استخدم دالة AVERAGE على المدى الأفقي لصف رقم 1."
    },
    {
      id: "ch_if",
      title: "لتحدي الشرطي الذكي (=IF)",
      description: "الخلية A1 ممتازة وتحتوي القيمة الرقمية 30. نريد كتابة معادلة IF للتحقق إذا كانت قيمة الخلية A1 أكبر من 20، إرجاع الكلمة 'ناجح' وغير ذلك إرجاع 'راسب'.",
      previewGrid: { A1: '30' },
      expectedAnswers: [
        `=IF(A1>20, "ناجح", "راسب")`,
        `=IF(A1>20, 'ناجح', 'راسب')`,
        `=IF(A1>20, "ناجح", "راسب")`
      ],
      expectedOutput: "ناجح",
      hint: "تأكد من هيكلIF والفاصلة واقتباس الكلمات بدقة!"
    }
  ];

  const currentChallenge = challengesList[currentChallengeIndex];

  const handleRunPlayground = () => {
    vibrate(HAPITCS.SUCCESS);
    const out = parseAndEvaluateFormula(playgroundFormulaInput, playgroundGrid);
    setComputedOutput(out);
  };

  const handleCheckChallenge = async () => {
    const inputClean = challengeFormulaInput.trim().toUpperCase().replace(/\s/g, '');
    let isCorrect = false;

    // Check against expected formulas (simplified regex comparison)
    for (const exp of currentChallenge.expectedAnswers) {
      const expClean = exp.toUpperCase().replace(/\s/g, '').replace(/['"]/g, '"');
      const normalizedInput = challengeFormulaInput.toUpperCase().replace(/\s/g, '').replace(/['"]/g, '"');
      if (normalizedInput === expClean) {
        isCorrect = true;
        break;
      }
    }

    // fallback evaluate verification
    if (!isCorrect) {
      const evalOut = parseAndEvaluateFormula(challengeFormulaInput, currentChallenge.previewGrid);
      if (evalOut === currentChallenge.expectedOutput) {
        isCorrect = true;
      }
    }

    if (isCorrect) {
      vibrate(HAPITCS.SUCCESS);
      confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
      setChallengeFeedback({
        status: 'success',
        msg: `إجابة عبقرية! تم إيجاد الصيغة وتطابقت النتيجة المتوقعة: ${currentChallenge.expectedOutput} (+15 XP)`
      });
      if (!completedChallenges.includes(currentChallenge.id)) {
        setCompletedChallenges(prev => [...prev, currentChallenge.id]);
        try {
          if (user) {
            const currentGData = user.gameData || { xp: 0, fuel: 100, keys: 0, lastReflectionDate: "" };
            const updatedGData = {
              ...currentGData
            };
            await db.userSettings.update(user.id, { gameData: updatedGData });
          }
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      vibrate(HAPITCS.MAJOR_CLICK);
      setChallengeFeedback({
        status: 'error',
        msg: `الصيغة لم تسفر عن النتيجة المطلوبة بعد. راجع المعادلة وجرب رمز الـ = ولا تنسى الفواصل.`
      });
    }
  };

  const handleNextChallenge = () => {
    vibrate(HAPITCS.SUCCESS);
    setChallengeFormulaInput('');
    setChallengeFeedback({ status: 'idle', msg: '' });
    setCurrentChallengeIndex((prev) => (prev + 1) % challengesList.length);
  };

  const saveCellEdit = () => {
    if (editingCell) {
      setPlaygroundGrid(prev => ({ ...prev, [editingCell]: editVal }));
      setEditingCell(null);
    }
  };

  if (!visible) return null;

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-[#020617] via-slate-900 to-indigo-950 text-white font-sans p-6 overflow-y-auto"
      style={{ zIndex: 500000 }}
      dir="rtl"
    >
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl w-full mx-auto flex flex-col h-full min-h-[85vh] relative z-10 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#10b981]/20 flex items-center justify-center border border-[#10b981]/30 text-[#10b981] shadow-lg shadow-[#10b981]/10">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                لوحة إتقان Google Sheets 📊
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg">مسار احترافي</span>
              </h1>
              <p className="text-xs text-indigo-200 mt-1">تعلم أساسيات الجداول الحسابية، جرب الدوال تلقائياً، وحل التحديات لامتلاك مهارة مهنية فريدة.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {user && (
              <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black">التحصيل الحالي: {(user.gameData?.xp || 0)} XP</span>
              </div>
            )}
            <button
              onClick={onHide}
              className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 active:scale-95 text-indigo-400 group cursor-pointer shadow-sm ml-auto sm:ml-0"
              title="إغلاق اللوحة"
            >
              <i className="pi pi-times text-sm group-hover:rotate-90 transition-transform duration-300"></i>
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => { vibrate(HAPITCS.SUCCESS); setActiveTab('lessons'); }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'lessons' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <BookOpen className="w-4 h-4" />
            <span>الدروس المنهجية (Capsules)</span>
          </button>
          <button 
            onClick={() => { vibrate(HAPITCS.SUCCESS); setActiveTab('playground'); }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'playground' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span>مختبر خلايا التجريب المفتوح</span>
          </button>
          <button 
            onClick={() => { vibrate(HAPITCS.SUCCESS); setActiveTab('shortcuts'); }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'shortcuts' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <Keyboard className="w-4 h-4" />
            <span>قاموس اختصارات الكيبورد</span>
          </button>
          <button 
            onClick={() => { vibrate(HAPITCS.SUCCESS); setActiveTab('challenges'); }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'challenges' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <Trophy className="w-4 h-4" />
            <span>سيناريوهات وتحديات التقييم</span>
          </button>
        </div>

        {/* Dynamic Tab Panels */}
        <div className="flex-1 bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
          
          {/* TAB 1: Lessons */}
          {activeTab === 'lessons' && (
            <div className="space-y-6 animate-fade-in text-right">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-black text-white">الدروس والكبسولات التعليمية للجداول</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {lessons.map((les) => (
                  <div key={les.id} className="bg-slate-900/60 rounded-3xl border border-white/10 p-5 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-white">{les.title}</h3>
                        <span className="text-[10px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2 py-1 rounded-lg">
                          +{les.xp} XP
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-semibold">{les.description}</p>
                    </div>

                    {/* Fake Video/Graphic Simulation Dashboard */}
                    <div className="w-full h-32 bg-slate-950/80 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-all" />
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/40 group-hover:scale-115 transition-transform duration-300 shadow-lg cursor-pointer">
                        <i className="pi pi-play text-xs" />
                      </div>
                      <span className="text-[10px] font-black mt-3 text-slate-400">{les.videoPlaceholder}</span>
                    </div>

                    <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-1.5 text-[11px] text-indigo-100 font-bold leading-relaxed">
                      <div className="flex items-center gap-1 text-indigo-300 font-black mb-1">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>نصيحة وخبرة عملية:</span>
                      </div>
                      {les.tips.map((tip, idx) => (
                        <p key={idx} className="flex gap-1">
                          <span>•</span>
                          <span>{tip}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Spreadsheet Playground */}
          {activeTab === 'playground' && (
            <div className="space-y-6 animate-fade-in text-right">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 gap-3">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-black text-white">مختبر التجريب والمحاكاة المباشرة</h2>
                </div>
                <p className="text-xs text-slate-400 font-semibold">تعديل قيم أي خلية بنقرة مزدوجة لملاحظة الناتج الحسابي.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Visual Sheet Grid Container */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-slate-950 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/10 text-[10px] text-indigo-200 font-black flex items-center justify-between">
                      <span>ورقة عمل 1 -- لغرض التجربة</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    {/* Standard Table Layout */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-xs text-center font-mono">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10">
                            <th className="py-2.5 border-r border-white/10 w-12 text-slate-500 font-sans font-black text-[10px]">#</th>
                            <th className="py-2.5 border-r border-white/10 text-slate-400 font-black">A</th>
                            <th className="py-2.5 border-r border-white/10 text-slate-400 font-black">B</th>
                            <th className="py-2.5 border-r border-white/10 text-slate-400 font-black">C</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[1, 2, 3].map((rowIdx) => (
                            <tr key={rowIdx} className="border-b border-white/5 hover:bg-white/2">
                              <td className="py-3 bg-white/3 border-r border-white/10 font-sans font-black text-slate-500 text-[10px]">{rowIdx}</td>
                              {['A', 'B', 'C'].map((col) => {
                                const id = `${col}${rowIdx}`;
                                const val = playgroundGrid[id] || '';
                                return (
                                  <td 
                                    key={id} 
                                    onDoubleClick={() => {
                                      setEditingCell(id);
                                      setEditVal(val);
                                    }}
                                    className="p-2 border-r border-white/5 h-10 w-1/3 text-indigo-100 font-extrabold font-mono hover:bg-indigo-500/10 transition-colors cursor-pointer select-none"
                                  >
                                    {editingCell === id ? (
                                      <input 
                                        type="text"
                                        value={editVal}
                                        onChange={(e) => setEditVal(e.target.value)}
                                        onBlur={saveCellEdit}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveCellEdit();
                                          if (e.key === 'Escape') setEditingCell(null);
                                        }}
                                        className="w-full p-1 bg-indigo-950 text-white font-mono font-black border border-indigo-400 rounded outline-none text-center text-xs"
                                        autoFocus
                                      />
                                    ) : (
                                      <span>{val}</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex gap-2.5 text-[11px] font-bold text-slate-300">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>انقر مرتين على أي خلية لتعديل محتواها أو الأرقام بداخلها لملاحظة النتائج. جرب تعويض أرقام مختلفة لملاحظة كيف أن الصيغة تتفعل وتجمع المدى فورياً!</span>
                  </div>
                </div>

                {/* Live Formula computation Sandbox */}
                <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                  <div className="bg-indigo-950/40 p-5 rounded-2xl border border-indigo-500/20 space-y-4">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-extrabold text-xs">
                      <Sparkles className="w-4 h-4 animate-spin-slow text-indigo-400" />
                      <span>مهندس المعادلات السلس</span>
                    </div>

                    <div className="space-y-1.5 text-right">
                      <label className="text-[10px] text-indigo-200 font-black">شريط الصيغ والصيغة (Formula bar)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={playgroundFormulaInput}
                          onChange={(e) => setPlaygroundFormulaInput(e.target.value)}
                          placeholder="مثال: =SUM(A1:C1)"
                          className="flex-1 p-3.5 bg-slate-950 text-emerald-400 font-mono font-black border border-white/10 rounded-xl outline-none focus:border-indigo-400 text-xs text-left"
                        />
                        <button
                          onClick={handleRunPlayground}
                          className="px-4 bg-indigo-600 hover:bg-indigo-500 transition-all text-white font-black rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1"
                        >
                          <CornerDownLeft className="w-3.5 h-3.5" />
                          <span>احسب</span>
                        </button>
                      </div>
                    </div>

                    <div className="h-px bg-white/5 my-4" />

                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block font-bold">الخلية الناتجة المستهدفة</span>
                        <span className="text-xs font-black text-indigo-300 font-sans">تحديث تلقائي</span>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-right flex items-center gap-4">
                        <div>
                          <span className="text-[9px] text-emerald-400 block font-black uppercase tracking-widest">القيمة الحسابية</span>
                          <span className="text-base font-black font-mono text-emerald-300">{computedOutput}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase font-black tracking-wider text-slate-400">صيغ للاقتباس والتجربة:</h4>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <button 
                        onClick={() => { setPlaygroundFormulaInput('=SUM(A1:C1)'); setPlaygroundFormulaInput('=SUM(A1:C1)'); }}
                        className="bg-white/3 hover:bg-white/6 p-2 rounded-lg text-right font-mono text-[10px] text-slate-300 border border-white/5 cursor-pointer block"
                      >
                        =SUM(A1:C1) <span className="text-indigo-300 text-[9px] mr-2">(جمع الصف الأول بالكامل)</span>
                      </button>
                      <button 
                        onClick={() => setPlaygroundFormulaInput('=AVERAGE(A1:A3)')}
                        className="bg-white/3 hover:bg-white/6 p-2 rounded-lg text-right font-mono text-[10px] text-slate-300 border border-white/5 cursor-pointer block"
                      >
                        =AVERAGE(A1:A3) <span className="text-indigo-300 text-[9px] mr-2">(متوسط قيم عمود A)</span>
                      </button>
                      <button 
                        onClick={() => setPlaygroundFormulaInput('=CONCATENATE(A2, " هو ", B2)')}
                        className="bg-white/3 hover:bg-white/6 p-2 rounded-lg text-right font-mono text-[10px] text-slate-300 border border-white/5 cursor-pointer block"
                      >
                        =CONCATENATE(A2, " هو ", B2) <span className="text-indigo-300 text-[9px] mr-2">(دمج النصوص وعمود الوصف)</span>
                      </button>
                      <button 
                        onClick={() => setPlaygroundFormulaInput('=IF(A1 > B1, "A كبير", "B كبير")')}
                        className="bg-white/3 hover:bg-white/6 p-2 rounded-lg text-right font-mono text-[10px] text-slate-300 border border-white/5 cursor-pointer block"
                      >
                        =IF(A1 &gt; B1, "A كبير", "B كبير") <span className="text-indigo-300 text-[9px] mr-2">(شروط وقواعد منطقية)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Shortcuts Quick-reference */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-6 animate-fade-in text-right">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 gap-3">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-black text-white">قاموس مصغرات الاختصارات المهنية</h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold ml-1">تنسيق الاختصارات لـ:</span>
                  <div className="bg-slate-900 p-0.5 rounded-lg border border-white/10 flex">
                    <button 
                      onClick={() => setShortcutOS('win')}
                      className={`px-3 py-1 rounded text-[10px] font-black transition-all cursor-pointer ${shortcutOS === 'win' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Windows
                    </button>
                    <button 
                      onClick={() => setShortcutOS('mac')}
                      className={`px-3 py-1 rounded text-[10px] font-black transition-all cursor-pointer ${shortcutOS === 'mac' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Mac OS
                    </button>
                  </div>
                </div>
              </div>

              {/* Search input bar */}
              <div className="relative">
                <Search className="absolute right-4 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={shortcutSearch}
                  onChange={(e) => setShortcutSearch(e.target.value)}
                  placeholder="ابحث بالاسم، فئة الاختصار، أو المفاتيح..."
                  className="w-full p-3.5 pr-11 bg-slate-950 border border-white/10 rounded-xl font-bold md:text-sm text-slate-200 outline-none focus:border-indigo-500 placeholder-slate-500"
                />
              </div>

              {/* Shortcuts Results List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar pt-1">
                {filteredShortcuts.length > 0 ? filteredShortcuts.map((sh, idx) => (
                  <div key={idx} className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between gap-4">
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-indigo-300 font-black mb-1 inline-block">
                        {sh.cat}
                      </span>
                      <p className="text-xs text-slate-300 font-bold">{sh.desc}</p>
                    </div>
                    
                    <kbd className="px-3 py-2 bg-slate-950 border border-white/10 rounded-xl font-mono text-xs font-black text-emerald-400 shadow-inner shrink-0 text-center">
                      {shortcutOS === 'win' ? sh.win : sh.mac}
                    </kbd>
                  </div>
                )) : (
                  <div className="col-span-2 text-center py-10 text-slate-500">
                    لا توجد اختصارات مطابقة لبحثك الحالي.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Scenario-based challenges */}
          {activeTab === 'challenges' && (
            <div className="space-y-6 animate-fade-in text-right">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <h2 className="text-lg font-black text-white">الغرفة التفاعلية للاختبار والتقييم الحسابي</h2>
                </div>

                <div className="flex items-center gap-2">
                  {challengesList.map((ch, idx) => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        vibrate(HAPITCS.SUCCESS);
                        setCurrentChallengeIndex(idx);
                        setChallengeFormulaInput('');
                        setChallengeFeedback({ status: 'idle', msg: '' });
                      }}
                      className={`w-7 h-7 rounded-lg text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
                        currentChallengeIndex === idx 
                          ? 'bg-indigo-600 text-white shadow-lg' 
                          : completedChallenges.includes(ch.id)
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white/5 hover:bg-white/10 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Challenge Details and Sandbox Input */}
                <div className="md:col-span-7 space-y-4">
                  <div className="bg-indigo-950/20 border border-indigo-500/20 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-300">تحدي رقم {currentChallengeIndex + 1} من {challengesList.length}</span>
                      {completedChallenges.includes(currentChallenge.id) && (
                        <span className="text-[10px] font-black bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>التحدي مروّض ومجتاز!</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-black text-white">{currentChallenge.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold">{currentChallenge.description}</p>
                  </div>

                  {/* Challenge grid preview */}
                  <div className="bg-slate-950 rounded-2xl border border-white/5 p-4 overflow-hidden">
                    <span className="text-[10px] text-slate-400 block font-black mb-2">معاينة ورقة العمل المستهدفة بالتحدي:</span>
                    <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs text-indigo-300">
                      {Object.entries(currentChallenge.previewGrid).map(([cell, keyVal]) => (
                        <div key={cell} className="bg-white/4 p-3.5 rounded-xl border border-white/10">
                          <span className="text-[9px] text-slate-500 block font-sans font-black">{cell}</span>
                          <span className="font-black">{keyVal}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* formula typing section */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-200">الصيغة المطلوبة (Formula bar)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={challengeFormulaInput}
                        onChange={(e) => setChallengeFormulaInput(e.target.value)}
                        placeholder="مثال: =SUM(A1:A3)"
                        className="flex-1 p-3.5 bg-slate-950 border border-white/10 rounded-xl text-emerald-400 font-mono text-xs font-black outline-none focus:border-indigo-500 text-left"
                      />
                      <button
                        onClick={handleCheckChallenge}
                        className="px-6 bg-indigo-600 hover:bg-indigo-500 transition-all font-black text-xs text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <i className="pi pi-check" />
                        <span>تقييم</span>
                      </button>
                    </div>
                  </div>

                  {/* Feedback panel */}
                  <AnimatePresence mode="wait">
                    {challengeFeedback.status !== 'idle' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-xl border text-xs font-semibold leading-relaxed flex items-start gap-2 ${
                          challengeFeedback.status === 'success' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                        }`}
                      >
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{challengeFeedback.msg}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Info side advice / hint caps */}
                <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                  <div className="bg-white/3 p-5 rounded-2xl border border-white/5 space-y-3.5">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-extrabold text-xs">
                      <HelpIcon className="w-4 h-4" />
                      <span>تلميحات الحل والمصطلحات:</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold">{currentChallenge.hint}</p>
                    
                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl text-[10px] text-indigo-200 leading-loose">
                      <span className="font-black block text-indigo-300 mb-1">النمط المستهدف:</span>
                      1. ابدأ الصيغة دائماً بالرمز =<br/>
                      2. اكتب أسماء الدوال والخرائط بأحرف لاتينية كبيرة (مثل SUM, AVERAGE, IF)<br/>
                      3. راعِ كتابة المدى بشكل كامل ومغلق بقوسين.
                    </div>
                  </div>

                  <button
                    onClick={handleNextChallenge}
                    className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 hover:border-indigo-400 transition-all text-indigo-300 border border-white/10 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>تخطي والسيناريو التالي</span>
                    <i className="pi pi-angle-left" />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
