import 'package:flutter/material.dart';

/// Centralized design tokens.
///
/// Palette 2026 — "Emerald Court": a deep emerald/teal brand (fresh, sporty,
/// trustworthy — like Monzo/Revolut-grade product colors) paired with warm
/// amber accents and carefully tuned neutral scales. Dark mode is a true
/// "pitch at night" surface stack, not an inversion.
class AppColors {
  AppColors._();

  // Brand — blue → violet (identical to the Tauri/React original)
  static const primary = Color(0xFF2563EB);
  static const primaryLight = Color(0xFF60A5FA);
  static const primaryDark = Color(0xFF1D4ED8);
  static const primaryDeep = Color(0xFF1E3A8A);
  static const secondary = Color(0xFF7C3AED);
  static const secondaryLight = Color(0xFFA78BFA);
  static const secondaryDark = Color(0xFF5B21B6);

  // Accents
  static const success = Color(0xFF10B981);
  static const successDark = Color(0xFF059669);
  static const warning = Color(0xFFF59E0B);
  static const warningDeep = Color(0xFFD97706);
  static const error = Color(0xFFEF4444);
  static const errorDeep = Color(0xFFDC2626);
  static const info = Color(0xFF3B82F6);

  static const gradientPrimary = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [Color(0xFF2563EB), Color(0xFF7C3AED)],
  );

  /// Hero gradient for auth/CTA surfaces (original blue→violet identity).
  static const gradientHero = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [Color(0xFF1E3A8A), Color(0xFF2563EB), Color(0xFF7C3AED)],
  );

  static const gradientSuccess = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [Color(0xFF16A34A), Color(0xFF15803D)],
  );

  static const gradientBank = LinearGradient(
    begin: Alignment.centerRight,
    end: Alignment.centerLeft,
    colors: [Color(0xFF1E3A8A), Color(0xFF2563EB), Color(0xFF7C3AED)],
  );

  static const gradientPrimarySoftTop = Color(0x142563EB);
  static const gradientPrimarySoftBottom = Color(0x147C3AED);

  /// Bright tint of the brand for chips/badges on light surfaces.
  static const primaryTint = Color(0x1A2563EB);

  // Light scheme — slate neutrals (original background #F8FAFC)
  static const lightBackground = Color(0xFFF8FAFC);
  static const lightSurface = Color(0xFFFFFFFF);
  static const lightSurfaceAlt = Color(0xFFF1F5F9);
  static const lightTextPrimary = Color(0xFF0F172A);
  static const lightTextSecondary = Color(0xFF64748B);
  static const lightTextMuted = Color(0xFF94A3B8);
  static const lightDivider = Color(0x140F172A);

  // Dark scheme — navy-tinted (mirrors the original dark slate)
  static const darkBackground = Color(0xFF0B1220);
  static const darkSurface = Color(0xFF111A2E);
  static const darkSurfaceAlt = Color(0xFF18233B);
  static const darkTextPrimary = Color(0xFFF1F5F9);
  static const darkTextSecondary = Color(0xFF94A3B8);
  static const darkTextMuted = Color(0xFF64748B);
  static const darkDivider = Color(0x1FF1F5F9);

  /// Soft brand glow used behind hero elements.
  static Color glow(BuildContext? _) => primary.withValues(alpha: 0.30);
}

class AppRadius {
  AppRadius._();

  static const card = 20.0;
  static const sheet = 24.0;
  static const button = 14.0;
  static const chip = 10.0;
  static const image = 16.0;
  static const tile = 12.0;
}

class AppSpacing {
  AppSpacing._();

  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 20.0;
  static const xxl = 24.0;
  static const xxxl = 32.0;
}

class AppElevation {
  AppElevation._();

  static const card = 1.5;
  static const cta = 4.0;
}

class AppDurations {
  AppDurations._();

  static const fast = Duration(milliseconds: 180);
  static const normal = Duration(milliseconds: 280);
  static const slow = Duration(milliseconds: 420);
  static const shimmer = Duration(milliseconds: 1400);
}

class AppTheme {
  AppTheme._();

  static const fontFamily = 'Vazirmatn';

