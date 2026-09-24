// What a cell of the compatibility matrix means. Shared by the build (data.ts) and the
// components, so nothing here may import Node modules.

export const PLATFORMS = [
  { id: 'paper', name: 'Paper', kind: 'server' },
  { id: 'purpur', name: 'Purpur', kind: 'server' },
  { id: 'folia', name: 'Folia', kind: 'server' },
  { id: 'spigot', name: 'Spigot', kind: 'server' },
  { id: 'bukkit', name: 'CraftBukkit', kind: 'server' },
  { id: 'sponge', name: 'Sponge', kind: 'server' },
  { id: 'velocity', name: 'Velocity', kind: 'proxy' },
  { id: 'bungeecord', name: 'BungeeCord', kind: 'proxy' },
  { id: 'waterfall', name: 'Waterfall', kind: 'proxy' },
  { id: 'geyser', name: 'Geyser', kind: 'proxy' },
] as const

export type PlatformId = (typeof PLATFORMS)[number]['id']

export type State =
  | 'passed'
  | 'failed'
  | 'not-run'
  | 'untested'
  | 'not-ported'
  | 'no-plugin'
  | 'unknown'

export const STATES: Record<State, { label: string; symbol: string; meaning: string }> = {
  passed: { symbol: '✓', label: 'Passed', meaning: 'Runs there, and passed on a real server in the latest CI run' },
  failed: { symbol: '✗', label: 'Failed', meaning: 'Runs there, but failed in the latest CI run' },
  'not-run': { symbol: '○', label: 'Not run', meaning: 'Runs there, not tested by the latest CI run' },
  untested: { symbol: '?', label: 'Untested', meaning: 'Expected to run there, not verified on a real server yet' },
  'not-ported': { symbol: '…', label: 'Not yet', meaning: 'The target plugin runs there, this collector does not yet' },
  'no-plugin': { symbol: '–', label: 'n/a', meaning: 'The target plugin itself does not run there' },
  unknown: { symbol: '?', label: 'Unknown', meaning: 'Nobody has checked' },
}

/** The outcome of every cell of that platform: velocity-3.5.1 and velocity-4.2.1 are velocity's. */
export function platformCells(cells: Record<string, string> | undefined, platform: string) {
  return Object.fromEntries(
    Object.entries(cells ?? {}).filter(([cell]) => cell.split('-')[0] === platform),
  ) as Record<string, string>
}

/**
 * The state of one cell: what the manifest claims (yes, untested, no — tested or untested for
 * the core), what the target plugin does there, and what the latest CI run found.
 */
export function stateOf(claim: string | undefined, plugin: string | undefined, cells: Record<string, string>): State {
  const outcomes = Object.values(cells)
  const failed = outcomes.includes('failed')
  const passed = outcomes.length > 0 && outcomes.every((o) => o === 'passed')
  switch (claim) {
    case 'yes':
    case 'tested':
      return failed ? 'failed' : passed ? 'passed' : 'not-run'
    case 'untested':
      return failed ? 'failed' : 'untested'
    case 'no':
      return plugin === 'yes' || plugin === 'bundled' ? 'not-ported' : plugin === 'no' ? 'no-plugin' : 'unknown'
    default:
      return 'unknown'
  }
}

/** "velocity-4.2.1" is shown as 4.2.1 under Velocity; a cell named after its platform alone as nothing. */
export function variantOf(cell: string) {
  return cell.includes('-') ? cell.slice(cell.indexOf('-') + 1) : ''
}
