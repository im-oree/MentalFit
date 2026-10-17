# MentalFit

## Git
- Never add Co-Authored-By lines to commits
- Commit changes in logical, granular chunks — not bulk commits

## Stack
- React 19 + Vite 8 + TypeScript 6
- Tailwind CSS v4 (CSS-based @theme config in src/index.css)
- Framer Motion for animations
- Capacitor 8 for iOS/Android
- MediaPipe PoseLandmarker (33 landmarks, GPU-first, One Euro filtering)
- Three.js / @react-three/fiber / @react-three/drei for 3D model
- idb-keyval for IndexedDB persistence (no backend, fully offline)
- Lucide icons

## Design System
- **Philosophy**: Apple-style minimal mobile UI, monochrome-first, colors only on meaningful states
- **All styling via Tailwind tokens** — no hardcoded colors anywhere
- **Typography**: Inter variable font, ultra-bold (font-black), tight tracking (tracking-[-0.04em] to [-0.055em])
- **Colors** (defined as @theme tokens in index.css):
  - ink: #050505, paper: #f1efe8, bone: #f6f2e9, muted: #747780
  - dark: #171512, dark-card: #131110, dark-soft: #15130f
  - accent: #0a84ff, accent-green, accent-red, accent-gold: #d9c395
- **Cards**: glass-card (rgba(245,242,235,0.82) + backdrop-blur-xl + rounded-[24px])
- **Dark cards**: glass-dark, soft-dark for dark glass surfaces
- **Shadows**: --shadow-soft, --shadow-lift, --shadow-glow tokens
- **Tab bar**: Floating dark glass bar, bg-dark-card/78, backdrop-blur-2xl, rounded-[26px], active pill with layoutId spring animation
- **Buttons**: 4 variants (primary/secondary/ghost/chip) × 3 sizes, font-black
- **Layout**: PhoneFrame wrapper (max-w-[430px] on desktop), Screen with safe-area padding
- **TopBar**: Dark header with safe-top, optional background image with gradient overlay
- **Animations**: Framer Motion springs, stagger (delay: i * 0.045), fade-up, scale-in
- **3D Model**: Fixed camera angles (no user rotation/orbit), studio lighting, contact shadows

## Architecture
- Routing: react-router-dom with Layout shell wrapping tabbed pages
- Data: React context + idb-keyval (StoreContext provider in App.tsx)
- Detection: Angle-based state machines in src/detection/, connected via useExerciseDetection hook
- Pose landmarks exposed via mutable ref (not React state) for 30fps performance
- Exercise guide flow: /guide/:id (3D model + steps) → /session/:id (PiP camera + model)

## Conventions
- No UI clutter — minimal controls, clean layouts
- Mobile-first, phone-width design (16px side gutter)
- Haptic feedback via @capacitor/haptics on rep completion
- GPS tracking via @capacitor/geolocation for runs
