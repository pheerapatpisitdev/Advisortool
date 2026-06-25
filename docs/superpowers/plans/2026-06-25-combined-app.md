# Combined App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge 4 separate web apps (CI123, iHealthyUltra, Global Saving Plus, Group Insurance) into one Next.js 15 app with a single shared navbar and a Hub home page.

**Architecture:** One Next.js 15 (App Router) project. Each source app becomes its own route segment under `app/<name>/` and stays self-contained (its own components/CSS under a private `_src/` folder). The two Vite SPAs are loaded as client-only components via `next/dynamic` with `ssr: false`. Only the navbar + layout + Hub page are shared. CSS is scoped per route to prevent the apps' conflicting global styles from leaking into each other.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS v3 (+ tailwindcss-animate), shadcn/ui (from iHealthyUltra), recharts, chart.js, jspdf, html2canvas, lucide-react.

---

## Pre-Flight: Key Facts (verified from source)

| App | Source path (`/Users/pheerapatpisit/Documents/APP/…`) | Stack | Routing | Port difficulty |
|-----|----|-------|---------|------|
| CI123 | `CI123` | Next.js + TS + Tailwind **v4** | file-based (`app/`, `app/calculator`) | Easy — relative imports, no `@/` |
| iHealthyUltra | `iHealthyUltra` | Next 14 + TS + Tailwind **v3** + shadcn | single page (`app/page.tsx`) | Hard — uses `@/*` alias + shadcn tokens + tailwindcss-animate |
| Global Saving Plus | `Global Saving Plus` | **Vite** + React 19 + TS, no Tailwind | hash (`#calc`/`#docs`), reads `window` at render | Medium — Vite→Next, `ssr:false`, `import.meta.env.BASE_URL` (4 spots), chart.js |
| Group Insurance | `Group Insurance` | **Vite** + React 18 + Tailwind **v3** (JSX/JS) | `useState('health')` internal tabs | Medium — Vite→Next, `ssr:false`, jspdf/html2canvas |

**Target route map:**
- `/` → Hub (4 cards)
- `/ci123` (+ `/ci123/calculator`)
- `/ihealthy`
- `/global-saving`
- `/group-insurance`

### Cross-cutting decisions (locked in during brainstorming + exploration)

1. **Tailwind v3, not v4.** iHealthyUltra depends on shadcn/ui + `tailwindcss-animate` + a `tailwind.config.js` theme — all v3 conventions. CI123 was authored on v4 but only uses standard utility classes, which work identically under v3. The combined app uses ONE Tailwind v3 config whose `content` globs cover all four app folders.
2. **`@/*` alias belongs to iHealthyUltra only.** It is the only app using `@/`. In the combined `tsconfig.json`, map `@/*` → `./app/ihealthy/_src/*`. Shared combined code (Navbar, Hub, layout) uses **relative** imports — never `@/`.
3. **CSS is scoped per route.** Each app sets a conflicting global `body`/`html` background. The root `globals.css` provides ONLY: `@tailwind` directives + the shadcn `:root` CSS variables + a scoped border reset. Each route wraps its content in a `<div className="<app>-scope">` and applies that app's background there.
4. **Browser-only libs load client-side only.** Global Saving (`window.location.hash` at render, chart.js) and Group Insurance (jspdf, html2canvas) are imported via `next/dynamic` with `{ ssr: false }` from a `'use client'` page.
5. **Private folders use `_src/`.** The leading underscore makes Next ignore the folder for routing while still allowing imports.

### Known risks (verify during build/smoke-test, do not pre-fix)
- `recharts` v2 + React 19 peer warnings → pin `recharts@^2.13.0` (first version with React 19 support).
- `react-day-picker@8` peer-warns on React 19 → keep v8, verify the date picker renders; bump to v9 only if it throws.
- CI123 v4-only CSS features (if any) may not compile under v3 → caught by `next build`.
- iHealthyUltra's `body { @apply bg-background }` reset is scoped to `.ihealthy-scope`; if its components assume a global body background, visually verify `/ihealthy`.

---

## File Structure (combined-app/)

