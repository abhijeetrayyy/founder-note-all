import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final String? actionLabel;
  final IconData? actionIcon;
  final VoidCallback? onAction;
  final String? secondaryActionLabel;
  final VoidCallback? onSecondaryAction;
  final Widget? illustration;
  final Color? accent;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.actionLabel,
    this.actionIcon,
    this.onAction,
    this.secondaryActionLabel,
    this.onSecondaryAction,
    this.illustration,
    this.accent,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = accent ?? AppTheme.primary;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          illustration ??
              Container(
                width: 88, height: 88,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: isDark ? 0.14 : 0.08),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 38, color: color),
              ),
          const SizedBox(height: 22),
          Text(title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleLarge),
          if (subtitle != null) ...[
            const SizedBox(height: 8),
            Text(
              subtitle!,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted,
                    height: 1.5,
                  ),
            ),
          ],
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 22),
            FilledButton.icon(
              onPressed: onAction,
              icon: Icon(actionIcon ?? Icons.add_rounded, size: 18),
              label: Text(actionLabel!),
            ),
          ],
          if (secondaryActionLabel != null && onSecondaryAction != null) ...[
            const SizedBox(height: 8),
            TextButton(onPressed: onSecondaryAction, child: Text(secondaryActionLabel!)),
          ],
        ]),
      ),
    );
  }
}
