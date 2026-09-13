import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DiscardConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DiscardConfirmModal: React.FC<DiscardConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Discard & Exit',
  cancelLabel = 'Keep Playing',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      id="discard-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        id="discard-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="discard-modal-title"
        aria-describedby="discard-modal-description"
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-slate-900 text-left"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3
          id="discard-modal-title"
          className="text-xl font-bold font-['Outfit'] text-slate-950 mb-2"
        >
          {title}
        </h3>

        <p
          id="discard-modal-description"
          className="text-sm text-slate-600 leading-relaxed mb-6"
        >
          {message}
        </p>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            id="discard-modal-cancel-btn"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-3 min-h-[44px] rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {cancelLabel}
          </button>

          <button
            id="discard-modal-confirm-btn"
            onClick={onConfirm}
            className="w-full sm:w-auto px-5 py-3 min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
