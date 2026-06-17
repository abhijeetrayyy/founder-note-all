import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/tag_provider.dart';
import '../../theme/app_theme.dart';

class TagPicker extends StatelessWidget {
  final Set<String> selectedTagIds;
  final ValueChanged<Set<String>> onChanged;
  const TagPicker({super.key, required this.selectedTagIds, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final tp = context.watch<TagProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        ...tp.tags.map((tag) {
          final selected = selectedTagIds.contains(tag.id);
          final color = Color(tag.color);
          return GestureDetector(
            onTap: () {
              final next = Set<String>.from(selectedTagIds);
              if (selected) {
                next.remove(tag.id);
              } else {
                next.add(tag.id);
              }
              onChanged(next);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: selected ? color.withValues(alpha: 0.18) : (isDark ? const Color(0xFF252536) : Colors.grey.shade100),
                borderRadius: BorderRadius.circular(14),
                border: selected ? Border.all(color: color) : null,
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
                const SizedBox(width: 6),
                Text(tag.name, style: TextStyle(fontSize: 12, color: selected ? color : (isDark ? Colors.white70 : Colors.grey.shade700), fontWeight: selected ? FontWeight.w600 : FontWeight.w400)),
              ]),
            ),
          );
        }),
        GestureDetector(
          onTap: () => _showAddTag(context),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade400, style: BorderStyle.solid, width: 1), borderRadius: BorderRadius.circular(14)),
            child: const Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.add, size: 14, color: AppTheme.primary), SizedBox(width: 4), Text('New tag', style: TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w600))]),
          ),
        ),
      ],
    );
  }

  void _showAddTag(BuildContext context) {
    final ctrl = TextEditingController();
    int color = 0xFF6C63FF;
    const palette = [0xFF6C63FF, 0xFF2196F3, 0xFFFF9800, 0xFF4CAF50, 0xFFF44336, 0xFF9C27B0, 0xFF00BCD4, 0xFF795548];
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(builder: (ctx, setState) => AlertDialog(
        title: const Text('New Tag'),
        content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          TextField(controller: ctrl, autofocus: true, decoration: const InputDecoration(hintText: 'Tag name')),
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, children: palette.map((c) => GestureDetector(onTap: () => setState(() => color = c), child: Container(width: 26, height: 26, decoration: BoxDecoration(color: Color(c), shape: BoxShape.circle, border: color == c ? Border.all(color: Colors.white, width: 2) : null)))).toList()),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(onPressed: () async {
            final name = ctrl.text.trim();
            if (name.isEmpty) return;
            await context.read<TagProvider>().add(name: name, color: color);
            if (ctx.mounted) Navigator.pop(ctx);
          }, child: const Text('Add')),
        ],
      )),
    );
  }
}
