import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseList } from './venueMedia'

describe('parseList', () => {
  it('passes a real array through', () => {
    expect(parseList(['a', 'b'])).toEqual(['a', 'b'])
  })

  it('decodes a JSON-string array column', () => {
    expect(parseList('["r","q"]')).toEqual(['r', 'q'])
  })

  it('returns [] for malformed JSON instead of throwing', () => {
    expect(parseList('{not json')).toEqual([])
  })

  it('returns [] for a JSON scalar or null', () => {
    expect(parseList('"plain string"')).toEqual([])
    expect(parseList(null)).toEqual([])
    expect(parseList(undefined)).toEqual([])
  })
})

describe('toFullUrl', () => {
  // STATIC_URL در زمان load ماژول از import.meta.env ساخته می‌شود ⇒ هر حالت با
  // resetModules + import مجدد ارزیابی می‌شود (وگرنه .env واقعی تست را می‌شکند)
  const loadWith = async (domain: string) => {
    vi.resetModules()
    vi.stubEnv('VITE_DOMAIN', domain)
    return await import('./venueMedia')
  }

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('returns empty string for missing filename', async () => {
    const { toFullUrl } = await loadWith('')
    expect(toFullUrl('')).toBe('')
  })

  it('passes absolute URLs through untouched', async () => {
    const { toFullUrl } = await loadWith('')
    expect(toFullUrl('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg')
    expect(toFullUrl('HTTP://cdn.example.com/a.jpg')).toBe('HTTP://cdn.example.com/a.jpg')
  })

  it('builds a relative static path when no domain is configured', async () => {
    const { toFullUrl } = await loadWith('')
    expect(toFullUrl('a.jpg')).toBe('/static/venues/a.jpg')
  })

  it('prefixes the configured domain and trims its trailing slash', async () => {
    const { toFullUrl } = await loadWith('https://salon.absadeghi.ir/')
    expect(toFullUrl('a.jpg')).toBe('https://salon.absadeghi.ir/static/venues/a.jpg')
  })

  it('strips leading slashes from stored filenames', async () => {
    const { toFullUrl } = await loadWith('')
    expect(toFullUrl('/uploads/a.jpg')).toBe('/static/venues/uploads/a.jpg')
  })
})
