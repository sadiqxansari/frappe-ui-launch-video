<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

// Centres its content in a tile at its own size, scaling it down only if
// it would not fit. Measured once, on mount (the content's size never changes with time, so neither does this).
const props = defineProps<{ w: number; h: number; max?: number }>()
const box = ref<HTMLElement>()
const s = ref(1)
onMounted(async () => {
  await nextTick()
  const el = box.value
  if (!el) return
  s.value = Math.min(props.max ?? 1, (props.w - 40) / el.offsetWidth, (props.h - 28) / el.offsetHeight)
})
</script>

<template>
  <div class="flex h-full w-full items-center justify-center">
    <div ref="box" class="shrink-0 text-ink-gray-8" :style="{ transform: `scale(${s})` }"><slot /></div>
  </div>
</template>
