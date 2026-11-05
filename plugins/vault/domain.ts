/** The snippet vault's types and pure rules: variables, rendering, search, sorting and the languages. No clock, disk or ids made here. */
export interface Language {
  readonly id: string
  readonly label: string
  /** The two or three letters on the language's chip. */
  readonly short: string
  readonly ext: string
  /** Whether snippets of this language are listed and can be created. */
  readonly enabled: boolean
}

export interface Snippet {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly language: string
  readonly code: string
  readonly tags: readonly string[]
  /** The `{{name}}` placeholders of the code, in order of first use. */
  readonly variables: readonly string[]
  readonly createdAt: string
  readonly updatedAt: string
  readonly starred: boolean
  /** When the snippet was last copied or inserted; absent when never. */
  readonly lastUsedAt?: string
}

export interface Collection {
  readonly id: string
  readonly name: string
  readonly snippetIds: readonly string[]
}

export interface VaultState {
  readonly version: 1
  languages: Language[]
  snippets: Snippet[]
  collections: Collection[]
}

export type VaultErrorCode = 'invalid' | 'not-found' | 'conflict'

export class VaultError extends Error {
  readonly code: VaultErrorCode
  constructor(code: VaultErrorCode, message: string) {
    super(message)
    this.name = 'VaultError'
    this.code = code
  }
}

const VARIABLE = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g

/** The placeholder names in a code, each once, in order of first use. */
export function variablesOf(code: string): string[] {
  const names: string[] = []
  for (const match of code.matchAll(VARIABLE)) if (!names.includes(match[1] as string)) names.push(match[1] as string)
  return names
}

/** The code with each `{{name}}` replaced by its value; a name with no (or an empty) value stays as it is and is reported in `missing`. */
export function render(code: string, values: Readonly<Record<string, string>>): { text: string; missing: string[] } {
  const missing: string[] = []
  const text = code.replace(VARIABLE, (whole, name: string) => {
    const value = values[name]
    if (value === undefined || value === '') {
      if (!missing.includes(name)) missing.push(name)
      return whole
    }
    return value
  })
  return { text, missing }
}

/** `2h ago`, `Yesterday`, `Oct 31`: how the list writes a time, next to `now` (ISO local date-times without a zone). */
export function ago(stamp: string, now: string): string {
  const minutes = Math.round((Date.parse(`${now}:00Z`) - Date.parse(`${stamp}:00Z`)) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 60 * 24 && stamp.slice(0, 10) === now.slice(0, 10)) return `${Math.floor(minutes / 60)}h ago`
  const days = Math.round((Date.parse(`${now.slice(0, 10)}T00:00:00Z`) - Date.parse(`${stamp.slice(0, 10)}T00:00:00Z`)) / 86400000)
  if (days === 1) return 'Yesterday'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[Number(stamp.slice(5, 7)) - 1]} ${Number(stamp.slice(8, 10))}`
}

export const SORTS = ['edited', 'name', 'used', 'created'] as const
export type Sort = (typeof SORTS)[number]
export const SORT_LABEL: Readonly<Record<Sort, string>> = {
  edited: 'Recently edited',
  name: 'Name A to Z',
  used: 'Recently used',
  created: 'Newest first',
}

export function sortSnippets(list: readonly Snippet[], sort: Sort): Snippet[] {
  const copy = [...list]
  const byName = (a: Snippet, b: Snippet) => a.title.localeCompare(b.title)
  switch (sort) {
    case 'name':
      return copy.sort(byName)
    case 'used':
      return copy.sort((a, b) => (b.lastUsedAt ?? '').localeCompare(a.lastUsedAt ?? '') || byName(a, b))
    case 'created':
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || byName(a, b))
    default:
      return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || byName(a, b))
  }
}

/** A snippet matches a search when every word is in its title, description, tags, language or code, ignoring case. */
export function matches(snippet: Snippet, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = `${snippet.title} ${snippet.description} ${snippet.tags.join(' ')} ${snippet.language} ${snippet.code}`.toLowerCase()
  return words.every((word) => haystack.includes(word))
}

/** A file name for a snippet: its title as a slug plus the language's extension. */
export function fileNameOf(snippet: Pick<Snippet, 'title'>, language: Pick<Language, 'ext'>): string {
  const slug = snippet.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${slug === '' ? 'snippet' : slug}.${language.ext}`
}

export function cleanText(value: unknown, label: string, max: number, required = true): string {
  const text = typeof value === 'string' ? value.trim() : ''
  if (text === '' && required) throw new VaultError('invalid', `${label} is needed.`)
  if (text.length > max) throw new VaultError('invalid', `${label} can be at most ${max} characters.`)
  return text
}

/** Tags from a comma or space separated text: lowercase, letters, digits and dashes, no repeats, at most 8. */
export function cleanTags(value: unknown): string[] {
  const text = Array.isArray(value) ? value.join(',') : typeof value === 'string' ? value : ''
  const tags: string[] = []
  for (const part of text.split(/[,\s]+/)) {
    const tag = part.toLowerCase().replace(/^#/, '').replace(/[^a-z0-9-]/g, '')
    if (tag === '' || tags.includes(tag)) continue
    if (tag.length > 24) throw new VaultError('invalid', `The tag "${tag.slice(0, 12)}…" is too long (24 characters at most).`)
    tags.push(tag)
  }
  if (tags.length > 8) throw new VaultError('invalid', 'Use at most 8 tags.')
  return tags
}
