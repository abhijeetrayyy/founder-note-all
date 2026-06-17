import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:notes_app/theme/app_theme.dart';

void main() {
  test('Light theme has correct properties', () {
    final t = AppTheme.light;
    expect(t.brightness, Brightness.light);
    expect(t.useMaterial3, true);
  });
  test('Dark theme has correct properties', () {
    final t = AppTheme.dark;
    expect(t.brightness, Brightness.dark);
    expect(t.useMaterial3, true);
  });
}
