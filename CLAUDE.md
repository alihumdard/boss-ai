@AGENTS.md

# BOSS — AI assistant dashboard

Client dashboard for an AI assistant suite. Voice bot is the first deliverable;
a website-orders agent and a WhatsApp agent follow later.

**Stack:** Next.js App Router, TypeScript, Tailwind v4, shadcn/ui, Framer Motion,
lucide-react + react-icons (brand logos), React Three Fiber + drei +
@react-three/postprocessing.

**Reference:** the client's design mockup is shared as a chat image, not a file in
the repo. There is no `docs/reference/dashboard.png`.

**Dev server:** `npm run dev`. It picks the first free port — currently **3000**.
Check before screenshotting; don't assume.

**Screenshots:** `node scripts/shot.mjs <label>` captures 1366×650 and 1920×960 into
`shots/` and reports whether the page scrolls. Override the target with `SHOT_URL`.

## Voice agent (`agent/`)

A separate Python LiveKit worker ([agent/main.py](agent/main.py)) that joins the
room the dashboard creates and does STT → LLM → TTS. The dashboard's
`use-voice-session.ts` hook talks to it over LiveKit; `/api/livekit-token`
issues the room token.

**Run both, in order:**

```bash
# 1. Agent worker (from agent/, first time: python -m venv .venv && pip install -r requirements.txt)
cd agent
.venv\Scripts\activate
python main.py start          # or `dev` for verbose/console logs — see note below

# 2. Dashboard, in a second terminal, from the repo root
npm run dev
```

