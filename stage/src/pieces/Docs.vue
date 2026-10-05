<script setup lang="ts">
import { Breadcrumbs, Button } from 'frappe-ui'
import propsData from './buttonProps.json'
import { ref } from 'vue'
import { onFrame } from '../runtime'
import ButtonPlayground from './ButtonPlayground.vue'

// ui.frappe.io's Button page: docs chrome around the real PlaygroundFrame and
// the real Button.playground.vue. The film sets the knob values it wants and
// this piece clicks the real knob controls to get there, and
// reports where its controls are so the film's cursor can aim at them.
defineProps<{ p: Record<string, any>; frame: number }>()

const nav = [
  ['Getting Started', ['Introduction', 'Installation', 'Frappe app', 'Tailwind Setup']],
  ['Foundations', ['Colors', 'Typography', 'Radius', 'Shadows']],
  ['Components', ['Alert', 'Avatar', 'Badge', 'Breadcrumbs', 'Button', 'Checkbox', 'Combobox', 'Dialog']],
] as const

const root = ref<HTMLElement>()

function knobBox(name: string) {
  const labels = [...root.value!.querySelectorAll('.knob-label')] as HTMLElement[]
  return labels.find((l) => l.textContent?.trim() === name)?.parentElement ?? null
}

function setTabs(name: string, value: string) {
  const box = knobBox(name)
  const btn = [...(box?.querySelectorAll('button, [role="radio"]') ?? [])].find(
    (b) => b.textContent?.trim() === value,
  ) as HTMLElement | undefined
  if (btn && btn.getAttribute('aria-checked') !== 'true' && btn.getAttribute('data-state') !== 'checked' && btn.getAttribute('data-state') !== 'active') btn.click()
}

function setSwitch(name: string, on: boolean) {
  const sw = knobBox(name)?.querySelector('[role="switch"]') as HTMLElement | null
  if (sw && (sw.getAttribute('aria-checked') === 'true') !== on) sw.click()
}

