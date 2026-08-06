import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/note.dart';
import '../models/task.dart';
import '../models/project.dart';
import '../models/goal.dart';
import '../providers/app_provider.dart';
import '../providers/notes_provider.dart';
import '../providers/tasks_provider.dart';
import '../providers/projects_provider.dart';
import '../providers/goals_provider.dart';
import '../providers/daily_plan_provider.dart';
import '../providers/auth_provider.dart';
import '../services/database_service.dart';
import '../services/supabase_sync_service.dart';
import '../theme/app_theme.dart';

Future<void> _deleteAccount(BuildContext context) async {
  final step1 = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Delete your account?'),
      content: const Text('This will permanently delete your cloud account and all synced data. Local data on this device will remain until you clear it manually. This action cannot be undone.'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
        FilledButton(onPressed: () => Navigator.pop(ctx, true), style: FilledButton.styleFrom(backgroundColor: AppTheme.danger), child: const Text('I understand')),
      ],
    ),
  );
  if (step1 != true) return;

  final ctrl = TextEditingController();
  final step2 = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Type DELETE to confirm'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        const Text('To confirm, type DELETE in the field below.'),
        const SizedBox(height: 12),
        TextField(controller: ctrl, autofocus: true, decoration: const InputDecoration(hintText: 'Type DELETE')),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
        FilledButton(onPressed: () => Navigator.pop(ctx, ctrl.text.trim() == 'DELETE'), style: FilledButton.styleFrom(backgroundColor: AppTheme.danger), child: const Text('Delete my account')),
      ],
    ),
  );
  ctrl.dispose();
  if (step2 != true) return;

  final step3 = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Are you absolutely sure?'),
      content: const Text('All your cloud data will be permanently deleted. This is your final chance to cancel.'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
        FilledButton(onPressed: () => Navigator.pop(ctx, true), style: FilledButton.styleFrom(backgroundColor: AppTheme.danger), child: const Text('Yes, delete everything')),
      ],
    ),
  );
  if (step3 != true) return;

  try {
    // Delete user's profile row
    await Supabase.instance.client.from('users_profile').delete().eq('user_id', Supabase.instance.client.auth.currentUser!.id);
    // Sign out
    await context.read<AuthProvider>().signOut();
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Account deleted. Restart the app to start fresh.')));
    }
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to delete account: $e')));
    }
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(pinned: true, backgroundColor: Theme.of(context).scaffoldBackgroundColor, automaticallyImplyLeading: false, title: const Text('Settings', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -0.5))),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
            sliver: SliverList.list(children: [
              _ProfileCard(name: app.userName, isDark: isDark, onEdit: () => _editName(context, app.userName)),
              const SizedBox(height: 16),
              _Section(label: 'APPEARANCE'),
              _SettingTile(icon: isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded, title: 'Dark mode', subtitle: 'Reduces eye strain, saves battery', trailing: Switch(value: app.isDarkMode, onChanged: (_) => app.toggleDarkMode())),
              const SizedBox(height: 16),
              _Section(label: 'EXECUTION DEFAULTS'),
              _SettingTile(icon: Icons.flag_rounded, title: 'Default plan time', subtitle: 'When to start your morning ritual', trailing: const Icon(Icons.chevron_right_rounded)),
              _SettingTile(icon: Icons.star_rounded, title: 'MIT limit', subtitle: 'Max MITs per day (3 recommended)', trailing: const Text('3', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700))),
              _SettingTile(icon: Icons.bolt_rounded, title: 'Default energy level', subtitle: 'New tasks default to Medium', trailing: const Icon(Icons.chevron_right_rounded)),
              const SizedBox(height: 16),
              _Section(label: 'ACCOUNT'),
              Consumer<AuthProvider>(
                builder: (context, auth, _) => _SettingTile(
                  icon: Icons.account_circle_rounded,
                  title: auth.user?.email ?? 'Account',
                  subtitle: 'Signed in with Supabase',
                  onTap: () async {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Sign out?'),
                        content: const Text('Your local data will remain on this device.'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Sign out')),
                        ],
                      ),
                    );
                    if (confirm == true) await auth.signOut();
                  },
                  trailing: const Text('Sign out', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.primary)),
                ),
              ),
              const SizedBox(height: 16),
              _Section(label: 'CLOUD'),
              Consumer<AuthProvider>(
                builder: (context, auth, _) => _SettingTile(
                  icon: Icons.cloud_upload_rounded,
                  title: 'Sync to cloud',
                  subtitle: auth.isAuthenticated ? 'Push local data to Supabase' : 'Sign in to enable sync',
                  onTap: auth.isAuthenticated
                      ? () async {
                          final result = await SupabaseSyncService.instance.syncAll();
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(result.message)),
                            );
                          }
                        }
                      : null,
                  trailing: auth.isAuthenticated ? const Icon(Icons.chevron_right_rounded) : const Icon(Icons.lock_outline, size: 18, color: AppTheme.lightTextMuted),
                ),
              ),
              const SizedBox(height: 16),
              _Section(label: 'DATA'),
              _SettingTile(icon: Icons.upload_file_rounded, title: 'Export all data', subtitle: 'Backup as JSON', onTap: () => _export(context)),
              _SettingTile(icon: Icons.download_rounded, title: 'Import data', subtitle: 'Restore from backup', onTap: () => _import(context)),
              _SettingTile(icon: Icons.cleaning_services_rounded, title: 'Reset onboarding', subtitle: 'Show welcome screens again', onTap: () async {
                final prefs = await SharedPreferencesHelper.reset();
                if (context.mounted) {
                  await context.read<AppProvider>().loadPreferences();
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Onboarding reset. Restart to see the welcome.')));
                }
              }),
              const SizedBox(height: 16),
              _Section(label: 'ABOUT'),
              _SettingTile(icon: Icons.rocket_launch_rounded, title: 'Founder', subtitle: 'Execution OS for founders · v2.1'),
              _SettingTile(icon: Icons.code_rounded, title: 'Built with', subtitle: 'Flutter · SQLite · Provider'),
              const SizedBox(height: 16),
              _Section(label: 'DANGER ZONE'),
              Consumer<AuthProvider>(
                builder: (context, auth, _) => _SettingTile(
                  icon: Icons.delete_forever_rounded,
                  title: 'Delete account',
                  subtitle: auth.isAuthenticated ? 'Permanently delete your account and cloud data' : 'Sign in first',
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(color: AppTheme.danger.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
                    child: const Text('Delete', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.danger)),
                  ),
                  onTap: auth.isAuthenticated ? () => _deleteAccount(context) : null,
                ),
              ),
              const SizedBox(height: 24),
              Center(child: Text('Built for people who ship.', style: TextStyle(fontSize: 12, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, fontStyle: FontStyle.italic))),
            ]),
          ),
        ],
      ),
    );
  }

  Future<void> _editName(BuildContext context, String current) async {
    final ctrl = TextEditingController(text: current);
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Your name'),
        content: TextField(controller: ctrl, autofocus: true, decoration: const InputDecoration(hintText: 'First name')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(onPressed: () async {
            await context.read<AppProvider>().setUserName(ctrl.text.trim());
            if (ctx.mounted) Navigator.pop(ctx);
          }, child: const Text('Save')),
        ],
      ),
    );
  }

  Future<void> _export(BuildContext context) async {
    try {
      final result = await FilePicker.platform.saveFile(dialogTitle: 'Export', fileName: 'founder_backup.json', type: FileType.custom, allowedExtensions: ['json']);
      if (result == null) return;
      final db = DatabaseService.instance;
      final notes = await db.getNotes(includeArchived: true);
      final tasks = await db.getTasks(includeCompleted: true);
      final projects = await db.getProjects();
      final goals = await db.getGoals();
      final data = {
        'version': 2,
        'exportedAt': DateTime.now().toIso8601String(),
        'notes': notes.map((n) => n.toMap()).toList(),
        'tasks': tasks.map((t) => t.toMap()).toList(),
        'projects': projects.map((p) => p.toMap()).toList(),
        'goals': goals.map((g) => g.toMap()).toList(),
      };
      await File(result).writeAsString(const JsonEncoder.withIndent('  ').convert(data));
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Exported to $result')));
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Export failed: $e')));
    }
  }

  Future<void> _import(BuildContext context) async {
    try {
      final result = await FilePicker.platform.pickFiles(dialogTitle: 'Import', type: FileType.custom, allowedExtensions: ['json']);
      if (result == null || result.files.isEmpty) return;
      final json = jsonDecode(await File(result.files.single.path!).readAsString());
      final db = DatabaseService.instance;
      int nc = 0, tc = 0, pc = 0, gc = 0;
      if (json['notes'] != null) for (final n in json['notes']) { await db.insertNote(Note.fromMap(n)); nc++; }
      if (json['tasks'] != null) for (final t in json['tasks']) { await db.insertTask(Task.fromMap(t)); tc++; }
      if (json['projects'] != null) for (final p in json['projects']) { await db.insertProject(Project.fromMap(p)); pc++; }
      if (json['goals'] != null) for (final g in json['goals']) { await db.insertGoal(Goal.fromMap(g)); gc++; }
      await db.rebuildFts();
      if (context.mounted) {
        await context.read<NotesProvider>().load();
        await context.read<TasksProvider>().load();
        await context.read<ProjectsProvider>().load();
        await context.read<GoalsProvider>().load();
        await context.read<DailyPlanProvider>().load();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Imported $nc notes, $tc tasks, $pc projects, $gc goals')));
      }
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Import failed: $e')));
    }
  }
}

