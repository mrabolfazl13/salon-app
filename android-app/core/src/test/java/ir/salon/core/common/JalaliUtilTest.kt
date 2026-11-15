package ir.salon.core.common

import org.junit.Assert.assertEquals
import org.junit.Test

/** تطبیق با خروجی مرجع jalaali-js (`frontend/src/lib/jalali.ts`) */
class JalaliUtilTest {

    @Test
    fun `gregorian to jalali known dates`() {
        // 2026-11-15 → 24 آبان 1405
        assertEquals(JalaliUtil.JalaliDate(1405, 8, 24), JalaliUtil.toJalali(2026, 11, 15))
        // 2026-03-21 → 1 فروردین 1405
        assertEquals(JalaliUtil.JalaliDate(1405, 1, 1), JalaliUtil.toJalali(2026, 3, 21))
        // 2024-03-20 → 1 فروردین 1403
        assertEquals(JalaliUtil.JalaliDate(1403, 1, 1), JalaliUtil.toJalali(2024, 3, 20))
        // 2025-12-22 → 1 دی 1404
        assertEquals(JalaliUtil.JalaliDate(1404, 10, 1), JalaliUtil.toJalali(2025, 12, 22))
    }

    @Test
    fun `jalali to gregorian round trip`() {
        val j = JalaliUtil.toJalali(2026, 11, 15)
        val g = JalaliUtil.toGregorian(j.jy, j.jm, j.jd)
        assertEquals(2026, g.gy)
        assertEquals(11, g.gm)
        assertEquals(15, g.gd)
    }

    @Test
    fun `leap year esfand length`() {
        // 1403 کبیسه است → اسفند 30 روز
        assertEquals(30, JalaliUtil.jalaliMonthLength(1403, 12))
        // 1404 عادی → اسفند 29
        assertEquals(29, JalaliUtil.jalaliMonthLength(1404, 12))
    }

    @Test
    fun `month names count`() {
        assertEquals(12, JalaliUtil.monthNames.size)
        assertEquals("فروردین", JalaliUtil.monthNames.first())
        assertEquals("اسفند", JalaliUtil.monthNames.last())
    }
}
