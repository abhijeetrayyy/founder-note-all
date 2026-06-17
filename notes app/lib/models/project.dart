import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';

class Project extends Equatable {
  final String id;
  final String name;
  final String description;
  final int color;
  final int iconIndex;
  final DateTime createdAt;
  final DateTime updatedAt;

  static const List<IconData> icons = [
    Icons.folder_rounded,
    Icons.star_rounded,
    Icons.work_rounded,
    Icons.home_rounded,
    Icons.favorite_rounded,
    Icons.school_rounded,
    Icons.shopping_cart_rounded,
    Icons.flight_rounded,
    Icons.fitness_center_rounded,
    Icons.music_note_rounded,
    Icons.code_rounded,
    Icons.palette_rounded,
  ];

  IconData get icon => icons[iconIndex.clamp(0, icons.length - 1)];

  Project({
    required this.id,
    required this.name,
    this.description = '',
    this.color = 0xFF6C63FF,
    this.iconIndex = 0,
    DateTime? createdAt,
    DateTime? updatedAt,
  })  : createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();

  Project copyWith({
    String? id,
    String? name,
    String? description,
    int? color,
    int? iconIndex,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Project(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      color: color ?? this.color,
      iconIndex: iconIndex ?? this.iconIndex,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'description': description,
        'color': color,
        'iconIndex': iconIndex,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  factory Project.fromMap(Map<String, dynamic> map) => Project(
        id: map['id'] as String,
        name: map['name'] as String,
        description: map['description'] as String? ?? '',
        color: map['color'] as int? ?? 0xFF6C63FF,
        iconIndex: map['iconCode'] != null ? _legacyIconIndex(map['iconCode'] as int) : ((map['iconIndex'] as int?) ?? 0),
        createdAt: DateTime.parse(map['createdAt'] as String),
        updatedAt: DateTime.parse(map['updatedAt'] as String),
      );

  static int _legacyIconIndex(int codePoint) {
    final idx = icons.indexWhere((i) => i.codePoint == codePoint);
    return idx == -1 ? 0 : idx;
  }

  @override
  List<Object?> get props => [id, name, description, color, iconIndex, createdAt, updatedAt];
}
