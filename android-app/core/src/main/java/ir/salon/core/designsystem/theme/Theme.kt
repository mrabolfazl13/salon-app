package ir.salon.core.designsystem.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

/** حالت تم — قرینهٔ themeStore وب */
enum class ThemeMode { SYSTEM, LIGHT, DARK }

private val LightScheme: ColorScheme = lightColorScheme(
    primary = SalonColors.PrimaryBlue,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFDBEAFE),
    onPrimaryContainer = SalonColors.PrimaryBlueDark,
    secondary = SalonColors.AmberDeep,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFFEF3C7),
    onSecondaryContainer = SalonColors.AmberDeep,
    error = SalonColors.Destructive,
    onError = Color.White,
    errorContainer = Color(0xFFFEE2E2),
    onErrorContainer = Color(0xFFB91C1C),
    background = SalonColors.LightBackground,
    onBackground = SalonColors.LightInk,
    surface = SalonColors.LightSurface,
    onSurface = SalonColors.LightInk,
    surfaceVariant = Color(0xFFF1F5F9),
    onSurfaceVariant = SalonColors.LightMuted,
    outline = SalonColors.LightOutline,
    outlineVariant = SalonColors.LightOutline,
)

private val DarkScheme: ColorScheme = darkColorScheme(
    primary = SalonColors.PrimaryBlueLight,
    onPrimary = Color(0xFF0B1220),
    primaryContainer = Color(0xFF1E3A8A),
    onPrimaryContainer = Color(0xFFDBEAFE),
    secondary = SalonColors.AmberSport,
    onSecondary = Color(0xFF0B1220),
    secondaryContainer = Color(0xFF78350F),
    onSecondaryContainer = Color(0xFFFDE68A),
    error = SalonColors.Destructive,
    onError = Color.White,
    errorContainer = Color(0xFF7F1D1D),
    onErrorContainer = Color(0xFFFECACA),
    background = SalonColors.DarkBackground,
    onBackground = SalonColors.DarkInk,
    surface = SalonColors.DarkSurface,
    onSurface = SalonColors.DarkInk,
    surfaceVariant = Color(0xFF1A2438),
    onSurfaceVariant = SalonColors.DarkMuted,
    outline = SalonColors.DarkOutline,
    outlineVariant = SalonColors.DarkOutline,
)

/** تم تزریقی به پایین‌تر از MaterialTheme — برای گرادیان‌های امضا */
data class SalonExtraColors(
    val gradientEnergy: List<Color> = SalonColors.GradientEnergy,
    val gradientTile: List<Color> = SalonColors.GradientTile,
    val gradientDeep: List<Color> = SalonColors.GradientDeep,
    val emerald: Color = SalonColors.Emerald,
    val emeraldChipBg: Color = SalonColors.EmeraldChipBg,
    val emeraldChipInk: Color = SalonColors.EmeraldChipInk,
)

val LocalSalonExtra = staticCompositionLocalOf { SalonExtraColors() }

/**
 * تم اصلی اپ — RTL توسط Activity/Manifest و directionality کنترل می‌شود.
 * Dynamic Color اندروید ۱۲+ به‌صورت گزینه، پیش‌فرض خاموش تا هویت برند حفظ شود.
 */
@Composable
fun SalonTheme(
    mode: ThemeMode = ThemeMode.SYSTEM,
    fontFamily: androidx.compose.ui.text.font.FontFamily = androidx.compose.ui.text.font.FontFamily.Default,
    content: @Composable () -> Unit,
) {
    val dark = when (mode) {
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
    }
    val scheme = if (dark) DarkScheme else LightScheme
    androidx.compose.runtime.CompositionLocalProvider(LocalSalonExtra provides SalonExtraColors()) {
        MaterialTheme(
            colorScheme = scheme,
            typography = salonTypography(fontFamily),
            shapes = SalonShapes,
            content = content,
        )
    }
}
