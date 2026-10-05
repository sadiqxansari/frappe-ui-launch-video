<script setup lang="ts">
import { Alert, Avatar, Badge, Button, Checkbox, Progress, Rating, Slider, Switch, TabButtons, TextInput, Tooltip, toast } from 'frappe-ui'
import { ref } from 'vue'
import { onFrame } from '../runtime'

// One real frappe-ui component (or a small group), picked by p.kind, with its
// state set by the film for this frame.
defineProps<{ p: Record<string, any>; frame: number }>()

const tabs = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
]
const people = ['Priya Nair', 'Rahul Shah', 'Mei Chen', 'Ana Lopez', 'Omar Haddad']
const themes = ['blue', 'green', 'amber', 'violet', 'red'] as const

// Tooltip opens on hover: send the trigger a real pointer move once asked.
const tipRoot = ref<HTMLElement>()
let tipOpen = false
onFrame(async (_f, p) => {
  if (p.kind !== 'tooltip' || !tipRoot.value) return
  if (p.open && !tipOpen) {
    const trigger = tipRoot.value.querySelector('[data-slot="trigger"], button') as HTMLElement
    trigger?.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse' }))
    tipOpen = true
    await new Promise((r) => setTimeout(r, 30))
  }
})

// Toasts come from the real toast() API, into FrappeUIProvider's toaster.
let toasted = false
onFrame(async (_f, p) => {
  if (p.kind !== 'toast' || toasted || !p.show) return
  toast.success(p.title ?? 'Invite sent', { description: p.body, duration: Infinity })
  toasted = true
  await new Promise((r) => setTimeout(r, 30))
})

</script>

<template>
  <div class="flex h-full w-full items-center justify-center">
    <div v-if="p.kind === 'buttons'" class="flex gap-2">
      <Button variant="solid" size="md" label="Solid" />
      <Button variant="subtle" size="md" label="Subtle" />
      <Button variant="outline" size="md" label="Outline" />
    </div>

    <!-- the playground's Button, as its knobs leave it -->
    <Button v-else-if="p.kind === 'deploy'" variant="subtle" theme="gray" size="lg" icon-left="lucide-plus" label="Deploy" />

    <div v-else-if="p.kind === 'alert'" class="w-[680px]">
      <Alert theme="green" title="Deal won" description="Acme Corp signed for 200 seats. The invoice is on its way." />
    </div>

    <div v-else-if="p.kind === 'switchrow'" class="w-[320px]">
      <Switch label="Email me when a deal moves" :model-value="!!p.on" size="md" />
    </div>

    <Switch v-else-if="p.kind === 'switch'" :model-value="!!p.on" :size="p.size ?? 'md'" />

    <div v-else-if="p.kind === 'checkbox'" class="flex flex-col gap-2">
      <Checkbox label="Email me" :model-value="!!p.a" />
      <Checkbox label="Weekly digest" :model-value="!!p.b" />
      <Checkbox label="Beta features" :model-value="false" />
    </div>

    <div v-else-if="p.kind === 'badges'" class="flex max-w-[220px] flex-wrap justify-center gap-1.5">
      <Badge label="Open" theme="blue" />
      <Badge label="Paid" theme="green" />
      <Badge label="Urgent" theme="red" />
      <Badge label="Draft" theme="gray" />
      <Badge label="Review" theme="violet" />
    </div>

    <TextInput
      v-else-if="p.kind === 'textinput'"
      class="w-[220px]"
      variant="outline"
      placeholder="Title"
      :model-value="p.value ?? ''"
    />

    <TabButtons v-else-if="p.kind === 'tabbuttons'" :options="tabs" :model-value="tabs[p.active ?? 0].value" />

    <div v-else-if="p.kind === 'slider'" class="w-[220px]">
      <Slider :model-value="[p.value ?? 40]" :min="0" :max="100" />
    </div>

    <div v-else-if="p.kind === 'progress'" class="w-[240px]">
      <Progress :value="p.value ?? 0" label="Uploading" hint />
    </div>

    <!-- stacked; a ring in the page colour cuts each out of the one under it,
         as frappe-ui's Assignees story does -->
    <div v-else-if="p.kind === 'avatars'" class="flex -space-x-2">
      <Avatar v-for="(n, i) in people" :key="n" :label="n" size="xl" :theme="themes[i]" :style="{ boxShadow: '0 0 0 2px var(--surface-base)' }" />
    </div>

    <div v-else-if="p.kind === 'tooltip'" ref="tipRoot" class="pt-10">
      <Tooltip text="Copy link" :hover-delay="0">
        <Button variant="outline" size="md" label="Share" />
      </Tooltip>
    </div>

    <div v-else-if="p.kind === 'toast'" />

    <Rating v-else-if="p.kind === 'rating'" :model-value="p.value ?? 0" />

    <div v-else-if="p.kind === 'agent'" class="w-[360px] rounded-7 bg-surface-base p-2 ring-1" :class="p.flat ? 'ring-outline-gray-2' : 'shadow-lg ring-outline-gray-1'">
      <div class="px-3 pb-1 pt-2 text-lg font-semibold text-ink-gray-9">Notifications</div>
      <Switch v-if="p.lines >= 1" label="Email alerts" icon="lucide-bell" padded size="md" :model-value="!!p.email" />
      <Switch v-if="p.lines >= 2" label="Weekly digest" icon="lucide-calendar-days" padded size="md" :model-value="!!p.digest" />
      <div v-if="p.lines >= 3" class="flex justify-end px-3 pb-2 pt-3">
        <Button variant="solid" size="md" label="Save" />
      </div>
    </div>

    <div v-else-if="p.kind === 'form'" class="flex w-[300px] flex-col gap-3">
      <TextInput variant="outline" :model-value="p.value ?? ''" placeholder="Title" />
      <div class="flex gap-2">
        <Button variant="outline" size="md" label="Cancel" />
        <Button variant="solid" size="md" label="Save" />
      </div>
    </div>
  </div>
</template>
