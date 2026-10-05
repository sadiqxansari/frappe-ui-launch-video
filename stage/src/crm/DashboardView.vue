<script setup lang="ts">
import { placeStyle } from './place'
import { Breadcrumbs, Button, Dropdown, Select } from 'frappe-ui'
import { BarChart, DonutChart, FunnelChart, LineChart, NumberCard } from 'frappe-ui/charts'

// CRM's dashboard (pages/Dashboard.vue, crm_dashboard.py), the same tiles
// in the same order, redrawn with frappe-ui/charts. Each chart mounts when
// the film lists it in p.live, so it draws itself in; the number cards
// count up from zero once p.count is set.
const props = defineProps<{ p: Record<string, any> }>()
const on = (k: string) => (props.p.live ?? []).includes(k)
const at = (id: string) => placeStyle(props.p.at?.[id] ?? { o: 0 })
const n = (v: number) => (props.p.count ? v : 0)

const DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 8, 1 + i))
  return d.toISOString().slice(0, 10)
})
const wave = (i: number, base: number, amp: number, seed: number) =>
  Math.round(base + amp * Math.sin(i / 3 + seed) + (i * base) / 90 + ((i * 37 + seed * 11) % 7))
const salesTrend = DAYS.map((day, i) => ({
  day,
  Leads: wave(i, 38, 9, 0),
  Deals: wave(i, 16, 5, 1.3),
  'Won deals': wave(i, 6, 2, 2.1),
}))
const forecast = ['2026-04-01', '2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01', '2026-09-01'].map((month, i) => ({
  month,
  Forecasted: [410, 440, 480, 505, 560, 610][i] * 1000,
  Actual: [395, 452, 468, 530, 571, 598][i] * 1000,
}))
const funnel = [
  { stage: 'Qualification', deals: 412 },
  { stage: 'Demo/Making', deals: 238 },
  { stage: 'Proposal/Quotation', deals: 151 },
  { stage: 'Negotiation', deals: 97 },
  { stage: 'Ready to Close', deals: 71 },
  { stage: 'Won', deals: 58 },
]
const byStage = [
  { stage: 'Qualification', deals: 31 },
  { stage: 'Demo/Making', deals: 22 },
  { stage: 'Proposal/Quotation', deals: 14 },
  { stage: 'Negotiation', deals: 10 },
  { stage: 'Ready to Close', deals: 7 },
]
const bySource = [
  { source: 'Website', leads: 482 },
  { source: 'Referral', leads: 286 },
  { source: 'Campaign', leads: 213 },
  { source: 'Cold call', leads: 139 },
  { source: 'Existing customer', leads: 120 },
]
const byTerritory = [
  { territory: 'United States', deals: 32, value: 2840000 },
  { territory: 'India', deals: 21, value: 960000 },
  { territory: 'Germany', deals: 12, value: 1120000 },
  { territory: 'United Kingdom', deals: 11, value: 890000 },
  { territory: 'Brazil', deals: 8, value: 410000 },
]
const lost = [
  { reason: 'Competition', deals: 18 },
  { reason: 'Budget constraints', deals: 14 },
  { reason: 'No decision', deals: 9 },
  { reason: 'Timing', deals: 6 },
]
const card = 'flex min-w-0 flex-col rounded-6 bg-surface-base px-4 py-3 ring-1 ring-outline-gray-1'
const period = [{ label: 'Last 30 Days', onClick: () => {} }]
</script>

<template>
  <div class="flex min-w-0 flex-1 flex-col">
    <header class="flex h-[42px] shrink-0 items-center justify-between border-b border-outline-gray-1 pl-5 pr-5">
      <Breadcrumbs :items="[{ label: 'Dashboard' }]" />
      <div class="flex items-center gap-2">
        <Button icon-left="lucide-refresh-ccw" label="Refresh" />
        <Button icon-left="lucide-pen-line" label="Edit" />
      </div>
    </header>
    <div data-scroll class="min-h-0 flex-1 overflow-hidden">
      <div :style="{ transform: `translateY(${-(p.scroll ?? 0)}px)` }">
        <div class="flex gap-4 p-5 pb-2">
          <Dropdown :options="period">
            <Button variant="outline" icon-left="lucide-calendar" label="Last 30 Days" />
          </Dropdown>
          <div class="w-48"><Select variant="outline" placeholder="Sales user" :options="[]" /></div>
        </div>
        <div class="grid grid-cols-5 gap-4 px-5 pt-3">
          <NumberCard data-chart="kpi" :class="card" :style="at('k0')" title="Total leads" :value="n(1240)" :delta="8.2" delta-suffix="%" delta-caption="vs last 30 days" :sparkline="{ data: salesTrend.map((r) => r.Leads) }" />
          <NumberCard :class="card" :style="at('k1')" title="Ongoing deals" :value="n(84)" :delta="4.1" delta-suffix="%" delta-caption="vs last 30 days" />
          <NumberCard :class="card" :style="at('k2')" title="Won deals" :value="n(58)" :delta="12" delta-suffix="%" delta-caption="vs last 30 days" :sparkline="{ data: [31, 38, 42, 47, 52, 58], type: 'bar' }" />
          <NumberCard :class="card" :style="at('k3')" title="Avg. won deal value" :value="n(86400)" prefix="$" :delta="3.4" delta-suffix="%" delta-caption="vs last 30 days" />
          <NumberCard :class="card" :style="at('k4')" title="Avg. time to close" :value="n(23)" suffix=" days" :delta="-2" delta-suffix=" days" delta-caption="vs last 30 days" negative-is-better />
        </div>
        <div class="grid grid-cols-2 gap-4 p-5">
          <section data-chart="trend" :style="at('trend')" :class="[card, 'h-80']">
            <LineChart v-if="on('trend')" :data="salesTrend" x="day" :y="['Leads', 'Deals', 'Won deals']" :x-axis="{ type: 'time', timeGrain: 'day' }" title="Sales trend" subtitle="Leads, deals and won deals, daily" />
          </section>
          <section data-chart="forecast" :style="at('forecast')" :class="[card, 'h-80']">
            <BarChart v-if="on('forecast')" :data="forecast" x="month" :y="['Forecasted', 'Actual']" :x-axis="{ type: 'time', timeGrain: 'month' }" palette="categorical" title="Forecasted revenue" subtitle="Weighted by stage probability" />
          </section>
          <section data-chart="funnel" :style="at('funnel')" :class="[card, 'h-80']">
            <FunnelChart v-if="on('funnel')" :data="funnel" category="stage" value="deals" title="Funnel conversion" subtitle="Deals that reached each stage" />
          </section>
          <section data-chart="stage" :style="at('stage')" :class="[card, 'h-80']">
            <DonutChart v-if="on('stage')" :data="byStage" category="stage" value="deals" center-label="open deals" title="Deals by stage" subtitle="Current pipeline distribution" />
          </section>
          <section data-chart="source" :style="at('source')" :class="[card, 'h-80']">
            <DonutChart v-if="on('source')" :data="bySource" category="source" value="leads" center-label="leads" title="Leads by source" />
          </section>
          <section data-chart="territory" :style="at('territory')" :class="[card, 'h-80']">
            <BarChart v-if="on('territory')" :data="byTerritory" x="territory" y="deals" title="Deals by territory" />
          </section>
          <section data-chart="lost" :style="at('lost')" :class="[card, 'col-span-2 h-72']">
            <BarChart v-if="on('lost')" :data="lost" x="reason" y="deals" horizontal :series-config="{ deals: { showDataLabels: true } }" title="Lost deal reasons" />
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
