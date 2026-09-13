import React, { useState } from 'react';
import { User, UserX, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { ParticipantIdentity } from '../types';

interface IdentityViewProps {
  onSelectIdentity: (identity: ParticipantIdentity) => void;
  onBack: () => void;
  initialName?: string | null;
}

export const IdentityView: React.FC<IdentityViewProps> = ({
  onSelectIdentity,
  onBack,
  initialName = '',
}) => {
  const [name, setName] = useState(initialName || '');
  const [hasInteracted, setHasInteracted] = useState(false);

  const trimmedName = name.trim();
  const isValidName = trimmedName.length >= 2 && trimmedName.length <= 40;
  const isTooShort = hasInteracted && trimmedName.length < 2;
  const isTooLong = trimmedName.length > 40;

  const handleNamedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasInteracted(true);
    if (isValidName) {
      onSelectIdentity({
        type: 'named',
        displayName: trimmedName,
      });
    }
  };

  const handleAnonymousSubmit = () => {
    onSelectIdentity({
      type: 'anonymous',
      displayName: null,
    });
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div
        id="identity-card"
        className="w-full bg-white rounded-3xl p-6 sm:p-10 shadow-2xl shadow-blue-950/40 text-slate-900 border border-slate-100"
      >
        {/* Navigation back */}
        <button
          id="identity-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl px-3 py-2.5 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Copy from spec */}
        <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-bold">
          Step 1 of 2 · Participant Identity
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Outfit'] text-slate-950 mb-2">
          Claim your score — or keep them guessing.
        </h2>

        <p className="text-sm sm:text-base text-slate-600 mb-8 leading-relaxed">
          Choose whether Forsyth and your friends will see your name on the challenge board, or play
          undercover as Anonymous.
        </p>

        {/* Form for Named Participant */}
        <form onSubmit={handleNamedSubmit} className="space-y-4 mb-6">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="participant-name-input"
                className="block text-sm font-bold text-slate-800"
              >
                Your Name or Nickname
              </label>
              <span
                className={`text-xs ${
                  isTooLong
                    ? 'text-red-500 font-bold'
                    : 'text-slate-600'
                }`}
              >
                {trimmedName.length} / 40
              </span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                id="participant-name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!hasInteracted) setHasInteracted(true);
                }}
                maxLength={40}
                placeholder="e.g. Jason, Aunty Folake, Chidi"
                className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border text-slate-900 placeholder:text-slate-400 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 ${
                  isTooShort || isTooLong
                    ? 'border-red-500 focus-visible:ring-red-200 bg-red-50/20'
                    : 'border-slate-300 focus-visible:ring-blue-200 focus-visible:border-blue-600 bg-white'
                }`}
                aria-invalid={isTooShort || isTooLong}
                aria-describedby="name-input-feedback"
              />
            </div>

            {/* Error or guidance text */}
            <div id="name-input-feedback" role="status" aria-live="polite" className="mt-1.5 min-h-[20px]">
              {isTooShort && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {trimmedName.length === 0
                    ? 'Please enter a name (at least 2 characters; whitespace does not count).'
                    : 'Name must be at least 2 characters.'}
                </p>
              )}
              {isTooLong && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Name cannot exceed 40 characters.
                </p>
              )}
              {!isTooShort && !isTooLong && (
                <p className="text-xs text-slate-600">
                  2 to 40 characters. This name will appear on your results card.
                </p>
              )}
            </div>
          </div>

          {/* Submit with name */}
          <button
            id="identity-submit-named-btn"
            type="submit"
            disabled={!isValidName}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px] ${
              isValidName
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 focus-visible:ring-4 focus-visible:ring-blue-300'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <span>Play as {trimmedName || 'Named Participant'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-wider text-slate-400">
            or go undercover
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Anonymous button */}
        <button
          id="identity-continue-anon-btn"
          type="button"
          onClick={handleAnonymousSubmit}
          className="w-full py-3.5 px-6 rounded-2xl border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer focus-visible:ring-4 focus-visible:ring-slate-300 min-h-[48px]"
        >
          <UserX className="w-5 h-5 text-slate-500" />
          <span>Continue as Anonymous</span>
        </button>

        <p className="text-xs text-slate-600 text-center mt-4">
          Anonymous means no participant name is collected or displayed.
        </p>
      </div>
    </div>
  );
};
