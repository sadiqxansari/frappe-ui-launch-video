<script setup lang="ts">
import { computed, ref } from 'vue'
import { onFrame } from '../runtime'

// One of the docs stories (src/components/*/stories), rendered at its own
// size and centred. Reports its size so the film can fit it to a tile.
const props = defineProps<{ p: Record<string, any>; frame: number }>()

const files = import.meta.glob('../stories/*.vue', { eager: true, import: 'default' })
const story = computed(() => files[`../stories/${props.p.name}.vue`])

const box = ref<HTMLElement>()
onFrame(() => {
  if (!box.value) return
  ;(window as any).__stage.targets = { size: { x: box.value.offsetWidth, y: box.value.offsetHeight } }
})
</script>

<template>
  <div class="flex h-screen w-screen items-center justify-center overflow-hidden text-ink-gray-8">
    <div ref="box" :style="{ width: p.w ? `${p.w}px` : undefined }">
      <component :is="story" />
    </div>
  </div>
</template>
