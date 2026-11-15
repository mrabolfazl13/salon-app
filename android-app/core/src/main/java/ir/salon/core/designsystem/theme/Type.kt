package ir.salon.core.designsystem.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

/**
 * تایپوگرافی — قرینهٔ وب: وزن سربرگ 700، line-height 1.7 برای فارسی.
 * فونت‌فمیلی در app تزریق می‌شود (Vazirmatn)؛ پیش‌فرض سیستمی برای تست.
 */
fun salonTypography(fontFamily: FontFamily = FontFamily.Default): Typography = Typography(
    headlineLarge = TextStyle(fontFamily = fontFamily, fontWeight = FontWeight.Bold, fontSize = 30.sp, lineHeight = 44.sp),
    headlineMedium = TextStyle(fontFamily = fontFamily, fontWeight = FontWeight.Bold, fontSize = 24.sp, lineHeight = 36.sp),
    headlineSmall = TextStyle(fontFamily = fontFamily, fontWeight = FontWeight.Bold, fontSize = 20.sp, lineHeight = 32.sp),
    titleLarge = TextStyle(fontFamily = fontFamily, fontWeight = FontWeight.Bold, fontSize = 18.sp, lineHeight = 30.sp),
    titleMedium = TextStyle(fontFamily = fontFamily, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, lineHeight = 26.sp),
    titleSmall = TextStyle(fontFamily = fontFamily, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, lineHeight = 22.sp),
    bodyLarge = TextStyle(fontFamily = fontFamily, fontWeight = FontWeight.Normal, fontSize = 16.sp, lineHeight = 27.sp),
    bodyMedium = TextStyle(fontFamily = fontFamily, fontWeight = FontWeight.Normal, fontSize = 14.sp, lineHeight = 24.sp),
    bodySmall = TextStyle(fontFamily = fontFamily, fontWeight = FontWeight.Normal, fontSize = 12.sp, lineHeight = 20.sp),
    labelLarge = TextStyle(fontFamily = fontFamily, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, lineHeight = 20.sp),
    labelMedium = TextStyle(fontFamily = fontFamily, fontWeight = FontWeight.SemiBold, fontSize = 12.sp, lineHeight = 16.sp),
    labelSmall = TextStyle(fontFamily = fontFamily, fontWeight = FontWeight.SemiBold, fontSize = 11.sp, lineHeight = 15.sp),
)

/** پیش‌فرض قدیمی برای سازگاری */
val SalonTypography = salonTypography()
