---
description: One small plugin per integration, installed next to the plugin it measures.
---

# Collectors

A collector is a small plugin that reads one other plugin and publishes what it sees through the
core. Install only the ones for the plugins you run: each depends on its target plugin, so a
missing one disables that collector, never the core.

<CollectorGrid />
