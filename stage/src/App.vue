<script setup lang="ts">
import { FrappeUIProvider } from 'frappe-ui'
import { state } from './runtime'
import Widget from './pieces/Widget.vue'
import Mosaic from './pieces/Mosaic.vue'
import Recipe from './pieces/Recipe.vue'
import Docs from './pieces/Docs.vue'
import Story from './pieces/Story.vue'
import Charts from './pieces/Charts.vue'
import Wall from './pieces/Wall.vue'
import Crm from './pieces/Crm.vue'
import Card from './pieces/Card.vue'

const pieces: Record<string, any> = { widget: Widget, mosaic: Mosaic, recipe: Recipe, docs: Docs, story: Story, charts: Charts, wall: Wall, crm: Crm, card: Card }
</script>

<template>
  <FrappeUIProvider>
    <div :style="{ zoom: state.zoom, width: `${100 / state.zoom}vw`, height: `${100 / state.zoom}vh` }">
      <component :is="pieces[state.piece]" :p="state.p" :frame="state.frame" />
    </div>
  </FrappeUIProvider>
</template>
