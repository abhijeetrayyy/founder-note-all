import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme/app_theme.dart';

enum StuckReason { big, unclear, energy, avoiding }

class TaskBreakdownSheet extends StatefulWidget {
  final String firstStep;
  final String implementationIntention;
  final int currentEnergy;
  final void Function(String firstStep)? onFirstStepSaved;
  final void Function(String intention)? onIntentionSaved;
  final VoidCallback? onMatchEnergy;

  const TaskBreakdownSheet({
    super.key,
    this.firstStep = '',
    this.implementationIntention = '',
    this.currentEnergy = 1,
    this.onFirstStepSaved,
    this.onIntentionSaved,
    this.onMatchEnergy,
  });

  @override
  State<TaskBreakdownSheet> createState() => _TaskBreakdownSheetState();
}

class _TaskBreakdownSheetState extends State<TaskBreakdownSheet> {
  late TextEditingController _firstStepCtrl;
  late TextEditingController _intentionCtrl;
  StuckReason? _reason;

  static const _reasons = [
    (StuckReason.big, "It's too big", 'Name the smallest physical action that moves it forward — not the whole task, just the very first move.'),
    (StuckReason.unclear, "I don't know how to start", "What's the first thing you'd literally do — open a doc, send a message, make a call?"),
    (StuckReason.energy, 'Wrong energy right now', "This needs a different kind of focus than you have right now. Match it to today, or come back when you're ready."),
    (StuckReason.avoiding, 'I keep avoiding it', 'Set a trigger so you don\'t have to decide in the moment — "When ___ happens, I will ___."'),
  ];

  @override
  void initState() {
    super.initState();
    _firstStepCtrl = TextEditingController(text: widget.firstStep);
    _intentionCtrl = TextEditingController(text: widget.implementationIntention);
  }

  @override
  void dispose() {
    _firstStepCtrl.dispose();
    _intentionCtrl.dispose();
    super.dispose();
  }

  bool get _hasBreakdown => widget.firstStep.isNotEmpty || widget.implementationIntention.isNotEmpty;

  String _activeReasonPrompt() {
    if (_reason == null) return '';
    return _reasons.firstWhere((r) => r.$1 == _reason).$3;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? AppTheme.darkText : AppTheme.lightText;
    final mutedColor = isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted;

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 20),
          Row(children: [
            Icon(_hasBreakdown ? Icons.psychology_rounded : Icons.help_outline_rounded, color: AppTheme.primary, size: 20),
            const SizedBox(width: 8),
            Text(_hasBreakdown ? 'Getting started' : 'Feeling stuck?', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.2, color: AppTheme.lightTextSubtle)),
          ]),
          const SizedBox(height: 16),

          // First step field
          _Label('FIRST STEP'),
          const SizedBox(height: 6),
          TextField(
            controller: _firstStepCtrl,
            style: const TextStyle(fontSize: 14, height: 1.4),
            decoration: InputDecoration(
              hintText: 'e.g. Open the doc and write one sentence',
              filled: true,
              fillColor: isDark ? AppTheme.darkSurfaceAlt : AppTheme.lightSurfaceAlt,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            ),
            onChanged: (_) {
              widget.onFirstStepSaved?.call(_firstStepCtrl.text.trim());
            },
          ),
          const SizedBox(height: 16),

          // Implementation intention
          _Label('TRIGGER (IF–THEN)'),
          const SizedBox(height: 6),
          TextField(
            controller: _intentionCtrl,
            style: const TextStyle(fontSize: 14, height: 1.4),
            decoration: InputDecoration(
              hintText: 'When I sit down after lunch, I will...',
              filled: true,
              fillColor: isDark ? AppTheme.darkSurfaceAlt : AppTheme.lightSurfaceAlt,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            ),
            onChanged: (_) {
              widget.onIntentionSaved?.call(_intentionCtrl.text.trim());
            },
          ),
          const SizedBox(height: 16),

          // Reason chips (only show if no breakdown yet)
          if (!_hasBreakdown) ...[
            Text("Not sure why you're avoiding this? Pick what fits:", style: TextStyle(fontSize: 13, color: mutedColor)),
            const SizedBox(height: 10),
Wrap(spacing: 6, runSpacing: 6, children: _reasons.map((r) {
              final active = _reason == r.$1;
              return GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _reason = active ? null : r.$1);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                  decoration: BoxDecoration(
                    color: active ? AppTheme.primary : (isDark ? AppTheme.darkSurfaceAlt : AppTheme.lightSurfaceAlt),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: active ? AppTheme.primary : (isDark ? AppTheme.darkBorder : AppTheme.lightBorder), width: 1),
                  ),
                  child: Text(r.$2, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: active ? Colors.white : textColor)),
                ),
              );
            }).toList()),
            if (_reason != null) ...[
              const SizedBox(height: 12),
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.primary.withValues(alpha: 0.16)),
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(_activeReasonPrompt(), style: TextStyle(fontSize: 14, color: textColor, height: 1.5)),
                  if (_reason == StuckReason.energy) ...[
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: () {
                          widget.onMatchEnergy?.call();
                          Navigator.pop(context);
                        },
                        style: FilledButton.styleFrom(backgroundColor: AppTheme.primary),
                        child: const Text("Match to today's admin energy"),
                      ),
                    ),
                  ],
                ]),
              ),
            ],
          ],
        ]),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) => Text(text, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.4, color: AppTheme.lightTextMuted));
}
