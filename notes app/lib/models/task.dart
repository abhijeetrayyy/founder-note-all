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

  // ── The loop model (web migration 00003) ──
  // A task is a loop: something open in the founder's head. These are the
  // fields that make it one rather than a checkbox. They exist in Supabase and
  // the web app has used them for months; this model simply did not read them,
  // so every one arrived from sync and was dropped on the floor.
  /// Name of the person attached to this loop. Empty when nobody is waiting.
  final String owedTo;
  /// 0 = they are waiting on you, 1 = you are waiting on them.
  final int owedDirection;
  /// 0 = task, 1 = decision.
  final int kind;
  final DateTime? decideBy;
  final String decisionUnlock;
  /// When this loop was triaged. Null = still raw; only raw loops decay.
  final DateTime? answeredAt;
  /// Soft drop — hidden everywhere, restorable for 30 days.
  final DateTime? releasedAt;
  final String releaseReason;
  final bool notThisWeek;
  final String antiReason;

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
    this.owedTo = '',
    this.owedDirection = 0,
    this.kind = 0,
    this.decideBy,
    this.decisionUnlock = '',
    this.answeredAt,
    this.releasedAt,
    this.releaseReason = '',
    this.notThisWeek = false,
    this.antiReason = '',
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
    String? owedTo, int? owedDirection, int? kind,
    DateTime? decideBy, bool clearDecideBy = false,
    String? decisionUnlock,
    DateTime? answeredAt, bool clearAnsweredAt = false,
    DateTime? releasedAt, bool clearReleasedAt = false,
    String? releaseReason, bool? notThisWeek, String? antiReason,
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
      owedTo: owedTo ?? this.owedTo,
      owedDirection: owedDirection ?? this.owedDirection,
      kind: kind ?? this.kind,
      decideBy: clearDecideBy ? null : (decideBy ?? this.decideBy),
      decisionUnlock: decisionUnlock ?? this.decisionUnlock,
      answeredAt: clearAnsweredAt ? null : (answeredAt ?? this.answeredAt),
      releasedAt: clearReleasedAt ? null : (releasedAt ?? this.releasedAt),
      releaseReason: releaseReason ?? this.releaseReason,
      notThisWeek: notThisWeek ?? this.notThisWeek,
      antiReason: antiReason ?? this.antiReason,
    );
  }

  /// Someone is waiting on you. The heaviest thing a founder carries.
  bool get isOwedByYou => owedTo.trim().isNotEmpty && owedDirection == 0;

  /// It is sitting in someone else's court. Nudge it, do not schedule it.
  bool get isBlockedOnThem => owedTo.trim().isNotEmpty && owedDirection == 1;

  bool get isDecision => kind == 1;
  bool get isReleased => releasedAt != null;
  /// Raw means never triaged — and only raw loops decay.
  bool get isRaw => answeredAt == null;

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
    'owedTo': owedTo,
    'owedDirection': owedDirection,
    'kind': kind,
    'decideBy': decideBy?.toIso8601String(),
    'decisionUnlock': decisionUnlock,
    'answeredAt': answeredAt?.toIso8601String(),
    'releasedAt': releasedAt?.toIso8601String(),
    'releaseReason': releaseReason,
    'notThisWeek': notThisWeek ? 1 : 0,
    'antiReason': antiReason,
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
    owedTo: map['owedTo'] as String? ?? '',
    owedDirection: (map['owedDirection'] as int?) ?? 0,
    kind: (map['kind'] as int?) ?? 0,
    decideBy: map['decideBy'] != null ? DateTime.parse(map['decideBy'] as String) : null,
    decisionUnlock: map['decisionUnlock'] as String? ?? '',
    answeredAt: map['answeredAt'] != null ? DateTime.parse(map['answeredAt'] as String) : null,
    releasedAt: map['releasedAt'] != null ? DateTime.parse(map['releasedAt'] as String) : null,
    releaseReason: map['releaseReason'] as String? ?? '',
    notThisWeek: (map['notThisWeek'] as int?) == 1,
    antiReason: map['antiReason'] as String? ?? '',
  );
}
