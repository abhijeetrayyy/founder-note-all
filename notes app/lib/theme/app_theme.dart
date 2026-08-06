import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AppTheme {
  // ── Brand (from web tailwind.config.ts) ────────────────────────────
  static const primary = Color(0xFF7C3AED);
  static const primaryGlow = Color(0xFF8B5CF6);
  static const primaryDeep = Color(0xFF6B21A8);

  // ── Light (from web base colors) ───────────────────────────────────
  static const lightBg = Color(0xFFFAFAFC);
  static const lightSurface = Color(0xFFFFFFFF);
  static const lightSurfaceAlt = Color(0xFFF4F4F8);
  static const lightText = Color(0xFF1A1A2E);
  static const lightTextMuted = Color(0x801A1A2E);    // 50% opacity
  static const lightTextSubtle = Color(0x4D1A1A2E);   // 30% opacity
  static const lightBorder = Color(0x0F000000);        // rgba(0,0,0,0.06)
  static const lightSidebar = Color(0xFFFFFFFF);

  // ── Dark (from web dark mode) ──────────────────────────────────────
  static const darkBg = Color(0xFF0A0A0F);
  static const darkSurface = Color(0xFF1A1A24);
  static const darkSurfaceAlt = Color(0xFF24243A);
  static const darkText = Color(0xFFF5F5FA);
  static const darkTextMuted = Color(0xFF9595A8);
  static const darkBorder = Color(0xFF2A2A3A);
  static const darkSidebar = Color(0xFF0F0F18);

  // ── Energy palette (matching web ENERGY_CONFIG) ────────────────────
  static const energyAdmin = Color(0xFF10B981);  // teal
  static const energyMedium = Color(0xFF3B82F6);  // blue
  static const energyDeep = Color(0xFF8B5CF6);    // deep purple

  // ── State colors (from web) ────────────────────────────────────────
  static const success = Color(0xFF10B981);
  static const warning = Color(0xFFF59E0B);
  static const danger = Color(0xFFEF4444);
  static const successSurface = Color(0x1410B981);
  static const attentionSurface = Color(0x14F59E0B);
  static const dangerSurface = Color(0x14EF4444);

  // ── Shape tokens (from web) ────────────────────────────────────────
  static const cardRadius = 24.0;
  static const pillRadius = 9999.0;
  static const sheetRadius = 32.0;

  // ── Spacing scale ──────────────────────────────────────────────────
  static const s1 = 4.0;
  static const s2 = 8.0;
  static const s3 = 12.0;
  static const s4 = 16.0;
  static const s5 = 20.0;
  static const s6 = 24.0;
  static const s7 = 32.0;
  static const s8 = 40.0;

  static SystemUiOverlayStyle overlay(Brightness b) => b == Brightness.dark
      ? SystemUiOverlayStyle.light.copyWith(
          statusBarColor: Colors.transparent,
          systemNavigationBarColor: darkBg,
          systemNavigationBarIconBrightness: Brightness.light,
        )
      : SystemUiOverlayStyle.dark.copyWith(
          statusBarColor: Colors.transparent,
          systemNavigationBarColor: lightBg,
          systemNavigationBarIconBrightness: Brightness.dark,
        );

  static ThemeData get light => _build(Brightness.light);
  static ThemeData get dark => _build(Brightness.dark);

  static ThemeData _build(Brightness b) {
    final isDark = b == Brightness.dark;
    final bg = isDark ? darkBg : lightBg;
    final surface = isDark ? darkSurface : lightSurface;
    final surfaceAlt = isDark ? darkSurfaceAlt : lightSurfaceAlt;
    final text = isDark ? darkText : lightText;
    final muted = isDark ? darkTextMuted : lightTextMuted;
    final border = isDark ? darkBorder : lightBorder;

    final cs = ColorScheme.fromSeed(
      seedColor: primary,
      brightness: b,
      primary: primary,
      surface: surface,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: b,
      colorScheme: cs,
      scaffoldBackgroundColor: bg,
      canvasColor: bg,
      dividerColor: border,
      splashColor: primary.withValues(alpha: 0.08),
      highlightColor: primary.withValues(alpha: 0.05),
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: bg,
        surfaceTintColor: Colors.transparent,
        foregroundColor: text,
        iconTheme: IconThemeData(color: text, size: 22),
        titleTextStyle: TextStyle(color: text, fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.5),
        systemOverlayStyle: overlay(b),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(cardRadius)),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        modalBackgroundColor: surface,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(sheetRadius))),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceAlt,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: primary, width: 1.5)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: TextStyle(color: muted, fontSize: 15),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: primary,
        foregroundColor: Colors.white,
        elevation: 4,
        focusElevation: 6,
        hoverElevation: 6,
        highlightElevation: 8,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        extendedTextStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, letterSpacing: 0.2),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: surface,
        selectedItemColor: primary,
        unselectedItemColor: muted,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
        unselectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        indicatorColor: primary.withValues(alpha: 0.15),
        height: 68,
        labelTextStyle: WidgetStatePropertyAll(
          TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: text),
        ),
        iconTheme: WidgetStateProperty.resolveWith((s) => IconThemeData(
              color: s.contains(WidgetState.selected) ? primary : muted,
              size: 24,
            )),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: surfaceAlt,
        selectedColor: primary.withValues(alpha: 0.15),
        labelStyle: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: text),
        side: BorderSide.none,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(pillRadius)),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: text,
          side: BorderSide(color: border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: primary, textStyle: const TextStyle(fontWeight: FontWeight.w600)),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: isDark ? darkSurfaceAlt : lightText,
        contentTextStyle: TextStyle(color: isDark ? darkText : Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
        actionTextColor: isDark ? primary : const Color(0xFF9F8CFF),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      textTheme: TextTheme(
        displayLarge: TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: text, letterSpacing: -1.0, height: 1.1),
        displayMedium: TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: text, letterSpacing: -0.8, height: 1.15),
        displaySmall: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: text, letterSpacing: -0.6, height: 1.2),
        headlineLarge: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: text, letterSpacing: -0.5),
        headlineMedium: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: text, letterSpacing: -0.3),
        headlineSmall: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: text),
        titleLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: text),
        titleMedium: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: text),
        titleSmall: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: text),
        bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400, color: text, height: 1.5),
        bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: text, height: 1.5),
        bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: muted, height: 1.4),
        labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: text),
        labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: muted, letterSpacing: 0.3),
        labelSmall: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: muted, letterSpacing: 0.8),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: muted,
        textColor: text,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: primary,
        linearTrackColor: border,
        circularTrackColor: border,
      ),
      sliderTheme: SliderThemeData(activeTrackColor: primary, inactiveTrackColor: border, thumbColor: primary),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? primary : Colors.grey.shade400),
        trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? primary.withValues(alpha: 0.4) : border),
      ),
    );
  }
}
