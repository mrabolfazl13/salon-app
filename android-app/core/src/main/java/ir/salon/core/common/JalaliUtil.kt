package ir.salon.core.common

/**
 * تبدیل میلادی ↔ جلالی — بازنویسی دقیق الگوریتم jalaali-js (Borkowski)
 * تا با خروجی فرانت‌اند (`frontend/src/lib/jalali.ts`) یکسان باشد.
 * API همیشه ISO میلادی می‌فرستد؛ تبدیل فقط در لبهٔ UI.
 */
object JalaliUtil {

    /** سال کبیسهٔ جلالی بر پایهٔ الگوریتم 2820 ساله */
    fun isLeapJalaliYear(jy: Int): Boolean = jalCal(jy).leap

    /** تبدیل میلادی → جلالی */
    fun toJalali(gy: Int, gm: Int, gd: Int): JalaliDate {
        val j = d2j(g2d(gy, gm, gd))
        return JalaliDate(j.jy, j.jm, j.jd)
    }

    /** تبدیل جلالی → میلادی */
    fun toGregorian(jy: Int, jm: Int, jd: Int): GregorianDate {
        val g = d2g(j2d(jy, jm, jd))
        return GregorianDate(g.gy, g.gm, g.gd)
    }

    /** طول ماه جلالی (روز) */
    fun jalaliMonthLength(jy: Int, jm: Int): Int {
        if (jm <= 6) return 31
        if (jm <= 11) return 30
        return if (isLeapJalaliYear(jy)) 30 else 29
    }

    val monthNames = listOf(
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
    )

    /** نام روز هفتهٔ میلادی (1=شنبه...7=جمعه مطابق Monday=1 در Date.getDay سنجیده با 6=شنبه) */
    val weekDayNames = listOf("شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه")

    /** نام روز هفتهٔ جلالی از تاریخ میلادی: python weekday (0=دوشنبه) → شنبه‌مبنا */
    fun weekDayIndexFa(javaDayOfWeek: Int): Int = ((javaDayOfWeek + 1) % 7) // java: 1=Sunday..7=Saturday → 0=شنبه

    data class JalaliDate(val jy: Int, val jm: Int, val jd: Int)
    data class GregorianDate(val gy: Int, val gm: Int, val gd: Int)

    private data class Breaks(val leap: Boolean, val gy: Int, val cycle: Int)

    /** تقسیم صحیح با truncation — قرینهٔ ~~ در jalaali-js */
    private fun div(a: Int, b: Int): Int = a / b

    private fun mod(a: Int, b: Int): Int = a - div(a, b) * b

    private fun jalCal(jy: Int): Breaks {
        val breaks = intArrayOf(-61, 9, 38, 14, 17, 33, 21, 8, 45, 20, 14, 13, 33, 11, 34, 15, 33, 12, 35, 14, 12, 14, 44)
        var bl = breaks.size
        val gy = jy + 621
        var leapJ = -14
        var jp = breaks[0]
        var jump = 0
        for (i in 1 until bl) {
            val jm = breaks[i]
            jump = jm - jp
            if (jy < jm) break
            leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4)
            jp = jm
        }
        var n = jy - jp
        leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
        if (mod(jump, 33) == 4 && jump - n == 4) leapJ += 1
        val leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
        val march = 20 + leapJ - leapG
        if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33
        var leap = mod(mod(n + 1, 33) - 1, 4)
        if (leap == -1) leap = 4
        return Breaks(leap == 1, gy, march)
    }

    private fun g2d(gy: Int, gm: Int, gd: Int): Int {
        var d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408
        d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
        return d
    }

    private fun j2d(jy: Int, jm: Int, jd: Int): Int {
        val r = jalCal(jy)
        return g2d(r.gy, 3, r.cycle) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
    }

    private fun d2j(jdn: Int): JalaliDate {
        val gy = d2g(jdn).gy
        var jy = gy - 621
        val r = jalCal(jy)
        val jdn1f = g2d(gy, 3, r.cycle)
        var k = jdn - jdn1f
        val jm: Int
        val jd: Int
        if (k >= 0) {
            if (k <= 185) {
                jm = 1 + div(k, 31)
                jd = mod(k, 31) + 1
                return JalaliDate(jy, jm, jd)
            } else {
                k -= 186
            }
        } else {
            jy -= 1
            k += 179
            if (jalCal(jy).leap) k += 1
        }
        jm = 7 + div(k, 30)
        jd = mod(k, 30) + 1
        return JalaliDate(jy, jm, jd)
    }

    private fun d2g(jdn: Int): GregorianDate {
        var j = 4 * jdn + 139361631
        j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
        val i = div(mod(j, 1461), 4) * 5 + 308
        val gd = div(mod(i, 153), 5) + 1
        val gm = mod(div(i, 153), 12) + 1
        val gy = div(j, 1461) - 100100 + div(8 - gm, 6)
        return GregorianDate(gy, gm, gd)
    }
}
