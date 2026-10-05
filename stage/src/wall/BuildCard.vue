<script setup lang="ts">
import { computed } from 'vue'
import { Avatar, Badge, Button } from 'frappe-ui'
import { faceOf } from '../crm/faces'

// The card stage one builds from tokens: the CRM's email activity, narrowed.
// It grows from the title outward, a piece at a time: `s.show` says how far
// in each piece is, and every other key how far along a token is (0 = plain
// Inter, nothing set; 1 = the token), so the film can type a class and have
// it land. Left out, `s` is the finished card, exactly its classes:
//   w-[440px] p-4 bg-surface-elevation-2 border border-outline-gray-1 rounded-6 shadow-sm
// The avatar, the badge and the Reply button are components, dropped in.
type S = Record<string, any>
const props = defineProps<{ s?: S }>()
const DONE: S = {
  pad: 1, bg: 1, ring: 1, r: 12, sh: 1, surf: 'elevation-2',
  name: 1, time: 1, title: 1, to: 1, hr: 1, body: 1, para: 1, ink: [1, 1, 1, 1, 1],
  avatar: 1, badge: 1, buttons: 1, theme: 'amber', btn: 'ghost', icon: 'lucide-reply',
}
const SHOWN: S = { title: 1, body: 1, header: 1, name: 1, time: 1, to: 1, hr: 1, footer: 1 }
const s = computed<S>(() => ({ ...DONE, ...(props.s ?? {}) }))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const c01 = (x: number) => Math.max(0, Math.min(1, x))
const shown = (k: string) => c01({ ...SHOWN, ...(s.value.show ?? {}) }[k] ?? 1)
// black (nothing set) to the ink token, mixed in oklab
const ink = (token: string, t: number) => (t >= 1 ? `var(--${token})` : t <= 0 ? '#000' : `color-mix(in oklab, var(--${token}) ${(t * 100).toFixed(1)}%, #000)`)

// A line of text going from plain Inter to its type token: size, weight,
// letter spacing and line height together.
type Face = { size: number; weight: number; track: number; lh: number }
const RAW: Face = { size: 16, weight: 400, track: 0, lh: 1.21 }
const type = (t: number, to: Face) => {
  const k = c01(t)
  return {
    fontFamily: '"Inter Variable", Inter, sans-serif',
    fontSize: `${lerp(RAW.size, to.size, k)}px`,
    fontWeight: lerp(RAW.weight, to.weight, k),
    letterSpacing: `${lerp(RAW.track, to.track, k)}em`,
    lineHeight: String(lerp(RAW.lh, to.lh, k)),
    fontVariationSettings: "'opsz' 24",
  }
}
const BASE_MED: Face = { size: 14, weight: 500, track: 0.02, lh: 1.35 }
const SM: Face = { size: 13, weight: 420, track: 0.02, lh: 1.35 }
const LG_SEMI: Face = { size: 16, weight: 600, track: 0.02, lh: 1.35 }
const BASE: Face = { size: 14, weight: 420, track: 0.02, lh: 1.35 }

// a piece coming in: fades up from a touch above
const fade = (t: number) => ({ opacity: c01(t * 1.4), transform: `translateY(${-6 * (1 - c01(t))}px)` })
// a piece that opens room for itself (its full height, px)
const room = (t: number, h: number) => ({ height: `${h * t}px`, overflow: 'hidden' })

