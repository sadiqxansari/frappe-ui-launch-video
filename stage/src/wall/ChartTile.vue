<script setup lang="ts">
import { AreaChart, BarChart, DonutChart, FunnelChart, LineChart, NumberCard } from 'frappe-ui/charts'

// Small charts for the wall, from the same business as the dashboard.
defineProps<{ kind: string }>()

const MONTHS = ['2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01', '2026-06-01', '2026-07-01']
const plans = [
  { Starter: 43900, Plus: 72900, Pro: 60300 },
  { Starter: 46200, Plus: 76800, Pro: 63700 },
  { Starter: 47500, Plus: 79200, Pro: 66900 },
  { Starter: 49100, Plus: 82600, Pro: 70400 },
  { Starter: 50400, Plus: 85300, Pro: 73800 },
  { Starter: 52600, Plus: 89400, Pro: 78200 },
].map((r, i) => ({ month: MONTHS[i], ...r }))
const target = [180000, 185000, 190000, 198000, 206000, 215000]
const vsTarget = plans.map((r, i) => ({ month: r.month, revenue: r.Starter + r.Plus + r.Pro, target: target[i] }))
const channels = [
  { channel: 'Organic search', sessions: 39900 },
  { channel: 'Paid social', sessions: 21400 },
  { channel: 'Email', sessions: 16800 },
  { channel: 'Direct', sessions: 14700 },
  { channel: 'Referral', sessions: 8900 },
]
const funnel = [
  { stage: 'Leads', people: 1240 },
  { stage: 'Qualified', people: 610 },
  { stage: 'Demo', people: 284 },
  { stage: 'Proposal', people: 131 },
  { stage: 'Won', people: 58 },
]
const monthly = vsTarget.map((r) => r.revenue)
</script>

<template>
  <div :class="kind === 'number' ? 'h-[200px] w-[540px]' : 'h-[330px] w-[540px]'">
    <BarChart
      v-if="kind === 'bar'"
      :data="plans"
      x="month"
      :y="['Starter', 'Plus', 'Pro']"
      :x-axis="{ type: 'time', timeGrain: 'month' }"
      title="Revenue by plan"
    />
    <DonutChart v-else-if="kind === 'donut'" :data="channels" category="channel" value="sessions" center-label="sessions" title="Traffic by channel" />
    <LineChart
      v-else-if="kind === 'line'"
      :data="vsTarget"
      x="month"
      :y="['revenue', 'target']"
      :x-axis="{ type: 'time', timeGrain: 'month' }"
      palette="categorical"
      :series-config="{ target: { dashed: true } }"
      title="Revenue against target"
    />
    <AreaChart
      v-else-if="kind === 'area'"
      :data="plans"
      x="month"
      :y="['Starter', 'Plus', 'Pro']"
      :x-axis="{ type: 'time', timeGrain: 'month' }"
      stacked
      title="Subscriptions"
    />
    <FunnelChart v-else-if="kind === 'funnel'" :data="funnel" category="stage" value="people" title="Pipeline" />
    <div v-else class="grid h-full grid-cols-2 items-center gap-4">
      <NumberCard title="Net revenue" :value="monthly.at(-1)!" prefix="$" :delta="4.6" delta-suffix="%" delta-caption="vs last month" :sparkline="{ data: monthly }" />
      <NumberCard title="Won deals" :value="58" :delta="12" delta-suffix="%" delta-caption="vs last month" :sparkline="{ data: [31, 38, 42, 47, 52, 58], type: 'bar' }" />
    </div>
  </div>
</template>
