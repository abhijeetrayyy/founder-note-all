import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/daily_plan.dart';
import '../models/goal.dart';
import '../models/habit.dart';
import '../models/journal_entry.dart';
import '../models/note.dart';
import '../models/project.dart';
import '../models/task.dart';
import '../models/tag.dart';
import '../models/goal_milestone.dart';
import '../models/focus_session.dart';
import '../models/energy_log.dart';
import 'database_service.dart';

/// Cloud sync bridge between the local SQLite database and Supabase.
///
/// Covers 14 tables: projects, notes, tasks, goals, habits, journal_entries,
/// daily_plans, tags, note_tags, task_tags, goal_milestones, focus_sessions,
/// energy_logs, reminders.
///
/// Strategy: `pullAll()` is meant to run once, right after sign-in, to seed
/// the local database from whatever already exists in the cloud (e.g. data
/// created from the web app). `syncAll()` (push) then runs periodically
/// afterwards to keep the cloud up to date with local changes. This isn't a
/// real conflict-resolution system — it's last-write-wins — but avoiding a
/// pull happening *after* fresh local edits keeps that from mattering in
/// practice for a single-session use pattern.
class SupabaseSyncService {
  static final SupabaseSyncService instance = SupabaseSyncService._();
  SupabaseSyncService._();

  SupabaseClient get _client => Supabase.instance.client;
  bool get _authenticated => _client.auth.currentUser != null;
  String? get _userId => _client.auth.currentUser?.id;

  Future<SyncResult> syncAll() async {
    if (!_authenticated || _userId == null) {
      return SyncResult(success: false, message: 'Not signed in');
    }

    final db = DatabaseService.instance;
    int upserted = 0;
    String? lastError;

    try {
      final projects = await db.getProjects();
      for (final p in projects) {
        await _upsert('projects', {
          'id': p.id,
          'user_id': _userId,
          'name': p.name,
          'description': p.description,
          'color': p.color,
          'icon_index': p.iconIndex,
          'updated_at': p.updatedAt.toIso8601String(),
        });
        upserted++;
      }

      final notes = await db.getNotes(includeArchived: true);
      for (final n in notes) {
        await _upsert('notes', {
          'id': n.id,
          'user_id': _userId,
          'title': n.title,
          'content': n.content,
          'category': n.category,
          'color': n.color,
          'project_id': n.projectId,
          'is_pinned': n.isPinned,
          'is_archived': n.isArchived,
          'is_locked': n.isLocked,
          'updated_at': n.updatedAt.toIso8601String(),
        });
        upserted++;
      }

      final tasks = await db.getTasks(includeCompleted: true);
      for (final t in tasks) {
        await _upsert('tasks', {
          'id': t.id,
          'user_id': _userId,
          'title': t.title,
          'description': t.description,
          'priority': t.priority,
          'completed': t.completed,
          'due_date': t.dueDate?.toIso8601String().split('T').first,
          'project_id': t.projectId,
          'parent_id': t.parentId,
          'recurrence': t.recurrence,
          'energy_level': t.energyLevel,
          'estimated_minutes': t.estimatedMinutes,
          'first_step': t.firstStep,
          'implementation_intention': t.implementationIntention,
          'is_inbox': t.isInbox,
          'updated_at': t.updatedAt.toIso8601String(),
        });
        upserted++;
      }

      final goals = await db.getGoals();
      for (final g in goals) {
        await _upsert('goals', {
          'id': g.id,
          'user_id': _userId,
          'title': g.title,
          'description': g.description,
          'color': g.color,
          'icon_index': g.iconIndex,
          'progress': g.progress,
          'archived': g.archived,
          'updated_at': g.updatedAt.toIso8601String(),
        });
        upserted++;
      }

      final habits = await db.getHabits();
      for (final h in habits) {
        await _upsert('habits', {
          'id': h.id,
          'user_id': _userId,
          'name': h.name,
          'color': h.color,
          'icon_index': h.iconIndex,
          'updated_at': DateTime.now().toIso8601String(),
        });
        upserted++;
      }

      final entries = await db.getJournalEntries();
      for (final e in entries) {
        await _upsert('journal_entries', {
          'id': e.id,
          'user_id': _userId,
          'content': e.content,
          'mood': e.mood,
          'entry_date': e.createdAt.toIso8601String().split('T').first,
          'updated_at': e.createdAt.toIso8601String(),
        });
        upserted++;
      }

      final plans = await db.getRecentDailyPlans(limit: 1000);
      for (final p in plans) {
        await _upsert('daily_plans', {
          'id': p.id,
          'user_id': _userId,
          'mit_task_ids': p.mitTaskIds,
          'intention_text': p.intentionText,
          'blocker_notes': p.blockerNotes,
          'morning_done': p.morningDone,
          'updated_at': p.updatedAt.toIso8601String(),
        });
        upserted++;
      }

      // Tags
      final tags = await db.getTags();
      for (final t in tags) {
        await _upsert('tags', {
          'id': t.id,
          'user_id': _userId,
          'name': t.name,
          'color': t.color,
          'updated_at': t.createdAt.toIso8601String(),
        });
        upserted++;
      }

      // Goal milestones
      final allGoals = await db.getGoals();
      for (final g in allGoals) {
        final milestones = await db.getMilestonesForGoal(g.id);
        for (final m in milestones) {
          await _upsert('goal_milestones', {
            'id': m.id,
            'goal_id': m.goalId,
            'user_id': _userId,
            'title': m.title,
            'is_completed': m.isCompleted,
            'completed_at': m.completedAt?.toIso8601String(),
          });
          upserted++;
        }
      }

      // Focus sessions
      final sessions = await db.getRecentFocusSessions();
      for (final s in sessions) {
        await _upsert('focus_sessions', {
          'id': s.id,
          'user_id': _userId,
          'mode': s.mode,
          'duration_minutes': s.durationMinutes,
          'completed': s.completed,
          'created_at': s.createdAt.toIso8601String(),
        });
        upserted++;
      }

      // Energy logs
      final energyLogs = await db.getRecentEnergyLogs();
      for (final e in energyLogs) {
        await _upsert('energy_logs', {
          'id': e.id,
          'user_id': _userId,
          'level': e.level,
          'note': e.note,
          'created_at': e.createdAt.toIso8601String(),
        });
        upserted++;
      }
    } catch (e) {
      lastError = e.toString();
    }

    return SyncResult(
      success: lastError == null,
      upsertedCount: upserted,
      message: lastError ?? 'Synced $upserted records',
    );
  }

