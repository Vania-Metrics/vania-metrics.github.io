<script setup lang="ts">
import { computed } from 'vue'
import { STATES, type State } from '../../lib/platforms'

const props = defineProps<{ state: State; label?: string; compact?: boolean; title?: string }>()
const info = computed(() => STATES[props.state] ?? STATES.unknown)
</script>

<template>
  <span class="vm-pill" :class="[`is-${state}`, { 'is-compact': compact }]" :title="title ?? info.meaning">
    <span aria-hidden="true">{{ info.symbol }}</span>
    <span v-if="!compact">{{ label ?? info.label }}</span>
    <span v-else class="visually-hidden">{{ info.label }}</span>
  </span>
</template>
