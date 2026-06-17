import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_theme.dart';

class CommandPalette extends StatefulWidget {
  const CommandPalette({super.key});
  @override State<CommandPalette> createState() => _CommandPaletteState();
}

class _CommandPaletteState extends State<CommandPalette> {
  final _ctrl = TextEditingController();
  int _selected = 0;

  @override void dispose() { _ctrl.dispose(); super.dispose(); }

  List<_Command> get _commands => [
    _Command(icon: Icons.dashboard, label: 'Dashboard', shortcut: 'D', action: (_) => _navigate(AppSection.dashboard)),
    _Command(icon: Icons.check_circle_outline, label: 'Tasks', shortcut: 'T', action: (_) => _navigate(AppSection.tasks)),
    _Command(icon: Icons.note_alt_outlined, label: 'Notes', shortcut: 'N', action: (_) => _navigate(AppSection.notes)),
    _Command(icon: Icons.folder_outlined, label: 'Projects', shortcut: 'P', action: (_) => _navigate(AppSection.projects)),
    _Command(icon: Icons.calendar_month, label: 'Calendar', shortcut: 'C', action: (_) => _navigate(AppSection.calendar)),
    _Command(icon: Icons.edit_note, label: 'Journal', shortcut: 'J', action: (_) => _navigate(AppSection.journal)),
    _Command(icon: Icons.auto_awesome, label: 'Habits', shortcut: 'H', action: (_) => _navigate(AppSection.habits)),
    _Command(icon: Icons.analytics_rounded, label: 'Stats', shortcut: '', action: (_) => _navigate(AppSection.stats)),
    _Command(icon: Icons.insights_rounded, label: 'Weekly Review', shortcut: '', action: (_) => _navigate(AppSection.review)),
    _Command(icon: Icons.timer_rounded, label: 'Focus Timer', shortcut: '', action: (_) => _navigate(AppSection.focus)),
    _Command(icon: Icons.dark_mode, label: 'Toggle Dark Mode', shortcut: '', action: (_) { Navigator.pop(context); context.read<AppProvider>().toggleDarkMode(); }),
    _Command(icon: Icons.settings, label: 'Settings', shortcut: '', action: (_) => _navigate(AppSection.settings)),
  ];

  List<_Command> get filtered => _ctrl.text.isEmpty ? _commands : _commands.where((c) => c.label.toLowerCase().contains(_ctrl.text.toLowerCase())).toList();

  void _navigate(AppSection s) { Navigator.pop(context); context.read<AppProvider>().setSidebarIndex(AppSection.values.indexOf(s)); }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cmds = filtered;
    if (_selected >= cmds.length) _selected = 0;

    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        width: 500,
        constraints: const BoxConstraints(maxHeight: 500),
        decoration: BoxDecoration(color: isDark ? const Color(0xFF1E1E2C) : Colors.white, borderRadius: BorderRadius.circular(20)),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Padding(padding: const EdgeInsets.all(16), child: TextField(
            controller: _ctrl, autofocus: true,
            style: TextStyle(fontSize: 16, color: isDark ? Colors.white : const Color(0xFF1A1A2E)),
            decoration: const InputDecoration(hintText: 'Type a command...', prefixIcon: Icon(Icons.search_rounded), border: InputBorder.none),
            onChanged: (_) => setState(() => _selected = 0),
          )),
          const Divider(height: 1),
          Flexible(
            child: ListView.builder(
              shrinkWrap: true, padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: cmds.length,
              itemBuilder: (_, i) {
                final c = cmds[i]; final sel = i == _selected;
                return ListTile(
                  dense: true, selected: sel,
                  leading: Icon(c.icon, size: 20, color: sel ? AppTheme.primary : null),
                  title: Text(c.label, style: TextStyle(fontSize: 14, fontWeight: sel ? FontWeight.w600 : FontWeight.w400)),
                  trailing: Text(c.shortcut, style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                  onTap: () => c.action(context),
                );
              },
            ),
          ),
        ]),
      ),
    );
  }
}

class _Command {
  final IconData icon; final String label, shortcut;
  final void Function(BuildContext) action;
  _Command({required this.icon, required this.label, required this.shortcut, required this.action});
}
