# Plan — SuriWorld 3D Polish Loop (12 units)

Quality tier: DELIGHTFUL. Each unit ships independently: implement → screenshot-verify → commit. Order is HIGH leverage first (1-4), then MEDIUM (5-9), then LOW (10-12).

## Project Context

- Repo: `/Users/surixing/Code/SuriWorld/SuriWorld`
- Stack: Vite + React + TS + react-three-fiber + drei + zustand
- Dev server: `npm run dev` on port 5173, route `/3d`
- Build: `npm run build`, Lint: `npm run lint`
- Verify pattern: webapp-testing skill → screenshot → Read → confirm
- Already shipped: EXIT/ESC, doors-swing-in, full-width book wall, MyRoom shelf stack, door labels, U-close hysteresis, F-to-sit sign

## Units

### HIGH LEVERAGE (1-4)

- **P1** spawn-signage — 4-direction floating sign post at hallway intersection (0,0)
  - verify: screenshot at spawn shows 4 directional plaques with room labels + accent bars; signs vanish in FP room view
  - eval: distanceFactor=6 makes them shrink with distance; pointerEvents none; hidden when viewMode!=='overview'

- **P2** crosshair-feedback — gold tint + 1.2x scale + "press E" hint when focusedInteractable !== null
  - verify: FP screenshot looking AT a trophy shows gold scaled crosshair + hint; looking at empty space shows neutral
  - eval: smooth transition (opacity/transform with CSS), no layout jump, hint readable at FP distance

- **P3** wasd-pulse — first-load onboarding overlay, 2s WASD/arrow diagram pulse, sessionStorage gate
  - verify: fresh-session screenshot after dialogue ends shows centered keyboard hint; second visit (sessionStorage set) shows nothing
  - eval: doesn't block input; pointer-events none; fades smoothly; gated correctly

- **P4** sound-layer — per-room CC0 audio loop + mute toggle in HUD, persisted localStorage
  - verify: each room mounts its own <audio>; mute button visible top-right; localStorage key persists; audio files committed under public/audio/
  - eval: files <50KB, loops cleanly, gracefully degrades if browser blocks autoplay (most do — needs first user interaction)

### MEDIUM LEVERAGE (5-9)

- **P5** myroom-side-walls — left wall: ticking analog clock (12 spokes + hour/minute hands via useFrame). Right wall: 5-bulb string-light garland on a wire
  - verify: screenshots from 2 angles in MyRoom show clock + garland in pink/wood palette
  - eval: clock hands actually advance per real-time; emissive bulbs not flickering (zero-brightness-motion invariant)

- **P6** bookroom-balance — 2 wall sconces flanking chair (lamp shade + warm pointLight intensity 0.4 distance 3) + chalkboard "currently reading" plaque on left wall (drei <Html>)
  - verify: BookRoom screenshot from chair POV shows symmetric sconces + readable book list
  - eval: sconces match existing reading-lamp aesthetic; chalkboard distanceFactor reasonable; doesn't clash with full-width shelf

- **P7** idealab-dust — 5 floating emissive cubes, lab green color, slower speed, smaller amplitude than BookRoom
  - verify: IdeaLab screenshot shows visible motes; useFrame bob is per-mesh sin(t*speed+phase)
  - eval: deterministic seed; positioned over the desk/whiteboard; doesn't z-fight existing meshes

- **P8** ambient-tint — per-room <ambientLight>: MyRoom #f4a8b8, BookRoom #e8a860, ProductRoom #60a5fa, IdeaLab #fbbf24, intensity 0.15
  - verify: side-by-side screenshots of 2 rooms show subtle hue differences
  - eval: 0.15 is barely-noticeable individually but rooms feel distinct in succession; doesn't wash out existing palette

- **P9** myroom-window — fake "view" plane behind curtains: gradient sky (pink→blue dawn) + 3-4 building silhouettes, static
  - verify: MyRoom screenshot through curtain gap shows sky gradient + skyline
  - eval: positioned behind curtains in -z direction; no z-fighting; gradient mesh uses vertexColors or shader-free trick (lerp-tinted boxes is fine)

### LOW LEVERAGE (10-12)

- **P10** mobile-touch — detect `'ontouchstart' in window`; render SVG joystick (left half) + tap-to-look (right half) + tap-on-focused = E
  - verify: Playwright with isMobile emulation: joystick visible, drag moves character, tap on trophy opens modal; desktop keyboard still works
  - eval: zero new dependency (no nipplejs); existing keyboard handlers untouched; touch controls hidden on desktop

- **P11** idealab-manifesto — interactable plaque on IdeaLab desk, 3-4 paragraphs in Suri's voice (pattern recognition, first principles, 70% rule)
  - verify: walk into IdeaLab → focus plaque → press E → modal opens with manifesto text
  - eval: tone matches MY_ROOM_CONTENT (warm, age-appropriate, first-person); no jargon dumping

- **P12** analytics — Vercel Analytics package (`@vercel/analytics`) instrumented for viewMode changes, modal opens, room-time-spent
  - verify: package installed; <Analytics /> mounted in App; track() calls fire on viewMode change; build green
  - eval: privacy-friendly (Vercel default = no cookies); events have stable names; no PII in event props

## Termination

- Stop after P12 commit
- Generate summary table: unit | shipped | screenshot | commit SHA
- Ask user about `npm run deploy`
