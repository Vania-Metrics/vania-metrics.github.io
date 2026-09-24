// VitePress data loader: pages and components import `data` from here, read once at build time.
import { defineLoader } from 'vitepress'
import { loadSite, type SiteData } from './data'

declare const data: SiteData
export { data }

export default defineLoader({
  load: () => loadSite(),
})
