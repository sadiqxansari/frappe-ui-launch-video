<script setup lang="ts">
import { onMounted } from 'vue'
import { placeStyle } from './place'
import { ACME, faceOf, preloadFaces } from './faces'
import { Avatar, Badge, Breadcrumbs, Button, Select, TabList, Tabs, TabTrigger, TextInput } from 'frappe-ui'

// Frappe CRM's deal page (pages/Deal.vue): breadcrumbs and status in the
// header, the activity feed under tabs, the record's fields on the right.
// Every block can be moved by the film (p.at[id]: offset, scale, opacity)
// so the page can be put together piece by piece.
const props = defineProps<{ p: Record<string, any>; show: (layer: string) => boolean }>()
const at = (id: string) => placeStyle(props.p.at?.[id])
const tabs = [
  { value: 'activity', label: 'Activity', icon: 'lucide-activity' },
  { value: 'emails', label: 'Emails', icon: 'lucide-mail' },
  { value: 'comments', label: 'Comments', icon: 'lucide-message-square-text' },
  { value: 'data', label: 'Data', icon: 'lucide-table-2' },
  { value: 'calls', label: 'Calls', icon: 'lucide-phone' },
  { value: 'tasks', label: 'Tasks', icon: 'lucide-circle-check' },
  { value: 'notes', label: 'Notes', icon: 'lucide-notebook-pen' },
  { value: 'attachments', label: 'Attachments', icon: 'lucide-paperclip' },
]
const face = (label: string) => faceOf(props.p.faces, label)
onMounted(preloadFaces)
const people = [
  { label: 'Sarah Connor', theme: 'violet' },
  { label: 'John Parker', theme: 'green' },
  { label: 'Emily Chen', theme: 'amber' },
] as const
const industries = [{ label: 'Technology', value: 'Technology' }]
const sizes = [{ label: '201-500', value: '201-500' }]
const territories = [{ label: 'United States', value: 'US' }]
</script>

