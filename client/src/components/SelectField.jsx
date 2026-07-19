import React from 'react';

/**
 * SelectField — Reusable dropdown select with icon, label, and error state.
 *
 * @param {string}   label    - Field label
 * @param {string}   name     - select name attribute
 * @param {string}   value    - controlled value
 * @param {Function} onChange - change handler
 * @param {string}   error    - error message
 * @param {boolean}  required - marks field required visually
 * @param {ReactNode} icon    - icon element
 * @param {Array}    options  - [{ value, label }]
 * @param {string}   placeholder - default empty option text
 */
export default function SelectField({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  icon,
  options = [],
  placeholder = 'Select an option',
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5 flex items-center z-10">
            {icon}
          </span>
        )}

        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          aria-describedby={error ? `${name}-error` : undefined}
          aria-invalid={!!error}
          className={`
            w-full rounded-xl border bg-white py-3 pr-10 text-sm text-slate-800
            transition-all duration-200 cursor-pointer appearance-none input-ring
            ${icon ? 'pl-10' : 'pl-4'}
            ${value === '' ? 'text-slate-400' : 'text-slate-800'}
            ${error
              ? 'border-red-400 bg-red-50 focus:border-red-400'
              : 'border-slate-200 hover:border-slate-300 focus:border-green-500'
            }
          `}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom chevron icon */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
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