class SharedPreferencesHelper {
  static Future<void> reset() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('onboarded');
    await prefs.remove('userName');
  }
}

class _ProfileCard extends StatelessWidget {
  final String name;
  final bool isDark;
  final VoidCallback onEdit;
  const _ProfileCard({required this.name, required this.isDark, required this.onEdit});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onEdit,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [AppTheme.primary, AppTheme.primaryDeep]),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(children: [
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), shape: BoxShape.circle),
            child: Center(child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800))),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(name.isEmpty ? 'Set your name' : name, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
              const SizedBox(height: 2),
              Text('Tap to edit', style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 12)),
            ]),
          ),
          const Icon(Icons.edit_rounded, color: Colors.white, size: 18),
        ]),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String label;
  const _Section({required this.label});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 8, 4, 8),
      child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, letterSpacing: 1.4)),
    );
  }
}

class _SettingTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  const _SettingTile({required this.icon, required this.title, this.subtitle, this.trailing, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.only(bottom: 4),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(12)),
          child: Row(children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, size: 18, color: AppTheme.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                if (subtitle != null) ...[const SizedBox(height: 2), Text(subtitle!, style: TextStyle(fontSize: 12, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted))],
              ]),
            ),
            if (trailing != null) trailing!,
          ]),
        ),
      ),
    );
  }
}
