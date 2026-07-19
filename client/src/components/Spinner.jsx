import React from 'react';

/**
 * Spinner — Animated loading indicator.
 * @param {string} size  - 'sm' | 'md' | 'lg'
 * @param {string} color - Tailwind color class for stroke (default: white)
 */
export default function Spinner({ size = 'md', color = 'white' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  return (
    <svg
      className={`${sizes[size]} animate-spin`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill={color}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
