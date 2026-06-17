import 'dart:async';
import 'package:flutter/material.dart';

class FocusTimerScreen extends StatefulWidget {
  final String taskTitle;
  const FocusTimerScreen({super.key, this.taskTitle = 'Focus Session'});

  @override State<FocusTimerScreen> createState() => _FocusTimerScreenState();
}

class _FocusTimerScreenState extends State<FocusTimerScreen> {
  int _seconds = 25 * 60; // 25 min default
  bool _running = false;
  Timer? _timer;
  int _sessions = 0;

  @override void dispose() { _timer?.cancel(); super.dispose(); }

  void _toggle() {
    setState(() => _running = !_running);
    if (_running) {
      _timer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (_seconds <= 0) { _complete(); return; }
        setState(() => _seconds--);
      });
    } else { _timer?.cancel(); }
  }

  void _complete() {
    _timer?.cancel();
    setState(() { _running = false; _sessions++; _seconds = _sessions % 4 == 0 ? 25 * 60 : (_sessions % 2 == 0 ? 15 * 60 : 5 * 60); });
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_sessions % 4 == 0 ? 'Long break! ' : (_sessions % 2 == 0 ? 'Break time ' : 'Focus done! '))));
  }

  void _reset() { _timer?.cancel(); setState(() { _running = false; _seconds = 25 * 60; }); }

  String get _timeString {
    final m = (_seconds ~/ 60).toString().padLeft(2, '0');
    final s = (_seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final progress = 1 - (_seconds / (25 * 60));
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      appBar: AppBar(title: const Text('Focus Timer'), actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _reset)]),
      body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Text(widget.taskTitle, style: TextStyle(fontSize: 18, color: isDark ? Colors.white70 : Colors.black54)),
        const SizedBox(height: 30),
        SizedBox(width: 200, height: 200, child: Stack(alignment: Alignment.center, children: [
          SizedBox(width: 200, height: 200, child: CircularProgressIndicator(value: progress, strokeWidth: 8, color: const Color(0xFF6C63FF), backgroundColor: Colors.grey.shade200)),
          Text(_timeString, style: TextStyle(fontSize: 48, fontWeight: FontWeight.w200, letterSpacing: 2, color: isDark ? Colors.white : const Color(0xFF1A1A2E))),
        ])),
        const SizedBox(height: 40),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          GestureDetector(onTap: _toggle, child: Container(width: 64, height: 64, decoration: BoxDecoration(color: _running ? Colors.red : const Color(0xFF6C63FF), shape: BoxShape.circle), child: Icon(_running ? Icons.stop : Icons.play_arrow, color: Colors.white, size: 32))),
        ]),
        const SizedBox(height: 16),
        Text('Session $_sessions', style: TextStyle(color: Colors.grey.shade500)),
      ])),
    );
  }
}
