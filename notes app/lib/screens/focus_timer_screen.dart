import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:uuid/uuid.dart';
import '../models/focus_session.dart';
import '../services/database_service.dart';
import '../theme/app_theme.dart';

class FocusTimerScreen extends StatefulWidget {
  final String taskTitle;
  const FocusTimerScreen({super.key, this.taskTitle = 'Focus Session'});

  @override State<FocusTimerScreen> createState() => _FocusTimerScreenState();
}

class _FocusTimerScreenState extends State<FocusTimerScreen> {
  static const _modes = [
    ('Pomodoro', 25, AppTheme.primary, Icons.local_cafe_rounded),
    ('Deep work', 50, AppTheme.energyDeep, Icons.psychology_rounded),
    ('Quick sprint', 10, AppTheme.energyAdmin, Icons.bolt_rounded),
  ];

  late int _minutes;
  late int _seconds;
  bool _running = false;
  Timer? _timer;
  int _completed = 0;
  int _modeIndex = 0;

  @override
  void initState() {
    super.initState();
    _minutes = _modes[0].$2;
    _seconds = _minutes * 60;
  }

  @override void dispose() { _timer?.cancel(); super.dispose(); }

  void _setMode(int idx) {
    if (_running) _toggle();
    setState(() {
      _modeIndex = idx;
      _minutes = _modes[idx].$2;
      _seconds = _minutes * 60;
    });
  }

  void _toggle() {
    HapticFeedback.lightImpact();
    setState(() => _running = !_running);
    if (_running) {
      _timer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (!mounted) return;
        if (_seconds <= 0) { _complete(); return; }
        setState(() => _seconds--);
      });
    } else { _timer?.cancel(); }
  }

  void _complete() {
    _timer?.cancel();
    HapticFeedback.heavyImpact();
    setState(() {
      _running = false;
      _completed++;
      _seconds = _minutes * 60;
    });
    _logSession(completed: true);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Row(children: const [
          Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
          SizedBox(width: 10),
          Expanded(child: Text('Focus session complete!', style: TextStyle(fontWeight: FontWeight.w600))),
        ]),
        backgroundColor: AppTheme.success,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  Future<void> _logSession({bool completed = true}) async {
    final modeKeys = ['pomodoro', 'deep_work', 'quick_sprint'];
    final session = FocusSession(
      id: const Uuid().v4(),
      mode: modeKeys[_modeIndex],
      durationMinutes: _modes[_modeIndex].$2,
      completed: completed,
    );
    await DatabaseService.instance.insertFocusSession(session);
  }

  void _reset() {
    _timer?.cancel();
    HapticFeedback.selectionClick();
    setState(() {
      _running = false;
      _seconds = _minutes * 60;
    });
  }

  String get _timeString {
    final m = (_seconds ~/ 60).toString().padLeft(2, '0');
    final s = (_seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final totalSec = _minutes * 60;
    final progress = totalSec == 0 ? 0.0 : 1 - (_seconds / totalSec);
    final color = _modes[_modeIndex].$3;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Focus Timer'),
        actions: [IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _reset, tooltip: 'Reset')],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
          child: Column(children: [
            if (widget.taskTitle != 'Focus Session')
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: isDark ? 0.16 : 0.08),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: color.withValues(alpha: 0.3)),
                ),
                child: Row(children: [
                  Icon(Icons.star_rounded, color: color, size: 18),
                  const SizedBox(width: 8),
                  Expanded(child: Text(widget.taskTitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: color))),
                ]),
              ),

            // Mode selector
            Row(children: [
              for (int i = 0; i < _modes.length; i++)
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(right: i < _modes.length - 1 ? 8 : 0),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => _setMode(i),
                        borderRadius: BorderRadius.circular(14),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
                          decoration: BoxDecoration(
                            color: _modeIndex == i ? _modes[i].$3 : Theme.of(context).cardColor,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: _modeIndex == i ? _modes[i].$3 : Theme.of(context).dividerColor, width: 1.5),
                          ),
                          child: Column(children: [
                            Icon(_modes[i].$4, color: _modeIndex == i ? Colors.white : _modes[i].$3, size: 20),
                            const SizedBox(height: 6),
                            Text(_modes[i].$1, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: _modeIndex == i ? Colors.white : (isDark ? AppTheme.darkText : AppTheme.lightText))),
                            Text('${_modes[i].$2}m', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: _modeIndex == i ? Colors.white.withValues(alpha: 0.85) : AppTheme.lightTextMuted)),
                          ]),
                        ),
                      ),
                    ),
                  ),
                ),
            ]),
            const SizedBox(height: 32),

            // Timer ring
            Expanded(
              child: Center(
                child: SizedBox(
                  width: 240, height: 240,
                  child: Stack(alignment: Alignment.center, children: [
                    SizedBox(
                      width: 240, height: 240,
                      child: CircularProgressIndicator(
                        value: progress,
                        strokeWidth: 10,
                        color: color,
                        backgroundColor: color.withValues(alpha: isDark ? 0.15 : 0.08),
                        strokeCap: StrokeCap.round,
                      ),
                    ),
                    Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Text(_timeString, style: TextStyle(fontSize: 56, fontWeight: FontWeight.w300, letterSpacing: 2, color: isDark ? Colors.white : const Color(0xFF1A1A2E))),
                      const SizedBox(height: 4),
                      Text(_running ? 'IN PROGRESS' : 'READY', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.4, color: color)),
                    ]),
                  ]),
                ),
              ),
            ),

            // Controls
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              _CircleButton(icon: Icons.refresh_rounded, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, onTap: _reset),
              const SizedBox(width: 24),
              _CircleButton(icon: _running ? Icons.pause_rounded : Icons.play_arrow_rounded, color: color, size: 80, onTap: _toggle, primary: true),
              const SizedBox(width: 24),
              _CircleButton(icon: Icons.skip_next_rounded, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, onTap: () { _timer?.cancel(); setState(() { _seconds = _minutes * 60; _running = false; }); }),
            ]),
            const SizedBox(height: 16),
            Text('Completed today: $_completed', style: TextStyle(fontSize: 12, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, fontWeight: FontWeight.w600)),
          ]),
        ),
      ),
    );
  }
}

class _CircleButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final bool primary;
  final double size;
  const _CircleButton({required this.icon, required this.color, required this.onTap, this.primary = false, this.size = 56});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Container(
          width: size, height: size,
          decoration: BoxDecoration(
            color: primary ? color : Colors.transparent,
            shape: BoxShape.circle,
            border: primary ? null : Border.all(color: color.withValues(alpha: 0.4), width: 2),
            boxShadow: primary ? [BoxShadow(color: color.withValues(alpha: 0.4), blurRadius: 16, offset: const Offset(0, 6))] : null,
          ),
          child: Icon(icon, color: primary ? Colors.white : color, size: primary ? 36 : 22),
        ),
      ),
    );
  }
}
