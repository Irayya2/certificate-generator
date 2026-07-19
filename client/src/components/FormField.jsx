import React from 'react';

/**
 * FormField — Reusable text/email/date input with icon, label, and error state.
 *
 * @param {string}   label       - Field label text
 * @param {string}   name        - input name attribute
 * @param {string}   type        - input type (text | email | date | tel)
 * @param {string}   value       - controlled value
 * @param {Function} onChange    - change handler
 * @param {string}   placeholder - placeholder text
 * @param {string}   error       - error message (or empty/undefined)
 * @param {boolean}  required    - marks field as required visually
 * @param {ReactNode} icon       - Heroicon element to display inside the field
 */
export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error,
  required = false,
  icon,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-sm font-semibold text-slate-700 flex items-center gap-1"
      >
        {label}
        {required && <span className="text-red-500 text-xs">*</span>}
      </label>

      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5 flex items-center">
            {icon}
          </span>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-describedby={error ? `${name}-error` : undefined}
          aria-invalid={!!error}
          className={`
            w-full rounded-xl border bg-white py-3 pr-4 text-sm text-slate-800
            placeholder-slate-400 transition-all duration-200 input-ring
            ${icon ? 'pl-10' : 'pl-4'}
            ${error
              ? 'border-red-400 bg-red-50 focus:border-red-400'
              : 'border-slate-200 hover:border-slate-300 focus:border-green-500'
            }
          `}
        />
      </div>

      {error && (
        <p
          id={`${name}-error`}
          className="text-xs text-red-500 flex items-center gap-1 animate-fade-in-up"
          role="alert"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
