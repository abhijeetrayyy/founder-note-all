import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../models/task.dart';
import '../services/database_service.dart';
import 'reminder_provider.dart';

class TasksProvider extends ChangeNotifier {
  final DatabaseService _db = DatabaseService.instance;
  final Uuid _uuid = const Uuid();
  List<Task> _tasks = [];
  String _search = '';
  Map<String, List<Task>> _subtasks = {};

  List<Task> get tasks => _search.isEmpty ? _tasks : _tasks.where((t) => t.title.toLowerCase().contains(_search.toLowerCase()) || t.description.toLowerCase().contains(_search.toLowerCase())).toList();
  List<Task> get active => _tasks.where((t) => !t.completed && !t.isSubtask).toList();
  List<Task> get todayTasks => active.where((t) => t.dueDate == null || t.dueDate!.toIso8601String().substring(0, 10) == DateTime.now().toIso8601String().substring(0, 10)).toList();
  String get search => _search;
  int get activeCount => active.length;

  Future<void> load() async {
    _tasks = await _db.getTasks();
    _tasks.sort((a, b) => b.priority.compareTo(a.priority));
    await _loadSubtasks();
    notifyListeners();
  }

  Future<void> _loadSubtasks() async {
    final parentIds = _tasks.where((t) => !t.isSubtask).map((t) => t.id).toList();
    _subtasks = await _db.getSubtasksForParents(parentIds);
  }

  Future<void> refreshSubtasksFor(String parentId) async {
    _subtasks[parentId] = await _db.getSubtasks(parentId);
    notifyListeners();
  }

  List<Task> subtasksFor(String parentId) => _subtasks[parentId] ?? [];

  Map<String, Task> get _byId => {for (final t in _tasks) t.id: t};
  Task? taskById(String id) => _byId[id];
  List<Task> tasksByIds(List<String> ids) {
    final out = <Task>[];
    for (final id in ids) {
      final t = _byId[id];
      if (t != null) out.add(t);
    }
    return out;
  }

  Future<Task> add({
    required String title,
    String description = '',
    int priority = 1,
    DateTime? dueDate,
    String? projectId,
    String? parentId,
    int recurrence = 0,
    int energyLevel = 1,
    int? estimatedMinutes,
    String firstStep = '',
    String implementationIntention = '',
    bool isInbox = true,
  }) async {
    final task = Task(
      id: _uuid.v4(),
      title: title,
      description: description,
      priority: priority,
      dueDate: dueDate,
      projectId: projectId,
      parentId: parentId,
      recurrence: recurrence,
      energyLevel: energyLevel,
      estimatedMinutes: estimatedMinutes,
      firstStep: firstStep,
      implementationIntention: implementationIntention,
      isInbox: isInbox,
    );
    await _db.insertTask(task);
    _tasks.insert(0, task);
    if (parentId != null) {
      _subtasks[parentId] = [...(_subtasks[parentId] ?? []), task];
    }
    notifyListeners();
    return task;
  }

  Future<void> addSubtask(String parentId, String title) async {
    await add(title: title, parentId: parentId);
  }

  Future<void> update({
    required String id,
    String? title,
    String? description,
    int? priority,
    DateTime? dueDate,
    bool clearDueDate = false,
    String? projectId,
    bool clearProject = false,
    String? parentId,
    int? recurrence,
    int? energyLevel,
    int? estimatedMinutes,
    bool clearEstimate = false,
    String? firstStep,
    String? implementationIntention,
    bool? isInbox,
  }) async {
    final i = _tasks.indexWhere((t) => t.id == id);
    if (i == -1) return;
    final t = _tasks[i];
    final u = t.copyWith(
      title: title ?? t.title,
      description: description ?? t.description,
      priority: priority ?? t.priority,
      dueDate: clearDueDate ? null : dueDate,
      projectId: clearProject ? null : projectId,
      parentId: parentId ?? t.parentId,
      recurrence: recurrence ?? t.recurrence,
      energyLevel: energyLevel ?? t.energyLevel,
      estimatedMinutes: clearEstimate ? null : (estimatedMinutes ?? t.estimatedMinutes),
      firstStep: firstStep ?? t.firstStep,
      implementationIntention: implementationIntention ?? t.implementationIntention,
      isInbox: isInbox ?? t.isInbox,
      updatedAt: DateTime.now(),
    );
    await _db.updateTask(u);
    _tasks[i] = u;
    notifyListeners();
  }

  Future<void> setInbox(String id, bool isInbox) async {
    await update(id: id, isInbox: isInbox);
  }

  Future<void> toggle(String id, {ReminderProvider? reminderProvider}) async {
    final i = _tasks.indexWhere((t) => t.id == id);
    if (i == -1) return;
    final t = _tasks[i];
    final c = !t.completed;
    await _db.toggleTaskComplete(id, c);

    Task? nextInstance;
    if (c && t.isRecurring && !t.isSubtask) {
      nextInstance = await _createRecurringNext(t);
    }

    _tasks[i] = t.copyWith(completed: c, updatedAt: DateTime.now());
    if (t.isSubtask && t.parentId != null) {
      await _loadSubtasks();
    }
    notifyListeners();

    if (nextInstance != null && reminderProvider != null) {
      await reminderProvider.rescheduleForNextInstance(t, nextInstance);
    }
  }

  Future<Task?> _createRecurringNext(Task task) async {
    DateTime base = task.dueDate ?? DateTime.now();
    DateTime nextDue = base;
    switch (task.recurrenceEnum) {
      case TaskRecurrence.daily: nextDue = DateTime(base.year, base.month, base.day + 1, base.hour, base.minute); break;
      case TaskRecurrence.weekly: nextDue = DateTime(base.year, base.month, base.day + 7, base.hour, base.minute); break;
      case TaskRecurrence.monthly:
        var nm = base.month + 1;
        var ny = base.year;
        if (nm > 12) { nm = 1; ny += 1; }
        nextDue = DateTime(ny, nm, base.day, base.hour, base.minute);
        break;
      case TaskRecurrence.none: return null;
    }
    final next = Task(
      id: _uuid.v4(),
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: nextDue,
      projectId: task.projectId,
      recurrence: task.recurrence,
      energyLevel: task.energyLevel,
      estimatedMinutes: task.estimatedMinutes,
      firstStep: task.firstStep,
      implementationIntention: task.implementationIntention,
      isInbox: task.isInbox,
    );
    await _db.insertTask(next);
    _tasks.insert(0, next);
    return next;
  }

  Future<void> remove(String id, {ReminderProvider? reminderProvider}) async {
    if (reminderProvider != null) await reminderProvider.removeForTask(id);
    await _db.deleteTask(id);
    await _db.deleteSubtasks(id);
    _tasks.removeWhere((t) => t.id == id || t.parentId == id);
    _subtasks.remove(id);
    notifyListeners();
  }

  Future<void> removeSubtask(String subtaskId, String parentId) async {
    await _db.deleteTask(subtaskId);
    _tasks.removeWhere((t) => t.id == subtaskId);
    _subtasks[parentId] = (_subtasks[parentId] ?? []).where((x) => x.id != subtaskId).toList();
    notifyListeners();
  }

  void setSearch(String q) { _search = q; notifyListeners(); }

  List<Task> tasksForProject(String projectId) => _tasks.where((t) => t.projectId == projectId && !t.completed && !t.isSubtask).toList();

  List<Task> tasksForDate(DateTime date) {
    final d = date.toIso8601String().substring(0, 10);
    return _tasks.where((t) => !t.isSubtask && (t.dueDate != null && t.dueDate!.toIso8601String().substring(0, 10) == d)).toList();
  }
}
