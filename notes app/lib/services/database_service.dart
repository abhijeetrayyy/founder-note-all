import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/note.dart';
import '../models/task.dart';
import '../models/project.dart';
import '../models/reminder.dart';
import '../models/journal_entry.dart';
import '../models/tag.dart';
import '../models/habit.dart';
import '../models/daily_plan.dart';
import '../models/goal.dart';
import '../models/goal_milestone.dart';
import '../models/focus_session.dart';
import '../models/energy_log.dart';

class DatabaseService {
  static Database? _database;
  static final DatabaseService instance = DatabaseService._();

  DatabaseService._();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'notes_app.db');

    return await openDatabase(path, version: 11, onCreate: _onCreate, onUpgrade: _onUpgrade);
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE notes (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT 'General', color INTEGER NOT NULL DEFAULT 0xFF6C63FF,
        projectId TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
        isPinned INTEGER NOT NULL DEFAULT 0, isArchived INTEGER NOT NULL DEFAULT 0,
        isLocked INTEGER NOT NULL DEFAULT 0
      )
    ''');
    await db.execute('''
      CREATE TABLE tasks (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
        priority INTEGER NOT NULL DEFAULT 1, completed INTEGER NOT NULL DEFAULT 0,
        dueDate TEXT, projectId TEXT, parentId TEXT, recurrence INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
        energyLevel INTEGER NOT NULL DEFAULT 1,
        estimatedMinutes INTEGER,
        firstStep TEXT NOT NULL DEFAULT '',
        implementationIntention TEXT NOT NULL DEFAULT '',
        isInbox INTEGER NOT NULL DEFAULT 1
      )
    ''');
    await db.execute('''
      CREATE TABLE projects (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
        color INTEGER NOT NULL DEFAULT 0xFF6C63FF, iconIndex INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
      )
    ''');
    await db.execute('CREATE INDEX idx_notes_pinned ON notes(isPinned)');
    await db.execute('CREATE INDEX idx_notes_archived ON notes(isArchived)');
    await db.execute('CREATE INDEX idx_notes_project ON notes(projectId)');
    await db.execute('CREATE INDEX idx_tasks_completed ON tasks(completed)');
    await db.execute('CREATE INDEX idx_tasks_due ON tasks(dueDate)');
    await db.execute('CREATE INDEX idx_tasks_project ON tasks(projectId)');

    await db.execute('CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts4(content="notes", title, content)');
    _createFtsTriggers(db, 'notes', 'notes_fts');
    await db.execute('CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts USING fts4(content="tasks", title, description)');
    _createFtsTriggers(db, 'tasks', 'tasks_fts');
    await db.execute('''
      CREATE TABLE reminders (
        id TEXT PRIMARY KEY, taskId TEXT NOT NULL,
        taskTitle TEXT NOT NULL DEFAULT '',
        remindAt TEXT NOT NULL, notified INTEGER NOT NULL DEFAULT 0
      )
    ''');
    await db.execute('CREATE INDEX idx_reminders_task ON reminders(taskId)');
    await db.execute('CREATE INDEX idx_reminders_time ON reminders(remindAt)');

    await db.execute('CREATE TABLE journal_entries (id TEXT PRIMARY KEY, content TEXT NOT NULL, mood INTEGER NOT NULL DEFAULT 1, createdAt TEXT NOT NULL)');
    await db.execute('CREATE INDEX idx_journal_date ON journal_entries(createdAt DESC)');

    await db.execute('CREATE TABLE tags (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, color INTEGER NOT NULL DEFAULT 0xFF6C63FF, createdAt TEXT NOT NULL)');
    await db.execute('CREATE TABLE note_tags (noteId TEXT NOT NULL, tagId TEXT NOT NULL, PRIMARY KEY(noteId, tagId))');
    await db.execute('CREATE TABLE task_tags (taskId TEXT NOT NULL, tagId TEXT NOT NULL, PRIMARY KEY(taskId, tagId))');

    await db.execute('CREATE TABLE habits (id TEXT PRIMARY KEY, name TEXT NOT NULL, color INTEGER NOT NULL DEFAULT 0xFF6C63FF, iconIndex INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL)');
    await db.execute('CREATE TABLE habit_logs (id TEXT PRIMARY KEY, habitId TEXT NOT NULL, date TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0)');
    await db.execute('CREATE INDEX idx_hl_habit ON habit_logs(habitId, date)');

    await db.execute('''
      CREATE TABLE daily_plans (
        id TEXT PRIMARY KEY,
        mitTaskIds TEXT NOT NULL DEFAULT '',
        intentionText TEXT NOT NULL DEFAULT '',
        blockerNotes TEXT NOT NULL DEFAULT '',
        morningDone INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        color INTEGER NOT NULL DEFAULT 0xFF6C63FF,
        iconIndex INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        archived INTEGER NOT NULL DEFAULT 0,
        progress INTEGER NOT NULL DEFAULT 0
      )
    ''');

    await db.execute('''
      CREATE TABLE goal_milestones (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL,
        title TEXT NOT NULL,
        is_completed INTEGER NOT NULL DEFAULT 0,
        completed_at TEXT
      )
    ''');
    await db.execute('CREATE INDEX idx_gm_goal ON goal_milestones(goal_id)');

    await db.execute('''
      CREATE TABLE focus_sessions (
        id TEXT PRIMARY KEY,
        mode TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        completed INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      )
    ''');
    await db.execute('CREATE INDEX idx_fs_date ON focus_sessions(created_at DESC)');

    await db.execute('''
      CREATE TABLE energy_logs (
        id TEXT PRIMARY KEY,
        level INTEGER NOT NULL DEFAULT 1,
        note TEXT,
        created_at TEXT NOT NULL
      )
    ''');
    await db.execute('CREATE INDEX idx_el_date ON energy_logs(created_at DESC)');
  }

  void _createFtsTriggers(Database db, String table, String fts) {
    final col = table == 'tasks' ? 'description' : 'content';
    db.execute('CREATE TRIGGER IF NOT EXISTS ${fts}_insert AFTER INSERT ON $table BEGIN INSERT INTO $fts(docid, title, $col) VALUES (new.rowid, new.title, new.$col); END');
    db.execute('CREATE TRIGGER IF NOT EXISTS ${fts}_delete AFTER DELETE ON $table BEGIN DELETE FROM $fts WHERE docid = old.rowid; END');
    db.execute('CREATE TRIGGER IF NOT EXISTS ${fts}_update AFTER UPDATE ON $table BEGIN DELETE FROM $fts WHERE docid = old.rowid; INSERT INTO $fts(docid, title, $col) VALUES (new.rowid, new.title, new.$col); END');
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      try { await db.execute('ALTER TABLE notes ADD COLUMN isLocked INTEGER NOT NULL DEFAULT 0'); } catch (_) {}
    }
    if (oldVersion < 3) {
      try { await db.execute('ALTER TABLE notes ADD COLUMN projectId TEXT'); } catch (_) {}
      await db.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
          priority INTEGER NOT NULL DEFAULT 1, completed INTEGER NOT NULL DEFAULT 0,
          dueDate TEXT, projectId TEXT, parentId TEXT, recurrence INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
        )
      ''');
      await db.execute('''
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
          color INTEGER NOT NULL DEFAULT 0xFF6C63FF, iconIndex INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
        )
      ''');
      await db.execute('CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(projectId)');
      await db.execute('CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)');
      await db.execute('CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(dueDate)');
      await db.execute('CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(projectId)');
      await db.execute('CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts4(content="notes", title, content)');
      _createFtsTriggers(db, 'notes', 'notes_fts');
      await db.execute('CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts USING fts4(content="tasks", title, description)');
      _createFtsTriggers(db, 'tasks', 'tasks_fts');
    }
    if (oldVersion < 4) {
      try { await db.execute('ALTER TABLE tasks ADD COLUMN parentId TEXT'); } catch (_) {}
      try { await db.execute('ALTER TABLE tasks ADD COLUMN recurrence INTEGER NOT NULL DEFAULT 0'); } catch (_) {}
      await db.execute('''
        CREATE TABLE IF NOT EXISTS reminders (
          id TEXT PRIMARY KEY, taskId TEXT NOT NULL,
          taskTitle TEXT NOT NULL DEFAULT '',
          remindAt TEXT NOT NULL, notified INTEGER NOT NULL DEFAULT 0
        )
      ''');
      await db.execute('CREATE INDEX IF NOT EXISTS idx_reminders_task ON reminders(taskId)');
      await db.execute('CREATE INDEX IF NOT EXISTS idx_reminders_time ON reminders(remindAt)');
    }
    if (oldVersion < 5) {
      await db.execute('CREATE TABLE IF NOT EXISTS journal_entries (id TEXT PRIMARY KEY, content TEXT NOT NULL, mood INTEGER NOT NULL DEFAULT 1, createdAt TEXT NOT NULL)');
      await db.execute('CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(createdAt DESC)');
      await db.execute('CREATE TABLE IF NOT EXISTS tags (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, color INTEGER NOT NULL DEFAULT 0xFF6C63FF, createdAt TEXT NOT NULL)');
      await db.execute('CREATE TABLE IF NOT EXISTS note_tags (noteId TEXT NOT NULL, tagId TEXT NOT NULL, PRIMARY KEY(noteId, tagId))');
      await db.execute('CREATE TABLE IF NOT EXISTS task_tags (taskId TEXT NOT NULL, tagId TEXT NOT NULL, PRIMARY KEY(taskId, tagId))');
      await db.execute('CREATE TABLE IF NOT EXISTS habits (id TEXT PRIMARY KEY, name TEXT NOT NULL, color INTEGER NOT NULL DEFAULT 0xFF6C63FF, iconIndex INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL)');
      await db.execute('CREATE TABLE IF NOT EXISTS habit_logs (id TEXT PRIMARY KEY, habitId TEXT NOT NULL, date TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0)');
      await db.execute('CREATE INDEX IF NOT EXISTS idx_hl_habit ON habit_logs(habitId, date)');
    }
    if (oldVersion < 6) {
      try { await db.execute('ALTER TABLE reminders ADD COLUMN taskTitle TEXT NOT NULL DEFAULT ""'); } catch (_) {}
    }
    if (oldVersion < 7) {
      try { await db.execute('ALTER TABLE tasks ADD COLUMN energyLevel INTEGER NOT NULL DEFAULT 1'); } catch (_) {}
      try { await db.execute('ALTER TABLE tasks ADD COLUMN estimatedMinutes INTEGER'); } catch (_) {}
      try { await db.execute('ALTER TABLE tasks ADD COLUMN firstStep TEXT NOT NULL DEFAULT ""'); } catch (_) {}
      try { await db.execute('ALTER TABLE tasks ADD COLUMN implementationIntention TEXT NOT NULL DEFAULT ""'); } catch (_) {}
      try { await db.execute('ALTER TABLE tasks ADD COLUMN isInbox INTEGER NOT NULL DEFAULT 1'); } catch (_) {}
      await db.execute('''
        CREATE TABLE IF NOT EXISTS daily_plans (
          id TEXT PRIMARY KEY,
          mitTaskIds TEXT NOT NULL DEFAULT '',
          intentionText TEXT NOT NULL DEFAULT '',
          blockerNotes TEXT NOT NULL DEFAULT '',
          morningDone INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      ''');
    }
    if (oldVersion < 8) {
      await db.execute('''
        CREATE TABLE IF NOT EXISTS goals (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          color INTEGER NOT NULL DEFAULT 0xFF6C63FF,
          iconIndex INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          archived INTEGER NOT NULL DEFAULT 0
        )
      ''');
    }
    if (oldVersion < 9) {
      try { await db.execute('ALTER TABLE goals ADD COLUMN progress INTEGER NOT NULL DEFAULT 0'); } catch (_) {}
    }
    if (oldVersion < 10) {
      await db.execute('''
        CREATE TABLE IF NOT EXISTS goal_milestones (
          id TEXT PRIMARY KEY,
          goal_id TEXT NOT NULL,
          title TEXT NOT NULL,
          is_completed INTEGER NOT NULL DEFAULT 0,
          completed_at TEXT
        )
      ''');
      await db.execute('CREATE INDEX IF NOT EXISTS idx_gm_goal ON goal_milestones(goal_id)');
    }
    if (oldVersion < 11) {
      await db.execute('''
        CREATE TABLE IF NOT EXISTS focus_sessions (
          id TEXT PRIMARY KEY,
          mode TEXT NOT NULL,
          duration_minutes INTEGER NOT NULL,
          completed INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL
        )
      ''');
      await db.execute('CREATE INDEX IF NOT EXISTS idx_fs_date ON focus_sessions(created_at DESC)');
      await db.execute('''
        CREATE TABLE IF NOT EXISTS energy_logs (
          id TEXT PRIMARY KEY,
          level INTEGER NOT NULL DEFAULT 1,
          note TEXT,
          created_at TEXT NOT NULL
        )
      ''');
      await db.execute('CREATE INDEX IF NOT EXISTS idx_el_date ON energy_logs(created_at DESC)');
    }
  }

  Future<void> rebuildFts() async {
    final db = await database;
    await db.execute('DELETE FROM notes_fts');
    await db.execute('DELETE FROM tasks_fts');
    final notes = await db.query('notes');
    for (final n in notes) {
      await db.rawInsert('INSERT INTO notes_fts(docid, title, content) VALUES (?, ?, ?)',
          [n['rowid'], n['title'], n['content']]);
    }
    final tasks = await db.query('tasks');
    for (final t in tasks) {
      await db.rawInsert('INSERT INTO tasks_fts(docid, title, description) VALUES (?, ?, ?)',
          [t['rowid'], t['title'], t['description']]);
    }
  }

  // ── Notes ──
  Future<List<Note>> getNotes({bool includeArchived = false, String? projectId}) async {
    final db = await database;
    final conditions = <String>[];
    final args = <dynamic>[];
    if (!includeArchived) conditions.add('isArchived = 0');
    if (projectId != null) { conditions.add('projectId = ?'); args.add(projectId); }
    final where = conditions.isEmpty ? null : conditions.join(' AND ');
    final maps = await db.query('notes', where: where, whereArgs: args.isNotEmpty ? args : null, orderBy: 'isPinned DESC, updatedAt DESC');
    return maps.map((m) => Note.fromMap(m)).toList();
  }

  Future<List<Note>> getArchivedNotes() async {
    final db = await database;
    final maps = await db.query('notes', where: 'isArchived = 1', orderBy: 'updatedAt DESC');
    return maps.map((m) => Note.fromMap(m)).toList();
  }

  Future<List<Note>> getRecentNotes({int limit = 5}) async {
    final db = await database;
    final maps = await db.query('notes', where: 'isArchived = 0', orderBy: 'updatedAt DESC', limit: limit);
    return maps.map((m) => Note.fromMap(m)).toList();
  }

  Future<List<Note>> searchNotes(String query) async {
    final db = await database;
    final maps = await db.rawQuery(
      'SELECT notes.* FROM notes JOIN notes_fts ON notes.rowid = notes_fts.docid '
      'WHERE notes_fts MATCH ? AND notes.isArchived = 0 ORDER BY notes.isPinned DESC, notes.updatedAt DESC',
      [query],
    );
    return maps.map((m) => Note.fromMap(m)).toList();
  }

  Future<Note?> getNote(String id) async {
    final db = await database;
    final maps = await db.query('notes', where: 'id = ?', whereArgs: [id]);
    return maps.isEmpty ? null : Note.fromMap(maps.first);
  }

  Future<void> insertNote(Note note) async {
    final db = await database;
    await db.insert('notes', note.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> updateNote(Note note) async {
    final db = await database;
    await db.update('notes', note.toMap(), where: 'id = ?', whereArgs: [note.id]);
  }

  Future<void> deleteNote(String id) async {
    final db = await database;
    await db.delete('notes', where: 'id = ?', whereArgs: [id]);
  }

  // ── Tasks ──
  Future<List<Task>> getTasks({bool includeCompleted = false, String? projectId}) async {
    final db = await database;
    final conditions = <String>[];
    final args = <dynamic>[];
    if (!includeCompleted) conditions.add('completed = 0');
    if (projectId != null) { conditions.add('projectId = ?'); args.add(projectId); }
    final where = conditions.isEmpty ? null : conditions.join(' AND ');
    final maps = await db.query('tasks',
        where: where, whereArgs: args.isNotEmpty ? args : null,
        orderBy: 'priority DESC, dueDate ASC NULLS LAST, createdAt DESC');
    return maps.map((m) => Task.fromMap(m)).toList();
  }

  Future<List<Task>> getTodayTasks() async {
    final db = await database;
    final today = DateTime.now().toIso8601String().substring(0, 10);
    final maps = await db.query('tasks',
        where: 'completed = 0 AND (dueDate LIKE ? OR dueDate IS NULL)',
        whereArgs: ['$today%'],
        orderBy: 'priority DESC, createdAt DESC');
    return maps.map((m) => Task.fromMap(m)).toList();
  }

  Future<List<Task>> getProjectTasks(String projectId) async {
    final db = await database;
    final maps = await db.query('tasks',
        where: 'projectId = ? AND completed = 0', whereArgs: [projectId],
        orderBy: 'priority DESC, dueDate ASC NULLS LAST');
    return maps.map((m) => Task.fromMap(m)).toList();
  }

  Future<List<Task>> searchTasks(String query) async {
    final db = await database;
    final maps = await db.rawQuery(
      'SELECT tasks.* FROM tasks JOIN tasks_fts ON tasks.rowid = tasks_fts.docid '
      'WHERE tasks_fts MATCH ? ORDER BY tasks.priority DESC, tasks.createdAt DESC',
      [query],
    );
    return maps.map((m) => Task.fromMap(m)).toList();
  }

  Future<void> insertTask(Task task) async {
    final db = await database;
    await db.insert('tasks', task.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> updateTask(Task task) async {
    final db = await database;
    await db.update('tasks', task.toMap(), where: 'id = ?', whereArgs: [task.id]);
  }

  Future<void> deleteTask(String id) async {
    final db = await database;
    await db.delete('tasks', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> toggleTaskComplete(String id, bool completed) async {
    final db = await database;
    await db.update('tasks',
        {'completed': completed ? 1 : 0, 'updatedAt': DateTime.now().toIso8601String()},
        where: 'id = ?', whereArgs: [id]);
  }

  Future<int> getTaskCount({bool onlyActive = true}) async {
    final db = await database;
    final result = await db.rawQuery(
      'SELECT COUNT(*) as count FROM tasks${onlyActive ? " WHERE completed = 0" : ""}',
    );
    return Sqflite.firstIntValue(result) ?? 0;
  }

  Future<List<Task>> getSubtasks(String parentId) async {
    final db = await database;
    final maps = await db.query('tasks', where: 'parentId = ?', whereArgs: [parentId], orderBy: 'createdAt ASC');
    return maps.map((m) => Task.fromMap(m)).toList();
  }

  Future<Map<String, List<Task>>> getSubtasksForParents(List<String> parentIds) async {
    if (parentIds.isEmpty) return {};
    final db = await database;
    final placeholders = List.filled(parentIds.length, '?').join(',');
    final maps = await db.query('tasks', where: 'parentId IN ($placeholders)', whereArgs: parentIds, orderBy: 'createdAt ASC');
    final grouped = <String, List<Task>>{for (final id in parentIds) id: []};
    for (final m in maps) {
      final t = Task.fromMap(m);
      final pid = m['parentId'] as String;
      grouped.putIfAbsent(pid, () => []).add(t);
    }
    return grouped;
  }

  Future<void> deleteSubtasks(String parentId) async {
    final db = await database;
    await db.delete('tasks', where: 'parentId = ?', whereArgs: [parentId]);
  }

  // ── Reminders ──
  Future<List<Reminder>> getReminders() async {
    final db = await database;
    final maps = await db.query('reminders', orderBy: 'remindAt ASC');
    return maps.map((m) => Reminder.fromMap(m)).toList();
  }

  Future<List<Reminder>> getPendingReminders() async {
    final db = await database;
    final now = DateTime.now().toIso8601String();
    final maps = await db.query('reminders', where: 'notified = 0 AND remindAt <= ?', whereArgs: [now]);
    return maps.map((m) => Reminder.fromMap(m)).toList();
  }

  Future<Reminder?> getReminderForTask(String taskId) async {
    final db = await database;
    final maps = await db.query('reminders', where: 'taskId = ?', whereArgs: [taskId]);
    return maps.isEmpty ? null : Reminder.fromMap(maps.first);
  }

  Future<void> insertReminder(Reminder r) async {
    final db = await database;
    await db.insert('reminders', r.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> deleteReminder(String id) async {
    final db = await database;
    await db.delete('reminders', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> deleteReminderForTask(String taskId) async {
    final db = await database;
    await db.delete('reminders', where: 'taskId = ?', whereArgs: [taskId]);
  }

  Future<void> markReminderNotified(String id) async {
    final db = await database;
    await db.update('reminders', {'notified': 1}, where: 'id = ?', whereArgs: [id]);
  }
  Future<List<Project>> getProjects() async {
    final db = await database;
    final maps = await db.query('projects', orderBy: 'name ASC');
    return maps.map((m) => Project.fromMap(m)).toList();
  }

  Future<Project?> getProject(String id) async {
    final db = await database;
    final maps = await db.query('projects', where: 'id = ?', whereArgs: [id]);
    return maps.isEmpty ? null : Project.fromMap(maps.first);
  }

  Future<void> insertProject(Project project) async {
    final db = await database;
    await db.insert('projects', project.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> updateProject(Project project) async {
    final db = await database;
    await db.update('projects', project.toMap(), where: 'id = ?', whereArgs: [project.id]);
  }

  Future<void> deleteProject(String id) async {
    final db = await database;
    await db.delete('projects', where: 'id = ?', whereArgs: [id]);
    await db.update('notes', {'projectId': null}, where: 'projectId = ?', whereArgs: [id]);
    await db.update('tasks', {'projectId': null}, where: 'projectId = ?', whereArgs: [id]);
  }

  // ── Dashboard ──
  Future<Map<String, int>> getDashboardCounts() async {
    final db = await database;
    final active = await db.rawQuery('SELECT COUNT(*) as c FROM tasks WHERE completed = 0');
    final due = await db.rawQuery('SELECT COUNT(*) as c FROM tasks WHERE completed = 0 AND dueDate IS NOT NULL');
    final notes = await db.rawQuery('SELECT COUNT(*) as c FROM notes WHERE isArchived = 0');
    return {
      'activeTasks': Sqflite.firstIntValue(active) ?? 0,
      'dueTasks': Sqflite.firstIntValue(due) ?? 0,
      'activeNotes': Sqflite.firstIntValue(notes) ?? 0,
    };
  }

  // ── Journal ──
  Future<List<JournalEntry>> getJournalEntries() async {
    final db = await database;
    final maps = await db.query('journal_entries', orderBy: 'createdAt DESC');
    return maps.map((m) => JournalEntry.fromMap(m)).toList();
  }

  Future<JournalEntry?> getJournalEntryForDate(String datePrefix) async {
    final db = await database;
    final maps = await db.query('journal_entries', where: 'createdAt LIKE ?', whereArgs: ['$datePrefix%'], limit: 1);
    return maps.isEmpty ? null : JournalEntry.fromMap(maps.first);
  }

  Future<void> insertJournalEntry(JournalEntry e) async {
    final db = await database;
    await db.insert('journal_entries', e.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<int> getJournalStreak() async {
    final db = await database;
    int streak = 0;
    final today = DateTime.now();
    for (int i = 0; i < 365; i++) {
      final d = today.subtract(Duration(days: i)).toIso8601String().substring(0, 10);
      final r = await db.rawQuery('SELECT COUNT(*) as c FROM journal_entries WHERE createdAt LIKE ?', ['$d%']);
      if ((Sqflite.firstIntValue(r) ?? 0) > 0) { streak++; } else { break; }
    }
    return streak;
  }

  // ── Tags ──
  Future<List<Tag>> getTags() async {
    final db = await database;
    final maps = await db.query('tags', orderBy: 'name ASC');
    return maps.map((m) => Tag.fromMap(m)).toList();
  }

  Future<void> insertTag(Tag t) async {
    final db = await database;
    await db.insert('tags', t.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> deleteTag(String id) async {
    final db = await database;
    await db.delete('tags', where: 'id = ?', whereArgs: [id]);
    await db.delete('note_tags', where: 'tagId = ?', whereArgs: [id]);
    await db.delete('task_tags', where: 'tagId = ?', whereArgs: [id]);
  }

  Future<List<Tag>> getTagsForNote(String noteId) async {
    final db = await database;
    final maps = await db.rawQuery('SELECT t.* FROM tags t JOIN note_tags nt ON t.id = nt.tagId WHERE nt.noteId = ?', [noteId]);
    return maps.map((m) => Tag.fromMap(m)).toList();
  }

  Future<List<Tag>> getTagsForTask(String taskId) async {
    final db = await database;
    final maps = await db.rawQuery('SELECT t.* FROM tags t JOIN task_tags tt ON t.id = tt.tagId WHERE tt.taskId = ?', [taskId]);
    return maps.map((m) => Tag.fromMap(m)).toList();
  }

  Future<void> setNoteTags(String noteId, List<String> tagIds) async {
    final db = await database;
    await db.delete('note_tags', where: 'noteId = ?', whereArgs: [noteId]);
    for (final tid in tagIds) { await db.insert('note_tags', {'noteId': noteId, 'tagId': tid}); }
  }

  Future<void> setTaskTags(String taskId, List<String> tagIds) async {
    final db = await database;
    await db.delete('task_tags', where: 'taskId = ?', whereArgs: [taskId]);
    for (final tid in tagIds) { await db.insert('task_tags', {'taskId': taskId, 'tagId': tid}); }
  }

  Future<Map<String, int>> getTagCounts() async {
    final db = await database;
    final maps = await db.rawQuery('SELECT t.id, t.name, t.color, (SELECT COUNT(*) FROM note_tags nt WHERE nt.tagId = t.id) + (SELECT COUNT(*) FROM task_tags tt WHERE tt.tagId = t.id) as cnt FROM tags t ORDER BY cnt DESC');
    final res = <String, int>{};
    for (final m in maps) { res[m['id'] as String] = (m['cnt'] as int?) ?? 0; }
    return res;
  }

  // ── Habits ──
  Future<List<Habit>> getHabits() async {
    final db = await database;
    final maps = await db.query('habits', orderBy: 'name ASC');
    return maps.map((m) => Habit.fromMap(m)).toList();
  }

  Future<void> insertHabit(Habit h) async {
    final db = await database;
    await db.insert('habits', h.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> deleteHabit(String id) async {
    final db = await database;
    await db.delete('habits', where: 'id = ?', whereArgs: [id]);
    await db.delete('habit_logs', where: 'habitId = ?', whereArgs: [id]);
  }

  Future<Map<String, bool>> getTodayHabitStatus() async {
    final db = await database;
    final today = DateTime.now().toIso8601String().substring(0, 10);
    final maps = await db.query('habit_logs', where: 'date = ?', whereArgs: [today]);
    final res = <String, bool>{};
    for (final m in maps) { res[m['habitId'] as String] = (m['done'] as int?) == 1; }
    return res;
  }

  Future<void> toggleHabitDone(String habitId, bool done) async {
    final db = await database;
    final today = DateTime.now().toIso8601String().substring(0, 10);
    final existing = await db.query('habit_logs', where: 'habitId = ? AND date = ?', whereArgs: [habitId, today]);
    if (existing.isEmpty && done) {
      await db.insert('habit_logs', {'id': '${habitId}_$today', 'habitId': habitId, 'date': today, 'done': 1});
    } else if (!done) {
      await db.delete('habit_logs', where: 'habitId = ? AND date = ?', whereArgs: [habitId, today]);
    } else {
      await db.update('habit_logs', {'done': done ? 1 : 0}, where: 'habitId = ? AND date = ?', whereArgs: [habitId, today]);
    }
  }

  // ── Daily Plans ──
  Future<DailyPlan?> getDailyPlan(String dateId) async {
    final db = await database;
    final maps = await db.query('daily_plans', where: 'id = ?', whereArgs: [dateId]);
    return maps.isEmpty ? null : DailyPlan.fromMap(maps.first);
  }

  Future<void> upsertDailyPlan(DailyPlan plan) async {
    final db = await database;
    await db.insert('daily_plans', plan.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<DailyPlan>> getRecentDailyPlans({int limit = 7}) async {
    final db = await database;
    final maps = await db.query('daily_plans', orderBy: 'id DESC', limit: limit);
    return maps.map((m) => DailyPlan.fromMap(m)).toList();
  }

  // ── Goals ──
  Future<List<Goal>> getGoals() async {
    final db = await database;
    final maps = await db.query('goals', orderBy: 'updatedAt DESC');
    return maps.map((m) => Goal.fromMap(m)).toList();
  }

  Future<void> insertGoal(Goal g) async {
    final db = await database;
    await db.insert('goals', g.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> updateGoal(Goal g) async {
    final db = await database;
    await db.update('goals', g.toMap(), where: 'id = ?', whereArgs: [g.id]);
  }

  Future<void> deleteGoal(String id) async {
    final db = await database;
    await db.delete('goals', where: 'id = ?', whereArgs: [id]);
    await db.delete('goal_milestones', where: 'goal_id = ?', whereArgs: [id]);
  }

  // ── Goal Milestones ──
  Future<List<GoalMilestone>> getMilestonesForGoal(String goalId) async {
    final db = await database;
    final maps = await db.query('goal_milestones', where: 'goal_id = ?', whereArgs: [goalId], orderBy: 'title ASC');
    return maps.map((m) => GoalMilestone.fromMap(m)).toList();
  }

  Future<void> insertMilestone(GoalMilestone m) async {
    final db = await database;
    await db.insert('goal_milestones', m.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> toggleMilestone(String id, bool completed) async {
    final db = await database;
    await db.update('goal_milestones', {
      'is_completed': completed ? 1 : 0,
      'completed_at': completed ? DateTime.now().toIso8601String() : null,
    }, where: 'id = ?', whereArgs: [id]);
  }

  Future<void> deleteMilestone(String id) async {
    final db = await database;
    await db.delete('goal_milestones', where: 'id = ?', whereArgs: [id]);
  }

  // ── Focus Sessions ──
  Future<void> insertFocusSession(FocusSession s) async {
    final db = await database;
    await db.insert('focus_sessions', s.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<int> getTodayFocusCount() async {
    final db = await database;
    final today = DateTime.now().toIso8601String().substring(0, 10);
    final r = await db.rawQuery('SELECT COUNT(*) as c FROM focus_sessions WHERE created_at LIKE ? AND completed = 1', ['$today%']);
    return Sqflite.firstIntValue(r) ?? 0;
  }

  Future<List<FocusSession>> getRecentFocusSessions({int limit = 20}) async {
    final db = await database;
    final maps = await db.query('focus_sessions', orderBy: 'created_at DESC', limit: limit);
    return maps.map((m) => FocusSession.fromMap(m)).toList();
  }

  // ── Energy Logs ──
  Future<void> insertEnergyLog(EnergyLog e) async {
    final db = await database;
    await db.insert('energy_logs', e.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<EnergyLog?> getTodayEnergyLog() async {
    final db = await database;
    final today = DateTime.now().toIso8601String().substring(0, 10);
    final maps = await db.query('energy_logs', where: 'created_at LIKE ?', whereArgs: ['$today%'], limit: 1);
    return maps.isEmpty ? null : EnergyLog.fromMap(maps.first);
  }

  Future<List<EnergyLog>> getRecentEnergyLogs({int limit = 7}) async {
    final db = await database;
    final maps = await db.query('energy_logs', orderBy: 'created_at DESC', limit: limit);
    return maps.map((m) => EnergyLog.fromMap(m)).toList();
  }
}
