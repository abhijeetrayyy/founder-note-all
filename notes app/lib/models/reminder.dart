class Reminder {
  final String id;
  final String taskId;
  final String taskTitle;
  final DateTime remindAt;
  bool notified;

  Reminder({
    required this.id,
    required this.taskId,
    required this.taskTitle,
    required this.remindAt,
    this.notified = false,
  });

  Reminder copyWith({String? id, String? taskId, String? taskTitle, DateTime? remindAt, bool? notified}) {
    return Reminder(
      id: id ?? this.id, taskId: taskId ?? this.taskId,
      taskTitle: taskTitle ?? this.taskTitle,
      remindAt: remindAt ?? this.remindAt, notified: notified ?? this.notified,
    );
  }

  Map<String, dynamic> toMap() => {
    'id': id, 'taskId': taskId, 'taskTitle': taskTitle,
    'remindAt': remindAt.toIso8601String(), 'notified': notified ? 1 : 0,
  };

  factory Reminder.fromMap(Map<String, dynamic> map) => Reminder(
    id: map['id'] as String, taskId: map['taskId'] as String,
    taskTitle: (map['taskTitle'] as String?) ?? '',
    remindAt: DateTime.parse(map['remindAt'] as String),
    notified: (map['notified'] as int?) == 1,
  );
}
