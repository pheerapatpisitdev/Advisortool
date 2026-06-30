/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        "bg-dark": "#1C1B1A",
        "surface-light": "#F7F5F2",
        "text-primary-light": "#1A1917",
        "text-primary-dark": "#EEEBE6",
        "text-secondary": "#9C9A96",
        "bubble-user-light": "#EDEAE5",
        "border-light": "#D9D5CE",
      },
    },
  },
  // Result-screen color classes are emitted from ternaries in the inline JS.
  // They appear as complete literals, but we safelist them defensively so the
  // dynamic red/orange/green result states never drop styles.
  safelist: [
    'bg-red-500', 'bg-green-500', 'bg-[#D97757]',
    'border-red-500', 'ring-red-200', 'border-red-100',
    'border-orange-500', 'ring-orange-200', 'border-orange-100',
    'border-green-500', 'ring-green-200', 'border-green-100',
    'bg-red-50', 'bg-orange-50', 'bg-green-50',
    'text-red-800', 'text-orange-800', 'text-green-800',
    'text-orange-700', 'text-green-700',
  ],
};
