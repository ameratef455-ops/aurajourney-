import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

declare global {
  interface Window {
    YG: any;
    onYouglishAPIReady: () => void;
  }
}

export function YouGlishWidget({ query, language = "english" }: { query: string; language?: string }) {
  return (
    <div className="w-full h-auto min-h-[400px] flex items-center justify-center bg-black/10 rounded-xl border border-white/5">
      <p className="text-slate-500 font-bold">YouGlish is temporarily disabled.</p>
    </div>
  );
}

export function LanguageTools() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [lang, setLang] = useState('english');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(query);
  };

  return (
    <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl mt-6 space-y-6 animate-fade-in" dir="rtl">
      <div className="flex items-center gap-2 text-indigo-900 mb-4">
        <Search className="w-5 h-5 text-indigo-600" />
        <h3 className="text-sm font-black">أداة النطق والاستماع (YouGlish)</h3>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن كلمة للتدرب على نطقها وسماعها..."
          className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm text-slate-800"
        />
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm text-slate-800 bg-white cursor-pointer"
        >
          <option value="english">الإنجليزية</option>
          <option value="spanish">الإسبانية</option>
          <option value="french">الفرنسية</option>
          <option value="german">الألمانية</option>
          <option value="italian">الإيطالية</option>
        </select>
        <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all">
          بحث
        </button>
      </form>

      {activeQuery && (
        <div className="space-y-8 mt-6">
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-rose-700">
               <i className="pi pi-youtube text-xl"></i>
               <h4 className="text-sm font-bold">YouGlish Official Widget</h4>
             </div>
             <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative pt-4 flex justify-center w-full">
                <YouGlishWidget query={activeQuery} language={lang} />
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
