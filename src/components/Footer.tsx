import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 mt-auto border-t border-slate-800/60 bg-[#070D1E]/80 text-center text-xs text-slate-400">
      <div className="max-w-[720px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Deterministic scoring · Honest answers stay private</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
          <span>for Forsyth</span>
        </div>
      </div>
    </footer>
  );
};