The dashboard falls back to a mic-only visualiser with no agent if
`NEXT_PUBLIC_LIVEKIT_URL` is unset — the voice pipeline only activates once the
worker is registered and the env vars below are present in `agent/.env` (and
mirrored into the dashboard's `.env.local` for `LIVEKIT_URL` /
`LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `NEXT_PUBLIC_LIVEKIT_URL`).

- **`VOICE_PROVIDER=groq`** (dev/fast path) needs `GROQ_API_KEY` and
  `DEEPGRAM_API_KEY`. LLM is `groq.LLM("openai/gpt-oss-120b")` — **not**
  `llama-3.3-70b-versatile`, which this Groq account's key returns 404
  "model not found" for (Groq's catalog has moved on; re-check
  `GET /openai/v1/models` if this ever 404s again). TTS is
  `groq.TTS()` (defaults to `canopylabs/orpheus-v1-english` / voice
  `"autumn"`) — **not** `playai-tts`, which Groq has decommissioned.
  **Manual step required:** this TTS model needs its terms accepted once at
  https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english
  by the org admin, or every reply's TTS synthesis 400s ("Bad Request";
  the real reason only shows calling the Groq endpoint directly, the
  livekit-agents log just says "Bad Request"). The agent still joins,
  greets (LLM path runs), and takes tool calls without this — only the
  spoken audio is missing until it's accepted.
- **`VOICE_PROVIDER=production`** needs `ANTHROPIC_API_KEY` and
  `CARTESIA_API_KEY` (both currently blank in `agent/.env` — untested end to
  end here for that reason). LLM `claude-haiku-4-5`, TTS Cartesia defaults.
- A worker just past "registered worker" in its logs briefly reports itself
  "at full capacity" while it finishes loading the Silero/turn-detector
  models and won't accept a dispatch — give it 60-90s after startup before
  joining a room, or the first join attempt silently no-ops (no job, no
  error, the room just sits empty).
- `python main.py download-files` (or `uv run -m livekit.agents
  download-files`, since the script-level command is deprecated) fetches the
  Silero VAD and turn-detector model weights on first setup.
- **`LOG_LEVEL`** (default `warn`) sets the SDK/plugin root logger via
  `LIVEKIT_LOG_LEVEL` — that env var only accepts its own lowercase names
  (`warn`/`info`/`debug`/...), never Python's `WARNING`/`INFO`; `main.py`
  maps common spellings for you. This agent's own per-turn logs (`heard: ...`
  / `tool: ...` / `reply: ...`) always print at INFO on a separate,
  non-propagating plain-text logger, regardless of `LOG_LEVEL` — that's what
  keeps them from being buried in (or duplicated by) the SDK's JSON logger.
- **`IDLE_TIMEOUT_SECONDS`** (default `300`) — how long the mic can stay open
  with no speech before the session ends itself. Resets on every
  `user_state_changed`/`agent_state_changed` event, so an open mic with
  silence doesn't trip it early; only a closed/disconnected participant or
  the 10-minute hard call cap ends the session before that.
- Room input uses LiveKit Cloud's BVC noise cancellation
  (`livekit-plugins-noise-cancellation`) so background noise doesn't trip
  turn detection.

## Hard rules

- The product is **BOSS**. Never J.A.R.V.I.S., anywhere — UI, console lines, comments.
- Stats are **Conversations / Resolved by AI / Orders answered / Handed to human**.
  Never CPU / Memory / Storage / Uptime.
- Only **Website, WhatsApp and Customer support** agents are live. Every other agent
  and non-live quick action shows **"Coming soon"** / "Soon".
- **No hard-coded hex in components** — design tokens only. `public/orb-fallback.svg`
  is the single exception (a static asset, it cannot read CSS variables).
- `npm run build`, `eslint --max-warnings 0` and `tsc --noEmit` must all stay clean.
- Work section by section and **stop after each for review**. Screenshot at
  1366×650 and 1920×960, compare against the reference, list differences, fix, stop.

## Architecture

| Concern | File |
|---|---|
| Design tokens, nebula backdrop, starfield | [src/app/globals.css](src/app/globals.css) |
| Page composition (server component) | [src/app/page.tsx](src/app/page.tsx) |
| Shell: sidebar, top bar, 3-column grid | [src/components/shell/app-shell.tsx](src/components/shell/app-shell.tsx) |
| Shared voice session (orb ↔ Voice Console) | [src/components/shell/voice-stage.tsx](src/components/shell/voice-stage.tsx) |
| Mic → smoothed RMS `audioLevel` | [src/lib/use-voice-input.ts](src/lib/use-voice-input.ts) |
| R3F orb scene | [src/components/orb/orb-scene.tsx](src/components/orb/orb-scene.tsx) |
| Orb canvas wrapper (`next/dynamic`, `ssr: false`) | [src/components/orb/voice-orb.tsx](src/components/orb/voice-orb.tsx) |
| Agent card positions + connector Béziers | [src/lib/network-layout.ts](src/lib/network-layout.ts) |
| Typed mock data (agents, stats, activity, tasks, console event pool) | [src/lib/mock.ts](src/lib/mock.ts) — a single file, not a folder |
| Accent token lookup | [src/lib/accent.ts](src/lib/accent.ts) |
| Unified mic + live console + stat rings | [src/components/panels/voice-console.tsx](src/components/panels/voice-console.tsx) |
| SSR-safe `prefers-reduced-motion` | [src/lib/use-reduced-motion.ts](src/lib/use-reduced-motion.ts) |
| SSR-safe page-visibility (pause when tab hidden) | [src/lib/use-page-visible.ts](src/lib/use-page-visible.ts) |

## Lessons — do not repeat these bugs

- **Never pass functions as children** from a server to a client component. React
  cannot serialize a render prop across the boundary; use `ReactNode` slots.
- **No `Math.random()` during render.** Use a seeded PRNG so geometry is identical
  on every render (see `Particles` in orb-scene.tsx).
- **No synchronous `setState` inside effects.** The clock uses `requestAnimationFrame`.
- **`getComputedStyle` returns OKLCH tokens as `lab()`**, which three.js cannot parse —
  it silently falls back to black and an additively-blended orb vanishes. `readToken()`
  in orb-scene.tsx converts via a 1×1 2D canvas. **Reuse that helper for any canvas or
  WebGL colour.**
- Space-to-talk must ignore key presses originating inside `input` / `textarea`.
- **A `useState` lazy initializer that reads `window`/`document` causes a hydration
  mismatch**, even though it "only runs on the client": the server renders with the
  SSR-safe fallback (e.g. `false`), but the *client's first render during hydration*
  runs that same initializer for real, so a user with `prefers-reduced-motion: reduce`
  hydrates to `true` while the server-rendered markup says `false` — a mismatch React
  logs and does not repair. Fix: the hook's state must start at the same value on
  both sides (`false` / `true` matching the SSR fallback, never conditional on
  `typeof window`) and read the real value **only inside `useEffect`**, which never
  runs during SSR or the hydration render. See `use-reduced-motion.ts` and
  `use-page-visible.ts` for the pattern; reuse it for any future
  `matchMedia`/`document`-reading hook. (Exception: hooks that live entirely inside
  the R3F `<Canvas>`, which is `next/dynamic({ssr:false})`, never run server-side at
  all, so this class of bug can't occur there — see `usePrefersReducedMotion` in
  orb-scene.tsx.)
- **That same "read the real value only in an effect" fix trips the
  `react-hooks/set-state-in-effect` lint rule** (calling `setState` synchronously in
  an effect body). Don't disable the rule — defer the call one tick with
  `requestAnimationFrame`: it's still the effect's own subscription callback firing
  once to pick up the current value, not a render-time state sync, and it satisfies
  the linter without a real behavioural cost (one frame, before the first paint in
  practice).
- **React Dev Mode / StrictMode double-invokes effects** (mount → cleanup → mount).
  A component reading a ref/state that an effect populates can look "stuck at the
  initial value" if you inspect it between the first mount and its cleanup — this is
  not a bug, just a race in whatever you used to inspect it. Wait for the second
  mount (or check in production mode) before concluding an effect never fired.
- **Headless full-page screenshots can render the network stage as completely
  empty** even when it's laid out correctly — this is the same WebGL-composite quirk
  as the orb (see below), just also hiding the DOM cards and connectors that sit
  right next to the canvas in that capture. If a screenshot shows a totally blank
  network area, re-capture before assuming it's broken; check `scale`/`box` state or
  capture the canvas alone to tell a real bug from a stale/composite-only capture.

## Orb rendering — hard-won settings

The orb is a stack of additively-blended layers, and it blows out to a flat
saturated disc very easily. If it ever looks like a solid ball again, these are
the knobs that matter, in order:

- **Globe alpha must ride the fresnel**, not be flat. A constant alpha makes the
  body opaque and hides the surface dot network drawn just above it.
- **Bloom `luminanceThreshold` stays high (~0.78).** Below ~0.6 the saturated body
  itself blooms and swallows everything.
- **The atmosphere halo needs a tight exponent (~5.0).** A broad one washes
  additively over the whole globe.
- **Surface links must be sparse** (~14% of points, one link each). Linking every
  point to its neighbours yields a solid mesh that hides the points.
- **The box edge** is bloom writing non-transparent pixels into its render
  target's corners. Fixed with a `radial-gradient` `mask-image` on the canvas
  *wrapper* in voice-orb.tsx, with the canvas drawn at `-inset-[18%]` so the
  pedestal and halo fall off before the mask bites.
- **Headless full-page screenshots composite WebGL unreliably** — the orb can look
  blank in `shots/<label>-1366.png` while rendering fine. Trust
  `shots/<label>-orb.png` (the canvas element captured on its own).

## Open gaps vs the reference

1. ~~**Orb**~~ — done in Step 1: perfect sphere (no vertex displacement), fresnel
   rim, ~2000-point Fibonacci dot network with sparse links, atmosphere halo,
   4-ring pedestal + light disc + beam, two tilted orbit rings with travelling
   dots, per-state behaviour, reduced-motion handling, DPR capped at 1.5, paused
   while the tab is hidden. The equator line and the box edge are gone.
2. ~~**Agent network**~~ — done in Step 2. See "The network stage" below.
3. ~~**Fit**~~ — done in Step 3: greeting and bottom panels are fixed height, the
   stage absorbs the remainder, `main` is `overflow-hidden`, and the chip row
   scrolls horizontally instead of wrapping to a second line. No page scroll at
   either viewport.
4. ~~**Background**~~ — done in Step 4: added a pedestal glow ellipse to
   `--space-backdrop`. The nebula layers and starfield already existed.
5. ~~**Truncation**~~ — done: "Apps & Integrations" → "Integrations",
   "Create Content"/"View Analytics" → "Content"/"Analytics" (they sit beside a
   "Soon" badge in a two-column grid), and stat labels use `text-balance`.

## The network stage

The orb, cards and connectors live in **one fixed coordinate space scaled as a
single unit**, in [network-layout.ts](src/lib/network-layout.ts). Percentage
positioning was what let cards drift over the orb at different widths — do not
go back to it.

- Two variants, both 1000 wide: `FULL_STAGE` (520 tall, full cards) and
  `COMPACT_STAGE` (320 tall, icon + name). Geometry travels as a
  `StageGeometry` object, so card, connector and orb maths always agree.
- **Breakpoints read `window.innerWidth`, not the stage box.** The container is
  always narrower than the viewport, so measuring it made a 1920px desktop fall
  into the compact branch.
- **The scale must fit `STAGE_W + cardW` by `height + cardH`.** Cards are centred
  on their coordinate and hang half outside the nominal box; fitting the nominal
  box alone clips the outermost cards.
- **The scaled stage needs a wrapper sized to `STAGE_W * scale`.** A CSS
  transform does not change layout size, so without it the unscaled stage
  inflates the flex parent and pushes the bottom panels off-screen.
- **Keep the hub's translate and scale in one `transform` string.** A
  `-translate-x-1/2` utility class and an inline `transform` overwrite each
  other, which throws the orb off-centre.
- Connectors terminate on the orb's **rim** (`connectorEnd`), not its centre, so
  no line vanishes under the globe.
- **`ORB_R` is NOT the globe's visible size.** It is only the disc the connectors
  terminate on. The canvas is drawn larger than that box (`-inset-[12%]` in
  voice-orb.tsx) and the globe fills ~0.863 of that canvas's half-width, so the
  painted sphere is `GLOBE_PAINT_SCALE` (~1.07x) larger than `ORB_R`. **Always lay
  cards out against `paintedOrbR(orbR)`, never `orbR`.**

  This was a real bug that shipped twice: laying out against `orbR` put the
  Website Agent card visually on top of the globe at *every* width (−30px at
  1280 through −58px at 1920) while the layout maths cheerfully reported 18u of
  clearance. If you change the canvas inset in voice-orb.tsx, you must update
  `GLOBE_PAINT_SCALE` to match.
- **Verify overlap from rendered pixels, not from the maths.** `scripts/overlap.mjs`
  scans the canvas's centre line for the globe's lit edge and reports the real
  gap to the top card across seven widths. Layout arithmetic cannot catch this
  class of bug — it is what asserted the clearance was fine while it wasn't.
- `MIN_GAP` (18u) is the least space allowed between a card and the painted
  globe; it must stay above the ±3px card float. `topCentreY()` derives the
  top-centre card's y from the hub, painted radius and card height, and a
  dev-only `assertClearance()` warns if anything drops below it.
- **Never put a CSS transform between the stage and the orb canvas.** R3F sizes
  the canvas from a ResizeObserver on its parent, and transforms do not trigger
  one — the canvas sticks at a stale size and the orb sits pinned to one edge of
  its box. The hub slot is a plain sized box and `VoiceOrb` takes `fill`; the
  `[&_canvas]:!size-full` override in voice-orb.tsx forces the canvas to match.

## Layout restructure (in progress)

A second restructure is underway, worked **one step at a time with a stop for
review after each** — do not skip ahead to a later step's scope even if it
looks related.

**Target layout:**
- Centre column: greeting row → agent network (taller) → **one** unified Voice
  Console panel.
- Right column: Upcoming Tasks → Recent Activity → Quick Actions.
- Deleted for good: the standalone Live Console card, the standalone System
  Status card, the standalone bottom-row Recent Activity card, the Active
  Agents list.

**Step 1 — done: the unified Voice Console.**
[voice-console.tsx](src/components/panels/voice-console.tsx) merges the mic,
the live console and the four stat rings into one panel — hairlines and
spacing only, no nested card borders. Replaces the deleted `command-bar.tsx`,
`live-console.tsx` and `stats-panel.tsx`. Internal layout (this shape came from
iterating with the user mid-step, not the original 3-stacked-rows spec — the
component doc-comment is the source of truth if this drifts):
- **Top: two columns.** Left is the mic + waveform + status text (no input
  here anymore). Right is the four stat rings in a 2×2 grid, ring size trimmed
  to 46px/11px labels — that width is what keeps "Resolved by AI" and "Handed
  to human" on one line without truncating at 1366px. If you widen the left
  column, re-check both labels at 1366px before calling it done.
- **Middle: the live console, full width**, "Running" status + icon on the
  left, ~4-5 lines of auto-scrolling monospace log on the right.
  - New lines append every 2-5s from `CONSOLE_EVENT_POOL` in mock.ts, which is
    keyed by `OrbState` (`idle`/`listening`/`thinking`/`speaking`) so the log
    visibly tracks what the orb is doing rather than running an unrelated
    ticker. `useVoiceInput` only ever produces `idle`/`listening` today —
    `thinking`/`speaking` pools exist and are wired, just unreachable until
    that hook grows those states.
  - Newest line types in via `Typewriter` (~15ms/char) with a blinking caret,
    plus a three-dot `ThinkingDots` while it types. Capped at `MAX_LINES` (50).
    Fully disabled under reduced motion (renders instantly, no caret).
- **Bottom: the text input, full width, transparent** — no filled input
  background, so it reads as part of the same glass panel rather than a
  separate field bolted underneath. Space-to-talk and the mic-denied fallback
  message both still live here / in the top row respectively.
- Stat rings count up 0→value with an ease-out on mount (`requestAnimationFrame`
  tick, not a CSS transition, so the displayed number and the ring stay in
  sync) and re-animate on value change; reduced motion jumps straight to the
  final value.

**Not yet done (later steps):** greeting row is still in the top bar, not the
centre column; Active Agents list is still in the right rail (Step 2 deletes
it); Upcoming Tasks / Recent Activity / Quick Actions are not yet in the
target right-column order (Step 2); the network stage is small/cramped at
1366px — that's Step 3's explicit job ("55-60% of column height, orb +35%"),
not a Step 1 regression to chase.
