import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/journal_entry.dart';
import '../../providers/journal_provider.dart';
import '../../theme/app_theme.dart';

class JournalScreen extends StatefulWidget {
  const JournalScreen({super.key});
  @override State<JournalScreen> createState() => _JournalScreenState();
}

class _JournalScreenState extends State<JournalScreen> {
  final _ctrl = TextEditingController();
  int _mood = 1;

  @override void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final p = context.read<JournalProvider>();
      final today = p.todayEntry;
      if (today != null) {
        setState(() { _ctrl.text = today.content; _mood = today.mood; });
      }
    });
  }

  @override void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final p = context.watch<JournalProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final today = p.todayEntry;

    return Scaffold(
      appBar: AppBar(
        title: Row(children: [const Text('Journal'), if (p.streak > 0) ...[const SizedBox(width: 8), Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: Colors.orange.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(10)), child: Text(' ${p.streak}d streak', style: const TextStyle(fontSize: 12, color: Colors.orange, fontWeight: FontWeight.w600)))]]),
      ),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        Text(DateFormat('EEEE, MMMM d, y').format(DateTime.now()), style: TextStyle(fontSize: 14, color: Colors.grey.shade500)),
        const SizedBox(height: 16),
        if (p.streak > 0) ...[
          Container(
            padding: const EdgeInsets.all(12), margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(color: isDark ? const Color(0xFF1E1E2C) : Colors.white, borderRadius: BorderRadius.circular(14)),
            child: Row(children: [
              const Text('—', style: TextStyle(fontSize: 24)), const SizedBox(width: 8),
              Expanded(child: Text('$p.streak day streak! Keep going.', style: TextStyle(fontSize: 14, color: isDark ? Colors.white70 : Colors.black87))),
            ]),
          ),
        ],
        TextField(controller: _ctrl, maxLines: 8, style: TextStyle(fontSize: 16, height: 1.7, color: isDark ? Colors.grey.shade200 : const Color(0xFF1A1A2E)), decoration: InputDecoration(hintText: 'How was today? What did you ship? What are you grateful for?', border: InputBorder.none, hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 15))),
        const SizedBox(height: 16),
        Text('Mood', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey)),
        const SizedBox(height: 8),
        Row(children: List.generate(5, (i) => GestureDetector(
          onTap: () => setState(() => _mood = i),
          child: Container(margin: const EdgeInsets.only(right: 8), padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: _mood == i ? AppTheme.primary.withValues(alpha: 0.15) : (isDark ? const Color(0xFF252536) : Colors.grey.shade100), borderRadius: BorderRadius.circular(12), border: _mood == i ? Border.all(color: AppTheme.primary) : null), child: Text(JournalEntry.moodEmojis[i], style: const TextStyle(fontSize: 22))),
        ))),
        const SizedBox(height: 24),
        SizedBox(width: double.infinity, child: FilledButton(onPressed: () async {
          if (_ctrl.text.trim().isEmpty) return;
          await p.save(content: _ctrl.text.trim(), mood: _mood);
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Journal saved!'), duration: Duration(seconds: 1)));
        }, child: const Text('Save Entry'))),
        const SizedBox(height: 32),
        if (p.entries.length > 1) ...[
          Text('Past Entries', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          ...p.entries.skip(today != null ? 1 : 0).map((e) => Container(
            margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: isDark ? const Color(0xFF1E1E2C) : Colors.white, borderRadius: BorderRadius.circular(14)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Text(e.moodEmoji, style: const TextStyle(fontSize: 18)),
                const SizedBox(width: 8),
                Text(DateFormat('MMM d, y').format(e.createdAt), style: TextStyle(fontSize: 13, color: Colors.grey.shade500)),
              ]),
              const SizedBox(height: 8),
              Text(e.content, maxLines: 5, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, color: isDark ? Colors.grey.shade300 : Colors.grey.shade700, height: 1.5)),
            ]),
          )),
        ],
      ]),
    );
  }
}

