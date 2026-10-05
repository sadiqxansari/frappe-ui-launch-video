<script setup lang="ts">
import { computed } from 'vue'
import { Avatar, Button, Sidebar, SidebarItem, SidebarRail, SidebarRailItem, SidebarSection } from 'frappe-ui'
import crmLogo from '../../../public/logos/crm.svg'
import { faceOf } from './faces'
import { placeStyle } from './place'

// CRM's app frame: the icon rail (the app, its sections, you at the bottom)
// and, beside it, the current section's own panel.
const props = defineProps<{ active: string; at?: Record<string, any>; open?: boolean; faces?: string[]; pressed?: number }>()
const at = (id: string) => placeStyle(props.at?.[id])
const nav = [
  { id: 'dashboard', label: 'Dashboard', icon: 'lucide-layout-dashboard' },
  { id: 'leads', label: 'Leads', icon: 'lucide-users' },
  { id: 'deals', label: 'Deals', icon: 'lucide-handshake' },
  { id: 'contacts', label: 'Contacts', icon: 'lucide-contact-round' },
  { id: 'organizations', label: 'Organizations', icon: 'lucide-building-2' },
  { id: 'tasks', label: 'Tasks', icon: 'lucide-list-checks' },
  { id: 'notes', label: 'Notes', icon: 'lucide-notebook-pen' },
]
const PANELS: Record<string, { title: string; main: string; icon: string; section: string; items: string[] }> = {
  deals: { title: 'Deals', main: 'All Deals', icon: 'lucide-handshake', section: 'Configure', items: ['Statuses', 'Products', 'Territories'] },
  dashboard: { title: 'Dashboard', main: 'Sales overview', icon: 'lucide-layout-dashboard', section: 'Reports', items: ['Pipeline', 'Forecast', 'Activities'] },
}
const panel = computed(() => PANELS[props.active] ?? PANELS.deals)
</script>

<template>
  <div class="flex h-full shrink-0">
    <SidebarRail class="border-r border-outline-gray-1" :class="{ '!overflow-visible': open }">
      <div class="relative" :style="at('brand')">
        <div class="absolute -inset-1 rounded-[10px] bg-surface-gray-3" :style="{ opacity: pressed ?? 0 }" />
        <img :src="crmLogo" class="relative size-7 rounded-[8px]" alt="" />
      </div>
      <div class="flex w-full flex-1 flex-col items-center gap-3 pt-5">
        <div v-for="(n, i) in nav" :key="n.id" :style="at(`n${i}`)">
          <SidebarRailItem :data-nav="n.id" :label="n.label" :icon="n.icon" :variant="active === n.id ? 'subtle' : 'ghost'" :active="active === n.id" />
        </div>
      </div>
      <div :style="at('foot')">
        <SidebarRailItem label="Sarah Connor" variant="ghost">
          <Avatar label="Sarah Connor" :image="faceOf(faces, 'Sarah Connor')" theme="violet" size="md" />
        </SidebarRailItem>
      </div>
    </SidebarRail>
    <Sidebar :collapsible="false" width="14rem" class="h-full border-r border-outline-gray-1 bg-surface-gray-1" :class="{ '!overflow-visible': open }">
      <div class="flex h-full flex-col p-2">
        <div class="flex h-9 items-center justify-between pl-2" :style="at('p0')">
          <span class="text-lg-semibold text-ink-gray-9">{{ panel.title }}</span>
          <Button variant="ghost" icon="lucide-settings-2" />
        </div>
        <div class="mt-2" :style="at('p1')"><SidebarItem :label="panel.main" :icon="panel.icon" active /></div>
        <div class="mt-4" :style="at('p2')">
          <SidebarSection :label="panel.section" collapsible>
            <div class="flex flex-col gap-1">
              <SidebarItem v-for="it in panel.items" :key="it" :label="it" icon="lucide-list" />
            </div>
          </SidebarSection>
        </div>
      </div>
    </Sidebar>
  </div>
</template>
