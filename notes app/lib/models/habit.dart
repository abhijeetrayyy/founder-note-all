import 'package:flutter/material.dart';

class Habit {
  final String id;
  final String name;
  final int color;
  final int iconIndex;
  final DateTime createdAt;

  static const icons = [
    Icons.fitness_center, Icons.book, Icons.self_improvement, Icons.water_drop, Icons.run_circle,
    Icons.music_note, Icons.code, Icons.palette, Icons.local_florist, Icons.bedtime, Icons.wb_sunny, Icons.psychology,
  ];

  Habit({required this.id, required this.name, this.color = 0xFF6C63FF, this.iconIndex = 0, DateTime? createdAt}) : createdAt = createdAt ?? DateTime.now();

  IconData get icon => icons[iconIndex.clamp(0, icons.length - 1)];

  Habit copyWith({String? id, String? name, int? color, int? iconIndex, DateTime? createdAt}) => Habit(id: id ?? this.id, name: name ?? this.name, color: color ?? this.color, iconIndex: iconIndex ?? this.iconIndex, createdAt: createdAt ?? this.createdAt);

  Map<String, dynamic> toMap() => {'id': id, 'name': name, 'color': color, 'iconIndex': iconIndex, 'createdAt': createdAt.toIso8601String()};
  factory Habit.fromMap(Map<String, dynamic> m) => Habit(id: m['id'] as String, name: m['name'] as String, color: (m['color'] as int?) ?? 0xFF6C63FF, iconIndex: (m['iconIndex'] as int?) ?? 0, createdAt: DateTime.parse(m['createdAt'] as String));
}
