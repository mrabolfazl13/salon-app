package ir.salon.app.ui.theme

import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.font.Font
import ir.salon.app.R

/**
 * Vazirmatn باندل‌شده — فایل‌ها در مرحلهٔ CI به `res/font/` دانلود می‌شوند
 * (workflow kotlin-android.yml)؛ همین امر بیلد را بدون وابستگی شبکهٔ اجرا قطعی می‌کند.
 */
val VazirmatnFamily: FontFamily = FontFamily(
    Font(R.font.vazirmatn_regular, FontWeight.Normal),
    Font(R.font.vazirmatn_medium, FontWeight.Medium),
    Font(R.font.vazirmatn_semibold, FontWeight.SemiBold),
    Font(R.font.vazirmatn_bold, FontWeight.Bold),
    Font(R.font.vazirmatn_extrabold, FontWeight.ExtraBold),
)
