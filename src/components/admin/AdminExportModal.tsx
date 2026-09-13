import React from 'react';
import { Lock, FileDown, X, ShieldAlert } from 'lucide-react';

interface AdminExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExport: () => void;
  submissionsCount: number;
}

export const AdminExportModal: React.FC<AdminExportModalProps> = ({
  isOpen,
  onClose,
  onConfirmExport,
  submissionsCount,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h2 id="export-modal-title" className="text-lg font-bold font-['Outfit'] text-white">
            Export Private Honest Room Reflections?
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            You are requesting a CSV export of Honest Room free-form responses across{' '}
            <strong className="text-slate-200">{submissionsCount} submissions</strong>.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5 leading-relaxed">
          <p className="font-semibold text-amber-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Confidentiality & Security Notice:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-amber-200/90 text-[11px]">
            <li>Honest Room responses contain intimate thoughts and unfiltered personal notes.</li>
            <li>Formulas and control characters are sanitized to protect against spreadsheet injection.</li>
            <li>Stored files must be protected with appropriate local disk encryption.</li>
            <li>Demo data (if previewed) is automatically excluded from export.</li>
          </ul>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            id="admin-export-cancel-btn"
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
          >
            Cancel
          </button>
          <button
            id="admin-export-confirm-btn"
            type="button"
            onClick={() => {
              onConfirmExport();
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
          >
            <FileDown className="w-4 h-4" />
            <span>Confirm & Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};
