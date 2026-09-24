<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import { data } from '../../lib/site.data'
import { PLATFORMS } from '../../lib/platforms'

const DOMAINS: [string, string, string][] = [
  ['server', 'Game server', 'Ticks, players, connections, commands, blocks.'],
  ['world', 'Worlds', 'Entities, chunks, tile entities, time and weather.'],
  ['proxy', 'Proxy', 'Players, backend servers, pings and switches.'],
  ['bedrock', 'Bedrock players', 'Published by the Geyser extension.'],
  ['jvm', 'JVM', 'Memory, garbage collection, threads.'],
  ['host', 'Host', 'CPU, throttling, memory, disk and I/O of the container, read from cgroup v2.'],
  ['exporter', 'Exporter', 'The health of the exporter and of every collector.'],
  ['build', 'Build', 'What is running.'],
]
const NAMES = Object.fromEntries(PLATFORMS.map((p) => [p.id, p.name]))

const query = ref('')
const matches = (m: { name: string; help: string | null; labels: string[] }, extra = '') => {
  const q = query.value.trim().toLowerCase()
  return !q || [m.name, m.help ?? '', ...m.labels, extra].some((s) => s.toLowerCase().includes(q))
}

const core = computed(() =>
  DOMAINS.map(([id, title, text]) => ({
    id,
    title,
    text,
    metrics: data.core.metrics.filter((m) => m.domain === id && matches(m)),
  })).filter((d) => d.metrics.length),
)
const collectors = computed(() =>
  data.collectors
    .map((c) => ({ ...c, shown: c.metrics.filter((m) => matches(m, `${c.target} ${c.repo}`)) }))
    .filter((c) => c.shown.length),
)
const where = (platforms: string[]) =>
  platforms.length === PLATFORMS.length ? ['every platform'] : platforms.map((p) => NAMES[p] ?? p)
</script>

<template>
  <input v-model="query" class="vm-filter" type="search" placeholder="Filter by name, label or description…" />

  <h2 id="core-metrics">Core</h2>
  <p>Published by the core as soon as it runs, on every platform that can provide them.</p>
  <template v-for="d in core" :key="d.id">
    <h3 :id="`domain-${d.id}`"><code>mc_{{ d.id }}_*</code> — {{ d.title }}</h3>
    <p class="vm-muted" style="font-size: 14px">{{ d.text }}</p>
    <div v-for="m in d.metrics" :key="m.name" class="vm-metric">
      <div class="vm-metric-head">
        <code>{{ m.name }}</code>
        <span class="vm-badge is-type">{{ m.type }}</span>
        <span v-for="l in m.labels" :key="l" class="vm-badge">{{ l }}</span>
      </div>
      <p>{{ m.help }}</p>
      <div class="vm-chips">on <span v-for="p in where(m.platforms)" :key="p" class="vm-badge">{{ p }}</span></div>
    </div>
  </template>

  <h2 id="collector-metrics">Collectors</h2>
  <p>Published once the collector's jar is installed next to its target plugin.</p>
  <template v-for="c in collectors" :key="c.repo">
    <h3 :id="`collector-${c.slug}`"><a :href="withBase(`/collectors/${c.slug}`)">{{ c.target }}</a></h3>
    <div v-for="m in c.shown" :key="m.name" class="vm-metric">
      <div class="vm-metric-head">
        <code>{{ m.name }}</code>
        <span class="vm-badge is-type">{{ m.type }}</span>
        <span v-for="l in m.labels" :key="l" class="vm-badge">{{ l }}</span>
      </div>
      <p>{{ m.help }}</p>
    </div>
  </template>

  <p v-if="!core.length && !collectors.length">No metric matches “{{ query }}”.</p>
</template>