```
combined-app/
├─ package.json                 # merged deps, Next 15 / React 19
├─ next.config.js
├─ tsconfig.json                # @/* → ./app/ihealthy/_src/*
├─ postcss.config.js
├─ tailwind.config.js           # v3, shadcn theme, content globs for all apps
├─ .gitignore
├─ app/
│  ├─ layout.tsx                # <html><body> + <Navbar/>
│  ├─ globals.css               # @tailwind + :root tokens + scoped reset
│  ├─ page.tsx                  # Hub (4 cards)
│  ├─ ci123/
│  │  ├─ page.tsx               # CI123 home (relative imports)
│  │  ├─ calculator/page.tsx
│  │  └─ _src/                  # components/, data/, lib/ from CI123
│  ├─ ihealthy/
│  │  ├─ page.tsx               # iHealthyUltra home, wrapped in .ihealthy-scope
│  │  └─ _src/                  # components/, lib/, hooks/, context/ from iHealthyUltra
│  ├─ global-saving/
│  │  ├─ page.tsx               # 'use client' + dynamic(ssr:false) → _src/App
│  │  └─ _src/                  # App.tsx, components/, data/, engine.ts, *.css
│  └─ group-insurance/
│     ├─ page.tsx               # 'use client' + dynamic(ssr:false) → _src/App
│     └─ _src/                  # App.jsx, pages/, components/, contexts/, utils/, i18n/, data/, assets/
├─ components/
│  └─ Navbar.tsx                # shared nav (relative imports only)
└─ public/
   ├─ ci123/        ihealthy/   global-saving/   group-insurance/   # per-app assets
```

---

### Task 0: Scaffold the combined Next.js 15 project

**Files:**
- Create: `combined-app/package.json`
- Create: `combined-app/next.config.js`
- Create: `combined-app/tsconfig.json`
- Create: `combined-app/postcss.config.js`
- Create: `combined-app/tailwind.config.js`
- Create: `combined-app/.gitignore`
- Create: `combined-app/next-env.d.ts` (generated by Next on first run)

Work from project root `/Users/pheerapatpisit/Documents/APP/combined-app`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "combined-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-alert-dialog": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.0",
    "@radix-ui/react-collapsible": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-menubar": "^1.1.0",
    "@radix-ui/react-popover": "^1.1.0",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.0",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "embla-carousel-react": "^8.3.0",
    "react-day-picker": "^8.10.1",
    "react-hook-form": "^7.53.0",
    "recharts": "^2.13.0",
    "tailwind-merge": "^2.5.0",
    "lucide-react": "^0.460.0",
    "html2canvas": "^1.4.1",
    "jspdf": "^4.2.1",
    "chart.js": "^4.5.1",
    "@fontsource/ibm-plex-sans-thai": "^5.2.8"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^20.14.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^3.4.14",
    "tailwindcss-animate": "^1.0.7",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.1",
    "eslint-config-next": "^15.1.0"
  }
}
```

- [ ] **Step 2: Create `next.config.js`**

```js
/** @type {import('next.js').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Source apps ship images without next/image optimization; keep <img> working.
  images: { unoptimized: true },
};
module.exports = nextConfig;
```

- [ ] **Step 3: Create `tsconfig.json`** (note the `@/*` alias points at iHealthyUltra's folder)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./app/ihealthy/_src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `postcss.config.js`**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create `tailwind.config.js`** (v3, shadcn theme from iHealthyUltra, content globs cover all apps)

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        chart: {
          1: "hsl(var(--chart-1))", 2: "hsl(var(--chart-2))", 3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))", 5: "hsl(var(--chart-5))",
        },
        brand: {
          ink: "#141413", "ink-light": "#2a2a28", cream: "#faf9f5", gray: "#e8e6dc",
          orange: "#d97757", "orange-dark": "#c96848", blue: "#6a9bcc", "blue-dark": "#5a8abb",
          "blue-deep": "#1a2535", green: "#788c5d", "green-dark": "#6a7d50",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))", foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))", "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))", "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))", ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: { body: ["Google Sans", "sans-serif"], headline: ["Google Sans", "sans-serif"] },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: { "accordion-down": "accordion-down 0.2s ease-out", "accordion-up": "accordion-up 0.2s ease-out" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules
.next
out
.DS_Store
*.tsbuildinfo
.env*.local
```

- [ ] **Step 7: Install dependencies**

Run: `cd "/Users/pheerapatpisit/Documents/APP/combined-app" && npm install`
Expected: completes with `added N packages`. Peer-dependency warnings for `recharts`/`react-day-picker` against React 19 are acceptable (see risks). Hard `ERESOLVE` errors are not — if it fails, re-run with the offending package version adjusted, not with `--force`.

- [ ] **Step 8: Commit**

```bash
cd "/Users/pheerapatpisit/Documents/APP/combined-app"
git init
git add -A
git commit -m "chore: scaffold combined Next.js 15 project"
```

---

### Task 1: Shared shell — layout, globals.css, Navbar, Hub page

**Files:**
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `components/Navbar.tsx`
- Create: `app/page.tsx`

- [ ] **Step 1: Create `app/globals.css`** (Tailwind + shadcn `:root` tokens + SCOPED reset; no global body background)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 48 33% 97%;
    --foreground: 60 3% 8%;
    --card: 48 33% 98%;
    --card-foreground: 60 3% 8%;
    --popover: 48 33% 98%;
    --popover-foreground: 60 3% 8%;
    --primary: 14 64% 60%;
    --primary-foreground: 48 33% 97%;
    --secondary: 211 48% 61%;
    --secondary-foreground: 48 33% 97%;
    --muted: 45 25% 89%;
    --muted-foreground: 60 3% 8%;
    --accent: 85 20% 46%;
    --accent-foreground: 48 33% 97%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 60 3% 8%;
    --input: 60 3% 8%;
    --ring: 14 64% 60%;
    --radius: 0.5rem;
    --chart-1: 14 64% 60%;
    --chart-2: 211 48% 61%;
    --chart-3: 85 20% 46%;
    --chart-4: 50 9% 67%;
    --chart-5: 45 25% 89%;
    --sidebar-background: 48 33% 98%;
    --sidebar-foreground: 60 3% 8%;
    --sidebar-primary: 14 64% 60%;
    --sidebar-primary-foreground: 48 33% 97%;
    --sidebar-accent: 85 20% 46%;
    --sidebar-accent-foreground: 48 33% 97%;
    --sidebar-border: 60 3% 8%;
    --sidebar-ring: 14 64% 60%;
  }
}

/* iHealthyUltra's global reset, scoped to its route only */
.ihealthy-scope * {
  @apply border-border;
}
.ihealthy-scope {
  @apply bg-background text-foreground;
}

