class DailyPlan {
  final String id;        // ISO date string e.g. "2026-06-15"
  final List<String> mitTaskIds; // ordered list of MIT task ids (max 3)
  final String intentionText;   // morning intention / focus word
  final String blockerNotes;    // what might get in the way
  final bool morningDone;       // has the planning ritual been completed today
  final DateTime createdAt;
  final DateTime updatedAt;

  const DailyPlan({
    required this.id,
    required this.mitTaskIds,
    this.intentionText = '',
    this.blockerNotes = '',
    this.morningDone = false,
    required this.createdAt,
    required this.updatedAt,
  });

  DailyPlan copyWith({
    List<String>? mitTaskIds,
    String? intentionText,
    String? blockerNotes,
    bool? morningDone,
    DateTime? updatedAt,
  }) => DailyPlan(
    id: id,
    mitTaskIds: mitTaskIds ?? this.mitTaskIds,
    intentionText: intentionText ?? this.intentionText,
    blockerNotes: blockerNotes ?? this.blockerNotes,
    morningDone: morningDone ?? this.morningDone,
    createdAt: createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );

  Map<String, dynamic> toMap() => {
    'id': id,
    'mitTaskIds': mitTaskIds.join(','),
    'intentionText': intentionText,
    'blockerNotes': blockerNotes,
    'morningDone': morningDone ? 1 : 0,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };

  factory DailyPlan.fromMap(Map<String, dynamic> map) => DailyPlan(
    id: map['id'] as String,
    mitTaskIds: ((map['mitTaskIds'] as String?) ?? '').isEmpty
        ? []
        : (map['mitTaskIds'] as String).split(','),
    intentionText: map['intentionText'] as String? ?? '',
    blockerNotes: map['blockerNotes'] as String? ?? '',
    morningDone: (map['morningDone'] as int?) == 1,
    createdAt: DateTime.parse(map['createdAt'] as String),
    updatedAt: DateTime.parse(map['updatedAt'] as String),
  );

  factory DailyPlan.empty(String dateId) => DailyPlan(
    id: dateId,
    mitTaskIds: [],
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );
}
