class EnergyLog {
  final String id;
  final int level; // 0=admin, 1=medium, 2=deep
  final String? note;
  final DateTime createdAt;

  EnergyLog({
    required this.id,
    required this.level,
    this.note,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toMap() => {
    'id': id,
    'level': level,
    'note': note,
    'created_at': createdAt.toIso8601String(),
  };

  factory EnergyLog.fromMap(Map<String, dynamic> m) => EnergyLog(
    id: m['id'] as String,
    level: m['level'] as int,
    note: m['note'] as String?,
    createdAt: m['created_at'] != null ? DateTime.parse(m['created_at'] as String) : DateTime.now(),
  );
}
