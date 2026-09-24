<script setup lang="ts">
import { withBase } from 'vitepress'
import { data } from '../../lib/site.data'

const platforms = data.core.platforms.filter((p) => p.state === 'passed').length
const metrics = data.core.metrics.length + data.collectors.reduce((n, c) => n + c.metrics.length, 0)
</script>

<template>
  <div class="vm-home-status">
    <a :href="withBase('/compatibility')">
      <strong>{{ data.green }} / {{ data.collectors.length }}</strong>
      <span>collectors pass on every platform they claim</span>
    </a>
    <a :href="withBase('/compatibility#core')">
      <strong>{{ platforms }}</strong>
      <span>platforms the core is tested on, Minecraft {{ data.minecraft }}</span>
    </a>
    <a :href="withBase('/metrics')">
      <strong>{{ metrics }}</strong>
      <span>metric families, all documented</span>
    </a>
    <a :href="withBase('/guide/getting-started')">
      <strong>{{ data.version }}</strong>
      <span>current version of the core</span>
    </a>
  </div>
</template>
