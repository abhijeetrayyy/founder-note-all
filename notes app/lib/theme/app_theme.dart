import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// FounderOS — instrument, not document.
///
/// This replaces a purple-brand, light-first consumer theme: 24px radii, pill
/// chips, saturated energy colours, a violet accent on every primary action.
/// It was a port of the web app's *previous* design system, which has since
/// been thrown out, so the two products had stopped looking like the same
/// thing.
///
/// The rule that holds this together, carried over from the web tokens:
/// COLOUR ONLY MEANS SIGNAL. Nothing in the chrome is tinted. Primary actions
/// are ink inverted on the ground, the active nav item is a raised surface,
/// links are ink. Amber and orange appear only where something needs the
/// founder; mint only where something resolved. A screen with no colour on it
/// means nothing is wrong — and that is information.
///
/// There is one ground. The old light/dark pair meant maintaining two of
/// everything and getting one of them wrong; the web app commits to graphite
/// and so does this.
class AppTheme {
  // ── Ground ──
  // Graphite, not navy and not pure black — black is a void, graphite is a
  // machined surface.
  static const void_ = Color(0xFF0B0B0D);
  static const surface = Color(0xFF141417);       // cards
  static const raised = Color(0xFF101013);        // rails, recedes behind content
  static const overlay = Color(0xFF1B1B1F);       // inputs, wells, nested panels
  static const border = Color(0xFF26262B);        // hairlines
  static const borderStrong = Color(0xFF35353C);

  // ── Ink ──
  static const ink = Color(0xFFF0F0EE);           // warm off-white; #FFF is clinical
  static const inkBright = Color(0xFFFFFFFF);
  static const muted = Color(0xFF9C9CA4);
  static const subtle = Color(0xFF8A8A93);
  static const faint = Color(0xFF3A3A41);
  static const onInk = Color(0xFF0B0B0D);         // text on an inverted surface

  // ── The only two colours in the product ──
  static const signal = Color(0xFFFF8A4C);        // needs you
  static const signalDim = Color(0xFFE0A33E);     // needs you eventually
  static const done = Color(0xFF5EE0B0);          // resolved

  /// Energy lanes read as instrument channels, not brand colours.
  static const energyAdmin = Color(0xFF5EE0B0);
  static const energyMedium = Color(0xFF7FA6D9);
  static const energyDeep = Color(0xFFF0F0EE);

  // ── Names the old theme exported, kept so nothing breaks mid-port ──
  // These resolve to the instrument palette rather than to a brand colour,
  // which is the point: `AppTheme.primary` is now ink.
  static const primary = ink;
  static const primaryGlow = inkBright;
  static const primaryDeep = ink;
  static const darkBg = void_;
  static const lightBg = void_;
  static const darkSurface = surface;
  static const lightSurface = surface;
  static const darkSurfaceAlt = overlay;
  static const lightSurfaceAlt = overlay;
  static const darkText = ink;
  static const lightText = ink;
  static const darkTextMuted = muted;
  static const lightTextMuted = muted;
  static const lightTextSubtle = subtle;
  static const darkBorder = border;
  static const lightBorder = border;
  static const darkSidebar = raised;
  static const lightSidebar = raised;
  static const success = done;
  static const warning = signalDim;
  static const danger = signal;
  static const successSurface = Color(0x1A5EE0B0);
  static const attentionSurface = Color(0x1AE0A33E);
  static const dangerSurface = Color(0x1AFF8A4C);

  // ── Type ──
  static const sans = 'IBMPlexSans';
  static const mono = 'IBMPlexMono';

  /// Every label and every number is mono. In an instrument, data and its
  /// labels share a voice — that is what makes a readout read as a readout.
  static const TextStyle microLabel = TextStyle(
    fontFamily: mono, fontSize: 10, fontWeight: FontWeight.w500,
    letterSpacing: 1.3, color: muted,
  );

  /// Tabular figures, so a changing number does not jitter its neighbours.
  static TextStyle metric({double size = 28, Color color = ink}) => TextStyle(
        fontFamily: mono, fontSize: size, fontWeight: FontWeight.w400,
        color: color, height: 1.0, letterSpacing: -0.5,
        fontFeatures: const [FontFeature.tabularFigures()],
      );

