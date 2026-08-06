import 'dart:math';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class MeterRing extends StatelessWidget {
  final double value; // 0.0 to 1.0
  final double size;
  final double strokeWidth;
  final Color? color;
  final Widget? centerChild;
  final bool withGlow;

  const MeterRing({
    super.key,
    required this.value,
    this.size = 80,
    this.strokeWidth = 8,
    this.color,
    this.centerChild,
    this.withGlow = false,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveColor = color ?? AppTheme.primary;
    final clamped = value.clamp(0.0, 1.0);

    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _MeterRingPainter(
          value: clamped,
          strokeWidth: strokeWidth,
          color: effectiveColor,
          withGlow: withGlow,
        ),
        child: centerChild != null ? Center(child: centerChild) : null,
      ),
    );
  }
}

class _MeterRingPainter extends CustomPainter {
  final double value;
  final double strokeWidth;
  final Color color;
  final bool withGlow;

  _MeterRingPainter({
    required this.value,
    required this.strokeWidth,
    required this.color,
    required this.withGlow,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Background ring
    final bgPaint = Paint()
      ..color = color.withValues(alpha: 0.08)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);

    // Progress ring
    if (value > 0) {
      final progressPaint = Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;

      if (withGlow) {
        progressPaint.maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);
      }

      final sweepAngle = 2 * pi * value;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -pi / 2, // start from top
        sweepAngle,
        false,
        progressPaint,
      );

      // Redraw without blur for sharp cap
      if (withGlow) {
        progressPaint.maskFilter = null;
        canvas.drawArc(
          Rect.fromCircle(center: center, radius: radius),
          -pi / 2,
          sweepAngle,
          false,
          progressPaint,
        );
      }
    }
  }

  @override
  bool shouldRepaint(_MeterRingPainter oldDelegate) =>
      value != oldDelegate.value || color != oldDelegate.color || strokeWidth != oldDelegate.strokeWidth || withGlow != oldDelegate.withGlow;
}
