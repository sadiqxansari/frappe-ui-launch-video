<script setup lang="ts">
import { computed } from 'vue'

// One of the docs recipes (docs/components/recipes), desktop or mobile.
const props = defineProps<{ p: Record<string, any>; frame: number }>()

// Eager so a screen is on the page by the time the frame is captured.
const files = import.meta.glob('../recipes/*.vue', { eager: true, import: 'default' })

const screen = computed(() => {
  const base = (props.p.name ?? 'tickets') as string
  const name = base[0].toUpperCase() + base.slice(1) + (props.p.mobile ? 'Mobile' : 'Desktop')
  return files[`../recipes/${name}.vue`]
})
</script>

<template>
  <div class="h-full w-full overflow-hidden bg-surface-base">
    <component :is="screen" />
  </div>
</template>
