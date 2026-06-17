class JournalEntry {
  final String id;
  final String content;
  final int mood; // 0-4: productive, neutral, thoughtful, stressed, tired
  final DateTime createdAt;

  JournalEntry({required this.id, required this.content, this.mood = 1, DateTime? createdAt})
      : createdAt = createdAt ?? DateTime.now();

  JournalEntry copyWith({String? id, String? content, int? mood, DateTime? createdAt}) {
    return JournalEntry(id: id ?? this.id, content: content ?? this.content, mood: mood ?? this.mood, createdAt: createdAt ?? this.createdAt);
  }

  Map<String, dynamic> toMap() => {'id': id, 'content': content, 'mood': mood, 'createdAt': createdAt.toIso8601String()};
  factory JournalEntry.fromMap(Map<String, dynamic> m) => JournalEntry(id: m['id'] as String, content: m['content'] as String, mood: (m['mood'] as int?) ?? 1, createdAt: DateTime.parse(m['createdAt'] as String));

  static const List<String> moodEmojis = [
    '\u{1F60A}',
    '\u{1F610}',
    '\u{1F914}',
    '\u{1F624}',
    '\u{1F634}',
  ];
  static const List<String> moodLabels = ['Productive', 'Neutral', 'Thoughtful', 'Stressed', 'Tired'];
  String get moodEmoji => moodEmojis[mood.clamp(0, 4)];
  String get moodLabel => moodLabels[mood.clamp(0, 4)];
}
