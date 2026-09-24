// Small formatting helpers shared by the components. No Node imports.

/** '7.0.17 (7.0.18+ drops 1.21.11)' is 7.0.17. */
export const bare = (version: string) => version.replace(/\s*\(.*\)\s*$/, '')

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The inline Markdown a javadoc paragraph uses: `code`, **bold**, *emphasis*. */
export function inline(markdown: string) {
  return escapeHtml(markdown)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}
