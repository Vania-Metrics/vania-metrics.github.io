<script setup lang="ts">
import { withBase } from 'vitepress'
import { data } from '../../lib/site.data'
import { bare, inline } from '../../lib/format'

type Collector = (typeof data.collectors)[number]
const on = (c: Collector, states: string[]) => c.platforms.filter((p) => states.includes(p.state)).map((p) => p.name)
</script>

<template>
  <ul class="vm-collectors" role="list">
    <li v-for="c in data.collectors" :key="c.repo">
      <div class="vm-collector-head">
        <a class="vm-collector-name" :href="withBase(`/collectors/${c.slug}`)">{{ c.target }}</a>
        <span class="vm-muted-text">{{ bare(c.compiled) }}</span>
      </div>
      <p class="vm-collector-text" v-html="inline(c.summary)"></p>
      <p class="vm-collector-meta">
        Works on {{ on(c, ['passed', 'not-run']).join(', ') || 'no platform yet' }}<template v-if="on(c, ['not-ported']).length">; not yet on {{ on(c, ['not-ported']).join(', ') }}</template>.
        {{ c.metrics.length }} {{ c.metrics.length === 1 ? 'metric' : 'metrics' }}.
        <a v-if="c.ci && c.ci.result !== 'success'" :href="c.ci.url" class="vm-ko">Latest CI run failed.</a>
      </p>
    </li>
  </ul>
</template>
