import 'dart:ui';
import 'package:flutter/material.dart';
import 'app_theme.dart';

/// Surfaces.
///
/// These kept their `glass*` names so every widget already using them re-skins
/// for free — the same trick the web app used with its `.glass-*` class names.
/// But there is no glass any more and no blur: just machined panels separated
/// by hairlines. Depth comes from the border, never from a shadow, and there
/// is exactly one ground rather than a light and a dark variant to keep in
/// step. The purple borders and violet glows that used to live here were the
/// last of the old brand.
class GlassTokens {
  GlassTokens._();

  // ── Opacity levels ──────────────────────────────────────────────────
  static const double ambientOpacity = 0.55;
  static const double activeOpacity = 0.72;
  static const double focusedOpacity = 0.88;
  static const double surfaceOpacity = 0.64;

  // ── Panels. Opaque; the level picks a surface, not a transparency. ──
  static const Color glassAmbientLight = AppTheme.surface;
  static const Color glassActiveLight = Color(0xFF17171B);
  static const Color glassFocusedLight = AppTheme.surface;
  static const Color glassSurfaceLight = AppTheme.raised;
  static const Color glassAmbientDark = AppTheme.surface;
  static const Color glassActiveDark = Color(0xFF17171B);
  static const Color glassFocusedDark = AppTheme.surface;
  static const Color glassSurfaceDark = AppTheme.raised;


  // ── Blur values ─────────────────────────────────────────────────────
  // No blur. A panel is a panel.
  static const double blurAmbient = 0;
  static const double blurActive = 0;
  static const double blurFocused = 0;
  static const double blurSurface = 0;

  // ── Border colors ───────────────────────────────────────────────────
  static const Color borderLight = AppTheme.border;
  static const Color borderDark = AppTheme.border;
  static const Color borderActiveLight = AppTheme.borderStrong;
  static const Color borderFocusedLight = AppTheme.borderStrong;

  // ── Shadows. There are none; the hairline does the separating. ──
  static const List<BoxShadow> ambientShadow = [];
  static const List<BoxShadow> activeShadow = [];
  static const List<BoxShadow> focusedShadow = [];
  static const List<BoxShadow> glowShadow = [];
  static const List<BoxShadow> glowStrongShadow = [];





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