  /// Pulls the 7 covered tables from Supabase into local SQLite. Meant to
  /// run once right after sign-in so a fresh install (or a second device)
  /// shows data that already exists in the cloud.
  Future<SyncResult> pullAll() async {
    if (!_authenticated || _userId == null) {
      return SyncResult(success: false, message: 'Not signed in');
    }

    final db = DatabaseService.instance;
    int pulled = 0;
    String? lastError;

    try {
      final projectRows = await _client.from('projects').select().eq('user_id', _userId as Object);
      for (final r in projectRows) {
        await db.insertProject(Project(
          id: r['id'] as String,
          name: r['name'] as String? ?? '',
          description: r['description'] as String? ?? '',
          color: _normalizeColor(r['color']),
          iconIndex: (r['icon_index'] as int?) ?? 0,
          createdAt: _parseDate(r['created_at']),
          updatedAt: _parseDate(r['updated_at']),
        ));
        pulled++;
      }

      final noteRows = await _client.from('notes').select().eq('user_id', _userId as Object);
      for (final r in noteRows) {
        await db.insertNote(Note(
          id: r['id'] as String,
          title: r['title'] as String? ?? '',
          content: r['content'] as String? ?? '',
          category: r['category'] as String? ?? 'General',
          color: _normalizeColor(r['color']),
          projectId: r['project_id'] as String?,
          createdAt: _parseDate(r['created_at']),
          updatedAt: _parseDate(r['updated_at']),
          isPinned: r['is_pinned'] as bool? ?? false,
          isArchived: r['is_archived'] as bool? ?? false,
          isLocked: r['is_locked'] as bool? ?? false,
        ));
        pulled++;
      }

      final taskRows = await _client.from('tasks').select().eq('user_id', _userId as Object);
      for (final r in taskRows) {
        await db.insertTask(Task(
          id: r['id'] as String,
          title: r['title'] as String? ?? '',
          description: r['description'] as String? ?? '',
          priority: (r['priority'] as int?) ?? 1,
          completed: r['completed'] as bool? ?? false,
          dueDate: r['due_date'] != null ? DateTime.parse(r['due_date'] as String) : null,
          projectId: r['project_id'] as String?,
          parentId: r['parent_id'] as String?,
          recurrence: (r['recurrence'] as int?) ?? 0,
          createdAt: _parseDate(r['created_at']),
          updatedAt: _parseDate(r['updated_at']),
          energyLevel: (r['energy_level'] as int?) ?? 1,
          estimatedMinutes: r['estimated_minutes'] as int?,
          firstStep: r['first_step'] as String? ?? '',
          implementationIntention: r['implementation_intention'] as String? ?? '',
          isInbox: r['is_inbox'] as bool? ?? false,
        ));
        pulled++;
      }

      final goalRows = await _client.from('goals').select().eq('user_id', _userId as Object);
      for (final r in goalRows) {
        await db.insertGoal(Goal(
          id: r['id'] as String,
          title: r['title'] as String? ?? '',
          description: r['description'] as String? ?? '',
          color: _normalizeColor(r['color']),
          iconIndex: (r['icon_index'] as int?) ?? 0,
          createdAt: _parseDate(r['created_at']),
          updatedAt: _parseDate(r['updated_at']),
          archived: r['archived'] as bool? ?? false,
          progress: ((r['progress'] as int?) ?? 0).clamp(0, 100),
        ));
        pulled++;
      }

      final habitRows = await _client.from('habits').select().eq('user_id', _userId as Object);
      for (final r in habitRows) {
        await db.insertHabit(Habit(
          id: r['id'] as String,
          name: r['name'] as String? ?? '',
          color: _normalizeColor(r['color']),
          iconIndex: (r['icon_index'] as int?) ?? 0,
          createdAt: _parseDate(r['created_at']),
        ));
        pulled++;
      }

      final journalRows = await _client.from('journal_entries').select().eq('user_id', _userId as Object);
      for (final r in journalRows) {
        await db.insertJournalEntry(JournalEntry(
          id: r['id'] as String,
          content: r['content'] as String? ?? '',
          mood: (r['mood'] as int?) ?? 1,
          createdAt: r['created_at'] != null ? _parseDate(r['created_at']) : DateTime.parse('${r['entry_date']}T00:00:00'),
        ));
        pulled++;
      }

      final planRows = await _client.from('daily_plans').select().eq('user_id', _userId as Object);
      for (final r in planRows) {
        final mitIds = (r['mit_task_ids'] as List?)?.cast<String>() ?? const <String>[];
        await db.upsertDailyPlan(DailyPlan(
          id: r['id'] as String,
          mitTaskIds: mitIds,
          intentionText: r['intention_text'] as String? ?? '',
          blockerNotes: r['blocker_notes'] as String? ?? '',
          morningDone: r['morning_done'] as bool? ?? false,
          createdAt: _parseDate(r['created_at']),
          updatedAt: _parseDate(r['updated_at']),
        ));
        pulled++;
      }

      // Tags
      final tagRows = await _client.from('tags').select().eq('user_id', _userId as Object);
      for (final r in tagRows) {
        await db.insertTag(Tag(
          id: r['id'] as String,
          name: r['name'] as String? ?? '',
          color: _normalizeColor(r['color']),
          createdAt: _parseDate(r['created_at']),
        ));
        pulled++;
      }

      // Goal milestones
      final milestoneRows = await _client.from('goal_milestones').select().eq('user_id', _userId as Object);
      for (final r in milestoneRows) {
        await db.insertMilestone(GoalMilestone(
          id: r['id'] as String,
          goalId: r['goal_id'] as String,
          title: r['title'] as String? ?? '',
          isCompleted: r['is_completed'] as bool? ?? false,
          completedAt: r['completed_at'] != null ? DateTime.parse(r['completed_at'] as String) : null,
        ));
        pulled++;
      }

      // Focus sessions
      final sessionRows = await _client.from('focus_sessions').select().eq('user_id', _userId as Object);
      for (final r in sessionRows) {
        await db.insertFocusSession(FocusSession(
          id: r['id'] as String,
          mode: r['mode'] as String? ?? 'pomodoro',
          durationMinutes: r['duration_minutes'] as int? ?? 25,
          completed: r['completed'] as bool? ?? true,
          createdAt: _parseDate(r['created_at']),
        ));
        pulled++;
      }

      // Energy logs
      final energyRows = await _client.from('energy_logs').select().eq('user_id', _userId as Object);
      for (final r in energyRows) {
        await db.insertEnergyLog(EnergyLog(
          id: r['id'] as String,
          level: r['level'] as int? ?? 1,
          note: r['note'] as String?,
          createdAt: _parseDate(r['created_at']),
        ));
        pulled++;
      }
    } catch (e) {
      lastError = e.toString();
    }

    return SyncResult(
      success: lastError == null,
      upsertedCount: pulled,
      message: lastError ?? 'Pulled $pulled records',
    );
  }