/* CI123 expects a plain white page */
.ci123-scope {
  background-color: #ffffff;
}

html { scroll-behavior: smooth; }
body { margin: 0; }
```

- [ ] **Step 2: Create `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "Combined App",
  description: "CI123 · iHealthyUltra · Global Saving Plus · Group Insurance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create `components/Navbar.tsx`** (relative imports only — no `@/`)

```tsx
import Link from "next/link";

const links = [
  { href: "/", label: "หน้าแรก" },
  { href: "/ci123", label: "CI123" },
  { href: "/ihealthy", label: "iHealthyUltra" },
  { href: "/global-saving", label: "Global Saving" },
  { href: "/group-insurance", label: "Group Insurance" },
];

export default function Navbar() {
  return (
    <nav style={{ borderBottom: "1px solid #e8e6dc", background: "#faf9f5" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 20, padding: "12px 20px", alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/" style={{ fontWeight: 700, color: "#141413", textDecoration: "none" }}>
          🏠 Hub
        </Link>
        {links.slice(1).map((l) => (
          <Link key={l.href} href={l.href} style={{ color: "#2a2a28", textDecoration: "none" }}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Create `app/page.tsx`** (Hub — 4 cards)

```tsx
import Link from "next/link";

const apps = [
  { href: "/ci123", title: "CI123", desc: "ประกันโรคร้ายแรง — landing & เครื่องคำนวณเบี้ย" },
  { href: "/ihealthy", title: "iHealthyUltra", desc: "เปรียบเทียบแผนประกันสุขภาพ" },
  { href: "/global-saving", title: "Global Saving Plus", desc: "เครื่องคำนวณเงินออม 15/8" },
  { href: "/group-insurance", title: "Group Insurance", desc: "ใบเสนอราคาประกันกลุ่ม" },
];

