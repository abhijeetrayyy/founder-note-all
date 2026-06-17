class Goal {
  final String id;
  final String title;
  final String description;
  final int color;
  final int iconIndex;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool archived;

  Goal({
    required this.id,
    required this.title,
    this.description = '',
    this.color = 0xFF6C63FF,
    this.iconIndex = 0,
    DateTime? createdAt,
    DateTime? updatedAt,
    this.archived = false,
  })  : createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();

  Goal copyWith({String? title, String? description, int? color, int? iconIndex, DateTime? updatedAt, bool? archived}) => Goal(
    id: id,
    title: title ?? this.title,
    description: description ?? this.description,
    color: color ?? this.color,
    iconIndex: iconIndex ?? this.iconIndex,
    createdAt: createdAt,
    updatedAt: updatedAt ?? DateTime.now(),
    archived: archived ?? this.archived,
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
  );
}
