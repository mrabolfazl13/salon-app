package ir.salon.core.designsystem.theme

import androidx.compose.ui.graphics.Color

/**
 * توکن رنگ از design system وب (`frontend/tailwind.config.js` + `globals.css`)
 * — همان هویت بصری، ترجمه‌شده به Material 3.
 */
object SalonColors {
    // برند: آبی اصلی + کهربایی ورزشی
    val PrimaryBlue = Color(0xFF2563EB)      // primary.600
    val PrimaryBlueDark = Color(0xFF1D4ED8)  // primary.700
    val PrimaryBlueLight = Color(0xFF60A5FA) // primary.400 — متن روی دارک (6.8:1)
    val AmberSport = Color(0xFFF59E0B)       // secondary
    val AmberDeep = Color(0xFFB45309)        // متن کهربایی با کنتراست کافی
    val Destructive = Color(0xFFEF4444)
    val Emerald = Color(0xFF059669)
    val EmeraldChipBg = Color(0x2610B981)    // emerald-500/15
    val EmeraldChipInk = Color(0xFF047857)

    // سطوح — روشن
    val LightBackground = Color(0xFFF6F7F9)
    val LightSurface = Color(0xFFFFFFFF)
    val LightOutline = Color(0xFFE2E8F0)
    val LightInk = Color(0xFF0F172A)         // slate-900
    val LightMuted = Color(0xFF475569)       // slate-600

    // سطوح — تیره (globals.css: #0b1220 / #121a2b)
    val DarkBackground = Color(0xFF0B1220)
    val DarkSurface = Color(0xFF121A2B)
    val DarkOutline = Color(0x14FFFFFF)      // white 8%
    val DarkInk = Color(0xFFE8EDF5)
    val DarkMuted = Color(0xFF94A3B8)        // slate-400

    // گرادیان‌های امضای وب
    val GradientEnergy = listOf(Color(0xFFF59E0B), Color(0xFFF97316))
    val GradientTile = listOf(Color(0x26F59E0B), Color(0x262563EB))
    val GradientDeep = listOf(Color(0xFF0F172A), Color(0xFF2563EB))
}
