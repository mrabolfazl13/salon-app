#!/usr/bin/env node
/**
 * Every literal Tailwind utility in src/**\/*.tsx must produce real CSS.
 *
 * This repo pins Tailwind 3.4 with the *static* scales, so a plausible-looking
 * class can compile to nothing at all (`bg-[#f6f7f9]/92`, `animate-shimmer`,
 * `min-h-13`). Those fail silently: the element renders unstyled and no tool
 * complains. Run after `vite build` — it compares source tokens to dist CSS.
 *
 *   npx vite build && node scripts/check-dead-classes.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const SPACING_ROOTS = new Set([
  'm', 'mt', 'mr', 'mb', 'ml', 'mx', 'my', 'ms', 'me',
  'p', 'pt', 'pr', 'pb', 'pl', 'px', 'py', 'ps', 'pe',
  'w', 'h', 'min-w', 'min-h', 'max-w', 'max-h', 'size',
  'gap', 'gap-x', 'gap-y', 'space-x', 'space-y',
  'inset', 'inset-x', 'inset-y', 'top', 'right', 'bottom', 'left', 'start', 'end',
  'translate-x', 'translate-y', 'scroll-m', 'scroll-p', 'indent', 'basis', 'order',
])

const UTILITY_ROOTS = new Set([
  ...SPACING_ROOTS,
  'sr', 'fixed', 'absolute', 'relative', 'sticky', 'z', 'float', 'clear', 'box',
  'block', 'inline', 'flex', 'grid', 'contents', 'hidden', 'visible', 'invisible',
  'collapse', 'aspect', 'divide', 'fill', 'stroke', 'object', 'overflow', 'overscroll',
  'text', 'font', 'leading', 'tracking', 'placeholder', 'align', 'whitespace', 'break',
  'hyphens', 'border', 'rounded', 'outline', 'ring', 'shadow', 'opacity', 'bg', 'from',
  'via', 'to', 'transition', 'duration', 'delay', 'animate', 'filter', 'backdrop',
  'uppercase', 'lowercase', 'capitalize', 'normal-case', 'italic', 'underline', 'overline',
  'line-through', 'rotate', 'skew', 'scale', 'origin', 'cursor', 'pointer', 'select',
  'resize', 'snap', 'scroll', 'touch', 'will', 'table', 'list', 'caret', 'accent',
  'mix', 'blur', 'brightness', 'contrast', 'grayscale', 'invert', 'saturate', 'sepia',
  'drop-shadow', 'place', 'justify', 'items', 'self', 'content', 'col', 'row', 'truncate',
])

const VARIANT_ROOTS = new Set([
  'hover', 'focus', 'focus-visible', 'focus-within', 'active', 'visited', 'disabled',
  'enabled', 'checked', 'group', 'peer', 'dark', 'light', 'sm', 'md', 'lg', 'xl', '2xl',
  'max-sm', 'max-md', 'max-lg', 'max-xl', 'max-2xl', 'supports', 'has', 'motion-safe',
  'motion-reduce', 'print', 'rtl', 'ltr', 'first', 'last', 'odd', 'even', 'only',
  'marker', 'file', 'selection', 'empty', 'open', 'closed', 'inert', 'aria', 'data',
])

/** `p-3`, `h-1.5`, `w-1/2`, `min-h-[52px]`, `mt-px` — but not `my-invitations`. */
const SPACING_VALUE = /^(\d+(\.\d+)?(\/\d+)?|\[.+\]|full|screen|auto|px|fit|min|max|span-\d+|auto)$/,
  UTILITY = /^[!-]?[a-z][a-zA-Z0-9@!:[\](){},.%#/*=_+-]*$/

// `min-h-13` must read as root `min-h`, not `m`/`min` — longest prefix wins
const LONGEST_ROOTS = [...UTILITY_ROOTS].sort((a, b) => b.length - a.length),
  SPACING_LONGEST = [...SPACING_ROOTS].sort((a, b) => b.length - a.length)

// Tailwind only negates scale-backed utilities, so `-outline` is an icon suffix, not a class
const NEGATABLE = new Set([...SPACING_ROOTS, 'rotate', 'skew', 'scale'])

export function isUtilityToken(tok) {
  if (!tok || !UTILITY.test(tok)) return false
  if (!tok.includes('-') && tok !== 'sr-only') return false
  const parts = tok.split(':')
  for (const v of parts.slice(0, -1)) {
    const root = v.split(/[-\[]/)[0]
    if (!VARIANT_ROOTS.has(root)) return false
    // `data-[state=active]` and `aria-expanded` are fine; `mdi:cash` is an icon name
    if (/\[/.test(v) === false && v.includes('=')) return false
  }
  const raw = parts[parts.length - 1]
  // `!flex` (important) and `-mt-2` (negative) are still utilities once the prefix is off
  const base = raw.startsWith('!') || raw.startsWith('-') ? raw.slice(1) : raw
  // an `=` outside brackets means an HTML attribute (`stroke-width=`), not a class
  if (base.includes('=') && !/\[.*=.*\]/.test(base)) return false
  if (base.includes('/')) {
    const slash = base.lastIndexOf('/')
    const left = base.slice(0, slash)
    if (left.includes('[')) {
      // arbitrary value with an opacity modifier: `bg-[#fff]/90`
    } else if (!/^\d+$/.test(base.slice(slash + 1))) return false
  }
  const root = base.split(/[-\[]/)[0]
  if (!UTILITY_ROOTS.has(root) && !LONGEST_ROOTS.some((r) => base.startsWith(r + '-'))) return false
  const spacing = SPACING_LONGEST.find((r) => base === r || base.startsWith(r + '-'))
  if (raw.startsWith('-') && !NEGATABLE.has(spacing ?? '')) return false
  if (spacing) {
    const value = base.slice(spacing.length + 1)
    if (value && !SPACING_VALUE.test(value)) return false
  }
  return true
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) yield* walk(full)
    else if (/\.(tsx|ts)$/.test(name) && !/\.test\.(tsx|ts)$/.test(name)) yield full
  }
}

function run() {
  const cssFiles = existsSync('dist/assets')
    ? readdirSync('dist/assets').filter((f) => f.endsWith('.css')).map((f) => join('dist/assets', f))
    : []
  if (!cssFiles.length) {
    console.error('check-dead-classes: no dist/assets/*.css — run `npx vite build` first.')
    process.exit(2)
  }
  // Tailwind escapes selector punctuation with backslashes; removing them makes
  // `.data-\[state=active\]\:bg-card` findable as the literal source token.
  const flat = cssFiles.map((f) => readFileSync(f, 'utf8')).join('\n').replaceAll('\\', '')
  const CONT = /[a-zA-Z0-9_.\-/]/

  function hasRule(tok) {
    const needle = '.' + tok
    for (let i = flat.indexOf(needle); i >= 0; i = flat.indexOf(needle, i + 1)) {
      const next = flat[i + needle.length]
      if (next === undefined || !CONT.test(next)) return true
    }
    return false
  }

  const dead = new Map()
  let scanned = 0
  for (const file of walk('src')) {
    const text = readFileSync(file, 'utf8')
    for (const m of text.matchAll(/["']([^"'${}]*)["']|`([^`${]*)`/g)) {
      for (const tok of (m[1] ?? m[2] ?? '').split(/\s+/)) {
        if (!isUtilityToken(tok)) continue
        scanned++
        if (!hasRule(tok)) {
          if (!dead.has(tok)) dead.set(tok, [])
          dead.get(tok).push(`${file}:${text.slice(0, m.index).split('\n').length}`)
        }
      }
    }
  }

  if (dead.size) {
    console.error(`check-dead-classes: ${dead.size} utility token(s) produce no CSS:`)
    for (const [tok, where] of dead) console.error(`  ${tok}  ← ${where.join(', ')}`)
    process.exit(1)
  }
  console.log(`check-dead-classes: OK — ${scanned} utility tokens, all present in compiled CSS`)
}

/**
 * The gate is only as good as this classifier: a token it ignores is a class
 * that can render silently unstyled, and a token it invents turns an icon name
 * into a fake finding. Run `node scripts/check-dead-classes.mjs --self-test`.
 */
const CLASSIFIER_CASES = {
  accept: [
    'min-h-11', 'min-h-13', 'h-1.5', 'w-1/2', 'px-3.5', 'sm:col-span-2', 'max-w-[720px]',
    'bg-[#f59e0b]/35', 'bg-[#f6f7f9]/92', 'data-[state=active]:bg-card', 'hover:scale-105',
    'focus-visible:ring-2', 'dark:hover:border-amber-400/35', '-translate-y-1', '-mt-2', 'gap-y-7',
  ],
  reject: [
    'mdi:cash-multiple', 'mdi:scale-balance', '@/components/ui/Button', 'aria-hidden', 'aria-live',
    'my-invitations', 'top-center', 'stroke-width=', 'auth-token', 'the', 'flex', '-outline', '',
  ],
}

function selfTest() {
  const failures = [
    ...CLASSIFIER_CASES.accept.filter((t) => !isUtilityToken(t)).map((t) => `should be a utility: "${t}"`),
    ...CLASSIFIER_CASES.reject.filter((t) => isUtilityToken(t)).map((t) => `should NOT be a utility: "${t}"`),
  ]
  if (failures.length) {
    console.error(`check-dead-classes self-test FAILED:\n  ${failures.join('\n  ')}`)
    process.exit(1)
  }
  console.log(`check-dead-classes self-test: OK — ${CLASSIFIER_CASES.accept.length + CLASSIFIER_CASES.reject.length} classifier cases`)
}

import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const isDirectRun = resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)
if (process.argv.includes('--self-test')) selfTest()
else if (isDirectRun) run()
