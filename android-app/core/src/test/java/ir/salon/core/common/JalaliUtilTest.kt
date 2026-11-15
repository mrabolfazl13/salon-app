package ir.salon.core.common

import org.junit.Assert.assertEquals
import org.junit.Test

/** تطبیق با خروجی مرجع jalaali-js (`frontend/src/lib/jalali.ts`) */
class JalaliUtilTest {

    @Test
    fun `gregorian to jalali known dates`() {
        // مقادیر مرجع با پورت پایتونیِ همان الگوریتم (jalaali-js) تولید شده‌اند
        assertEquals(JalaliUtil.JalaliDate(1405, 8, 25), JalaliUtil.toJalali(2026, 11, 15))
        assertEquals(JalaliUtil.JalaliDate(1405, 1, 2), JalaliUtil.toJalali(2026, 3, 21))
        assertEquals(JalaliUtil.JalaliDate(1403, 1, 1), JalaliUtil.toJalali(2024, 3, 20))
        assertEquals(JalaliUtil.JalaliDate(1404, 10, 2), JalaliUtil.toJalali(2025, 12, 22))
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
