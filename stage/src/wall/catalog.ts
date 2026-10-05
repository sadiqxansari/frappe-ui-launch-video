// What each bento tile shows, by the name geometry.json gives it. Real
// frappe-ui throughout: the docs' own stories, a few live widgets, a few
// charts. Each is shown at its own size (scaled down only if it must be).

export type TileContent =
  | { type: 'dialog' }
  | { type: 'story'; name: string; w?: number }
  | { type: 'widget'; kind: string }
  | { type: 'chart'; kind: 'bar' | 'donut' | 'line' | 'area' | 'number' | 'funnel' }

export const CATALOG: Record<string, TileContent> = {
  dialog: { type: 'dialog' },
  donut: { type: 'chart', kind: 'donut' },
  assignees: { type: 'story', name: 'Avatar_Assignees', w: 336 },
  duration: { type: 'story', name: 'Duration_SlaPolicy', w: 340 },
  password: { type: 'story', name: 'Password_NewPassword', w: 240 },
  search: { type: 'story', name: 'TextInput_Search', w: 260 },
  tabs: { type: 'story', name: 'Tabs_Underline', w: 560 },
  numbers: { type: 'chart', kind: 'number' },
  onboarding: { type: 'story', name: 'Progress_Onboarding', w: 320 },
  slider: { type: 'widget', kind: 'slider' },
  checkboxes: { type: 'story', name: 'Checkbox_SettingsList', w: 320 },
  switch: { type: 'widget', kind: 'switchrow' },
  tabbuttons: { type: 'widget', kind: 'tabbuttons' },
  agent: { type: 'widget', kind: 'agent' },
  skeleton: { type: 'story', name: 'Skeleton_List', w: 300 },
  reactions: { type: 'story', name: 'Badge_Reactions', w: 448 },
  breadcrumbs: { type: 'story', name: 'Breadcrumbs_PageHeader', w: 530 },
  toolbar: { type: 'story', name: 'Button_SelectionToolbar', w: 504 },
  comments: { type: 'story', name: 'Avatar_CommentThread', w: 480 },
  bar: { type: 'chart', kind: 'bar' },
  files: { type: 'story', name: 'FileUploader_Attachments', w: 480 },
  textarea: { type: 'story', name: 'Textarea_CommentBox', w: 320 },
  alert: { type: 'widget', kind: 'alert' },
  rowtags: { type: 'story', name: 'Badge_RowTags', w: 480 },
  keyboard: { type: 'story', name: 'KeyboardShortcut_PaletteFooter', w: 500 },
  radio: { type: 'story', name: 'Radio_SettingsList', w: 320 },
  storage: { type: 'story', name: 'Progress_Storage', w: 480 },
}
