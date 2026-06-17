import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz_data;
import '../../models/reminder.dart';

class NotificationService {
  static final NotificationService instance = NotificationService._();
  NotificationService._();

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    tz_data.initializeTimeZones();
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    await _plugin.initialize(const InitializationSettings(android: android, iOS: ios));
    await _plugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
  }

  Future<void> scheduleReminder(Reminder reminder) async {
    await cancelReminder(reminder);
    final scheduledDate = tz.TZDateTime.from(reminder.remindAt, tz.local);
    if (scheduledDate.isBefore(DateTime.now())) return;

    final title = reminder.taskTitle.isNotEmpty ? reminder.taskTitle : 'Task Reminder';
    await _plugin.zonedSchedule(
      reminder.id.hashCode,
      title,
      'Reminder: $title',
      scheduledDate,
      NotificationDetails(
        android: AndroidNotificationDetails(
          'reminders', 'Task Reminders',
          channelDescription: 'Reminders for your tasks',
          importance: Importance.high,
          priority: Priority.high,
          actions: const <AndroidNotificationAction>[
            AndroidNotificationAction('mark_done', 'Mark done'),
            AndroidNotificationAction('snooze_30', 'Snooze 30m'),
          ],
        ),
        iOS: const DarwinNotificationDetails(),
      ),
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.dateAndTime,
    );
  }

  Future<void> cancelReminder(Reminder reminder) async {
    await _plugin.cancel(reminder.id.hashCode);
  }

  Future<void> cancelAll() async {
    await _plugin.cancelAll();
  }
}
