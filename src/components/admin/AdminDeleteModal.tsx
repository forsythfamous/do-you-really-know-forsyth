import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { QuizSubmission } from '../../types';

interface AdminDeleteModalProps {
  submission: QuizSubmission | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (submissionId: string) => Promise<void>;
}

export const AdminDeleteModal: React.FC<AdminDeleteModalProps> = ({
  submission,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !submission) return null;

  const participantLabel =
    submission.participantType === 'anonymous' ? 'Anonymous' : submission.displayName || 'Unnamed Participant';

  const hasReflections =
    submission.reflections && Object.keys(submission.reflections).length > 0;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirmDelete(submission.submissionId);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete submission. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-md bg-slate-900 border border-red-900/40 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-2xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title & Body */}
        <div>
          <h2 id="delete-modal-title" className="text-lg font-bold font-['Outfit'] text-white">
            Permanently Delete Submission?
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            You are about to delete the quiz submission for{' '}
            <strong className="text-slate-200">{participantLabel}</strong> ({submission.submissionId}).
          </p>
        </div>

        {/* Warning details */}
        <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-900/40 text-red-200 text-xs space-y-1.5 leading-relaxed">
          <p className="font-semibold text-red-300">Atomic Deletion Notice:</p>
          <ul className="list-disc pl-4 space-y-1 text-red-300/90 text-[11px]">
            <li>All scored quiz answers and tier calculations will be purged.</li>
            {hasReflections ? (
              <li>
                <strong>All associated Honest Room reflections will be permanently removed.</strong>
              </li>
            ) : (
              <li>Any recorded reflection status will be purged.</li>
            )}
            <li>Dashboard analytics will update immediately.</li>
            <li>This action is irreversible.</li>
          </ul>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-800">
            {error}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            id="admin-delete-cancel-btn"
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            Cancel
          </button>
          <button
            id="admin-delete-confirm-btn"
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
