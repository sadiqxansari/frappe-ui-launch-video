<script setup lang="ts">
import { nextTick, ref } from 'vue'
import Dashboard from '../dashboard/Dashboard.vue'
import { onFrame } from '../runtime'

// The charts docs' own dashboard (frappe-ui/charts), driven by the film.
//   p.go      the first chart (p.first) mounts and draws in
//   p.reveal  every other chart mounts once it is in view, so it draws in as
//             the page scrolls to it
//   p.scroll  where the film has scrolled to, in px; the film moves the
//             whole (tall) page itself, this only decides what is in view
//   p.view    the height of the film's window onto the page
//   p.off     legend items to switch off, by label (a real click on the legend)
//   p.hover   a point to hover, in page px (a real mousemove)
defineProps<{ p: Record<string, any>; frame: number }>()

const live = ref<string[]>([])
const scroller = ref<HTMLElement>()

onFrame(async (_f, p) => {
  if (!scroller.value) return
  const next = new Set(live.value)
  if (p.go && p.first) next.add(p.first)
  if (p.reveal) {
    scroller.value.querySelectorAll<HTMLElement>('[data-chart]').forEach((el) => {
      if (el.getBoundingClientRect().top - (p.scroll ?? 0) < (p.view ?? innerHeight) - 60) next.add(el.dataset.chart!)
    })
  }
  if (next.size !== live.value.length) {
    live.value = [...next]
    await nextTick()
  }
})

// Legend: click the real legend button until its state matches the film.
onFrame(async (_f, p) => {
  const off: string[] = p.off ?? []
  document.querySelectorAll<HTMLButtonElement>('button[aria-pressed][aria-label]').forEach((btn) => {
    const name = btn.getAttribute('aria-label')!.replace(/^(Hide|Show) /, '')
    const isOff = btn.getAttribute('aria-pressed') === 'false'
    if (off.includes(name) !== isOff) btn.click()
  })
})

// Hover: a real mousemove on whatever is under the point, so echarts' own
// hit testing drives the axis pointer and the Vue tooltip.
let hovered: Element | null = null
onFrame(async (_f, p) => {
  const h = p.hover as { x: number; y: number } | null | undefined
  if (h) {
    // let echarts apply this frame's mounts before hit testing
    await nextTick()
    ;(window as any).__clock.flush()
    let el = document.elementFromPoint(h.x, h.y)
    // An HTML overlay (a donut's centre label) can sit over the plot; send
    // the pointer to the echarts root under the point instead.
    const ec = [...document.querySelectorAll('[_echarts_instance_]')].find((e) => {
      const r = e.getBoundingClientRect()
      return h.x >= r.left && h.x <= r.right && h.y >= r.top && h.y <= r.bottom
    })
    if (ec && el && !ec.contains(el)) el = ec.firstElementChild ?? ec
    // A chart created this very frame has no option yet; echarts throws if
    // it is hovered before its first draw. Wait for the next frame.
    if (ec && !ec.querySelector('svg path, canvas')) return
    if (hovered !== el) {
      // enter/leave for plain-DOM charts (FunnelChart hovers on mouseenter)
      hovered?.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, clientX: h.x, clientY: h.y, relatedTarget: el }))
      hovered?.dispatchEvent(new MouseEvent('mouseleave', { clientX: h.x, clientY: h.y }))
      el?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: h.x, clientY: h.y }))
      el?.dispatchEvent(new MouseEvent('mouseenter', { clientX: h.x, clientY: h.y }))
    }
    for (const dx of [-1, 0]) {
      el?.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: h.x + dx, clientY: h.y }))
      el?.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: h.x + dx, clientY: h.y, pointerType: 'mouse' }))
    }
    hovered = el
    // echarts shows its axis pointer from a zero-delay timer
    await new Promise((r) => setTimeout(r, 0))
  } else if (hovered) {
    hovered.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, clientX: -10, clientY: -10 }))
    hovered.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }))
    hovered = null
  }
})

// Where things are, for the film's camera and cursor: each card, and each
// legend item as `legend:<label>`.
onFrame(() => {
  if (!scroller.value) return
  const t: Record<string, any> = {}
  scroller.value.querySelectorAll<HTMLElement>('[data-chart]').forEach((el) => {
    const r = el.getBoundingClientRect()
    t[el.dataset.chart!] = { x: r.left, y: r.top, w: r.width, h: r.height }
  })
  document.querySelectorAll<HTMLButtonElement>('button[aria-pressed][aria-label]').forEach((btn) => {
    const r = btn.getBoundingClientRect()
    t[`legend:${btn.getAttribute('aria-label')!.replace(/^(Hide|Show) /, '')}`] = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  })
  ;(window as any).__stage.targets = t
})
</script>

<template>
  <div ref="scroller" class="h-screen w-screen overflow-hidden bg-surface-base">
    <div class="px-8 py-7">
      <Dashboard :live="live" />
    </div>
  </div>
</template>
