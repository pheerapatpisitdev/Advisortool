/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './data.js'],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        border: 'hsl(60 3% 8%)',
        input: 'hsl(60 3% 8%)',
        ring: 'hsl(14 64% 60%)',
        background: 'hsl(48 33% 97%)',
        foreground: 'hsl(60 3% 8%)',
        primary: { DEFAULT: 'hsl(14 64% 60%)', foreground: 'hsl(48 33% 97%)' },
        secondary: { DEFAULT: 'hsl(211 48% 61%)', foreground: 'hsl(48 33% 97%)' },
        destructive: { DEFAULT: 'hsl(0 84.2% 60.2%)', foreground: 'hsl(0 0% 98%)' },
        muted: { DEFAULT: 'hsl(45 25% 89%)', foreground: 'hsl(60 3% 8%)' },
        accent: { DEFAULT: 'hsl(85 20% 46%)', foreground: 'hsl(48 33% 97%)' },
        popover: { DEFAULT: 'hsl(48 33% 98%)', foreground: 'hsl(60 3% 8%)' },
        card: { DEFAULT: 'hsl(48 33% 98%)', foreground: 'hsl(60 3% 8%)' },
        brand: {
          ink: '#141413', 'ink-light': '#2a2a28', cream: '#faf9f5', gray: '#e8e6dc',
          orange: '#d97757', 'orange-dark': '#c96848', blue: '#6a9bcc', 'blue-dark': '#5a8abb',
          'blue-deep': '#1a2535', green: '#788c5d', 'green-dark': '#6a7d50',
        },
      },
      borderRadius: { lg: '0.5rem', md: 'calc(0.5rem - 2px)', sm: 'calc(0.5rem - 4px)' },
      fontFamily: { body: ['Google Sans', 'sans-serif'], headline: ['Google Sans', 'sans-serif'] },
    },
  },
  safelist: [
    // ---- plan header gradient/bg styles (planHeaderStyles) ----
    'bg-gradient-to-b', 'bg-gradient-to-r',
    'from-brand-blue', 'to-brand-blue-dark', 'from-brand-blue-deep',
    'from-brand-orange', 'to-brand-orange-dark',
    'from-brand-green', 'to-brand-green-dark',
    'from-brand-ink', 'to-brand-blue', 'to-brand-blue-deep',
    'from-background', 'to-muted',
    'bg-brand-gray', 'bg-brand-cream', 'bg-brand-ink', 'bg-brand-ink-light',
    'bg-brand-orange', 'bg-brand-blue', 'bg-brand-green',
    'text-brand-ink', 'text-brand-cream', 'text-white',
    // ---- benefit cell conditional bg (cellBgClass) ----
    'bg-background', 'bg-card', 'bg-muted', 'bg-muted/50', 'bg-background/80', 'bg-background/90', 'bg-background/95',
    // ---- as-incurred / not-covered styling ----
    'text-accent', 'text-foreground', 'text-muted-foreground',
    'text-muted-foreground/80', 'text-muted-foreground/90',
    // ---- gender button active/inactive states ----
    'border-primary', 'bg-primary', 'text-primary-foreground', 'hover:bg-primary/90',
    'border-border/60', 'border-border/40', 'text-primary',
    'hover:bg-muted', 'hover:bg-brand-green-dark', 'hover:bg-brand-blue-dark', 'hover:bg-brand-ink-light',
    // ---- badge / destructive toast ----
    'bg-destructive', 'bg-brand-green',
    // ---- conditional text sizes used in cells ----
    'text-[8px]', 'text-[9px]', 'text-[10px]', 'text-[11px]', 'text-[26px]',
    'sm:text-[9px]', 'sm:text-[10px]', 'sm:text-xs',
    'md:text-sm', 'md:text-base', 'md:text-lg', 'md:text-xl', 'md:text-[26px]',
    // ---- borders used conditionally ----
    'border-l', 'border-r', 'border-white/20', 'border-border/60', 'border-border/40',
    'ring-1', 'ring-black/5',
  ],
  plugins: [],
};
