# Configuration

The core writes `metrics.properties` into its folder on first start (`plugins/VaniaMetrics/` on
the Bukkit family), and never touches it again: the file is yours.

## Environment variables

Every key can be set by an environment variable instead: upper-case the key, turn dots into
underscores, prefix it with `VANIA_METRICS_`. The variable wins over the file.

| Key | Environment variable |
|---|---|
| `http.port` | `VANIA_METRICS_HTTP_PORT` |
| `collector.world.interval` | `VANIA_METRICS_COLLECTOR_WORLD_INTERVAL` |

That is what a Helm chart or a compose file needs to configure everything without shipping a
file — the same way Plan and LuckPerms do.

## Scrape endpoint

| Key | Default | |
|---|---|---|
| `http.bind` | `0.0.0.0` | Prometheus usually scrapes from another host or pod: restrict access with a firewall or a NetworkPolicy, not with the bind address. |
| `http.port` | `9940` | |
| `http.path` | `/metrics` | |
| `http.token` | empty | When set, a bearer token is required. On a closed network, one more secret to rotate adds nothing. |

## Core collectors

All enabled by default. `collector.<name> = false` disables one; `collector.<name>.interval` sets
how often a background collector refreshes, in seconds.

| Key | Default | |
|---|---|---|
| `collector.jvm` | `true` | Memory and memory pools, garbage collection, threads, classes, buffers. |
| `collector.cgroup` | `true` | CPU, throttling, memory, OOM events and I/O of the container, from cgroup v2. |
| `collector.disk` | `true` | Free, used and total space, and file counts, per path. |
| `collector.disk.interval` | `300` | |
| `collector.disk.paths` | `/data,/backups,/server` | |
| `collector.tick` | `true` | TPS, tick durations, tick count, player slots. |
| `collector.world` | `true` | Per world: entities (and per type), chunks, tile entities, players, time, weather. |
| `collector.world.interval` | `10` | Not lower: the per-type breakdown is the one O(n) part. |
| `collector.world.entity_type_threshold` | `5` | Entity types below this count are not published; `-1` publishes none per type. |
| `collector.players` | `true` | Online players, ping, locales, client brands, playtime and statistics. |
| `collector.events` | `true` | Connections and sessions, deaths, mob deaths, commands, chat, blocks, crafted items. |
| `collector.proxy` | `true` | On a proxy: players, backends (up, players, ping), connections, kicks, switches. |
| `collector.proxy.ping_timeout` | `5` | Seconds before a backend counts as down. |

## Per-player detail

A `player` label creates one series per player. "Never do it" is right at a thousand players and
wrong for a server of a few dozen: fifty slots make a few hundred series, next to the ~300 the server
already publishes. Two guarantees keep it bounded:

- **only online players are published** — nothing is lost, since what a player does happens while
  online, and Prometheus keeps the history after they leave;
- **a hard cap** — beyond it, detail stops and `mc_exporter_player_series_dropped` says so.

| Key | Default |
|---|---|
| `collector.players.per_player` | `true` |
| `collector.players.max_series` | `200` |

Still off-limits: per-player labels on high-frequency metrics, such as packets or broken blocks.
VaniaMetrics publishes states, not flows.

## Collectors

Each collector is its own jar: removing it from the plugins folder is the real switch, since
nothing loads, runs or fails. What remains configurable goes through the same keys as the core's,
under the name the collector registers — `collector.luckperms.interval` for LuckPerms,
`collector.packets.types` for PacketEvents. Every collector's page lists its keys.
