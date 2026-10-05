<script setup lang="ts">
import { Alert, Avatar, Badge, Button, Progress, Slider, Switch, TabButtons, TextInput } from 'frappe-ui'

// The collage the dark-mode split slides across: three cards and an alert,
// all real frappe-ui. Laid out on a 1280 × 720 canvas.
defineProps<{ p: Record<string, any>; frame: number }>()

const tabs = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
]
</script>

<template>
  <div class="relative h-[720px] w-[1280px]">
    <!-- Ticket -->
    <div class="absolute left-[60px] top-[150px] w-[400px] rounded-7 bg-surface-base p-5 shadow-lg ring-1 ring-outline-gray-1">
      <div class="flex items-center gap-2.5">
        <Avatar label="Priya Nair" size="md" theme="blue" />
        <span class="text-base font-medium text-ink-gray-8">Priya Nair</span>
        <span class="ml-auto text-base text-ink-gray-5">2m ago</span>
      </div>
      <div class="mt-4 text-lg font-semibold text-ink-gray-9">Payment failed on renewal</div>
      <p class="mt-1.5 text-p-base text-ink-gray-6">
        The card on file was declined twice. Can you retry before the site is suspended?
      </p>
      <div class="mt-3.5 flex gap-1.5">
        <Badge label="Urgent" theme="red" />
        <Badge label="Billing" theme="gray" />
        <Badge label="Open" theme="blue" />
      </div>
      <div class="-mx-5 mb-4 mt-5 border-t border-outline-gray-1" />
      <div class="flex justify-end gap-2">
        <Button variant="subtle" size="md" label="Close" />
        <Button variant="solid" size="md" label="Reply" />
      </div>
    </div>

    <!-- Settings -->
    <div class="absolute left-[490px] top-[120px] w-[340px] rounded-7 bg-surface-base px-3 py-2 shadow-lg ring-1 ring-outline-gray-1">
      <Switch label="Email alerts" icon="lucide-bell" padded :model-value="true" size="md" />
      <Switch label="Weekly digest" icon="lucide-calendar-days" padded :model-value="!!p.digest" size="md" />
      <Switch label="Dark mode" icon="lucide-moon" padded :model-value="true" size="md" />
      <div class="border-t border-outline-gray-1 px-3 pb-4 pt-3">
        <div class="mb-3 text-sm text-ink-gray-5">Density</div>
        <Slider :model-value="[p.density ?? 40]" :min="0" :max="100" />
      </div>
    </div>

    <!-- Filters -->
    <div class="absolute left-[860px] top-[190px] flex w-[380px] flex-col gap-4 rounded-7 bg-surface-base p-5 shadow-lg ring-1 ring-outline-gray-1">
      <TextInput model-value="renewal" variant="subtle">
        <template #prefix><span class="lucide-search size-4 text-ink-gray-5" /></template>
      </TextInput>
      <div class="flex items-center justify-between">
        <TabButtons :options="tabs" model-value="week" />
        <div class="flex -space-x-1.5">
          <Avatar v-for="(n, i) in ['Ana Lopez', 'Rahul Shah', 'Mei Chen']" :key="n" :label="n" size="md" :theme="(['violet', 'green', 'amber'] as const)[i]" :style="{ boxShadow: '0 0 0 2px var(--surface-base)' }" />
        </div>
      </div>
      <Progress :value="64" label="Storage" hint />
    </div>

    <!-- Alert -->
    <div class="absolute left-[490px] top-[470px] w-[340px] rounded-7 bg-surface-base p-2 shadow-lg ring-1 ring-outline-gray-1">
      <Alert theme="green" title="Ticket assigned" description="Priya's ticket is now yours." />
    </div>
  </div>
</template>
