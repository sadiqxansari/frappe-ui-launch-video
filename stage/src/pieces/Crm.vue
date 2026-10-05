<script setup lang="ts">
import CrmSidebar from '../crm/CrmSidebar.vue'
import DashboardView from '../crm/DashboardView.vue'
import DealView from '../crm/DealView.vue'
import BrandMenu from '../crm/BrandMenu.vue'
import { onFrame } from '../runtime'

// Frappe CRM, rebuilt from frappe-ui for the film: the deal page, and the
// dashboard with the new charts. 1600 × 900.
//   p.view    'deal' | 'dashboard'
//   p.at      per-block offsets, for putting the page together
//   p.layer   show one layer only (the isometric shot stacks several copies)
//   p.bg      the page's own background, 0 → 1 (it starts bare, on the film's paper)
//   p.menu / p.menuHi / p.darkOn   the app menu, open over the rail
//   p.live / p.count / p.scroll / p.off / p.hover   the dashboard, as in Charts.vue
const props = defineProps<{ p: Record<string, any>; frame: number }>()
const show = (layer: string) => !props.p.layer || props.p.layer === layer
const at = (id: string) => {
  const a = props.p.at?.[id] ?? {}
  return { transform: `translate(${a.x ?? 0}px, ${a.y ?? 0}px) scale(${a.s ?? 1})`, opacity: a.o ?? 1 }
}

// Legend: click the real legend button until its state matches the film.
onFrame(async (_f, p) => {
  const off: string[] = p.off ?? []
  document.querySelectorAll<HTMLButtonElement>('button[aria-pressed][aria-label]').forEach((btn) => {
    const name = btn.getAttribute('aria-label')!.replace(/^(Hide|Show) /, '')
    const isOff = btn.getAttribute('aria-pressed') === 'false'
    if (off.includes(name) !== isOff) btn.click()
  })
})

// Hover: a real mousemove on whatever is under the point (page px).
let hovered: Element | null = null
onFrame(async (_f, p) => {
  const h = p.hover as { x: number; y: number } | null | undefined
  if (h) {
    ;(window as any).__clock.flush()
    let el = document.elementFromPoint(h.x, h.y)
    const ec = [...document.querySelectorAll('[_echarts_instance_]')].find((e) => {
      const r = e.getBoundingClientRect()
      return h.x >= r.left && h.x <= r.right && h.y >= r.top && h.y <= r.bottom
    })
    if (ec && el && !ec.contains(el)) el = ec.firstElementChild ?? ec
    if (ec && !ec.querySelector('svg path, canvas')) return
    if (hovered !== el) {
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
    await new Promise((r) => setTimeout(r, 0))
  } else if (hovered) {
    hovered.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, clientX: -10, clientY: -10 }))
    hovered.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }))
    hovered = null
  }
})
</script>

<template>
  <div
    class="relative isolate flex h-[900px] w-[1600px] text-ink-gray-8"
    :class="{ 'overflow-hidden': !p.open }"
    :style="{ borderRadius: p.radius ? `${p.radius}px` : undefined, marginTop: p.pad ? `${p.pad}px` : undefined }"
  >
    <div v-if="!p.layer || p.layer === 'base'" class="absolute inset-0 -z-10 bg-surface-base" :style="{ opacity: p.bg ?? 1, borderRadius: p.radius ? `${p.radius}px` : undefined }" />
    <div class="h-full shrink-0" :style="{ ...at('sidebar'), visibility: show('sidebar') ? 'visible' : 'hidden' }">
      <CrmSidebar :active="p.nav ?? 'deals'" :at="p.at" :open="p.open" :faces="p.faces" :pressed="p.menu" />
    </div>
    <DealView v-if="(p.view ?? 'deal') === 'deal'" :p="p" :show="show" />
    <DashboardView v-else-if="show('feed')" :p="p" />
    <BrandMenu v-if="p.menu > 0" class="!absolute left-[10px] top-[46px]" :o="p.menu" :hi="p.menuHi" :dark="p.darkOn" />
  </div>
</template>
