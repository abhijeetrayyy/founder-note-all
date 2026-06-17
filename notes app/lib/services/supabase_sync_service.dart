

import 'package:supabase_flutter/supabase_flutter.dart';
import 'database_service.dart';

/// Cloud sync bridge between the local SQLite database and Supabase.
/// Currently pushes local data to the cloud. Pull sync can be added later.
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
      // Projects
      final projects = await db.getProjects();
      for (final p in projects) {
        await _upsert('projects', p.id, {
          'id': p.id,
          'user_id': _userId,
          'name': p.name,
          'description': p.description,
          'color': p.color,
          'icon_index': p.iconIndex,
          'archived': false,
          'updated_at': p.updatedAt.toIso8601String(),
        });
        upserted++;
      }

      // Notes
      final notes = await db.getNotes(includeArchived: true);
      for (final n in notes) {
        await _upsert('notes', n.id, {
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

      // Tasks
      final tasks = await db.getTasks(includeCompleted: true);
      for (final t in tasks) {
        await _upsert('tasks', t.id, {
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

      // Goals
      final goals = await db.getGoals();
      for (final g in goals) {
        await _upsert('goals', g.id, {
          'id': g.id,
          'user_id': _userId,
          'title': g.title,
          'description': g.description,
          'color': g.color,
          'icon_index': g.iconIndex,
          'target_date': null,
          'progress': 0,
          'archived': g.archived,
          'updated_at': g.updatedAt.toIso8601String(),
        });
        upserted++;
      }

      // Habits
      final habits = await db.getHabits();
      for (final h in habits) {
        await _upsert('habits', h.id, {
          'id': h.id,
          'user_id': _userId,
          'name': h.name,
          'description': '',
          'color': h.color,
          'icon_index': h.iconIndex,
          'target_per_day': 1,
          'archived': false,
          'updated_at': h.createdAt.toIso8601String(),
        });
        upserted++;
      }

      // Journal entries
      final entries = await db.getJournalEntries();
      for (final e in entries) {
        await _upsert('journal_entries', e.id, {
          'id': e.id,
          'user_id': _userId,
          'content': e.content,
          'mood': e.mood,
          'entry_date': e.createdAt.toIso8601String().split('T').first,
          'updated_at': e.createdAt.toIso8601String(),
        });
        upserted++;
      }

      // Daily plans
      final plans = await db.getRecentDailyPlans(limit: 1000);
      for (final p in plans) {
        await _upsert('daily_plans', p.id, {
          'id': p.id,
          'user_id': _userId,
          'mit_task_ids': p.mitTaskIds,
          'intention_text': p.intentionText,
          'blocker_notes': p.blockerNotes,
          'morning_done': p.morningDone,
          'reflection_text': '',
          'energy_level': null,
          'updated_at': p.updatedAt.toIso8601String(),
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

  Future<void> _upsert(String table, String id, Map<String, dynamic> data) async {
    await _client.from(table).upsert(data);
  }
}

class SyncResult {
  final bool success;
  final int upsertedCount;
  final String message;
  SyncResult({required this.success, this.upsertedCount = 0, required this.message});
}