function setText(name: string, value: string) {
  const input = root.value!.querySelector(`input[aria-label="${name}"]`) as HTMLInputElement | null
  if (!input || input.value === value) return
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  setter.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

onFrame(async (_f, p) => {
  if (!root.value || !p.knobs) return
  const k = p.knobs
  setText('label', k.label)
  setTabs('variant', k.variant)
  setTabs('theme', k.theme)
  setTabs('size', k.size)
  setSwitch('iconLeft', !!k.iconLeft)
  setSwitch('loading', !!k.loading)
  // let shiki re-highlight the code block
  await new Promise((r) => setTimeout(r, 40))
})

// Where the film's cursor should aim, in page coordinates, measured from
// the real knob controls after each frame.
function rect(el: Element | null | undefined) {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}
function tabRect(name: string, value: string) {
  const box = knobBox(name)
  return rect([...(box?.querySelectorAll('button, [role="radio"]') ?? [])].find((b) => b.textContent?.trim() === value))
}
onFrame(() => {
  if (!root.value) return
  ;(window as any).__stage.targets = {
    solid: tabRect('variant', 'solid'),
    subtle: tabRect('variant', 'subtle'),
    gray: tabRect('theme', 'gray'),
    red: tabRect('theme', 'red'),
    lg: tabRect('size', 'lg'),
    iconLeft: rect(knobBox('iconLeft')?.querySelector('[role="switch"]')),
    loading: rect(knobBox('loading')?.querySelector('[role="switch"]')),
    label: rect(root.value.querySelector('input[aria-label="label"]')),
    toggle: rect(root.value.querySelector('[data-target="toggle"]')),
    preview: rect(root.value.querySelector('[data-target="preview"]')),
  }
})
</script>

<template>
  <div ref="root" class="flex h-screen w-[1200px] overflow-hidden bg-surface-base text-ink-gray-8">
    <aside class="w-[220px] shrink-0 border-r border-outline-gray-1 bg-surface-sidebar px-2.5 py-3">
      <div class="flex items-center gap-2 px-2 pb-3">
        <svg width="22" height="22" viewBox="0 0 44 44">
          <path d="M31.4286 0H12.5714C5.62842 0 0 5.62842 0 12.5714V31.4286C0 38.3716 5.62842 44 12.5714 44H31.4286C38.3716 44 44 38.3716 44 31.4286V12.5714C44 5.62842 38.3716 0 31.4286 0Z" fill="#B352FF" />
          <path d="M34.5716 16.4998V13.3569H30.643V9.42834H27.5001V13.3569H16.5001V9.42834H13.3573V13.3569H9.42871V16.4998H13.3573H16.5001H16.8459H27.5001V27.4998H16.5001V20.5854H13.3573V27.4998H9.42871V30.6426H13.3573V34.5712H16.5001V30.6426H27.5001V34.5712H30.643V30.6426H34.5716V27.4998H30.643V16.4998H34.5716Z" fill="white" />
        </svg>
        <span class="text-base font-semibold text-ink-gray-9">Frappe UI</span>
      </div>
      <div class="mx-1 mb-3 flex h-7 items-center gap-2 rounded-4 bg-surface-gray-2 px-2 text-base text-ink-gray-5">
        <span class="lucide-search size-4" /> Search <span class="ml-auto text-sm">⌘ K</span>
      </div>
      <div v-for="[title, items] in nav" :key="title" class="mb-4">
        <div class="px-2 pb-1.5 text-base text-ink-gray-5">{{ title }}</div>
        <div
          v-for="item in items"
          :key="item"
          class="flex h-7 items-center rounded-4 px-2 text-base"
          :class="item === 'Button' ? 'bg-surface-gray-3 font-medium text-ink-gray-9 shadow-sm' : 'text-ink-gray-7'"
        >
          {{ item }}
        </div>
      </div>
    </aside>

    <main class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-12 items-center border-b border-outline-gray-1 px-5">
        <Breadcrumbs :items="[{ label: 'Components' }, { label: 'Button' }]" />
        <div class="ml-auto flex items-center gap-4 text-ink-gray-7">
          <svg class="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" /></svg>
          <span data-target="toggle" :class="p.dark ? 'lucide-moon' : 'lucide-sun'" class="size-4" />
        </div>
      </header>
      <div class="min-h-0 flex-1 overflow-hidden">
      <div class="px-10 pt-6" :style="{ transform: `translateY(${-(p.scroll ?? 0)}px)` }">
        <h1 class="text-2xl font-semibold text-ink-gray-9">Button</h1>
        <p class="mt-2 text-p-base text-ink-gray-6">A clickable element that runs an action, submits a form or opens a link.</p>
        <div class="mt-5 w-[880px]">
          <ButtonPlayground />
        </div>
        <h2 class="mt-10 text-xl font-semibold text-ink-gray-9">Examples</h2>
        <h3 class="mt-5 text-lg font-medium text-ink-gray-9">Primary and secondary action</h3>
        <div class="mt-3 flex w-[880px] items-center justify-end gap-2 rounded-7 border border-outline-gray-1 p-8">
          <Button variant="subtle" label="Cancel" />
          <Button variant="solid" label="Save changes" />
        </div>
        <h3 class="mt-6 text-lg font-medium text-ink-gray-9">Section header</h3>
        <div class="mt-3 flex w-[880px] items-center gap-2 rounded-7 border border-outline-gray-1 p-6">
          <span class="text-lg font-semibold text-ink-gray-9">Members</span>
          <Button class="ml-auto" variant="ghost" icon="lucide-more-horizontal" />
          <Button variant="outline" icon-left="lucide-plus" label="Invite" />
        </div>
        <h2 class="mt-10 text-xl font-semibold text-ink-gray-9">API Reference</h2>
        <table class="mt-4 w-[880px] border-collapse border-b border-outline-gray-2 text-left">
          <thead>
            <tr class="border-b border-outline-gray-2">
              <th class="w-[24%] py-2.5 pr-2 text-sm font-semibold text-ink-gray-9">Prop</th>
              <th class="w-[20%] px-2 py-2.5 text-sm font-semibold text-ink-gray-9">Default</th>
              <th class="w-[56%] px-2 py-2.5 text-sm font-semibold text-ink-gray-9">Type</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in propsData.slice(0, 9)" :key="row.name + row.type" class="border-b border-outline-gray-1">
              <td class="py-2.5 pr-2 font-mono text-sm text-ink-gray-9">{{ row.name }}</td>
              <td class="px-2 py-2.5 font-mono text-sm text-ink-gray-6">{{ row.default ?? '—' }}</td>
              <td class="px-2 py-2.5 font-mono text-sm text-ink-gray-6">{{ row.type }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </main>

  </div>
</template>
