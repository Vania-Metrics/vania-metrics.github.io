// Reads the data branch (checked out in data/) into what the pages show. Build time only: the
// CI of every repository writes one directory per repository there, see the README.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PLATFORMS, platformCells, stateOf, type State } from './platforms'

export const DATA_DIR = process.env.VANIA_DATA ?? fileURLToPath(new URL('../../../data', import.meta.url))
export const ORG_URL = 'https://github.com/Vania-Metrics'

export interface Run {
  repo: string
  workflow: string
  url: string
  event: string
  sha: string
  result: string
  finished: string
  cells: Record<string, string>
  runtime?: string
}

export interface Metric {
  name: string
  type: 'gauge' | 'counter' | 'histogram'
  help: string | null
  labels: string[]
}

export interface ConfigKey {
  key: string
  type: string
  default: string | null
  env: string
}

interface Catalog {
  metrics: Metric[]
  config: ConfigKey[]
  collector?: {
    class: string
    name: string | null
    source: string | null
    background: boolean
    interval: number | null
    text: string
  }
  contract?: Record<string, Record<string, { type: string; labels: string[] }>>
  expected?: Record<string, { present: string[]; absent: string[] }>
}

interface Repo {
  id: string
  manifest: any
  catalog: Catalog
  runs: Record<string, Run>
}

export interface Cell {
  platform: string
  name: string
  kind: string
  plugin?: string
  claim?: string
  state: State
  cells: Record<string, string>
}

export interface Collector {
  repo: string
  slug: string
  url: string
  name: string
  target: string
  targetUrl: string | null
  compiled: string
  latest: string
  updateAvailable: boolean
  minecraft: string
  core: string
  coreBehind: boolean
  jar: string
  java: string | null
  ci: Run | null
  platforms: Cell[]
  summary: string
  description: string
  metrics: Metric[]
  config: ConfigKey[]
  background: boolean
  interval: number | null
}

export interface CoreMetric extends Metric {
  domain: string
  platforms: string[]
}

export interface CorePlatform extends Cell {
  jar: string
  on: string
  note: string
}

export interface SiteData {
  minecraft: string
  version: string
  updated: string | null
  green: number
  core: {
    url: string
    platforms: CorePlatform[]
    build: Run | null
    full: Run | null
    metrics: CoreMetric[]
    config: ConfigKey[]
  }
  collectors: Collector[]
}

const read = (file: string) => JSON.parse(fs.readFileSync(file, 'utf-8'))

function loadRepos(): Repo[] {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`no data in ${DATA_DIR}: run "pnpm data" first`)
  }
  return fs
    .readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => {
      const dir = path.join(DATA_DIR, d.name)
      const runs: Record<string, Run> = {}
      for (const f of fs.readdirSync(dir)) {
        if (f.endsWith('.json') && f !== 'manifest.json' && f !== 'catalog.json') {
          runs[f.slice(0, -5)] = read(path.join(dir, f))
        }
      }
      return {
        id: d.name,
        manifest: read(path.join(dir, 'manifest.json')),
        catalog: read(path.join(dir, 'catalog.json')),
        runs,
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id))
}

/** '7.0.17 (7.0.18+ drops 1.21.11)' is 7.0.17: the manifest may explain a version in parentheses. */
const bare = (version: string) => version.replace(/\s*\(.*\)\s*$/, '')

const firstParagraph = (markdown: string) => markdown.split('\n\n')[0] ?? ''

// Which capability profile of the contract a platform runs with.
const PROFILE: Record<string, string> = {
  paper: 'game-paper',
  purpur: 'game-paper',
  spigot: 'game-spigot',
  bukkit: 'game-spigot',
  folia: 'game-folia',
  sponge: 'game-sponge',
  velocity: 'proxy',
  bungeecord: 'proxy',
  waterfall: 'proxy',
  geyser: 'proxy',
}

