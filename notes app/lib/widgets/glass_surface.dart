import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../theme/glass_tokens.dart';

class GlassSurface extends StatelessWidget {
  final Widget child;
  final GlassLevel level;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final BorderRadiusGeometry? borderRadius;
  final double? width;
  final double? height;
  final List<BoxShadow>? additionalShadows;

  const GlassSurface({
    super.key,
    required this.child,
    this.level = GlassLevel.ambient,
    this.padding,
    this.margin,
    this.borderRadius,
    this.width,
    this.height,
    this.additionalShadows,
  });

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final bg = GlassTokens.glass(brightness, level: level);
    final blur = GlassTokens.blur(level);
    final border = GlassTokens.border(brightness, level: level);
    final shadows = [...GlassTokens.shadows(level), if (additionalShadows != null) ...additionalShadows!];
    final radius = borderRadius ?? BorderRadius.circular(AppTheme.cardRadius);

    return Container(
      width: width,
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: radius,
        boxShadow: shadows,
        border: Border.all(color: border, width: 1),
      ),
      child: ClipRRect(
        borderRadius: radius,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blur / 2, sigmaY: blur / 2),
          child: Container(
            padding: padding,
            decoration: BoxDecoration(color: bg, borderRadius: radius),
            child: child,
          ),
        ),
      ),
    );
  }
}

class GlassCard extends StatelessWidget {
  final Widget child;
  final CardVariant variant;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;

  const GlassCard({
    super.key,
    required this.child,
    this.variant = CardVariant.ambient,
    this.padding,
    this.margin,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final level = switch (variant) {
      CardVariant.ambient => GlassLevel.ambient,
      CardVariant.active => GlassLevel.active,
      CardVariant.focused => GlassLevel.focused,
      CardVariant.flat => GlassLevel.surface,
    };

    final card = GlassSurface(
      level: level,
      padding: padding ?? const EdgeInsets.all(AppTheme.s4),
      margin: margin,
      child: child,
    );

    if (onTap != null) {
      return GestureDetector(onTap: onTap, child: card);
    }
    return card;
  }
}

enum CardVariant { ambient, active, focused, flat }
