import { defineConfig } from 'vitepress'
import { loadSite } from './lib/data'

const site = loadSite()

export default defineConfig({
  title: 'VaniaMetrics',
  description: 'Prometheus metrics for Minecraft servers and proxies.',
  lang: 'en-US',
  cleanUrls: true,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]],
  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'Compatibility', link: '/compatibility' },
      { text: 'Metrics', link: '/metrics' },
      { text: 'Collectors', link: '/collectors/', activeMatch: '/collectors/' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting started', link: '/guide/getting-started' },
          { text: 'Configuration', link: '/guide/configuration' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Compatibility', link: '/compatibility' },
          { text: 'Metrics', link: '/metrics' },
        ],
      },
      {
        text: 'Collectors',
        items: [
          { text: 'Overview', link: '/collectors/' },
          ...site.collectors.map((c) => ({ text: c.target, link: `/collectors/${c.slug}` })),
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/Vania-Metrics' }],
    search: { provider: 'local' },
    outline: { level: [2, 3] },
    footer: {
      message: `Minecraft ${site.minecraft} · core ${site.version} · rebuilt after every CI run`,
    },
  },
})
