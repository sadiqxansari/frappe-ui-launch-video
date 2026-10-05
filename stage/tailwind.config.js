import preset, { content } from 'frappe-ui/tailwind'

export default {
  presets: [preset],
  content: [
    ...content,
    './index.html',
    './src/**/*.{vue,ts}',
    './node_modules/frappe-ui/vitepress/components/**/*.vue',
  ],
}
