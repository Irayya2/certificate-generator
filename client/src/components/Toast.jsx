import React, { useEffect, useState } from 'react';

/**
 * Toast — Inline success/error notification banner.
 * Auto-dismisses after `duration` ms if provided.
 *
 * @param {{ success: boolean, message: string }|null} result
 * @param {number} duration - ms before auto-dismiss (0 = no auto-dismiss)
 * @param {Function} onDismiss - callback when dismissed
 */
export default function Toast({ result, duration = 5000, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!result) {
      setVisible(false);
      return;
    }
    setVisible(true);
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [result, duration, onDismiss]);

  if (!visible || !result) return null;

  const isSuccess = result.success;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm font-medium
        border animate-fade-in-up shadow-sm
        ${isSuccess
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
        }
      `}
    >
      <span className="flex-shrink-0 mt-0.5">
        {isSuccess ? (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )}
      </span>

      <span className="flex-1">{result.message}</span>

      <button
        onClick={() => { setVisible(false); onDismiss?.(); }}
        className="flex-shrink-0 ml-auto text-current opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