  // ── Shape. Instruments do not have pill corners. ──
  static const cardRadius = 8.0;
  static const controlRadius = 6.0;
  static const pillRadius = 9999.0;
  static const sheetRadius = 10.0;

  // ── Spacing ──
  static const s1 = 4.0;
  static const s2 = 8.0;
  static const s3 = 12.0;
  static const s4 = 16.0;
  static const s5 = 20.0;
  static const s6 = 24.0;
  static const s7 = 32.0;
  static const s8 = 40.0;

  static SystemUiOverlayStyle overlayStyle([Brightness? _]) =>
      SystemUiOverlayStyle.light.copyWith(
        statusBarColor: Colors.transparent,
        systemNavigationBarColor: void_,
        systemNavigationBarIconBrightness: Brightness.light,
      );

  /// Kept for call sites that still pass a brightness.
  static SystemUiOverlayStyle systemOverlay(Brightness b) => overlayStyle(b);

  // One ground. Both getters return it so a stale `AppTheme.light` reference
  // cannot resurrect the old palette on one screen.
  static ThemeData get dark => _build();
  static ThemeData get light => _build();

  static ThemeData _build() {
    final cs = ColorScheme.fromSeed(
      seedColor: ink,
      brightness: Brightness.dark,
      primary: ink,
      onPrimary: onInk,
      surface: surface,
      onSurface: ink,
      error: signal,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: cs,
      scaffoldBackgroundColor: void_,
      canvasColor: void_,
      dividerColor: border,
      fontFamily: sans,
      // Depth comes from the border, never from a shadow.
      splashColor: ink.withValues(alpha: 0.05),
      highlightColor: ink.withValues(alpha: 0.03),
      shadowColor: Colors.transparent,

      appBarTheme: const AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: void_,
        surfaceTintColor: Colors.transparent,
        foregroundColor: ink,
        iconTheme: IconThemeData(color: muted, size: 20),
        titleTextStyle: TextStyle(
          fontFamily: sans, color: ink, fontSize: 20,
          fontWeight: FontWeight.w500, letterSpacing: -0.4,
        ),
      ),

      cardTheme: CardThemeData(
        elevation: 0,
        color: surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(cardRadius),
          side: const BorderSide(color: border),
        ),
      ),

      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        modalBackgroundColor: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(sheetRadius)),
        ),
      ),

      dialogTheme: DialogThemeData(
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(cardRadius),
          side: const BorderSide(color: borderStrong),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: overlay,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(controlRadius),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(controlRadius),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(controlRadius),
          borderSide: const BorderSide(color: borderStrong),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        hintStyle: const TextStyle(fontFamily: sans, color: subtle, fontSize: 15),
      ),

      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: ink,
        foregroundColor: onInk,
        elevation: 0, focusElevation: 0, hoverElevation: 0, highlightElevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(controlRadius)),
        extendedTextStyle: const TextStyle(
          fontFamily: sans, fontWeight: FontWeight.w500, fontSize: 14,
        ),
      ),

      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: raised,
        selectedItemColor: ink,
        unselectedItemColor: muted,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: TextStyle(fontFamily: sans, fontSize: 10, fontWeight: FontWeight.w500),
        unselectedLabelStyle: TextStyle(fontFamily: sans, fontSize: 10, fontWeight: FontWeight.w400),
      ),

      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: raised,
        surfaceTintColor: Colors.transparent,
        indicatorColor: overlay,
        elevation: 0,
        height: 62,
        labelTextStyle: const WidgetStatePropertyAll(
          TextStyle(fontFamily: sans, fontSize: 10, fontWeight: FontWeight.w500, color: muted),
        ),
        iconTheme: WidgetStateProperty.resolveWith((s) => IconThemeData(
              color: s.contains(WidgetState.selected) ? ink : muted, size: 20,
            )),
      ),

      chipTheme: ChipThemeData(
        backgroundColor: overlay,
        selectedColor: ink,
        labelStyle: const TextStyle(fontFamily: sans, fontSize: 12, fontWeight: FontWeight.w500, color: ink),
        side: const BorderSide(color: border),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(controlRadius)),
      ),

      // Primary is ink inverted on the ground — no brand fill anywhere.
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: ink,
          foregroundColor: onInk,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(controlRadius)),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          textStyle: const TextStyle(fontFamily: sans, fontWeight: FontWeight.w500, fontSize: 15),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ink,
          foregroundColor: onInk,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(controlRadius)),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          textStyle: const TextStyle(fontFamily: sans, fontWeight: FontWeight.w500, fontSize: 15),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: ink,
          side: const BorderSide(color: borderStrong),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(controlRadius)),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          textStyle: const TextStyle(fontFamily: sans, fontWeight: FontWeight.w400, fontSize: 15),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: ink,
          textStyle: const TextStyle(fontFamily: sans, fontWeight: FontWeight.w500),
        ),
      ),

      snackBarTheme: SnackBarThemeData(
        backgroundColor: overlay,
        contentTextStyle: const TextStyle(fontFamily: sans, color: ink, fontSize: 14),
        actionTextColor: ink,
        behavior: SnackBarBehavior.floating,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(controlRadius),
          side: const BorderSide(color: borderStrong),
        ),
      ),

      // Denser than before. This is scanned, not read.
      textTheme: const TextTheme(
        displayLarge: TextStyle(fontFamily: sans, fontSize: 34, fontWeight: FontWeight.w500, color: ink, letterSpacing: -1.0, height: 1.1),
        displayMedium: TextStyle(fontFamily: sans, fontSize: 28, fontWeight: FontWeight.w500, color: ink, letterSpacing: -0.8, height: 1.15),
        displaySmall: TextStyle(fontFamily: sans, fontSize: 24, fontWeight: FontWeight.w500, color: ink, letterSpacing: -0.6, height: 1.2),
        headlineLarge: TextStyle(fontFamily: sans, fontSize: 22, fontWeight: FontWeight.w500, color: ink, letterSpacing: -0.5),
        headlineMedium: TextStyle(fontFamily: sans, fontSize: 19, fontWeight: FontWeight.w500, color: ink, letterSpacing: -0.3),
        headlineSmall: TextStyle(fontFamily: sans, fontSize: 17, fontWeight: FontWeight.w500, color: ink),
        titleLarge: TextStyle(fontFamily: sans, fontSize: 15, fontWeight: FontWeight.w600, color: ink),
        titleMedium: TextStyle(fontFamily: sans, fontSize: 14, fontWeight: FontWeight.w500, color: ink),
        titleSmall: TextStyle(fontFamily: sans, fontSize: 13, fontWeight: FontWeight.w500, color: ink),
        bodyLarge: TextStyle(fontFamily: sans, fontSize: 15, fontWeight: FontWeight.w400, color: ink, height: 1.45),
        bodyMedium: TextStyle(fontFamily: sans, fontSize: 14, fontWeight: FontWeight.w400, color: ink, height: 1.45),
        bodySmall: TextStyle(fontFamily: sans, fontSize: 12, fontWeight: FontWeight.w400, color: muted, height: 1.4),
        labelLarge: TextStyle(fontFamily: sans, fontSize: 14, fontWeight: FontWeight.w500, color: ink),
        labelMedium: TextStyle(fontFamily: mono, fontSize: 11, fontWeight: FontWeight.w500, color: muted, letterSpacing: 0.6),
        labelSmall: TextStyle(fontFamily: mono, fontSize: 10, fontWeight: FontWeight.w500, color: muted, letterSpacing: 1.3),
      ),

      listTileTheme: ListTileThemeData(
        iconColor: muted,
        textColor: ink,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(controlRadius)),
      ),

      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: ink, linearTrackColor: border, circularTrackColor: border,
      ),
      sliderTheme: const SliderThemeData(
        activeTrackColor: ink, inactiveTrackColor: border, thumbColor: ink,
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
            (s) => s.contains(WidgetState.selected) ? onInk : muted),
        trackColor: WidgetStateProperty.resolveWith(
            (s) => s.contains(WidgetState.selected) ? ink : overlay),
        trackOutlineColor: const WidgetStatePropertyAll(border),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith(
            (s) => s.contains(WidgetState.selected) ? ink : Colors.transparent),
        checkColor: const WidgetStatePropertyAll(onInk),
        side: const BorderSide(color: faint, width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
      ),
      dividerTheme: const DividerThemeData(color: border, thickness: 1, space: 1),
    );
  }
}
