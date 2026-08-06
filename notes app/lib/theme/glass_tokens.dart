import 'dart:ui';
import 'package:flutter/material.dart';
import 'app_theme.dart';

class GlassTokens {
  GlassTokens._();

  // ── Opacity levels ──────────────────────────────────────────────────
  static const double ambientOpacity = 0.55;
  static const double activeOpacity = 0.72;
  static const double focusedOpacity = 0.88;
  static const double surfaceOpacity = 0.64;

  // ── Light-mode glass colors ─────────────────────────────────────────
  static Color glassAmbientLight = Color.lerp(AppTheme.lightSurface, AppTheme.lightBg, 1 - ambientOpacity)!.withValues(alpha: ambientOpacity);
  static Color glassActiveLight = Color.lerp(AppTheme.lightSurface, AppTheme.lightBg, 1 - activeOpacity)!.withValues(alpha: activeOpacity);
  static Color glassFocusedLight = Color.lerp(AppTheme.lightSurface, AppTheme.lightBg, 1 - focusedOpacity)!.withValues(alpha: focusedOpacity);
  static Color glassSurfaceLight = Color.lerp(AppTheme.lightSurface, AppTheme.lightBg, 1 - surfaceOpacity)!.withValues(alpha: surfaceOpacity);

  // ── Dark-mode glass colors ──────────────────────────────────────────
  static Color glassAmbientDark = Color.lerp(AppTheme.darkSurface, AppTheme.darkBg, 1 - ambientOpacity)!.withValues(alpha: ambientOpacity);
  static Color glassActiveDark = Color.lerp(AppTheme.darkSurface, AppTheme.darkBg, 1 - activeOpacity)!.withValues(alpha: activeOpacity);
  static Color glassFocusedDark = Color.lerp(AppTheme.darkSurface, AppTheme.darkBg, 1 - focusedOpacity)!.withValues(alpha: focusedOpacity);
  static Color glassSurfaceDark = Color.lerp(AppTheme.darkSurface, AppTheme.darkBg, 1 - surfaceOpacity)!.withValues(alpha: surfaceOpacity);

  // ── Blur values ─────────────────────────────────────────────────────
  static const double blurAmbient = 20;
  static const double blurActive = 28;
  static const double blurFocused = 40;
  static const double blurSurface = 24;

  // ── Border colors ───────────────────────────────────────────────────
  static Color borderLight = const Color(0x0D000000); // rgba(0,0,0,0.05)
  static Color borderDark = const Color(0x0DFFFFFF);  // rgba(255,255,255,0.05)
  static Color borderActiveLight = const Color(0x1A7C3AED); // rgba(124,58,237,0.10)
  static Color borderFocusedLight = const Color(0x2E7C3AED); // rgba(124,58,237,0.18)

  // ── Shadows ─────────────────────────────────────────────────────────
  static List<BoxShadow> ambientShadow = [
    BoxShadow(color: const Color(0x0D000000), blurRadius: 2, offset: const Offset(0, 1)),
  ];

  static List<BoxShadow> activeShadow = [
    BoxShadow(color: const Color(0x0F000000), blurRadius: 24, offset: const Offset(0, 4)),
  ];

  static List<BoxShadow> focusedShadow = [
    BoxShadow(color: const Color(0x1A7C3AED), blurRadius: 40, offset: const Offset(0, 8)),
    BoxShadow(color: const Color(0x14000000), blurRadius: 8, offset: const Offset(0, 2)),
  ];

  static List<BoxShadow> glowShadow = [
    BoxShadow(color: AppTheme.primary.withValues(alpha: 0.08), blurRadius: 40, offset: const Offset(0, 0)),
  ];

  static List<BoxShadow> glowStrongShadow = [
    BoxShadow(color: AppTheme.primary.withValues(alpha: 0.14), blurRadius: 60, offset: const Offset(0, 0)),
  ];

  // ── Helper: resolve glass color for current brightness ──────────────
  static Color glass(Brightness brightness, {GlassLevel level = GlassLevel.ambient}) {
    if (brightness == Brightness.dark) {
      switch (level) {
        case GlassLevel.ambient: return glassAmbientDark;
        case GlassLevel.active: return glassActiveDark;
        case GlassLevel.focused: return glassFocusedDark;
        case GlassLevel.surface: return glassSurfaceDark;
      }
    }
    switch (level) {
      case GlassLevel.ambient: return glassAmbientLight;
      case GlassLevel.active: return glassActiveLight;
      case GlassLevel.focused: return glassFocusedLight;
      case GlassLevel.surface: return glassSurfaceLight;
    }
  }

  static double blur(GlassLevel level) {
    switch (level) {
      case GlassLevel.ambient: return blurAmbient;
      case GlassLevel.active: return blurActive;
      case GlassLevel.focused: return blurFocused;
      case GlassLevel.surface: return blurSurface;
    }
  }

  static List<BoxShadow> shadows(GlassLevel level) {
    switch (level) {
      case GlassLevel.ambient: return ambientShadow;
      case GlassLevel.active: return activeShadow;
      case GlassLevel.focused: return focusedShadow;
      case GlassLevel.surface: return ambientShadow;
    }
  }

  static Color border(Brightness brightness, {GlassLevel level = GlassLevel.ambient}) {
    if (brightness == Brightness.dark) return borderDark;
    switch (level) {
      case GlassLevel.ambient:
      case GlassLevel.surface: return borderLight;
      case GlassLevel.active: return borderActiveLight;
      case GlassLevel.focused: return borderFocusedLight;
    }
  }
}

enum GlassLevel { ambient, active, focused, surface }
