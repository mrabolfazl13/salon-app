package ir.salon.core.common

/**
 * متن فارسی: ارقام فارسی، نرمال‌سازی ی/ک عربی، قیمت (ریال→تومان).
 * قرینهٔ `frontend/src/utils/l10n.ts` و `formatPrice`.
 */
object PersianText {

    private val faDigits = charArrayOf('۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹')

    fun toPersianDigits(input: String): String = buildString(input.length) {
        for (c in input) append(if (c in '0'..'9') faDigits[c - '0'] else c)
    }

    fun toLatinDigits(input: String): String = buildString(input.length) {
        for (c in input) append(if (c in '۰'..'۹') ('0' + (c - '۰')) else c)
    }

    /** ی/ک عربی → فارسی (مطابق normalizePersianText فرانت) */
    fun normalize(input: String): String = input
        .replace('ي', 'ی')
        .replace('ك', 'ک')
        .replace('\u200c', '\u200c') // ZWNJ حفظ می‌شود

    /** جداکنندهٔ هزارگان با «٬» */
    fun thousands(n: Long): String {
        val s = n.toString()
        val sb = StringBuilder()
        for ((i, c) in s.withIndex()) {
            if (i > 0 && (s.length - i) % 3 == 0) sb.append('٬')
            sb.append(c)
        }
        return sb.toString()
    }

    /** ریال → تومان (÷10) + ارقام فارسی + «تومان» — قرینهٔ formatPrice */
    fun formatPrice(rial: Long): String = toPersianDigits(thousands(rial / 10)) + " تومان"
}
