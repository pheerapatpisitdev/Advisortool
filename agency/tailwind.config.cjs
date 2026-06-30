/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './calculator.html',
    './bonus-calculator.html',
    './manager-test.html',
    './agency.js',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
      fontFamily: { sans: ['IBM Plex Sans Thai', 'system-ui', 'sans-serif'] },
    },
  },
  // Classes assembled dynamically in inline scripts / template literals.
  safelist: [
    // hierarchy chart nodes / connectors (commission calculator)
    'bg-primary', 'text-primary-foreground', 'bg-secondary', 'border-primary/20',
    'h-4', 'w-px', 'h-6', 'h-8', 'bg-border', 'z-0', 'z-10',
    'top-[-16px]', 'top-[70px]', 'left-1/2', '-translate-x-1/2', 'w-[calc(100%-200px)]',
    'max-w-48', 'w-48',
    // result / detail cards
    'bg-accent/10', 'bg-primary/10', 'bg-muted/50', 'bg-card/50', 'border-accent', 'border-2',
    'text-accent', 'text-accent-foreground', 'text-primary', 'text-foreground', 'text-muted-foreground',
    'h-16', 'h-px',
    // tab active / gender / switch states handled via [data-*] in inline <style>; utilities used in markup:
    'hidden', 'flex',
    // quiz radio dots use .rg-item (custom CSS), no TW classes needed
    'hover:bg-secondary/20', 'hover:bg-secondary/40', 'hover:bg-secondary/50', 'hover:bg-accent/90',
    'hover:bg-primary/90', 'bg-destructive', 'text-destructive-foreground', 'hover:bg-destructive/90',
    'text-destructive',
  ],
};
