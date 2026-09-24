---
layout: home
hero:
  name: VaniaMetrics
  text: Prometheus metrics for Minecraft servers and proxies
  tagline: A small core serves /metrics; add one collector per plugin you run. Every platform it claims is tested on a real server.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Compatibility
      link: /compatibility
    - theme: alt
      text: Metrics
      link: /metrics
features:
  - title: No runtime dependencies
    details: The core runs on the JDK alone, nothing shaded, nothing relocated. It writes the Prometheus text format itself.
  - title: One jar per integration
    details: Install only the collectors for the plugins you run. A missing target plugin disables its collector, never the core.
  - title: Bounded cardinality
    details: Per-player series are capped, and rare values are folded away rather than exploding your TSDB.
  - title: Tested on real servers
    details: Paper, Purpur, Folia, Spigot, Sponge, Velocity, BungeeCord and Geyser, each started in a container by CI.
---

<HomeStatus />
