import { nextTick, reactive } from 'vue'

// The film drives this page one video frame at a time through
// window.__stage.set(). Each call applies that frame's state, lets Vue
// render, then pauses every running CSS transition/animation and seeks it to
// where it would be at this frame. That keeps frappe-ui's own motion but
// makes it a pure function of the frame, which frame-by-frame rendering needs.

export const state = reactive({
  piece: location.hash.replace('#', '') || 'widget',
  frame: 0,
  p: {} as Record<string, any>,
  zoom: 1,
})

const started = new WeakMap<Animation, number>()
let lastFrame = -999

// A transition first seen on this frame started at this frame when the film
// plays straight through. When the stage jumps (a still, a scrub, or a render
// tab that skipped frames), assume it started right after the last frame we
// saw, or long ago if that was far back, so settled states still render.
function seekAnimations(frame: number) {
  // Flush style so transitions triggered by this update exist now.
  getComputedStyle(document.body).opacity
  const gap = frame - lastFrame
  const origin = gap === 1 || gap === 0 ? frame : gap > 1 && gap <= 16 ? lastFrame + 1 : frame - 600
  for (const a of document.getAnimations()) {
    if (!started.has(a)) {
      started.set(a, origin)
      a.pause()
    }
    a.currentTime = Math.max(0, ((frame - started.get(a)!) * 1000) / 60)
  }
}

const clock = (window as any).__clock as { realRAF: typeof requestAnimationFrame; now: number; advance(ms: number): void; flush(): number }
const raf = () => new Promise((r) => clock.realRAF(() => r(null)))
const MS = 1000 / 60

// Run whatever is waiting on the (virtual) next frame, a few rounds deep:
// Vue's transitions wait two frames, echarts re-queues itself every frame.
async function flush() {
  for (let k = 0; k < 3; k++) {
    clock.flush()
    await nextTick()
  }
}

type Hook = (frame: number, p: Record<string, any>) => Promise<void> | void
const hooks = new Set<Hook>()
export const onFrame = (h: Hook) => {
  hooks.add(h)
  return () => hooks.delete(h)
}

// Every image on the page loaded (or failed), so a frame never captures one
// half in: an avatar's face, a story's picture.
const images = () =>
  Promise.all(
    [...document.images]
      .filter((i) => !i.complete)
      .map((i) => new Promise((r) => {
        i.addEventListener('load', r, { once: true })
        i.addEventListener('error', r, { once: true })
        setTimeout(r, 5000)
      })),
  )

// rAF time is the frame's time plus an offset that only grows (on a jump),
// so playing straight through, a chart's motion lands on the same frames
// however the frames arrive.
let offset = 0
const timeOf = (frame: number) => frame * MS + offset

async function apply(frame: number, p: Record<string, any>, theme: string, zoom: number) {
  const gap = frame - lastFrame
  const jump = gap < 0 || gap > 16
  // A change seen after skipped frames started on the first skipped one.
  if (!jump) clock.advance(timeOf(lastFrame + 1) - clock.now)
  // Only on a real change: frappe-ui charts watch this attribute and re-draw
  // (restarting their animation) on every write, even an unchanged one.
  if (document.documentElement.getAttribute('data-theme') !== theme) document.documentElement.setAttribute('data-theme', theme)
  state.frame = frame
  state.p = p
  state.zoom = zoom
  await nextTick()
  for (const h of hooks) await h(frame, p)
  await nextTick()
  await flush()
  if (jump) {
    // (a still, a scrub): let whatever this state started settle, as it
    // would have when played
    await raf()
    await flush()
    offset = clock.now + 3000 - frame * MS
  }
  await images()
  clock.advance(timeOf(frame) - clock.now)
  await flush()
  seekAnimations(frame)
  await raf()
  await flush()
  seekAnimations(frame)
  lastFrame = frame
}

// One frame at a time. In the Studio the player asks for frames faster than
// a page can draw them; keep only the newest request, so the page is never
// working on two frames at once and never falls behind.
let running = false
let queued: { args: Parameters<typeof apply>; done: (() => void)[] } | null = null
function set(...args: Parameters<typeof apply>) {
  return new Promise<void>((resolve) => {
    if (queued) {
      queued.args = args
      queued.done.push(resolve)
    } else queued = { args, done: [resolve] }
    if (!running) pump()
  })
}
async function pump() {
  running = true
  while (queued) {
    const job = queued
    queued = null
    await apply(...job.args)
    job.done.forEach((r) => r())
  }
  running = false
}

export const ready = (async () => {
  await document.fonts.ready
  await raf()
})()

;(window as any).__stage = { set, ready }
