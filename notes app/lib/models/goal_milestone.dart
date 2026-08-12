class GoalMilestone {
  final String id;
  final String goalId;
  final String title;
  final bool isCompleted;
  final DateTime? completedAt;

  GoalMilestone({
    required this.id,
    required this.goalId,
    required this.title,
    this.isCompleted = false,
    this.completedAt,
  });

  Map<String, dynamic> toMap() => {
    'id': id,
    'goal_id': goalId,
    'title': title,
    'is_completed': isCompleted ? 1 : 0,
    'completed_at': completedAt?.toIso8601String(),
  };

  factory GoalMilestone.fromMap(Map<String, dynamic> m) => GoalMilestone(
    id: m['id'] as String,
    goalId: m['goal_id'] as String,
    title: m['title'] as String,
    isCompleted: (m['is_completed'] as int?) == 1,
    completedAt: m['completed_at'] != null ? DateTime.parse(m['completed_at'] as String) : null,
  );
}
