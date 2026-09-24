<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import { data } from '../../lib/site.data'
import { PLATFORMS, STATES, variantOf, type State } from '../../lib/platforms'
import { bare } from '../../lib/format'

type Collector = (typeof data.collectors)[number]
type Cell = Collector['platforms'][number]

const total = data.collectors.length
const servers = PLATFORMS.filter((p) => p.kind === 'server')
const proxies = PLATFORMS.filter((p) => p.kind === 'proxy')
const works = (s: State) => s === 'passed' || s === 'not-run'

// Every platform card answers "how much works here" before anyone clicks it.
const tally = Object.fromEntries(
  PLATFORMS.map((p) => {
    const states = data.collectors.map((c) => c.platforms.find((x) => x.platform === p.id)!.state)
    const n = (test: (s: State) => boolean) => states.filter(test).length
    const extras = [
      [n((s) => s === 'failed'), 'failing'],
      [n((s) => s === 'untested'), 'untested'],
      [n((s) => s === 'not-ported'), 'not yet'],
    ].filter(([k]) => k) as [number, string][]
    return [p.id, { works: n(works), extras: extras.map(([k, what]) => `${k} ${what}`).join(', ') }]
  }),
)

// "Sep 24", in English whatever the reader's machine says, so the build and the browser agree.
const day = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : ''
const time = (iso?: string | null) => (iso ? `${iso.slice(11, 16)} UTC` : '')

const failing = data.collectors.filter((c) => c.ci && c.ci.result !== 'success')
const summary =
  failing.length === 0
    ? `All ${total} collectors passed their latest CI run`
    : `${total - failing.length} of ${total} collectors passed their latest CI run; ${failing.map((c) => c.target).join(', ')} failed`

// The picked platform lives in the address, so a link can point at it: /compatibility#folia.
const selected = ref<string | null>(null)
onMounted(() => {
  const hash = decodeURIComponent(location.hash.slice(1))
  if (PLATFORMS.some((p) => p.id === hash)) selected.value = hash
})
watch(selected, (id) => history.replaceState(history.state, '', id ? `#${id}` : location.pathname))
const pick = (id: string) => (selected.value = selected.value === id ? null : id)
const platform = computed(() => PLATFORMS.find((p) => p.id === selected.value) ?? null)

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
// What runs on the picked platform, in the order someone deciding what to install reads it.
const GROUPS: { key: string; test: (s: State) => boolean; heading: (n: number, p: string) => string; note?: string }[] = [
  { key: 'failed', test: (s) => s === 'failed', heading: (n, p) => `${plural(n, 'collector fails', 'collectors fail')} on ${p}`, note: 'Their latest CI run failed on this platform.' },
  { key: 'works', test: works, heading: (n, p) => `${plural(n, 'collector works', 'collectors work')} on ${p}` },
  { key: 'untested', test: (s) => s === 'untested', heading: (n, p) => `${plural(n, 'collector is', 'collectors are')} expected to work on ${p}`, note: 'Not checked on a real server yet.' },
  { key: 'not-yet', test: (s) => s === 'not-ported', heading: (n, p) => `${plural(n, 'collector doesn’t', 'collectors don’t')} support ${p} yet`, note: 'Their plugin runs there; the collector needs porting first.' },
]
const view = computed(() => {
  if (!selected.value || !platform.value) return null
  const rows = data.collectors.map((c) => ({ c, cell: c.platforms.find((p) => p.platform === selected.value)! }))
  return {
    core: data.core.platforms.find((p) => p.platform === selected.value) ?? null,
    groups: GROUPS.map((g) => ({ ...g, rows: rows.filter((r) => g.test(r.cell.state)) })).filter((g) => g.rows.length),
    unavailable: rows.filter((r) => r.cell.state === 'no-plugin' || r.cell.state === 'unknown').map((r) => r.c),
  }
})

/** "passed", or "3.5.1 and 4.2.1 passed" when a platform is tested in several versions. */
function result(cells: Record<string, string>) {
  const entries = Object.entries(cells).map(([name, outcome]) => ({ name: variantOf(name), outcome }))
  if (!entries.length) return { text: 'not run', ok: true }
  const ok = entries.every((e) => e.outcome === 'passed')
  // Velocity is only tested in named versions: "3.5.1 and 4.2.1 passed".
  if (ok && entries.every((e) => e.name)) return { text: `${entries.map((e) => e.name).join(' and ')} passed`, ok }
  // Sponge has its main version plus a release candidate: "passed, 1.21.11-rc passed".
  return { text: entries.map((e) => `${e.name ? `${e.name} ` : ''}${e.outcome}`).join(', '), ok }
}

