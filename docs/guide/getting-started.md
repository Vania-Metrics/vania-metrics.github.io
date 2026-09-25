<script setup>
import { data } from '../.vitepress/lib/site.data'

const folder = { sponge: 'mods/', geyser: 'extensions/' }
const luckperms = data.collectors.find((c) => c.slug === 'luckperms')
</script>

# Getting started

VaniaMetrics comes in two parts: **the core**, a plugin that serves `/metrics` over HTTP, and
**collectors**, one small plugin per integration. Install the core first, then add collectors only
for the plugins you run.

## Install the core

Drop the jar for your platform into its folder and restart the server.

<table>
  <thead>
    <tr><th>Platform</th><th>Jar</th><th>Folder</th><th>Tested on</th></tr>
  </thead>
  <tbody>
    <tr v-for="p in data.core.platforms" :key="p.platform">
      <td>{{ p.name }}</td>
      <td><code>{{ p.jar }}-{{ data.version }}.jar</code></td>
      <td><code>{{ folder[p.platform] ?? 'plugins/' }}</code></td>
      <td>{{ p.on }}</td>
    </tr>
  </tbody>
</table>

One Bukkit jar covers the whole family: the optional APIs of Paper (tick times, world counters,
client brands) are probed at startup, and Folia gets region schedulers instead of the main thread.
A metric a platform cannot provide is left out, never faked: see where each one is published in the
[metrics reference](/metrics).

## Check the endpoint

```sh
curl http://localhost:9940/metrics
```

```txt
# HELP mc_build_info Always 1. The version is in the labels, the Prometheus idiom for publishing a string.
# TYPE mc_build_info gauge
mc_build_info{version="0.6.0",platform="paper",server_version="1.21.11-132-c5eb079 (MC: 1.21.11)",server="lobby"} 1
# HELP mc_server_players_online Online players.
# TYPE mc_server_players_online gauge
mc_server_players_online 12
…
```

## Scrape it with Prometheus

```yaml
scrape_configs:
  - job_name: minecraft
    scrape_interval: 5s
    static_configs:
      - targets: ['mc.example.com:9940']
```

::: tip Five seconds
Tick metrics move fast: a 15 s interval smooths away the lag spikes you want to see. Scraping
costs the server next to nothing — values that are expensive to compute are refreshed in the
background, never during a scrape.
:::

If you set a token (`http.token`), add it to the job:

```yaml
    authorization:
      credentials: your-token
```

## Add collectors

Each collector is a separate jar that goes next to the core and next to the plugin it measures —
say `{{ luckperms.jar }}` next to LuckPerms. It does nothing
without its target plugin, and never takes the core down with it.

The [collectors overview](/collectors/) lists all of them; the
[compatibility matrix](/compatibility) shows where each one has been tested.

## Next

- [Configuration](/guide/configuration): the port, a token, what to collect, per-player detail.
- [Metrics](/metrics): every family, its labels and where it is published.
