// One page per collector, written from the data branch: what the collector's sources declare
// (description, metrics, configuration) and what its latest CI run found.
import { loadSite, type Collector } from '../.vitepress/lib/data'

/** The page goes through Vue: outside code spans, < and {{ must not read as a tag or a binding. */
function safe(text: string) {
  return text
    .split(/(`[^`]*`)/)
    .map((part, i) => (i % 2 ? part : part.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\{\{/g, '&#123;&#123;')))
    .join('')
}
const cell = (text: string) => safe(text).replace(/\|/g, '\\|')
const when = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`
const runState = (result: string) => (result === 'success' ? 'passed' : result === 'failure' ? 'failed' : 'not-run')

function page(c: Collector, coreVersion: string) {
  const out: string[] = []
  const w = (line = '') => out.push(line)
  const ci = c.ci

  w(`# ${c.target}`)
  w()
  const facts = [`[${c.repo}](${c.url})`, `version **${c.version}**`, `registers as \`${c.name}\``]
  if (ci) {
    facts.push(`<a href="${ci.url}"><Pill state="${runState(ci.result)}" label="CI ${ci.finished.slice(0, 10)}" /></a>`)
  }
  w(facts.join(' · '))
  w()
  if (c.description) {
    w(safe(c.description))
    w()
  }

  w('## Install')
  w()
  const target = c.targetUrl ? `[${c.target}](${c.targetUrl})` : c.target
  w(`Put \`${c.jar}\` in the plugins folder, next to the core and to ${target}, then restart. ` +
    `The collector depends on both: without ${c.target} it stays disabled, and the core keeps running.`)
  w()
  w(`- **Target plugin:** ${target} **${safe(c.compiled)}** — latest for Minecraft ${safe(c.minecraft)}: ${safe(c.latest || '?')}`)
  w(`- **Built against:** core ${safe(c.core)}${c.coreBehind ? ` (current: ${coreVersion})` : ''}`)
  w(`- **Download:** [${c.jar}](${c.release}), with its SHA-512, from the v${c.version} release (the repositories are private for now: members only)`)
  w(`- **Collects:** ${c.background
    ? `in the background, every ${c.interval ?? 'few'} s — reading the plugin's state never blocks a scrape`
    : 'on events, as they happen'}`)
  if (c.java) w(`- **Tested on:** Java ${c.java}`)
  if (ci) w(`- **Latest CI:** ${ci.result} · ${when(ci.finished)} · commit \`${ci.sha.slice(0, 7)}\` · [run](${ci.url})`)
  w()

  w('## Platforms')
  w()
  w('| Platform | Target plugin | Collector | Latest CI |')
  w('|---|---|---|---|')
  for (const p of c.platforms) {
    const runs = Object.entries(p.cells).map(([name, outcome]) => `${name} ${outcome === 'passed' ? '✓' : outcome === 'failed' ? '✗' : outcome}`)
    w(`| ${p.name} | ${p.plugin ?? '?'} | <Pill state="${p.state}" /> | ${runs.join(' · ') || '—'} |`)
  }
  w()
  w('See the [compatibility matrix](/compatibility) for every collector at once.')
  w()

  w('## Metrics')
  w()
  for (const m of c.metrics) {
    w(`### \`${m.name}\``)
    w()
    w(`<span class="vm-badge is-type">${m.type}</span>` +
      (m.labels.length ? ' ' + m.labels.map((l) => `<span class="vm-badge">${l}</span>`).join(' ') : ''))
    w()
    if (m.help) w(safe(m.help))
    w()
  }

  w('## Configuration')
  w()
  w(`In \`metrics.properties\`, or as environment variables. See [Configuration](/guide/configuration).`)
  w()
  w('| Key | Default | Environment variable |')
  w('|---|---|---|')
  const env = (key: string) => `VANIA_METRICS_${key.toUpperCase().replace(/\./g, '_')}`
  const rows: [string, string][] = [[`collector.${c.name}`, 'true']]
  if (c.background && !c.config.some((k) => k.key === `collector.${c.name}.interval`)) {
    rows.push([`collector.${c.name}.interval`, c.interval ? String(c.interval) : '—'])
  }
  for (const k of c.config) rows.push([k.key, k.default === null ? '—' : k.default === '' ? 'empty' : k.default])
  for (const [key, def] of rows) {
    w(`| \`${key}\` | ${def === 'empty' || def === '—' ? def : `\`${cell(def)}\``} | \`${env(key)}\` |`)
  }
  w()
  return out.join('\n')
}

export default {
  paths() {
    const site = loadSite()
    return site.collectors.map((c) => ({
      params: { slug: c.slug, title: c.target },
      content: page(c, site.version),
    }))
  },
}
