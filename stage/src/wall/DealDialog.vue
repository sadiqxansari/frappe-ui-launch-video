<script setup lang="ts">
import { Avatar, Button, DatePicker, Select, Switch, TextInput } from 'frappe-ui'

// CRM's "Create Deal" dialog, a medium one, put together from real
// frappe-ui pieces. The film moves each piece in (p.atoms: an offset, scale
// and opacity per piece), draws the dialog's own surface behind them
// (p.shell, 0 → 1, opening from the Create button's corner) and lifts it
// (p.shadow, a box-shadow). The shell's classes are Dialog.vue's.
const props = defineProps<{ p: Record<string, any> }>()

type Atom = { x?: number; y?: number; s?: number; o?: number }
const at = (id: string) => {
  const a: Atom = props.p.atoms?.[id] ?? {}
  return {
    transform: `translate(${a.x ?? 0}px, ${a.y ?? 0}px) scale(${a.s ?? 1})`,
    opacity: a.o ?? 1,
  }
}

const employees = [
  { label: '1-10', value: '1-10' },
  { label: '11-50', value: '11-50' },
  { label: '51-200', value: '51-200' },
  { label: '201-500', value: '201-500' },
  { label: '500-1000', value: '500-1000' },
]
const statuses = [
  { label: 'Qualification', value: 'Qualification' },
  { label: 'Demo/Making', value: 'Demo/Making' },
  { label: 'Proposal/Quotation', value: 'Proposal/Quotation' },
]
const owners = [{ label: 'Sarah Connor', value: 'sarah' }]
</script>

<template>
  <div class="relative w-[512px]">
    <!-- the surface, drawn behind the pieces -->
    <div
      class="absolute inset-0 rounded-7 bg-surface-elevation-1"
      :style="{
        // the surface opening from the corner; dropped once open, since a
        // clip-path also cuts away the box-shadow outside the box
        clipPath: (p.shell ?? 1) >= 0.999 ? undefined : `inset(${(1 - (p.shell ?? 1)) * 100}% 0 0 ${(1 - (p.shell ?? 1)) * 100}% round 16px)`,
        // a shadow while it floats; in its tile, a border instead (p.border)
        boxShadow: [p.shadow && p.shadow !== 'none' ? p.shadow : '', p.border ? `inset 0 0 0 1px color-mix(in srgb, var(--outline-gray-2) ${p.border * 100}%, transparent)` : ''].filter(Boolean).join(', ') || 'none',
      }"
    />
    <div class="relative px-6 pb-6 pt-5">
      <div class="mb-6 flex items-center justify-between">
        <h3 class="text-2xl-semibold leading-6 text-ink-gray-8" :style="at('title')" data-atom="title">Create Deal</h3>
        <div :style="at('x')" data-atom="x"><Button variant="ghost" icon="lucide-x" /></div>
      </div>
      <div class="mb-5" :style="at('switch')" data-atom="switch">
        <Switch label="Choose existing organization" :model-value="!!p.existing" size="sm" />
      </div>
      <div class="grid grid-cols-2 gap-x-4 gap-y-4">
        <div :style="at('org')" data-atom="org"><TextInput label="Organization" model-value="Acme Corp" /></div>
        <div :style="at('website')" data-atom="website"><TextInput label="Website" model-value="acmecorp.example.com" /></div>
        <div :style="at('revenue')" data-atom="revenue">
          <TextInput label="Annual revenue" model-value="5,000,000">
            <template #prefix><span class="text-base text-ink-gray-5">$</span></template>
          </TextInput>
        </div>
        <div :style="at('employees')" data-atom="employees"><Select label="No. of employees" :options="employees" model-value="201-500" /></div>
        <div :style="at('status')" data-atom="status">
          <Select label="Status" :options="statuses" model-value="Demo/Making">
            <template #prefix><span class="mx-0.5 size-2 rounded-full bg-surface-orange-5" /></template>
          </Select>
        </div>
        <div :style="at('owner')" data-atom="owner">
          <Select label="Deal owner" :options="owners" model-value="sarah">
            <template #prefix><Avatar size="xs" label="Sarah Connor" theme="violet" /></template>
          </Select>
        </div>
        <div :style="at('close')" data-atom="close"><DatePicker label="Expected close date" model-value="2026-10-30" /></div>
        <div :style="at('probability')" data-atom="probability">
          <TextInput label="Probability" model-value="25">
            <template #suffix><span class="text-base text-ink-gray-5">%</span></template>
          </TextInput>
        </div>
      </div>
    </div>
    <div class="relative flex justify-end px-6 pb-7 pt-4">
      <!-- the film's own Button sits here until it is handed over -->
      <div data-create :style="{ opacity: p.createReal ? 1 : 0 }">
        <Button variant="solid" label="Create" />
      </div>
    </div>
  </div>
</template>