/**
 * Where a core family is published. The testkit's expectations win where they speak (they are
 * checked on a real server); otherwise the contract of the platform's profile, which lists what
 * the core declares there. Host metrics come from the container, whatever the platform; Bedrock
 * ones from the Geyser extension only.
 */
function availability(name: string, catalog: Catalog): string[] {
  return PLATFORMS.filter(({ id }) => {
    if (name.startsWith('mc_host_')) return true
    if (name.startsWith('mc_bedrock_')) return id === 'geyser'
    const expected = catalog.expected?.[id]
    if (expected?.absent.includes(name)) return false
    if (expected?.present.includes(name)) return true
    return name in (catalog.contract?.[PROFILE[id]] ?? {})
  }).map(({ id }) => id)
}

export function loadSite(): SiteData {
  const repos = loadRepos()
  const core = repos.find((r) => r.id === 'core')
  if (!core) throw new Error('no data for the core')
  const version: string = core.manifest.version
  const full = core.runs.platforms ?? null

  const collectors: Collector[] = repos
    .filter((r) => r.id.startsWith('collector-'))
    .map((r) => {
      const m = r.manifest
      const plugin = m.plugin ?? {}
      const ci = r.runs.ci ?? null
      const info = r.catalog.collector
      const compiled = bare(plugin['compiled-against'] ?? '?')
      const latest = bare(plugin['latest-for-minecraft'] ?? '')
      return {
        repo: r.id,
        slug: r.id.replace(/^collector-/, ''),
        url: `${ORG_URL}/${r.id}`,
        name: info?.name ?? r.id.replace(/^collector-/, ''),
        target: plugin.name ?? '?',
        targetUrl: plugin.source ?? null,
        compiled: plugin['compiled-against'] ?? '?',
        latest: plugin['latest-for-minecraft'] ?? '',
        // Only between two versions of the same thing: spark is built against the API Paper
        // bundles, and the plugin's own version is no update of it.
        updateAvailable: /^\d/.test(compiled) && /^\d/.test(latest) && latest !== compiled,
        minecraft: m.minecraft ?? '?',
        core: m.core ?? '?',
        coreBehind: m.core !== `v${version}`,
        jar: `vania-metrics-${r.id}-${String(m.core ?? '').replace(/^v/, '')}.jar`,
        java: ci?.runtime?.replace(/^java/, '') ?? null,
        ci,
        platforms: PLATFORMS.map(({ id, name, kind }) => {
          const p = m.platforms?.[id] ?? {}
          const cells = platformCells(ci?.cells, id)
          return { platform: id, name, kind, plugin: p.plugin, claim: p.collector, state: stateOf(p.collector, p.plugin, cells), cells }
        }),
        summary: firstParagraph(info?.text ?? ''),
        description: info?.text ?? '',
        metrics: r.catalog.metrics,
        config: r.catalog.config,
        background: info?.background ?? false,
        interval: info?.interval ?? null,
      }
    })

  const finished = repos.flatMap((r) => Object.values(r.runs).map((run) => run.finished)).filter(Boolean).sort()
  return {
    minecraft: core.manifest.minecraft,
    version,
    updated: finished.at(-1) ?? null,
    green: collectors.filter((c) => c.ci?.result === 'success').length,
    core: {
      url: `${ORG_URL}/core`,
      platforms: PLATFORMS.filter(({ id }) => core.manifest.platforms?.[id]).map(({ id, name, kind }) => {
        const p = core.manifest.platforms[id]
        const cells = platformCells(full?.cells, id)
        return { platform: id, name, kind, claim: p.status, state: stateOf(p.status, 'yes', cells), cells, jar: p.jar, on: p.on ?? '', note: p.note ?? '' }
      }),
      build: core.runs.build ?? null,
      full,
      metrics: core.catalog.metrics.map((metric) => ({
        ...metric,
        domain: metric.name.split('_')[1],
        platforms: availability(metric.name, core.catalog),
      })),
      config: core.catalog.config,
    },
    collectors,
  }
}
