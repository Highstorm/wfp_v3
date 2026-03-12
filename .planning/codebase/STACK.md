# Technology Stack

**Analysis Date:** 2026-03-12

## Languages

**Primary:**
- TypeScript 5.2.2 - All source code in `src/` directory
- HTML/CSS - UI markup and styling

**Secondary:**
- JavaScript - Configuration files (PostCSS, Vite)

## Runtime

**Environment:**
- Node.js 22.19.0 - Development and build runtime
- Browser (ES2020+) - Runtime execution environment

**Package Manager:**
- npm 10.9.3
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 18.2.0 - UI library (`src/components/`)
- React Router DOM 6.22.0 - Client-side routing (`src/App.tsx`)
- Vite 5.1.0 - Build tool and dev server

**State Management:**
- Zustand 4.5.0 - Store management (`src/stores/`)
- TanStack React Query 5.64.0 - Server state management (`src/main.tsx`)

**UI/Styling:**
- Tailwind CSS 3.4.1 - Utility-first CSS framework
- PostCSS 8.4.35 - CSS processing
- Autoprefixer 10.4.17 - Vendor prefix automation
- Headless UI (React) 2.2.0 - Unstyled UI components
- Radix UI (React Slot) 1.2.4 - Composition primitives
- Lucide React 0.564.0 - Icon library

**Utilities:**
- date-fns 4.1.0 - Date manipulation
- class-variance-authority 0.7.1 - Component variant management
- clsx 2.1.1 - Conditional CSS class management
- tailwind-merge 3.4.0 - Merge Tailwind classes

**Testing:**
- Vitest 4.0.18 - Unit test runner (`vitest.config.ts`)
- Playwright 1.49.1 - E2E testing (`playwright.config.ts`)

**Build/Dev:**
- Vite React Plugin 4.2.1 - React integration for Vite
- TypeScript 5.2.2 - Type checking during build

## Key Dependencies

**Critical:**
- Firebase 12.5.0 - Authentication, Firestore database, and AI models
  - Used in: `src/lib/firebase.ts`, repositories, auth components
  - Submodules: `firebase/app`, `firebase/auth`, `firebase/firestore`, `firebase/ai`

**Infrastructure:**
- dotenv 16.4.7 - Environment variable loading

## Configuration

**Environment:**
- `.env` file - Contains Firebase configuration (Git-ignored)
- `.env.example` - Template for Firebase configuration vars:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_GEMINI_API_KEY` (optional)

**TypeScript Configuration:**
- `tsconfig.json` - Configured for ES2020 target, JSX React support, strict mode
- `tsconfig.node.json` - Referenced for build tools

**Build Configuration:**
- `vite.config.ts` - Manual chunk splitting for vendors (react, firebase, ui)
- `tailwind.config.ts` - Dark mode support, custom colors (nutrition-themed), animations
- `postcss.config.js` - PostCSS configuration

**Development Server:**
- Vite dev server on port 5173
- Proxy configured for `/api/openfoodfacts` → `https://search.openfoodfacts.org`

## Platform Requirements

**Development:**
- Node.js 22.x+
- npm 10.x+
- Modern browser with ES2020 support
- `.env` file with Firebase credentials

**Production:**
- Static hosting (HTML/CSS/JS bundle)
- Browser client: ES2020+ support required
- CORS-capable origin for external APIs

---

*Stack analysis: 2026-03-12*
