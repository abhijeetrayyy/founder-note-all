class Tag {
  final String id;
  final String name;
  final int color;
  final DateTime createdAt;

  Tag({required this.id, required this.name, this.color = 0xFF6C63FF, DateTime? createdAt}) : createdAt = createdAt ?? DateTime.now();

  Tag copyWith({String? id, String? name, int? color, DateTime? createdAt}) => Tag(id: id ?? this.id, name: name ?? this.name, color: color ?? this.color, createdAt: createdAt ?? this.createdAt);

  Map<String, dynamic> toMap() => {'id': id, 'name': name, 'color': color, 'createdAt': createdAt.toIso8601String()};
  factory Tag.fromMap(Map<String, dynamic> m) => Tag(id: m['id'] as String, name: m['name'] as String, color: (m['color'] as int?) ?? 0xFF6C63FF, createdAt: DateTime.parse(m['createdAt'] as String));
}