// The matrix: filter by name; the column under the pointer and the picked one stand out.
const query = ref('')
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? data.collectors.filter((c) => `${c.target} ${c.repo} ${c.name}`.toLowerCase().includes(q)) : data.collectors
})
const hovered = ref<string | null>(null)
const column = (id: string, i: number) => ({
  'is-proxy-start': i === servers.length,
  'is-hovered': hovered.value === id,
  'is-selected': selected.value === id,
})
const WORD: Partial<Record<State, string>> = { failed: 'failed', untested: 'untested', 'not-ported': 'not yet' }
function tooltip(c: Collector, cell: Cell) {
  const runs = Object.entries(cell.cells).map(([name, outcome]) => `${name}: ${outcome}`)
  return [`${c.target} on ${cell.name}`, STATES[cell.state].meaning, ...runs].join('\n')
}
const version = (v: string) => (bare(v).length > 16 ? `${bare(v).slice(0, 15)}…` : bare(v))
</script>

<template>
  <div class="vm-wide vm-compat">
    <h1>Compatibility</h1>
    <p class="vm-lead">
      Choose your platform to see which collectors work on it. A collector works on a platform when
      its CI started that server in a container, loaded the plugins, read <code>/metrics</code> and
      found a clean log.
    </p>
    <p class="vm-summary">
      {{ summary }}, on core {{ data.version }} and Minecraft {{ data.minecraft }}.
      <span>Last run {{ day(data.updated) }}, {{ time(data.updated) }}.</span>
    </p>

    <div class="vm-rail">
      <section v-for="group in [{ name: 'Game servers', items: servers }, { name: 'Proxies', items: proxies }]" :key="group.name">
        <h2 class="vm-rail-title">{{ group.name }}</h2>
        <div class="vm-rail-items">
          <button
            v-for="p in group.items"
            :key="p.id"
            type="button"
            class="vm-tile"
            :aria-pressed="selected === p.id"
            @click="pick(p.id)"
          >
            <span class="vm-tile-name">{{ p.name }}</span>
            <span class="vm-tile-count">{{ tally[p.id].works }} of {{ total }} work</span>
            <span class="vm-meter" aria-hidden="true">
              <span :style="{ width: `${(tally[p.id].works / total) * 100}%` }"></span>
            </span>
            <span v-if="tally[p.id].extras" class="vm-tile-extras">{{ tally[p.id].extras }}</span>
          </button>
        </div>
      </section>
    </div>

    <section v-if="view && platform" class="vm-on" aria-live="polite">
      <div class="vm-on-head">
        <h2 :id="`on-${platform.id}`">On {{ platform.name }}</h2>
        <button type="button" class="vm-link-button" @click="selected = null">Show every platform</button>
      </div>
      <p v-if="view.core" class="vm-on-core">
        The core runs here as <code>{{ view.core.jar }}-{{ data.version }}.jar</code>, tested on {{ view.core.on }}:
        <span :class="result(view.core.cells).ok ? 'vm-ok' : 'vm-ko'">{{ result(view.core.cells).text }}</span>.
      </p>

      <template v-for="g in view.groups" :key="g.key">
        <h3 :id="`on-${platform.id}-${g.key}`">{{ g.heading(g.rows.length, platform.name) }}</h3>
        <p v-if="g.note" class="vm-note">{{ g.note }}</p>
        <table class="vm-list" :aria-labelledby="`on-${platform.id}-${g.key}`">
          <thead>
            <tr><th>Collector</th><th>Built against</th><th>Java</th><th>Latest CI</th></tr>
          </thead>
          <tbody>
            <tr v-for="{ c, cell } in g.rows" :key="c.repo">
              <th scope="row"><a :href="withBase(`/collectors/${c.slug}`)">{{ c.target }}</a></th>
              <td class="vm-num" :title="c.compiled">{{ version(c.compiled) }}</td>
              <td class="vm-num">{{ c.java ?? '—' }}</td>
              <td>
                <a v-if="c.ci && Object.keys(cell.cells).length" :href="c.ci.url" :class="result(cell.cells).ok ? 'vm-ok' : 'vm-ko'">{{ result(cell.cells).text }} on {{ day(c.ci.finished) }}</a>
                <span v-else class="vm-muted-text">not tested on {{ platform.name }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </template>

      <details v-if="view.unavailable.length" class="vm-unavailable">
        <summary>{{ plural(view.unavailable.length, 'collector can’t', 'collectors can’t') }} run on {{ platform.name }}: their plugin doesn’t.</summary>
        <p>{{ view.unavailable.map((c) => c.target).join(', ') }}.</p>
      </details>
    </section>

    <h2 id="matrix" class="vm-section">All collectors by platform</h2>
    <div class="vm-matrix-tools">
      <label class="vm-filter-label">
        Filter
        <input v-model="query" class="vm-filter" type="search" placeholder="LuckPerms, spark…" />
      </label>
      <p class="vm-key">
        <span class="vm-ok">✓</span> means the collector works there, tested by its CI. A blank cell means
        its plugin doesn’t run there.
      </p>
    </div>
    <div class="vm-scroll">
      <table class="vm-table vm-matrix" @mouseleave="hovered = null">
        <caption class="visually-hidden">Collectors by platform, with the result of their latest CI run</caption>
        <thead>
          <tr class="vm-matrix-groups">
            <td class="vm-sticky"></td>
            <td colspan="2"></td>
            <th :colspan="servers.length" scope="colgroup">Game servers</th>
            <th :colspan="proxies.length" scope="colgroup" class="is-proxy-start">Proxies</th>
          </tr>
          <tr>
            <th class="vm-sticky" scope="col">Collector</th>
            <th scope="col">Built against</th>
            <th scope="col">Latest CI</th>
            <th
              v-for="(p, i) in PLATFORMS"
              :key="p.id"
              scope="col"
              class="vm-col"
              :class="column(p.id, i)"
              @mouseenter="hovered = p.id"
            >
              <button type="button" class="vm-col-button" :aria-pressed="selected === p.id" @click="pick(p.id)">{{ p.name }}</button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in shown" :key="c.repo">
            <th class="vm-sticky" scope="row"><a :href="withBase(`/collectors/${c.slug}`)">{{ c.target }}</a></th>
            <td class="vm-num">
              <span :title="c.compiled">{{ version(c.compiled) }}</span>
              <span v-if="c.updateAvailable" class="vm-update" :title="`Latest for Minecraft ${c.minecraft}: ${c.latest}`">{{ bare(c.latest) }} out</span>
            </td>
            <td>
              <a v-if="c.ci" :href="c.ci.url" :class="c.ci.result === 'success' ? 'vm-ok' : 'vm-ko'">
                {{ c.ci.result === 'success' ? 'passed' : c.ci.result }}
              </a>
            </td>
            <td
              v-for="(cell, i) in c.platforms"
              :key="cell.platform"
              class="vm-col"
              :class="column(cell.platform, i)"
              :title="tooltip(c, cell)"
              @mouseenter="hovered = cell.platform"
            >
              <template v-if="cell.state === 'passed' || cell.state === 'not-run'">
                <span class="vm-check" :class="{ 'is-stale': cell.state === 'not-run' }" aria-hidden="true">✓</span>
                <span class="visually-hidden">works</span>
              </template>
              <span v-else-if="WORD[cell.state]" class="vm-word" :class="`is-${cell.state}`">{{ WORD[cell.state] }}</span>
              <span v-else class="visually-hidden">not available</span>
            </td>
          </tr>
          <tr v-if="!shown.length">
            <td :colspan="PLATFORMS.length + 3" class="vm-empty">No collector matches “{{ query }}”. Try a plugin name, like LuckPerms.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2 id="core" class="vm-section">Core</h2>
    <p class="vm-note">
      One jar per platform family, and every collector above is tested on these same servers. The run over every platform
      <a v-if="data.core.full" :href="data.core.full.url">{{ data.core.full.result === 'success' ? 'passed' : 'failed' }} on {{ day(data.core.full.finished) }}</a>;
      the latest push <a v-if="data.core.build" :href="data.core.build.url">{{ data.core.build.result === 'success' ? 'passed' : 'failed' }} on {{ day(data.core.build.finished) }}</a>.
    </p>
    <div class="vm-scroll">
      <table class="vm-table">
        <caption class="visually-hidden">Platforms the core is tested on</caption>
        <thead>
          <tr>
            <th class="vm-sticky" scope="col">Platform</th>
            <th scope="col">Tested on</th>
            <th scope="col">Jar</th>
            <th scope="col">Latest run</th>
            <th scope="col">Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in data.core.platforms" :key="p.platform" :class="{ 'is-selected-row': selected === p.platform }">
            <th class="vm-sticky" scope="row">{{ p.name }}</th>
            <td>{{ p.on }}</td>
            <td><code>{{ p.jar }}</code></td>
            <td :class="result(p.cells).ok ? 'vm-ok' : 'vm-ko'">{{ result(p.cells).text }}</td>
            <td class="vm-note-cell">{{ p.note }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
