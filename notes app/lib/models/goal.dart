class Goal {
  final String id;
  final String title;
  final String description;
  final int color;
  final int iconIndex;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool archived;
  final int progress; // 0-100

  Goal({
    required this.id,
    required this.title,
    this.description = '',
    this.color = 0xFF6C63FF,
    this.iconIndex = 0,
    DateTime? createdAt,
    DateTime? updatedAt,
    this.archived = false,
    this.progress = 0,
  })  : createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();

  Goal copyWith({String? title, String? description, int? color, int? iconIndex, DateTime? updatedAt, bool? archived, int? progress}) => Goal(
    id: id,
    title: title ?? this.title,
    description: description ?? this.description,
    color: color ?? this.color,
    iconIndex: iconIndex ?? this.iconIndex,
    createdAt: createdAt,
    updatedAt: updatedAt ?? DateTime.now(),
    archived: archived ?? this.archived,
    progress: progress ?? this.progress,
  );

  Map<String, dynamic> toMap() => {
    'id': id,
    'title': title,
    'description': description,
    'color': color,
    'iconIndex': iconIndex,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
    'archived': archived ? 1 : 0,
    'progress': progress,
  };

  factory Goal.fromMap(Map<String, dynamic> map) => Goal(
    id: map['id'] as String,
    title: map['title'] as String,
    description: (map['description'] as String?) ?? '',
    color: (map['color'] as int?) ?? 0xFF6C63FF,
    iconIndex: (map['iconIndex'] as int?) ?? 0,
    createdAt: DateTime.parse(map['createdAt'] as String),
    updatedAt: DateTime.parse(map['updatedAt'] as String),
    archived: (map['archived'] as int?) == 1,
    progress: ((map['progress'] as int?) ?? 0).clamp(0, 100),
  );
}
