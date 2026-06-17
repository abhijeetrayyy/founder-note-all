import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:intl/intl.dart';

class NoteCard extends StatelessWidget {
  final String title;
  final String content;
  final int colorValue;
  final String category;
  final DateTime date;
  final bool isPinned;
  final bool isLocked;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  const NoteCard({
    super.key,
    required this.title,
    required this.content,
    required this.colorValue,
    required this.category,
    required this.date,
    this.isPinned = false,
    this.isLocked = false,
    this.onTap,
    this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    final color = Color(colorValue);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap, onLongPress: onLongPress,
      child: Container(
        decoration: BoxDecoration(color: isDark ? const Color(0xFF1E1E2C) : Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: color.withValues(alpha: isDark ? 0.1 : 0.06), blurRadius: 8, offset: const Offset(0, 2))]),
        child: Stack(children: [
          Positioned(left: 0, top: 0, bottom: 0, child: Container(width: 4, decoration: BoxDecoration(color: color, borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), bottomLeft: Radius.circular(16))))),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 10, 10),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                if (isPinned) Padding(padding: const EdgeInsets.only(right: 4), child: Icon(Icons.push_pin, size: 14, color: color)),
                if (isLocked) Padding(padding: const EdgeInsets.only(right: 4), child: Icon(Icons.lock_outline, size: 14, color: Colors.grey.shade500)),
                Expanded(child: Text(title.isEmpty ? 'Untitled' : title, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: isDark ? Colors.white : const Color(0xFF1A1A2E)))),
              ]),
              if (content.isNotEmpty) ...[const SizedBox(height: 4), Expanded(child: isLocked ? Center(child: Icon(Icons.lock_outline, size: 24, color: Colors.grey.shade400)) : MarkdownBody(data: content.length > 150 ? '${content.substring(0, 150)}...' : content, styleSheet: MarkdownStyleSheet(p: TextStyle(fontSize: 12, height: 1.4, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600))))],
              const SizedBox(height: 6),
              Row(children: [
                Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: color.withValues(alpha: isDark ? 0.15 : 0.08), borderRadius: BorderRadius.circular(6)), child: Text(category, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w500))),
                const Spacer(),
                Text(DateFormat('MMM d').format(date), style: TextStyle(fontSize: 10, color: Colors.grey.shade500)),
              ]),
            ]),
          ),
        ]),
      ),
    );
  }
}
