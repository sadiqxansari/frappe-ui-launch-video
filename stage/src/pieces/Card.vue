<script setup lang="ts">
import { onMounted } from 'vue'
import { preloadFaces } from '../crm/faces'
import { onFrame } from '../runtime'
import BuildCard from '../wall/BuildCard.vue'

// Stage one's card, on a page of surface-base, its top left pinned at
// (60, 60) so it grows only right and down as tokens land.
//   p.s   the build (see BuildCard); left out, the finished card
// Reports where the body, the badge and the card are (page px), for the
// film's guides.
defineProps<{ p: Record<string, any> }>()
onMounted(preloadFaces)
const box = (sel: string) => {
  const r = document.querySelector(sel)?.getBoundingClientRect()
  return r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null
}
onFrame(() => {
  const t: Record<string, any> = {}
  for (const k of ['card', 'body', 'badge', 'title', 'name', 'btn']) {
    const b = box(`[data-${k}]`)
    if (b) {
      t[`${k}0`] = { x: b.x, y: b.y }
      t[`${k}1`] = { x: b.x + b.w, y: b.y + b.h }
    }
  }
  ;(window as any).__stage.targets = t
})
</script>

<template>
  <div class="h-screen w-screen bg-surface-base">
    <div class="absolute left-[60px] top-[60px]"><BuildCard :s="p.s" /></div>
  </div>
</template>
