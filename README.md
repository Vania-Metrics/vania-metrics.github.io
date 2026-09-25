# vania-metrics.github.io

The VaniaMetrics site: https://vania-metrics.github.io. Getting started, configuration, the
compatibility of the core and of every collector, the reference of every metric.

Built with VitePress from two branches:

- `main` — the site: `docs/` (pages, theme, the components that draw the compatibility matrix and
  the metrics reference).
- `data` — what it shows. The CI of the core and of every collector ends with a `status` job
  (`Vania-Metrics/.github`, `.github/workflows/status.yml`) that writes one directory per
  repository here: its latest run (`ci.json`, `build.json`, `platforms.json`), its manifest
  (`manifest.json`) and what its sources declare (`catalog.json`: metrics, configuration keys,
  description). Nobody edits it by hand.

Every push to `main`, and every push to `data` through its `rebuild.yml`, rebuilds the site and
publishes it on GitHub Pages (`deploy.yml`).

```sh
pnpm install
pnpm data      # checks out the data branch into data/
pnpm dev       # http://localhost:5173
pnpm build     # docs/.vitepress/dist
```

## License

[GNU General Public License v3.0](LICENSE).
