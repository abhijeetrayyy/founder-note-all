class FocusSession {
  final String id;
  final String mode; // pomodoro, deep_work, quick_sprint
  final int durationMinutes;
  final bool completed;
  final DateTime createdAt;

  FocusSession({
    required this.id,
    required this.mode,
    required this.durationMinutes,
    this.completed = true,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toMap() => {
    'id': id,
    'mode': mode,
    'duration_minutes': durationMinutes,
    'completed': completed ? 1 : 0,
    'created_at': createdAt.toIso8601String(),
  };

  factory FocusSession.fromMap(Map<String, dynamic> m) => FocusSession(
    id: m['id'] as String,
    mode: m['mode'] as String,
    durationMinutes: m['duration_minutes'] as int,
    completed: (m['completed'] as int?) == 1,
    createdAt: m['created_at'] != null ? DateTime.parse(m['created_at'] as String) : DateTime.now(),
  );
}
