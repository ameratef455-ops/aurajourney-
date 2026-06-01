import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronLeft, ExternalLink } from "lucide-react";
import { vibrate, HAPITCS } from "../lib/haptics";

interface Ad {
  id: string;
  title: string;
  text: string;
  imageUrl?: string;
  link?: string;
  position: 'top' | 'bottom';
  isActive: boolean;
}

interface AdsCarouselProps {
  ads: Ad[];
}

export function AdsCarousel({ ads }: AdsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (ads.length <= 1) {
      setCurrentIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000); // Cycle ads every 5 seconds
    return () => clearInterval(interval);
  }, [ads.length]);

  if (ads.length === 0) return null;

  const handleNext = () => {
    vibrate(HAPITCS.MINOR_CLICK);
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  const handlePrev = () => {
    vibrate(HAPITCS.MINOR_CLICK);
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const ad = ads[currentIndex];

  return (
    <div className="ads-card w-full max-w-2xl mx-auto my-4 bg-white border border-slate-100 rounded-[28px] overflow-hidden shadow-sm p-5 relative pointer-events-auto min-h-[160px] flex flex-col justify-between">
      <AnimatePresence mode="wait">
        <motion.div
          key={ad.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="flex flex-col md:flex-row items-center gap-4 w-full"
        >
          {ad.imageUrl && (
            <img 
              src={ad.imageUrl} 
              alt={ad.title} 
              className="w-full md:w-32 h-32 object-cover rounded-2xl select-none shrink-0" 
              referrerPolicy="no-referrer" 
            />
          )}
          <div className="flex-1 text-right w-full" dir="rtl">
            <div className="flex items-center gap-2 mb-1 justify-start">
              <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">إعلان ممول</span>
              <h4 className="font-black text-blue-950 text-sm">{ad.title}</h4>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1.5">{ad.text}</p>
            {ad.link && (
              <a 
                href={ad.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black border border-blue-100 no-underline hover:bg-blue-100 transition-colors"
              >
                <span>مشاهدة المزيد</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls and Pagination dots if there are multiple ads */}
      {ads.length > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50 select-none">
          {/* Chevron Controls for navigation (reversed for RTL Arabic flow) */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrev}
              type="button"
              className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-center text-slate-500 transition active:scale-95 cursor-pointer"
              title="الإعلان السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={handleNext}
              type="button"
              className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-center text-slate-500 transition active:scale-95 cursor-pointer"
              title="الإعلان التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex gap-1.5 justify-center">
            {ads.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  vibrate(HAPITCS.MINOR_CLICK);
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 border-none p-0 cursor-pointer ${
                  currentIndex === idx ? "w-6 bg-blue-600" : "w-1.5 bg-slate-200 hover:bg-slate-300"
                }`}
                title={`الذهاب للإعلان ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