  static ThemeData light() => _build(Brightness.light);
  static ThemeData dark() => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: brightness,
      primary: AppColors.primary,
      secondary: AppColors.secondary,
      error: AppColors.error,
      surface: isDark ? AppColors.darkSurface : AppColors.lightSurface,
    );

    final textTheme = _textTheme(brightness);

    return ThemeData(
      useMaterial3: true,
      fontFamily: fontFamily,
      colorScheme: colorScheme,
      scaffoldBackgroundColor:
          isDark ? AppColors.darkBackground : AppColors.lightBackground,
      textTheme: textTheme,
      splashFactory: InkSparkle.splashFactory,
      visualDensity: VisualDensity.adaptivePlatformDensity,
      appBarTheme: AppBarTheme(
        backgroundColor:
            (isDark ? AppColors.darkBackground : AppColors.lightBackground)
                .withValues(alpha: 0.92),
        foregroundColor: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.card),
          side: BorderSide(color: isDark ? AppColors.darkDivider : AppColors.lightDivider),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: isDark ? AppColors.darkDivider : AppColors.lightDivider,
        thickness: 1,
        space: 1,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? AppColors.darkSurfaceAlt : AppColors.lightSurfaceAlt,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: 14,
        ),
        border: _inputBorder(isDark, false),
        enabledBorder: _inputBorder(isDark, false),
        focusedBorder: _inputBorder(isDark, true),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.button),
          borderSide: const BorderSide(color: AppColors.error, width: 1.4),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.button),
          borderSide: const BorderSide(color: AppColors.error, width: 1.8),
        ),
        hintStyle: TextStyle(
          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextMuted,
          fontSize: 14,
        ),
        labelStyle: TextStyle(
          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
          fontSize: 14,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size(64, 50),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.button),
          ),
          textStyle: const TextStyle(
            fontFamily: fontFamily,
            fontWeight: FontWeight.w700,
            fontSize: 15,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          minimumSize: const Size(64, 48),
          side: BorderSide(color: AppColors.primary.withValues(alpha: 0.45), width: 1.4),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.button),
          ),
          textStyle: const TextStyle(
            fontFamily: fontFamily,
            fontWeight: FontWeight.w700,
            fontSize: 14,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          textStyle: const TextStyle(
            fontFamily: fontFamily,
            fontWeight: FontWeight.w700,
            fontSize: 13.5,
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: isDark ? AppColors.darkSurfaceAlt : AppColors.primaryTint,
        selectedColor: AppColors.primaryTint,
        labelStyle: TextStyle(
          fontFamily: fontFamily,
          fontSize: 12.5,
          fontWeight: FontWeight.w600,
          color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
        ),
        side: BorderSide(color: isDark ? AppColors.darkDivider : AppColors.lightDivider),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.chip),
        ),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 6),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 68,
        backgroundColor:
            (isDark ? AppColors.darkSurface : AppColors.lightSurface).withValues(alpha: 0.96),
        surfaceTintColor: Colors.transparent,
        indicatorColor: Colors.transparent,
        elevation: 0,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        modalBackgroundColor: Colors.transparent,
        shape: RoundedRectangleBorder(),
        showDragHandle: false,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.sheet),
        ),
        titleTextStyle: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        contentTextStyle: textTheme.bodyMedium,
        barrierColor: Colors.black45,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: isDark ? AppColors.darkSurfaceAlt : AppColors.lightTextPrimary,
        contentTextStyle: TextStyle(
          fontFamily: fontFamily,
          color: isDark ? AppColors.darkTextPrimary : Colors.white,
          fontWeight: FontWeight.w600,
          fontSize: 13.5,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.tile),
        ),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.primary,
        linearTrackColor: AppColors.primaryTint,
      ),
      tabBarTheme: TabBarThemeData(
        labelColor: Colors.white,
        unselectedLabelColor:
            isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
        labelStyle: const TextStyle(fontFamily: fontFamily, fontWeight: FontWeight.w700),
        unselectedLabelStyle:
            const TextStyle(fontFamily: fontFamily, fontWeight: FontWeight.w600),
        dividerColor: Colors.transparent,
        indicatorSize: TabBarIndicatorSize.tab,
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected)
              ? Colors.white
              : (isDark ? AppColors.darkTextSecondary : Colors.white),
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected)
              ? AppColors.primary
              : (isDark ? AppColors.darkSurfaceAlt : AppColors.lightSurfaceAlt),
        ),
      ),
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.all(AppColors.primary),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected)
              ? AppColors.primary
              : Colors.transparent,
        ),
        side: BorderSide(color: AppColors.primary.withValues(alpha: 0.5), width: 1.6),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      ),
      sliderTheme: const SliderThemeData(
        activeTrackColor: AppColors.primary,
        inactiveTrackColor: AppColors.primaryTint,
        thumbColor: AppColors.primary,
        overlayColor: AppColors.primaryTint,
        valueIndicatorColor: AppColors.primary,
        valueIndicatorShape: PaddleSliderValueIndicatorShape(),
      ),
      dropdownMenuTheme: DropdownMenuThemeData(
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: isDark ? AppColors.darkSurfaceAlt : AppColors.lightSurfaceAlt,
          border: _inputBorder(isDark, false),
          enabledBorder: _inputBorder(isDark, false),
          focusedBorder: _inputBorder(isDark, true),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 14),
        ),
      ),
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        iconColor: AppColors.primary,
        titleTextStyle: textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
        subtitleTextStyle: textTheme.bodySmall,
      ),
      badgeTheme: const BadgeThemeData(
        backgroundColor: AppColors.error,
        textStyle: TextStyle(
          fontFamily: fontFamily,
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: Colors.white,
        ),
      ),
    );
  }

  static OutlineInputBorder _inputBorder(bool isDark, bool focused) {
    final color = focused
        ? AppColors.primary
        : (isDark ? AppColors.darkDivider : AppColors.lightDivider);
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppRadius.button),
      borderSide: BorderSide(color: color, width: focused ? 1.6 : 1),
    );
  }

  static TextTheme _textTheme(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final color = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final secondaryColor =
        isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    final base = TextTheme(
      displaySmall: TextStyle(fontSize: 34, fontWeight: FontWeight.w800, color: color),
      headlineMedium: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: color),
      headlineSmall: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color),
      titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color),
      titleMedium: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700, color: color),
      titleSmall: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: color),
      bodyLarge: TextStyle(fontSize: 15, fontWeight: FontWeight.w400, color: color),
      bodyMedium: TextStyle(fontSize: 13.8, fontWeight: FontWeight.w400, color: color),
      bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: secondaryColor),
      labelLarge: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: color),
      labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: secondaryColor),
      labelSmall: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: secondaryColor),
    );
    return base.apply(fontFamily: fontFamily);
  }
}
