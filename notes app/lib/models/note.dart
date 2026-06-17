import 'package:equatable/equatable.dart';

class Note extends Equatable {
  final String id;
  final String title;
  final String content;
  final String category;
  final int color;
  final String? projectId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isPinned;
  final bool isArchived;
  final bool isLocked;

  Note({
    required this.id,
    required this.title,
    required this.content,
    this.category = 'General',
    this.color = 0xFF6C63FF,
    this.projectId,
    DateTime? createdAt,
    DateTime? updatedAt,
    this.isPinned = false,
    this.isArchived = false,
    this.isLocked = false,
  })  : createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();

  Note copyWith({
    String? id,
    String? title,
    String? content,
    String? category,
    int? color,
    String? projectId,
    bool clearProject = false,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isPinned,
    bool? isArchived,
    bool? isLocked,
  }) {
    return Note(
      id: id ?? this.id,
      title: title ?? this.title,
      content: content ?? this.content,
      category: category ?? this.category,
      color: color ?? this.color,
      projectId: clearProject ? null : (projectId ?? this.projectId),
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isPinned: isPinned ?? this.isPinned,
      isArchived: isArchived ?? this.isArchived,
      isLocked: isLocked ?? this.isLocked,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'title': title,
        'content': content,
        'category': category,
        'color': color,
        'projectId': projectId,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
        'isPinned': isPinned ? 1 : 0,
        'isArchived': isArchived ? 1 : 0,
        'isLocked': isLocked ? 1 : 0,
      };

  factory Note.fromMap(Map<String, dynamic> map) => Note(
        id: map['id'] as String,
        title: map['title'] as String? ?? '',
        content: map['content'] as String? ?? '',
        category: map['category'] as String? ?? 'General',
        color: map['color'] as int? ?? 0xFF6C63FF,
        projectId: map['projectId'] as String?,
        createdAt: map['createdAt'] != null
            ? DateTime.parse(map['createdAt'] as String)
            : DateTime.now(),
        updatedAt: map['updatedAt'] != null
            ? DateTime.parse(map['updatedAt'] as String)
            : DateTime.now(),
        isPinned: (map['isPinned'] as int?) == 1,
        isArchived: (map['isArchived'] as int?) == 1,
        isLocked: (map['isLocked'] as int?) == 1,
      );

  @override
  List<Object?> get props => [id, title, content, category, color, projectId, createdAt, updatedAt, isPinned, isArchived, isLocked];
}
