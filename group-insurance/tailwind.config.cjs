/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './app.js', './data.js', './translations.js'],
  theme: {
    extend: {
      colors: {
        teal: {
          100: '#cfe0da', 200: '#a9c2b9', 300: '#82a497',
          400: '#5f7f74', 500: '#4f7064', 600: '#3f5e52',
          700: '#2f4a3d', 800: '#2a473d', 900: '#1f3329',
        },
      },
      keyframes: {
        'slide-up': { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: { 'slide-up': 'slide-up 0.4s ease-out both' },
    },
  },
  safelist: [
    // ---- sidebar nav active / inactive states (built via ternary) ----
    'bg-teal-600/80', 'border-teal-400', 'border-l-4', 'border-transparent',
    'bg-teal-500', 'bg-teal-700/60', 'text-teal-100', 'text-teal-200', 'text-teal-300',
    'text-teal-400', 'hover:bg-teal-700/50', 'hover:text-white', 'border-teal-700/80',
    'border-teal-600', 'bg-teal-700', 'bg-teal-800', 'border-teal-600/30',
    // ---- language toggle ----
    'bg-teal-600', 'hover:bg-slate-100', 'hover:bg-slate-50',
    // ---- plan / rider buttons (conditional active/disabled) ----
    'text-white', 'shadow-sm', 'bg-white', 'border-slate-200', 'text-slate-600',
    'hover:border-teal-300', 'hover:border-slate-300',
    'opacity-40', 'cursor-not-allowed', 'bg-slate-50', 'border-slate-100', 'text-slate-400',
    // ---- row striping (interpolated i % 2) ----
    'bg-slate-50/60', 'bg-white',
    // ---- business-type level badges ----
    'bg-emerald-100', 'text-emerald-800',
    'bg-teal-100', 'text-teal-800',
    'bg-amber-100', 'text-amber-800',
    'bg-red-100', 'text-red-800',
    // ---- warning / amber callout ----
    'bg-amber-400/20', 'border-amber-300/40', 'text-amber-100',
    // ---- quote action buttons primary/secondary ----
    'hover:opacity-90', 'border-slate-300', 'text-slate-700',
    // ---- sidebar overlay open/closed ----
    'opacity-100', 'opacity-0', 'pointer-events-none', 'translate-x-0', '-translate-x-full',
    'text-teal-700', 'hover:text-teal-700', 'hover:border-teal-400',
  ],
};