const CONTENT = 408 // the text column; w-[440px] with p-4 around it
const card = computed(() => ({
  width: `${CONTENT + 32 * s.value.pad}px`,
  padding: `${16 * s.value.pad}px`,
  borderRadius: `${s.value.r}px`,
  // bg-surface-{s.surf}: base, or one of the elevations (a short fade between,
  // which the stage seeks to the frame like any transition)
  background: `color-mix(in oklab, var(--surface-${s.value.surf}) ${s.value.bg * 100}%, transparent)`,
  transition: 'background-color 240ms ease-out',
  // border border-outline-gray-1: a real 1px border (inside w-[440px]), its colour fading in
  border: s.value.ring > 0 ? `1px solid color-mix(in oklab, var(--outline-gray-1) ${Math.min(1, s.value.ring) * 100}%, transparent)` : undefined,
}))
const body = computed(() => {
  const b = type(s.value.body, BASE)
  // text-base → text-p-base: only the leading moves
  if (s.value.body >= 1) b.lineHeight = String(lerp(1.35, 1.5, c01(s.value.para)))
  return b
})
const footer = computed(() => Math.max(s.value.badge, s.value.buttons, shown('footer')))
</script>

<template>
  <div class="relative" :style="card" data-card>
    <!-- shadow-sm, over the card so its inner highlight shows too -->
    <div class="pointer-events-none absolute inset-0" :style="{ borderRadius: card.borderRadius, boxShadow: 'var(--elevation-sm)', opacity: s.sh }" />
    <div class="relative" :style="{ width: `${CONTENT}px` }">
      <!-- header: avatar, name, time (and the gap under it) -->
      <div :style="room(shown('header'), 36)">
        <div class="flex items-center">
          <div class="overflow-hidden" :style="{ width: `${24 * c01(s.avatar)}px`, marginRight: `${8 * c01(s.avatar)}px`, flexShrink: 0 }">
            <div :style="fade(s.avatar)"><Avatar label="Rahul Mehta" :image="faceOf(['Rahul Mehta'], 'Rahul Mehta')" theme="blue" size="md" /></div>
          </div>
          <!-- the name and the time on one baseline -->
          <div class="flex flex-1 items-baseline justify-between gap-2">
            <span data-name :style="{ ...fade(shown('name')), ...type(s.name, BASE_MED), color: ink('ink-gray-8', s.ink[0]) }">Rahul Mehta</span>
            <span :style="{ ...fade(shown('time')), ...type(s.time, SM), position: 'relative', top: '-2px', color: ink('ink-gray-5', s.ink[1]) }">1 day ago</span>
          </div>
        </div>
      </div>
      <div data-title :style="{ ...fade(shown('title')), ...type(s.title, LG_SEMI), color: ink('ink-gray-8', s.ink[2]) }">Updated invoice for March</div>
      <div :style="room(shown('to'), 21.55)">
        <div :style="{ ...fade(shown('to')), ...type(s.to, SM), marginTop: '4px', color: ink('ink-gray-5', s.ink[3]) }">To: Sarah Connor</div>
      </div>
      <!-- the divider opens room for itself between the recipient and the
           paragraph: the browser's own rule first (8px margins, grey), then
           my-3 border-outline-gray-1 -->
      <div :style="room(shown('hr'), 2 * lerp(8, 12, c01(s.hr)) + 1)">
        <div
          :style="{
            ...fade(shown('hr')),
            margin: `${lerp(8, 12, c01(s.hr))}px 0`,
            height: '0px',
            borderTop: `1px solid ${s.hr >= 1 ? 'var(--outline-gray-1)' : `color-mix(in oklab, var(--outline-gray-1) ${c01(s.hr) * 100}%, #9a9a9a)`}`,
          }"
        />
      </div>
      <div data-body :style="{ ...fade(shown('body')), ...body, maxWidth: '340px', color: ink('ink-gray-6', s.ink[4]) }">
        Hi Sarah, I've attached the updated invoice with the corrected amount. Let me know if anything still looks off.
      </div>
      <div :style="room(footer, 44)">
        <div class="flex items-center justify-between" :style="{ marginTop: '16px', height: '28px' }">
          <div data-badge :style="fade(s.badge)"><Badge label="Important" :theme="s.theme" variant="subtle" /></div>
          <div data-btn :style="fade(s.buttons)"><Button :variant="s.btn" label="Reply" :icon-left="s.icon || undefined" /></div>
        </div>
      </div>
    </div>
  </div>
</template>
