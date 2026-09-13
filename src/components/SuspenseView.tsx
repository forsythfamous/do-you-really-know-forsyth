import React from 'react';
import { Eye, ArrowRight } from 'lucide-react';

interface SuspenseViewProps {
  onReveal: () => void;
}

export const SuspenseView: React.FC<SuspenseViewProps> = ({ onReveal }) => {
  return (
    <div
      id="suspense-view-card"
      role="region"
      aria-label="Love Questions Intermission"
      className="w-full max-w-xl mx-auto bg-slate-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-800 text-center animate-fade-in"
    >
      <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center mb-6">
        <Eye className="w-7 h-7 text-rose-400" />
      </div>

      <p className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-3 font-['Outfit']">
        Full Challenge Finale • Questions 27 & 28
      </p>

      <h2
        id="suspense-headline"
        className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-['Outfit'] leading-snug tracking-tight mb-4"
      >
        Okay… now for the questions everybody actually came for. 👀
      </h2>

      <p className="text-sm sm:text-base text-slate-300 max-w-md mx-auto mb-8 leading-relaxed">
        Two final questions on romance, connections, and non-negotiables. Each is worth 1 point towards your final score.
      </p>

      <button
        id="suspense-reveal-btn"
        onClick={onReveal}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 min-h-[48px] rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-base font-['Outfit'] shadow-lg shadow-rose-950/50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-rose-400 active:scale-[0.99]"
      >
        <span>Reveal the Questions</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};
