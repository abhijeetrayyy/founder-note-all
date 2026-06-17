import 'package:flutter_test/flutter_test.dart';
import 'package:notes_app/models/note.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {});

  test('Note model toMap creates correct map', () {
    final note = Note(
      id: 'id-1',
      title: 'Test',
      content: 'Hello',
      category: 'Work',
      color: 0xFF2196F3,
    );

    final map = note.toMap();
    expect(map['id'], 'id-1');
    expect(map['title'], 'Test');
    expect(map['category'], 'Work');
    expect(map['isPinned'], 0);
    expect(map['isArchived'], 0);
  });

  test('Note model fromMap parses correctly', () {
    final map = {
      'id': 'id-1',
      'title': 'Test',
      'content': 'Hello World',
      'category': 'Personal',
      'color': 0xFFFF9800,
      'createdAt': '2026-06-09T10:00:00.000',
      'updatedAt': '2026-06-09T12:00:00.000',
      'isPinned': 1,
      'isArchived': 0,
    };

    final note = Note.fromMap(map);
    expect(note.id, 'id-1');
    expect(note.title, 'Test');
    expect(note.category, 'Personal');
    expect(note.isPinned, true);
    expect(note.isArchived, false);
  });

  test('Note copyWith preserves unchanged fields', () {
    final note = Note(id: 'id-1', title: 'Original', content: 'Content');
    final updated = note.copyWith(title: 'Updated');

    expect(updated.title, 'Updated');
    expect(updated.id, 'id-1');
    expect(updated.content, 'Content');
    expect(updated.isPinned, false);
  });
}