  DateTime _parseDate(dynamic v) => v != null ? DateTime.parse(v as String) : DateTime.now();

  /// The web app stores `color` as a small palette index (0-5, see
  /// founder-web/lib/constants.ts PROJECT_COLORS); the Flutter app stores a
  /// full opaque ARGB int (e.g. 0xFF5B4FE9). A raw index like `0` decoded
  /// straight into `Color(0)` renders fully transparent — invisible icons,
  /// invisible slider fills. Anything without the alpha byte set is treated
  /// as a web-style index and mapped through the same palette instead.
  static const List<int> _webPalette = [0xFF5B4FE9, 0xFF14B8A6, 0xFFF59E0B, 0xFFEF4444, 0xFF7C3AED, 0xFF3B82F6];

  int _normalizeColor(dynamic raw, {int fallback = 0xFF6C63FF}) {
    if (raw is! int) return fallback;
    if (raw >= 0x1000000) return raw;
    return _webPalette[raw.abs() % _webPalette.length];
  }

  Future<void> _upsert(String table, Map<String, dynamic> data) async {
    await _client.from(table).upsert(data);
  }
}

class SyncResult {
  final bool success;
  final int upsertedCount;
  final String message;
  SyncResult({required this.success, this.upsertedCount = 0, required this.message});
}
