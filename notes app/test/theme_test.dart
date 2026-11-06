import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:notes_app/theme/app_theme.dart';

/// The theme's contract, not its details.
///
/// These used to assert that `AppTheme.light` was a light theme, which is the
/// assumption the redesign deliberately removed: there is one ground now, and
/// both getters return it. That test failing was the correct outcome — but
/// deleting it would have left the thing it was guarding untested, so it
/// asserts the new promises instead.
void main() {
  test('there is one ground, and it is graphite', () {
    for (final t in [AppTheme.light, AppTheme.dark]) {
      expect(t.brightness, Brightness.dark);
      expect(t.useMaterial3, true);
      expect(t.scaffoldBackgroundColor, AppTheme.void_);
    }
  });

  test('both getters resolve to the same theme', () {
    // A stale `AppTheme.light` reference must not be able to resurrect the old
    // palette on one screen while the rest of the app is on the new one.
    expect(AppTheme.light.scaffoldBackgroundColor, AppTheme.dark.scaffoldBackgroundColor);
    expect(AppTheme.light.colorScheme.primary, AppTheme.dark.colorScheme.primary);
  });

  test('interactive colour is ink, never a brand hue', () {
    // The rule the whole system rests on: colour only means signal. If primary
    // ever drifts back to a saturated brand colour, every button in the app is
    // tinted again and the signal colours stop meaning anything.
    expect(AppTheme.dark.colorScheme.primary, AppTheme.ink);
    expect(AppTheme.primary, AppTheme.ink);
  });

  test('signal colours are reserved and distinct from the chrome', () {
    for (final signal in [AppTheme.signal, AppTheme.signalDim, AppTheme.done]) {
      expect(signal, isNot(AppTheme.ink));
      expect(signal, isNot(AppTheme.surface));
      expect(signal, isNot(AppTheme.void_));
    }
  });

  test('type is the bundled pair, not a silent platform fallback', () {
    // The app asked for 'Inter' for months without ever shipping it.
    expect(AppTheme.dark.textTheme.bodyMedium?.fontFamily, AppTheme.sans);
    expect(AppTheme.microLabel.fontFamily, AppTheme.mono);
  });
}