export default function Hub() {
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: "#141413", marginBottom: 8 }}>เลือกแอป</h1>
      <p style={{ color: "#2a2a28", marginBottom: 32 }}>รวม 4 แอปไว้ในที่เดียว</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {apps.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            style={{ display: "block", padding: 20, borderRadius: 12, border: "1px solid #e8e6dc", background: "#fff", textDecoration: "none" }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: "#d97757", marginBottom: 6 }}>{a.title}</div>
            <div style={{ color: "#2a2a28", fontSize: 14 }}>{a.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run dev server and verify the Hub renders**

Run: `cd "/Users/pheerapatpisit/Documents/APP/combined-app" && (npm run dev > /tmp/combined-dev.log 2>&1 &) && sleep 8 && curl -s http://localhost:3000 | grep -c "เลือกแอป"`
Expected: prints `1` (Hub heading present). Then stop the dev server: `pkill -f "next dev"`.
If it prints `0` or curl fails, read `/tmp/combined-dev.log` for the compile error before continuing.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: shared layout, navbar, and hub page"
```

---

### Task 2: Port iHealthyUltra (the shadcn app — `@/` alias owner)

**Files:**
- Create: `app/ihealthy/_src/` (copied from `iHealthyUltra/{components,lib,hooks,context}`)
- Create: `app/ihealthy/page.tsx` (from `iHealthyUltra/app/page.tsx`)
- Copy: `iHealthyUltra/public/*` → `public/ihealthy/`

`SRC="/Users/pheerapatpisit/Documents/APP/iHealthyUltra"` for all steps below.

- [ ] **Step 1: Copy the app's code into a private `_src/` folder**

```bash
cd "/Users/pheerapatpisit/Documents/APP/combined-app"
SRC="/Users/pheerapatpisit/Documents/APP/iHealthyUltra"
mkdir -p app/ihealthy/_src
cp -R "$SRC/components" app/ihealthy/_src/components
cp -R "$SRC/lib" app/ihealthy/_src/lib
cp -R "$SRC/hooks" app/ihealthy/_src/hooks
cp -R "$SRC/context" app/ihealthy/_src/context
mkdir -p public/ihealthy && cp -R "$SRC/public/." public/ihealthy/
```

- [ ] **Step 2: Create the route page from the app's home page**

```bash
cp "$SRC/app/page.tsx" app/ihealthy/page.tsx
```

Then edit `app/ihealthy/page.tsx`:
- Ensure the **first line** is `"use client";` (the page uses interactive hooks/state). If the original already has it, leave it.
- Wrap the returned JSX root element's `className` so its scoped CSS applies. Change the outermost returned element to include the scope class, e.g. from `return ( <div className="..."> ` to `return ( <div className="ihealthy-scope ...">`. If the root is a Fragment `<>`, replace it with `<div className="ihealthy-scope">…</div>`.

The `@/components/...`, `@/lib/...`, `@/hooks/...`, `@/context/...` imports inside the copied files now resolve via the tsconfig `@/*` → `./app/ihealthy/_src/*` alias set in Task 0 — no import edits needed.

- [ ] **Step 3: Verify no source-relative `app/` imports were left dangling**

Run:
```bash
grep -rn "from \"@/app" app/ihealthy/_src || echo "OK: no @/app imports"
```
Expected: `OK: no @/app imports`. If any are found, they reference the original `app/` folder — repoint them to the copied file's new location (most live under `components/`).

- [ ] **Step 4: Build to verify the route compiles**

Run: `npm run build 2>&1 | tail -20`
Expected: build succeeds and the output route list includes `/ihealthy`. Resolve any "Module not found" by checking the alias target path; resolve any React-19/recharts type errors per the risks list.

- [ ] **Step 5: Smoke-test the route renders**

Run: `(npm run dev > /tmp/combined-dev.log 2>&1 &) && sleep 8 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/ihealthy && pkill -f "next dev"`
Expected: `200`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: port iHealthyUltra to /ihealthy route"
```

---

### Task 3: Port CI123 (Next, relative imports — easy)

**Files:**
- Create: `app/ci123/_src/` (from `CI123/app/{components,data}` and `CI123/lib`)
- Create: `app/ci123/page.tsx` (from `CI123/app/page.tsx`)
- Create: `app/ci123/calculator/page.tsx` (from `CI123/app/calculator/page.tsx`)
- Copy: `CI123/public/*` → `public/ci123/`

`SRC="/Users/pheerapatpisit/Documents/APP/CI123"`.

- [ ] **Step 1: Copy components, data, lib, and assets**

```bash
cd "/Users/pheerapatpisit/Documents/APP/combined-app"
SRC="/Users/pheerapatpisit/Documents/APP/CI123"
mkdir -p app/ci123/_src
cp -R "$SRC/app/components" app/ci123/_src/components
cp -R "$SRC/app/data" app/ci123/_src/data
[ -d "$SRC/lib" ] && cp -R "$SRC/lib" app/ci123/_src/lib
mkdir -p public/ci123 && cp -R "$SRC/public/." public/ci123/
```

- [ ] **Step 2: Create the route pages**

```bash
cp "$SRC/app/page.tsx" app/ci123/page.tsx
mkdir -p app/ci123/calculator
cp "$SRC/app/calculator/page.tsx" app/ci123/calculator/page.tsx
```

- [ ] **Step 3: Fix relative imports + scope class + asset paths**

The original `app/page.tsx` imported components via `./components/...` (same folder). Now components live in `./_src/components/...`. In **both** `app/ci123/page.tsx` and `app/ci123/calculator/page.tsx`:
- Rewrite `from "./components/` → `from "../_src/components/` (for `page.tsx`) and `from "../components/` → `from "../../_src/components/` (for `calculator/page.tsx`). Run a grep first to see the exact specifiers:
  ```bash
  grep -rn "from \"\.\./\?components\|from \"\./data\|from \"\.\./\?lib" app/ci123/page.tsx app/ci123/calculator/page.tsx
  ```
  Apply the matching relative-depth fix for each.
- If a component reads `/images/...` or root-relative asset URLs that came from CI123's `public/`, prefix them with `/ci123` (assets now live under `public/ci123/`). Grep inside `_src`:
  ```bash
  grep -rn "src=\"/\|url(/\|href=\"/" app/ci123/_src | grep -v "/ci123" | head
  ```
  Update found root-absolute asset URLs to `/ci123/...`.
- Wrap the outermost returned element of each page with the scope class: add `ci123-scope` to its `className` (or wrap a Fragment in `<div className="ci123-scope">`).
- Ensure `"use client";` is the first line if the page uses `useState`/event handlers (the premium calculator does).

- [ ] **Step 4: Build to verify**

Run: `npm run build 2>&1 | tail -20`
Expected: build succeeds; route list includes `/ci123` and `/ci123/calculator`.

- [ ] **Step 5: Smoke-test both routes**

Run:
```bash
(npm run dev > /tmp/combined-dev.log 2>&1 &) && sleep 8 \
  && curl -s -o /dev/null -w "ci123:%{http_code}\n" http://localhost:3000/ci123 \
  && curl -s -o /dev/null -w "calc:%{http_code}\n" http://localhost:3000/ci123/calculator \
  && pkill -f "next dev"
```
Expected: `ci123:200` and `calc:200`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: port CI123 to /ci123 route"
```

---

### Task 4: Port Global Saving Plus (Vite → Next, client-only)

**Files:**
- Create: `app/global-saving/_src/` (from `Global Saving Plus/src`, minus `main.tsx`)
- Create: `app/global-saving/page.tsx` (new client wrapper)
- Copy: `Global Saving Plus/public/*` → `public/global-saving/`

`SRC="/Users/pheerapatpisit/Documents/APP/Global Saving Plus"`.

- [ ] **Step 1: Copy source (drop the Vite entry `main.tsx`)**

```bash
cd "/Users/pheerapatpisit/Documents/APP/combined-app"
SRC="/Users/pheerapatpisit/Documents/APP/Global Saving Plus"
mkdir -p app/global-saving/_src
cp -R "$SRC/src/." app/global-saving/_src/
rm -f app/global-saving/_src/main.tsx app/global-saving/_src/vite-env.d.ts
mkdir -p public/global-saving && cp -R "$SRC/public/." public/global-saving/
# logo.png and docs/ live at the Vite project root's public; confirm they copied:
ls public/global-saving | head
```

- [ ] **Step 2: Replace Vite's `import.meta.env.BASE_URL` (4 spots) with the route asset base**

Assets now live under `/global-saving/`. Replace in all four files:

```bash
cd "/Users/pheerapatpisit/Documents/APP/combined-app"
grep -rl "import.meta.env.BASE_URL" app/global-saving/_src
# Files: App.tsx, data/documents.ts, components/Documents.tsx, components/Calculator.tsx
```

In each, change `${import.meta.env.BASE_URL}` → `/global-saving/`. Concretely:
- `app/global-saving/_src/App.tsx`: `` src={`${import.meta.env.BASE_URL}logo.png`} `` → `src="/global-saving/logo.png"`
- `app/global-saving/_src/data/documents.ts`: `` `${import.meta.env.BASE_URL}docs/${file}` `` → `` `/global-saving/docs/${file}` ``
- `app/global-saving/_src/components/Documents.tsx`: `` src={`${import.meta.env.BASE_URL}logo.png`} `` → `src="/global-saving/logo.png"`
- `app/global-saving/_src/components/Calculator.tsx`: same logo replacement as above.

Verify none remain:
```bash
grep -rn "import.meta.env" app/global-saving/_src || echo "OK: none left"
```
Expected: `OK: none left`.

- [ ] **Step 3: Make `App.tsx` a client component**

Add `"use client";` as the very first line of `app/global-saving/_src/App.tsx` (it uses `useState`, `useEffect`, and `window.location.hash`).

- [ ] **Step 4: Create the route page that loads the app client-only**

Create `app/global-saving/page.tsx`:

```tsx
"use client";
import dynamic from "next/dynamic";

const GlobalSavingApp = dynamic(() => import("./_src/App"), { ssr: false });

export default function Page() {
  return <GlobalSavingApp />;
}
```

This guarantees no SSR (the app reads `window.location.hash` during render). `App.tsx` already imports its own `./index.css` and `./components/Factsheet.css`; if it does not import `index.css`, add `import "./index.css";` near the top of `App.tsx` so its styles load. Verify:
```bash
grep -n "index.css\|Factsheet.css" app/global-saving/_src/App.tsx app/global-saving/_src/components/*.tsx
```
If `index.css` is not imported anywhere, add the import to `App.tsx`.

- [ ] **Step 5: Build to verify**

Run: `npm run build 2>&1 | tail -20`
Expected: build succeeds; route list includes `/global-saving`. chart.js compiles fine client-side. If the build complains about importing global CSS from `_src`, confirm the import sits inside the `'use client'` `App.tsx` (allowed in App Router).

- [ ] **Step 6: Smoke-test the route (incl. hash views)**

Run: `(npm run dev > /tmp/combined-dev.log 2>&1 &) && sleep 8 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/global-saving && pkill -f "next dev"`
Expected: `200`. (Manually, also confirm `/global-saving#docs` switches the view in a browser later.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: port Global Saving Plus to /global-saving route (client-only)"
```

---

### Task 5: Port Group Insurance (Vite → Next, client-only, JSX)

**Files:**
- Create: `app/group-insurance/_src/` (from `Group Insurance/src`, minus `main.jsx`)
- Create: `app/group-insurance/page.tsx` (new client wrapper)
- Copy: `Group Insurance/public/*` → `public/group-insurance/`

`SRC="/Users/pheerapatpisit/Documents/APP/Group Insurance"`.

- [ ] **Step 1: Copy source (drop the Vite entry `main.jsx`)**

```bash
cd "/Users/pheerapatpisit/Documents/APP/combined-app"
SRC="/Users/pheerapatpisit/Documents/APP/Group Insurance"
mkdir -p app/group-insurance/_src
cp -R "$SRC/src/." app/group-insurance/_src/
rm -f app/group-insurance/_src/main.jsx
mkdir -p public/group-insurance && cp -R "$SRC/public/." public/group-insurance/
```

- [ ] **Step 2: Strip duplicate Tailwind directives from this app's `index.css`**

The root `app/globals.css` already injects `@tailwind base/components/utilities`. Importing them again from this app duplicates the reset. Edit `app/group-insurance/_src/index.css`: delete any `@tailwind base;`, `@tailwind components;`, `@tailwind utilities;` lines, keeping all custom CSS below them.

```bash
grep -n "@tailwind" app/group-insurance/_src/index.css
```
Remove those lines; leave the rest.

- [ ] **Step 3: Make `App.jsx` a client component and ensure its CSS imports**

- Add `"use client";` as the very first line of `app/group-insurance/_src/App.jsx` (uses `useState`, context, jspdf/html2canvas).
- Confirm `App.jsx` imports `./index.css`; if not, add `import "./index.css";` at the top.
- The PDF utils (`utils/quotePdf.js`, `components/QuoteDocument.jsx`, `components/MultiGroupQuoteDocument.jsx`) call `jspdf`/`html2canvas` at click time, which is fine inside client components. No `'use client'` needed on leaf util files, only on components that use React hooks.

```bash
grep -n "index.css" app/group-insurance/_src/App.jsx || echo "ADD index.css import"
```

- [ ] **Step 4: Fix root-absolute asset URLs to the route base**

Assets imported via `src/assets/*` (e.g. `health.png`) are bundled by import and need no change. But any root-absolute URLs (`/something.png`) must point under `/group-insurance`:

```bash
grep -rn "src=\"/\|url(/\|href=\"/" app/group-insurance/_src | grep -v "http\|/group-insurance" | head
```
Prefix any found root-absolute asset paths with `/group-insurance`.

- [ ] **Step 5: Create the route page that loads the app client-only**

Create `app/group-insurance/page.tsx`:

```tsx
"use client";
import dynamic from "next/dynamic";

const GroupInsuranceApp = dynamic(() => import("./_src/App"), { ssr: false });

export default function Page() {
  return <GroupInsuranceApp />;
}
```

- [ ] **Step 6: Build to verify**

Run: `npm run build 2>&1 | tail -20`
Expected: build succeeds; route list includes `/group-insurance`. `allowJs` in tsconfig lets the `.jsx`/`.js` files compile. If jspdf/html2canvas error during build, confirm they are only reached from the `ssr:false` dynamic subtree.

- [ ] **Step 7: Smoke-test the route**

Run: `(npm run dev > /tmp/combined-dev.log 2>&1 &) && sleep 8 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/group-insurance && pkill -f "next dev"`
Expected: `200`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: port Group Insurance to /group-insurance route (client-only)"
```

---

### Task 6: Final integration — production build + smoke-test all routes

**Files:** none new — verification + fixes only.

- [ ] **Step 1: Clean production build**

Run: `cd "/Users/pheerapatpisit/Documents/APP/combined-app" && rm -rf .next && npm run build 2>&1 | tail -30`
Expected: "Compiled successfully"; the printed route table lists `/`, `/ci123`, `/ci123/calculator`, `/ihealthy`, `/global-saving`, `/group-insurance`.

- [ ] **Step 2: Start production server and smoke-test every route**

Run:
```bash
(npm run start > /tmp/combined-start.log 2>&1 &) && sleep 6
for r in "" ci123 ci123/calculator ihealthy global-saving group-insurance; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/$r")
  echo "/$r -> $code"
done
pkill -f "next start"
```
Expected: every line ends in `200`.

- [ ] **Step 3: Visual check (manual)**

Start `npm run dev`, open each route in a browser, and confirm:
- Hub shows 4 cards and the navbar links work.
- `/ihealthy` keeps its cream background and shadcn styling (scope class applied).
- `/ci123` shows a white background; the premium calculator is interactive.
- `/global-saving` calculator renders charts; `#docs` switches to the documents view.
- `/group-insurance` tab switching works and "ดาวน์โหลด/PDF" generates a file.

Fix any visual regression by tightening the per-app scope class in `app/globals.css` (a leaked style is almost always a global selector in an app's own CSS — scope it under the app's `*-scope` class).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: verify combined app builds and all routes serve 200"
```

---

## Self-Review (completed against the spec)

- **Spec coverage:** Single Next.js app ✅ (Task 0); single navbar/menu ✅ (Task 1); Hub home ✅ (Task 1); all 4 apps as routes ✅ (Tasks 2–5: iHealthyUltra, CI123, Global Saving, Group Insurance — Group Insurance replacing the empty Blueprint folder per the user); Next 15 + React 19 ✅ (Task 0); Vite→Next ports with `ssr:false` ✅ (Tasks 4–5); `import.meta.env` removed ✅ (Task 4); Tailwind-version + `@/`-alias collisions resolved ✅ (Tasks 0–2); per-route CSS scoping ✅ (Task 1 globals + each port).
- **Placeholder scan:** every code step contains full file content or exact `cp`/`grep`/edit commands; no TBD/TODO.
- **Type/name consistency:** alias `@/*` defined once (Task 0) and relied on in Task 2; scope classes `ihealthy-scope`/`ci123-scope` defined in Task 1 globals and applied in Tasks 2–3; route names match the navbar/Hub hrefs in Task 1.
