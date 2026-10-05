<script setup lang="ts">
import { ItemListRow, Switch } from 'frappe-ui'
// frappe-ui's own menu classes (Menu/utils menuClasses)
const menuClasses = {
  content: 'z-[100] min-w-40 divide-y divide-outline-elevation-2 rounded-6 bg-surface-elevation-2 shadow-2xl ring-1 ring-black ring-opacity-5',
  group: 'p-1.5',
  itemIcon: 'size-4 shrink-0',
  chevronIcon: 'size-4 shrink-0',
}

// The CRM's app menu, as frappe-ui's Dropdown draws it, held open by the film.
//   o     0 → 1, open
//   hi    the row under the cursor
//   dark  the Dark mode switch
defineProps<{ o: number; hi?: string | null; dark?: boolean }>()
const groups = [
  [
    { id: 'apps', label: 'Apps', icon: 'lucide-layout-grid', chevron: true },
    { id: 'docs', label: 'Docs', icon: 'lucide-book-open' },
    { id: 'support', label: 'Support', icon: 'lucide-life-buoy' },
  ],
  [
    { id: 'dark', label: 'Dark mode', icon: 'lucide-moon', switch: true },
    { id: 'settings', label: 'Settings', icon: 'lucide-settings' },
  ],
  [{ id: 'logout', label: 'Log out', icon: 'lucide-log-out' }],
]
</script>

<template>
  <div
    data-brand-menu
    :class="[menuClasses.content, 'w-56 [&_*]:!transition-none']"
    :style="{ opacity: o, transform: `translateY(${(1 - o) * -4}px) scale(${0.98 + 0.02 * o})`, transformOrigin: 'top left' }"
  >
    <div v-for="(g, gi) in groups" :key="gi" :class="menuClasses.group">
      <ItemListRow v-for="it in g" :key="it.id" :data-item="it.id" :active="hi === it.id">
        <template #prefix><span :class="[it.icon, menuClasses.itemIcon, 'text-ink-gray-6']" /></template>
        <template #label><div class="truncate leading-tighter text-ink-gray-7">{{ it.label }}</div></template>
        <template v-if="it.switch || it.chevron" #suffix>
          <Switch v-if="it.switch" class="ml-auto" :model-value="!!dark" />
          <span v-else :class="['lucide-chevron-right', menuClasses.chevronIcon, 'text-ink-gray-6']" />
        </template>
      </ItemListRow>
    </div>
  </div>
</template>
