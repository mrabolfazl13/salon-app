package ir.salon.core.common

import org.junit.Assert.assertEquals
import org.junit.Test

class PersianTextTest {

    @Test
    fun `price rial to toman`() {
        assertEquals("۳۱٬۵۰۰ تومان", PersianText.formatPrice(315_000))
        assertEquals("۰ تومان", PersianText.formatPrice(0))
    }

    @Test
    fun `persian digits round trip`() {
        val s = "09123456789"
        assertEquals("۰۹۱۲۳۴۵۶۷۸۹", PersianText.toPersianDigits(s))
        assertEquals(s, PersianText.toLatinDigits(PersianText.toPersianDigits(s)))
    }

    @Test
    fun `normalize arabic yeh kaf`() {
        assertEquals("علی", PersianText.normalize("علي"))
        assertEquals("کافه", PersianText.normalize("كافه"))
    }

    @Test
    fun `thousands separator`() {
        assertEquals("۱٬۲۳۴٬۵۶۷", PersianText.toPersianDigits(PersianText.thousands(1_234_567)))
    }
}
