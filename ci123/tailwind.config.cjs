/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './data.js'],
  safelist: [
    // accordion animation (arbitrary grid-template-rows + opacity, toggled in JS)
    'grid-rows-[0fr]',
    'grid-rows-[1fr]',
    'opacity-0',
    'opacity-100',
    'rotate-180',
    // benefit-table / disease-section conditional colors
    'bg-white',
    'bg-gray-50',
    'bg-slate-50',
    'bg-[#dbeafe]',
    'font-bold',
    'font-semibold',
    'text-white',
    'text-[#1b2b7a]',
    'text-[#1f2937]',
    'text-[#1e3a8a]',
    'text-[#1d4ed8]',
    // conditions / examples button active+inactive states
    'border-[#1d4ed8]',
    'bg-[#1d4ed8]',
    'shadow-md',
    'shadow-[#1d4ed8]/25',
    'hover:bg-[#eff4ff]',
    'border-[#1b2b7a]',
    'bg-[#1b2b7a]',
    'shadow-[#1b2b7a]/25',
    'hover:bg-[#eef0f9]',
  ],
  theme: { extend: {} },
  plugins: [],
};