<template>
  <div class="flex min-w-0 flex-1 flex-col">
    <!-- header -->
    <header v-show="show('header')" class="flex h-[42px] shrink-0 items-center justify-between border-b border-outline-gray-1 pl-5 pr-5" :style="at('header')">
      <div :style="at('crumbs')"><Breadcrumbs :items="[{ label: 'Deals' }, { label: 'Acme Corp' }]" /></div>
      <div class="flex items-center gap-2">
        <div class="flex items-center" :style="at('avatars')">
          <Avatar v-for="(u, i) in people" :key="u.label" :label="u.label" :image="face(u.label)" :theme="u.theme" size="sm" class="-mr-1.5 ring-2 ring-[color:var(--surface-base)]" :style="{ zIndex: 3 - i }" />
        </div>
        <div class="ml-2" :style="at('status')">
          <Button :variant="p.statusVariant ?? 'subtle'" :label="p.status ?? 'Demo/Making'" icon-right="lucide-chevron-down">
            <template #prefix><span class="size-2 rounded-full" :class="p.status === 'Won' ? 'bg-surface-green-6' : 'bg-surface-orange-5'" /></template>
          </Button>
        </div>
        <!-- the Button from stage one, as the page's primary action -->
        <div data-new :style="at('new')">
          <Button :variant="p.newVariant ?? 'solid'" label="Save" />
        </div>
      </div>
    </header>

    <div class="flex min-h-0 flex-1">
      <!-- activity -->
      <div class="flex min-w-0 flex-1 flex-col">
        <div v-show="show('tabs')" class="flex h-[45px] shrink-0 items-end border-b border-outline-gray-1 px-5" :style="at('tabs')">
          <Tabs :model-value="p.tab ?? 'activity'">
            <TabList variant="underline" class="-mb-px">
              <TabTrigger v-for="t in tabs" :key="t.value" :value="t.value" :label="t.label" :icon-left="t.icon" />
            </TabList>
          </Tabs>
        </div>
        <div v-show="show('feed')" class="min-h-0 flex-1">
          <div class="mx-10 mb-4 mt-8 flex items-center justify-between">
            <h2 class="text-2xl-semibold text-ink-gray-8" :style="at('feedTitle')">Activity</h2>
          </div>
          <div class="px-10">
            <!-- comment -->
            <div class="grid grid-cols-[30px_1fr] gap-4" :style="at('f0')">
              <div class="relative flex justify-center before:absolute before:bottom-0 before:left-1/2 before:top-8 before:border-l before:border-outline-gray-2">
                <Avatar label="Sarah Connor" :image="face('Sarah Connor')" theme="violet" size="md" />
              </div>
              <div class="mb-6">
                <div class="mb-2 flex items-center justify-between">
                  <div class="text-base text-ink-gray-5"><span class="font-medium text-ink-gray-8">Sarah Connor</span> added a <span class="font-medium text-ink-gray-8">comment</span></div>
                  <div class="flex items-center gap-1.5 text-sm text-ink-gray-5">2 hours ago <Button variant="ghost" icon="lucide-ellipsis" /></div>
                </div>
                <div class="rounded-4 bg-surface-gray-1 px-3 py-[7.5px] text-p-base text-ink-gray-7">
                  Live demo went well. Alice's product team joined and asked for a sandbox. Sending access today.
                </div>
              </div>
            </div>
            <!-- status change -->
            <div class="grid grid-cols-[30px_1fr] gap-4" :style="at('f1')">
              <div class="relative flex justify-center before:absolute before:bottom-0 before:left-1/2 before:top-0 before:border-l before:border-outline-gray-2">
                <div class="relative z-10 mt-1 flex size-7 items-center justify-center rounded-full bg-surface-base"><span class="size-1.5 rounded-full bg-surface-gray-6" /></div>
              </div>
              <div class="mb-5 mt-2 flex items-start justify-between">
                <div class="text-base text-ink-gray-5"><span class="font-medium text-ink-gray-8">Sarah Connor</span> changed <span class="font-medium text-ink-gray-8">Status</span> from <Badge label="Qualification" theme="gray" /> to <Badge label="Demo/Making" theme="amber" /></div>
                <div class="text-sm text-ink-gray-5">3 hours ago</div>
              </div>
            </div>
            <!-- email -->
            <div class="grid grid-cols-[30px_1fr] gap-4" :style="at('f2')">
              <div class="relative flex justify-center before:absolute before:bottom-0 before:left-1/2 before:top-8 before:border-l before:border-outline-gray-2">
                <Avatar label="Alice Johnson" :image="face('Alice Johnson')" theme="blue" size="md" />
              </div>
              <div class="mb-6 rounded-5 bg-surface-elevation-1 px-3 py-2 shadow-sm ring-1 ring-outline-gray-1">
                <div class="flex items-center justify-between gap-2">
                  <div class="text-base font-medium text-ink-gray-8">Alice Johnson <span class="font-normal text-ink-gray-5">&lt;alice.johnson@example.com&gt;</span></div>
                  <div class="flex items-center gap-2 text-sm text-ink-gray-5">
                    <Badge label="Replied" theme="green" /> 1 day ago
                    <Button variant="ghost" icon="lucide-reply" />
                    <Button variant="ghost" icon="lucide-reply-all" />
                  </div>
                </div>
                <div class="mt-1 text-base-medium text-ink-gray-8">Sandbox access for Acme Corp</div>
                <div class="mt-0.5 text-sm text-ink-gray-5">To: Sarah Connor</div>
                <div class="my-2 border-t border-outline-gray-1" />
                <div class="text-p-base text-ink-gray-7">Thanks Sarah. Our admin is ready. Could you share the sandbox link and a test login for the team?</div>
              </div>
            </div>
            <!-- call -->
            <div class="grid grid-cols-[30px_1fr] gap-4" :style="at('f3')">
              <div class="relative flex justify-center before:absolute before:bottom-0 before:left-1/2 before:top-8 before:border-l before:border-outline-gray-2">
                <Avatar label="Emily Chen" :image="face('Emily Chen')" theme="amber" size="md" />
              </div>
              <div class="mb-6 rounded-5 bg-surface-elevation-1 px-3 py-2.5 shadow-sm ring-1 ring-outline-gray-1">
                <div class="flex items-center justify-between">
                  <div class="text-base text-ink-gray-5"><span class="font-medium text-ink-gray-8">Emily Chen</span> logged an <span class="font-medium text-ink-gray-8">outbound call</span></div>
                  <div class="text-sm text-ink-gray-5">1 day ago</div>
                </div>
                <div class="mt-2 flex items-center gap-2">
                  <Badge label="Completed" theme="green" />
                  <Badge label="24m 10s" theme="gray" />
                  <span class="text-base text-ink-gray-7">Discovery call with Alice about pricing and seats for 200 users.</span>
                </div>
              </div>
            </div>
            <!-- task -->
            <div class="grid grid-cols-[30px_1fr] gap-4" :style="at('f4')">
              <div class="relative flex justify-center before:absolute before:bottom-0 before:left-1/2 before:top-0 before:border-l before:border-outline-gray-2">
                <div class="relative z-10 mt-1 flex size-7 items-center justify-center rounded-full bg-surface-base"><span class="lucide-circle-check size-4 text-ink-gray-6" /></div>
              </div>
              <div class="mb-5 mt-2 flex items-start justify-between">
                <div class="flex items-center gap-1.5 text-base text-ink-gray-5"><span class="font-medium text-ink-gray-8">Sarah Connor</span> added a task <span class="font-medium text-ink-gray-8">Send sandbox credentials</span> <Badge label="Todo" theme="violet" /></div>
                <div class="text-sm text-ink-gray-5">2 days ago</div>
              </div>
            </div>
            <!-- owner change -->
            <div class="grid grid-cols-[30px_1fr] gap-4" :style="at('f5')">
              <div class="relative flex justify-center before:absolute before:bottom-0 before:left-1/2 before:top-0 before:border-l before:border-outline-gray-2">
                <div class="relative z-10 mt-1 flex size-7 items-center justify-center rounded-full bg-surface-base"><span class="size-1.5 rounded-full bg-surface-gray-6" /></div>
              </div>
              <div class="mb-5 mt-2 flex items-start justify-between">
                <div class="flex items-center gap-1 text-base text-ink-gray-5"><span class="font-medium text-ink-gray-8">John Parker</span> changed <span class="font-medium text-ink-gray-8">Deal owner</span> to <Avatar label="Sarah Connor" :image="face('Sarah Connor')" theme="violet" size="xs" /><span class="font-medium text-ink-gray-8">Sarah Connor</span></div>
                <div class="text-sm text-ink-gray-5">2 days ago</div>
              </div>
            </div>
            <!-- created -->
            <div class="grid grid-cols-[30px_1fr] gap-4" :style="at('f6')">
              <div class="relative flex justify-center">
                <div class="relative z-10 mt-1 flex size-7 items-center justify-center rounded-full bg-surface-gray-2"><span class="lucide-handshake size-4 text-ink-gray-7" /></div>
              </div>
              <div class="mt-2 flex items-start justify-between">
                <div class="text-base text-ink-gray-5"><span class="font-medium text-ink-gray-8">John Parker</span> created this deal</div>
                <div class="text-sm text-ink-gray-5">3 days ago</div>
              </div>
            </div>
          </div>
        </div>
        <!-- the composer: who's writing, a placeholder, and one icon button -->
        <div v-show="show('feed')" class="shrink-0 px-10 pb-5 pt-2">
          <div class="flex h-12 items-center gap-3 rounded-[16px] border border-outline-gray-1 bg-surface-elevation-1 pl-2.5 pr-2 shadow-md" :style="at('composer')">
            <Avatar label="Sarah Connor" :image="face('Sarah Connor')" theme="violet" size="md" />
            <span class="flex-1 text-base text-ink-gray-4">Add a comment</span>
            <Button variant="ghost" icon="lucide-message-square-text" />
            <Button variant="ghost" icon="lucide-plus" />
          </div>
        </div>
      </div>

      <!-- the record -->
      <aside v-show="show('side')" class="flex w-[352px] shrink-0 flex-col border-l border-outline-gray-1 bg-surface-base" :style="at('side')">
        <div class="flex h-[45px] shrink-0 items-center border-b border-outline-gray-1 px-5 text-lg-medium text-ink-gray-8" :style="at('s0')">CRM-DEAL-2026-00001</div>
        <div class="flex items-center gap-4 border-b border-outline-gray-1 p-5" :style="at('org')">
          <div :style="at('orgAvatar')"><Avatar label="Acme Corp" :image="p.faces?.includes('Acme Corp') ? ACME : undefined" size="3xl" shape="square" theme="blue" /></div>
          <div class="flex flex-col gap-2">
            <div class="text-3xl-medium text-ink-gray-9" :style="at('orgName')">Acme Corp</div>
            <div class="flex gap-1.5" :style="at('orgActions')">
              <Button icon="lucide-phone" />
              <Button icon="lucide-mail" />
              <Button icon="lucide-link" />
              <Button icon="lucide-paperclip" />
              <Button icon="lucide-trash-2" theme="red" />
            </div>
          </div>
        </div>
        <div class="border-b border-outline-gray-1 p-3" :style="at('s2')">
          <div class="flex h-8 items-center justify-between px-2 text-base font-semibold text-ink-gray-8">Contacts <Button variant="ghost" icon="lucide-plus" /></div>
          <div class="flex items-center gap-2 px-2 py-1.5">
            <Avatar label="Alice Johnson" :image="face('Alice Johnson')" theme="blue" size="md" />
            <span class="flex-1 text-base text-ink-gray-8">Alice Johnson</span>
            <Badge label="Primary" theme="green" variant="outline" />
          </div>
        </div>
        <div class="p-3">
          <div class="flex h-8 items-center px-2 text-base font-semibold text-ink-gray-8" :style="at('detailsTitle')">Details</div>
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center gap-2 px-3" :style="at('d0')"><span class="w-[35%] text-sm text-ink-gray-5">Organization</span><div class="w-[65%]"><TextInput variant="ghost" model-value="Acme Corp" /></div></div>
            <div class="flex items-center gap-2 px-3" :style="at('d1')"><span class="w-[35%] text-sm text-ink-gray-5">Website</span><div class="w-[65%]"><TextInput variant="ghost" model-value="acmecorp.example.com" /></div></div>
            <div class="flex items-center gap-2 px-3" :style="at('d2')"><span class="w-[35%] text-sm text-ink-gray-5">Industry</span><div class="w-[65%]"><Select variant="ghost" :options="industries" model-value="Technology" /></div></div>
            <div class="flex items-center gap-2 px-3" :style="at('d3')"><span class="w-[35%] text-sm text-ink-gray-5">Employees</span><div class="w-[65%]"><Select variant="ghost" :options="sizes" model-value="201-500" /></div></div>
            <div class="flex items-center gap-2 px-3" :style="at('d4')"><span class="w-[35%] text-sm text-ink-gray-5">Territory</span><div class="w-[65%]"><Select variant="ghost" :options="territories" model-value="US" /></div></div>
            <div class="flex items-center gap-2 px-3" :style="at('d5')"><span class="w-[35%] text-sm text-ink-gray-5">Annual revenue</span><div class="w-[65%]"><TextInput variant="ghost" model-value="$5,000,000" /></div></div>
            <div class="flex items-center gap-2 px-3" :style="at('d6')"><span class="w-[35%] text-sm text-ink-gray-5">Close date</span><div class="w-[65%]"><TextInput variant="ghost" model-value="Oct 30, 2026" /></div></div>
            <div class="flex items-center gap-2 px-3" :style="at('d7')"><span class="w-[35%] text-sm text-ink-gray-5">Probability</span><div class="w-[65%]"><TextInput variant="ghost" model-value="25%" /></div></div>
            <div class="flex items-center gap-2 px-3" :style="at('d8')">
              <span class="w-[35%] text-sm text-ink-gray-5">Deal owner</span>
              <div class="flex w-[65%] items-center gap-2 px-2 text-base text-ink-gray-8"><Avatar label="Sarah Connor" :image="face('Sarah Connor')" theme="violet" size="sm" />Sarah Connor</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
