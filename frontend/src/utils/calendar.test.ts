import { describe, it, expect } from 'vitest'
import { buildIcsEvent, escapeIcsText, foldIcsLine, icsFileName } from './calendar'

const base = {
  bookingId: 42,
  venueName: 'سالن آزادی',
  date: '2026-04-01',
  time: '18:30',
  price: 250000,
}

describe('escapeIcsText', () => {
  it('escapes backslash before the other specials', () => {
    expect(escapeIcsText('a\\b')).toBe('a\\\\b')
  })

  it('escapes semicolon, comma and newline', () => {
    expect(escapeIcsText('a;b,c\nd')).toBe('a\\;b\\,c\\nd')
  })
})

describe('foldIcsLine', () => {
  it('leaves short lines alone', () => {
    expect(foldIcsLine('SUMMARY:short')).toBe('SUMMARY:short')
  })

  it('folds long ASCII lines at 75 octets with CRLF+space', () => {
    const folded = foldIcsLine(`DESCRIPTION:${'x'.repeat(100)}`)
    for (const piece of folded.split('\r\n')) {
      expect(new TextEncoder().encode(piece).length).toBeLessThanOrEqual(75)
    }
    expect(folded).toContain('\r\n ')
  })

  it('counts UTF-8 bytes, not characters, for Persian text', () => {
    const folded = foldIcsLine(`SUMMARY:${'سالن'.repeat(40)}`)
    for (const piece of folded.split('\r\n')) {
      expect(new TextEncoder().encode(piece).length).toBeLessThanOrEqual(75)
    }
  })
})

describe('buildIcsEvent', () => {
  const ics = buildIcsEvent(base)
  const lines = ics.split('\r\n')

  it('wraps a VCALENDAR with a VEVENT and ends with CRLF', () => {
    expect(lines[0]).toBe('BEGIN:VCALENDAR')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('END:VEVENT')
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })

  it('uses Tehran TZID with wall-clock start (no UTC shift)', () => {
    expect(ics).toContain('DTSTART;TZID=Asia/Tehran:20260401T183000')
  })

  it('adds the slot duration to DTEND', () => {
    expect(ics).toContain('DTEND;TZID=Asia/Tehran:20260401T193000')
  })

  it('rolls DTEND over midnight when the slot crosses it', () => {
    const late = buildIcsEvent({ ...base, time: '23:30', durationMinutes: 60 })
    expect(late).toContain('DTEND;TZID=Asia/Tehran:20260402T003000')
  })

  it('honours a custom duration', () => {
    const short = buildIcsEvent({ ...base, durationMinutes: 45 })
    expect(short).toContain('DTEND;TZID=Asia/Tehran:20260401T191500')
  })

  it('emits a stable UID per booking', () => {
    expect(ics).toContain('UID:booking-42@salon.absadeghi.ir')
  })

  it('escapes ASCII commas inside the venue name (RFC 5545 text)', () => {
    // «،» فارسی در ICS کاراکتر ویژه نیست؛ فقط ویرگول ASCII باید فرار شود
    const escaped = buildIcsEvent({ ...base, venueName: 'Azadi, Tehran' })
    expect(escaped).toContain('SUMMARY:سانس Azadi\\, Tehran')
  })

  it('ships a DTSTAMP in UTC', () => {
    expect(ics).toMatch(/^DTSTAMP:\d{8}T\d{6}Z$/m)
  })

  it('names the file after the booking', () => {
    expect(icsFileName(base)).toBe('booking-42-2026-04-01.ics')
  })
})
