import 'package:flutter/material.dart';

enum TaskRecurrence { none, daily, weekly, monthly }

// 0=admin/light, 1=medium, 2=deep focus
enum EnergyLevel { admin, medium, deep }

class Task {
  final String id;
  final String title;
  final String description;
  final int priority; // 0=low, 1=medium, 2=high
  final bool completed;
  final DateTime? dueDate;
  final String? projectId;
  final String? parentId;
  final int recurrence; // TaskRecurrence index
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<Task> subtasks;

  // Execution intelligence fields
  final int energyLevel;        // EnergyLevel index: 0=admin, 1=medium, 2=deep
  final int? estimatedMinutes;  // time estimate in minutes
  final String firstStep;       // first micro-action to reduce activation energy
  final String implementationIntention; // "When X, I will Y at Z"
  final bool isInbox;           // true = not yet triaged for a day

  Task({
    required this.id,
    required this.title,
    this.description = '',
    this.priority = 1,
    this.completed = false,
    this.dueDate,
    this.projectId,
    this.parentId,
    this.recurrence = 0,
    DateTime? createdAt,
    DateTime? updatedAt,
    this.subtasks = const [],
    this.energyLevel = 1,
    this.estimatedMinutes,
    this.firstStep = '',
    this.implementationIntention = '',
    this.isInbox = true,
  })  : createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();

  Task copyWith({
    String? id, String? title, String? description, int? priority,
    bool? completed, DateTime? dueDate, bool clearDueDate = false,
    String? projectId, bool clearProject = false,
    String? parentId, bool clearParent = false,
    int? recurrence,
    DateTime? createdAt, DateTime? updatedAt,
    List<Task>? subtasks,
    int? energyLevel, int? estimatedMinutes, bool clearEstimate = false,
    String? firstStep, String? implementationIntention,
    bool? isInbox,
  }) {
    return Task(
      id: id ?? this.id, title: title ?? this.title,
      description: description ?? this.description,
      priority: priority ?? this.priority, completed: completed ?? this.completed,
      dueDate: clearDueDate ? null : (dueDate ?? this.dueDate),
      projectId: clearProject ? null : (projectId ?? this.projectId),
      parentId: clearParent ? null : (parentId ?? this.parentId),
      recurrence: recurrence ?? this.recurrence,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      subtasks: subtasks ?? this.subtasks,
      energyLevel: energyLevel ?? this.energyLevel,
      estimatedMinutes: clearEstimate ? null : (estimatedMinutes ?? this.estimatedMinutes),
      firstStep: firstStep ?? this.firstStep,
      implementationIntention: implementationIntention ?? this.implementationIntention,
      isInbox: isInbox ?? this.isInbox,
    );
  }

  bool get isSubtask => parentId != null;
  bool get isRecurring => recurrence > 0;
  TaskRecurrence get recurrenceEnum => TaskRecurrence.values[recurrence];
  EnergyLevel get energyLevelEnum => EnergyLevel.values[energyLevel.clamp(0, 2)];
  Color get priorityColor => [Colors.green, Colors.orange, Colors.red][priority.clamp(0, 2)];
  String get priorityLabel => ['Low', 'Medium', 'High'][priority.clamp(0, 2)];
  String get recurrenceLabel => ['None', 'Daily', 'Weekly', 'Monthly'][recurrence.clamp(0, 3)];
  Color get energyColor => [Colors.teal, Colors.blue, Colors.deepPurple][energyLevel.clamp(0, 2)];
  String get energyLabel => ['Admin', 'Medium', 'Deep Focus'][energyLevel.clamp(0, 2)];
  IconData get energyIcon => [Icons.inbox_rounded, Icons.bolt_rounded, Icons.psychology_rounded][energyLevel.clamp(0, 2)];

  String get estimatedLabel {
    if (estimatedMinutes == null) return '';
    final m = estimatedMinutes!;
    if (m < 60) return '${m}m';
    final h = m ~/ 60;
    final rem = m % 60;
    return rem == 0 ? '${h}h' : '${h}h ${rem}m';
  }

  Map<String, dynamic> toMap() => {
    'id': id, 'title': title, 'description': description,
    'priority': priority, 'completed': completed ? 1 : 0,
    'dueDate': dueDate?.toIso8601String(), 'projectId': projectId,
    'parentId': parentId, 'recurrence': recurrence,
    'createdAt': createdAt.toIso8601String(), 'updatedAt': updatedAt.toIso8601String(),
    'energyLevel': energyLevel,
    'estimatedMinutes': estimatedMinutes,
    'firstStep': firstStep,
    'implementationIntention': implementationIntention,
    'isInbox': isInbox ? 1 : 0,
  };

  factory Task.fromMap(Map<String, dynamic> map) => Task(
    id: map['id'] as String, title: map['title'] as String,
    description: map['description'] as String? ?? '',
    priority: (map['priority'] as int?) ?? 1,
    completed: (map['completed'] as int?) == 1,
    dueDate: map['dueDate'] != null ? DateTime.parse(map['dueDate'] as String) : null,
    projectId: map['projectId'] as String?,
    parentId: map['parentId'] as String?,
    recurrence: (map['recurrence'] as int?) ?? 0,
    createdAt: DateTime.parse(map['createdAt'] as String),
    updatedAt: DateTime.parse(map['updatedAt'] as String),
    energyLevel: (map['energyLevel'] as int?) ?? 1,
    estimatedMinutes: map['estimatedMinutes'] as int?,
    firstStep: map['firstStep'] as String? ?? '',
    implementationIntention: map['implementationIntention'] as String? ?? '',
    isInbox: (map['isInbox'] as int?) == 1,
  );
}
