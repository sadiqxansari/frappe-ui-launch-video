<script setup lang="ts">
import { computed } from 'vue'
import G from '../wall/geometry.json'
import { CATALOG } from '../wall/catalog'
import ChartTile from '../wall/ChartTile.vue'
import BuildCard from '../wall/BuildCard.vue'
import TileFit from '../wall/TileFit.vue'
import Widget from './Widget.vue'

// Stage two, as one page the film's camera moves over: stage one's card,
// then the bento of real components it sits in.
//   p.card    the card's tile, drawn in around it
//   p.tiles   [{ id, dx, dy, s, o, sh }], every tile on screen (ids index geometry.json)
//   p.fo      frames to add to the clock the live widgets run on
const props = defineProps<{ p: Record<string, any>; frame: number }>()

const files = import.meta.glob('../stories/*.vue', { eager: true, import: 'default' }) as Record<string, any>
const story = (name: string) => files[`../stories/${name}.vue`]

type Rect = { x: number; y: number; w: number; h: number }
const rect = (t: (typeof G.tiles)[number]): Rect => ({
  x: G.margin + t.c * (G.unitW + G.gap),
  y: G.margin + t.r * (G.unitH + G.gap),
  w: t.w * G.unitW + (t.w - 1) * G.gap,
  h: t.h * G.unitH + (t.h - 1) * G.gap,
})
const W = G.margin * 2 + G.cols * (G.unitW + G.gap) - G.gap
const H = G.margin * 2 + G.rows * (G.unitH + G.gap) - G.gap
const home = rect(G.tiles[0])

const beat = 36
const widgetP = (kind: string, f: number, seed: number) => {
  const b = Math.floor((f + seed * 11) / beat)
  switch (kind) {
    case 'switchrow':
      return { kind, on: b % 2 === 0 }
    case 'slider':
      return { kind, value: 30 + ((b * 17) % 50) }
    case 'tabbuttons':
      return { kind, active: b % 3 }
    case 'agent':
      // flat: bordered, not floating, as a tile's content
      return { kind, lines: 3, email: true, digest: b % 2 === 0, flat: true }
    default:
      return { kind }
  }
}
const t0 = computed(() => (props.p.tiles ?? []).find((t: any) => t.id === 0) ?? {})
const style = (t: any) => {
  const r = rect(G.tiles[t.id])
  return {
    left: `${r.x}px`,
    top: `${r.y}px`,
    width: `${r.w}px`,
    height: `${r.h}px`,
    transform: `translate(${t.dx ?? 0}px, ${t.dy ?? 0}px) scale(${t.s ?? 1})`,
    opacity: t.o ?? 1,
    filter: t.sh ? `drop-shadow(0 ${12 * t.sh}px ${16 * t.sh}px rgba(0,0,0,${0.14 * t.sh}))` : undefined,
  }
}
const content = (id: number) => CATALOG[G.tiles[id].name] as any
</script>

<template>
  <div class="relative" :style="{ width: `${W}px`, height: `${H}px` }">
    <div v-for="t in p.tiles ?? []" :key="t.id" class="absolute" :style="style(t)">
      <div
        class="h-full w-full overflow-hidden rounded-8 bg-surface-base ring-1 ring-outline-gray-1"
        :style="t.id === 0 ? { opacity: p.card ?? 0 } : undefined"
      >
        <TileFit v-if="content(t.id).type === 'story'" :w="rect(G.tiles[t.id]).w" :h="rect(G.tiles[t.id]).h">
          <div :style="{ width: content(t.id).w ? `${content(t.id).w}px` : undefined }">
            <component :is="story(content(t.id).name)" />
          </div>
        </TileFit>
        <TileFit v-else-if="content(t.id).type === 'widget'" :w="rect(G.tiles[t.id]).w" :h="rect(G.tiles[t.id]).h">
          <Widget :p="widgetP(content(t.id).kind, frame + (p.fo ?? 0), t.id)" :frame="frame" />
        </TileFit>
        <TileFit v-else-if="content(t.id).type === 'chart'" :w="rect(G.tiles[t.id]).w" :h="rect(G.tiles[t.id]).h">
          <ChartTile :kind="content(t.id).kind" />
        </TileFit>
      </div>
    </div>

    <!-- stage one's card, (about) centred on its tile, its top left pinned
         where the film expects it (CARD_AT in StageTwo.tsx) -->
    <div
      class="absolute"
      :style="{
        left: `${home.x + (home.w - 440) / 2}px`,
        top: `${home.y + 62}px`,
        transform: `translate(${t0.dx ?? 0}px, ${t0.dy ?? 0}px)`,
        opacity: t0.o ?? 1,
      }"
    >
      <BuildCard />
    </div>
  </div>
</template>
