import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../models/reminder.dart';
import '../models/task.dart';
import '../services/database_service.dart';
import '../services/notifications/notification_service.dart';

class ReminderProvider extends ChangeNotifier {
  final DatabaseService _db = DatabaseService.instance;
  final NotificationService _notif = NotificationService.instance;
  final Uuid _uuid = const Uuid();
  List<Reminder> _reminders = [];

  List<Reminder> get reminders => _reminders;

  Future<void> load() async {
    _reminders = await _db.getReminders();
    notifyListeners();
  }

  Future<void> scheduleForTask(Task task, DateTime remindAt) async {
    await _db.deleteReminderForTask(task.id);
    final r = Reminder(id: _uuid.v4(), taskId: task.id, taskTitle: task.title, remindAt: remindAt);
    await _db.insertReminder(r);
    await _notif.scheduleReminder(r);
    _reminders.removeWhere((x) => x.taskId == task.id);
    _reminders.add(r);
    notifyListeners();
  }

  Future<void> removeForTask(String taskId) async {
    final r = _reminders.where((x) => x.taskId == taskId).firstOrNull;
    if (r != null) await _notif.cancelReminder(r);
    await _db.deleteReminderForTask(taskId);
    _reminders.removeWhere((x) => x.taskId == taskId);
    notifyListeners();
  }

  Future<void> checkMissed() async {
    final pending = await _db.getPendingReminders();
    for (final r in pending) {
      await _notif.cancelReminder(r);
      await _db.markReminderNotified(r.id);
    }
    _reminders = await _db.getReminders();
    notifyListeners();
  }

  Future<void> rescheduleForNextInstance(Task oldTask, Task newTask) async {
    final existing = _reminders.where((r) => r.taskId == oldTask.id).firstOrNull;
    if (existing == null) return;
    final nextRemind = existing.remindAt.add(_deltaBetween(oldTask.dueDate, newTask.dueDate));
    await scheduleForTask(newTask, nextRemind);
  }

  Duration _deltaBetween(DateTime? a, DateTime? b) {
    if (a == null || b == null) return Duration.zero;
    return b.difference(a);
  }

  Reminder? getForTask(String taskId) => _reminders.where((x) => x.taskId == taskId).firstOrNull;
}
