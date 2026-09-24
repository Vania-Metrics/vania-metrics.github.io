import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import CollectorGrid from './components/CollectorGrid.vue'
import CompatMatrix from './components/CompatMatrix.vue'
import HomeStatus from './components/HomeStatus.vue'
import MetricsReference from './components/MetricsReference.vue'
import Pill from './components/Pill.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('CollectorGrid', CollectorGrid)
    app.component('CompatMatrix', CompatMatrix)
    app.component('HomeStatus', HomeStatus)
    app.component('MetricsReference', MetricsReference)
    app.component('Pill', Pill)
  },
} satisfies Theme
