import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum AppSection {
  dashboard, // Today
  inbox,
  planning,
  tasks,
  notes,
  projects,
  calendar,
  journal,
  habits,
  stats,
  review,
  focus,
  goals,
  settings,
}

class AppProvider extends ChangeNotifier {
  AppSection _section = AppSection.dashboard;
  bool _isDarkMode = false;
  String _globalSearch = '';
  bool _sidebarOpen = true;
  int _sidebarIndex = 0;
  bool _onboarded = false;
  String _userName = '';

  AppSection get section => _section;
  bool get isDarkMode => _isDarkMode;
  String get globalSearch => _globalSearch;
  bool get sidebarOpen => _sidebarOpen;
  int get sidebarIndex => _sidebarIndex;
  bool get onboarded => _onboarded;
  String get userName => _userName;

  Timer? _searchDebounce;

  void setSection(AppSection s) {
    _section = s;
    _sidebarIndex = AppSection.values.indexOf(s);
    notifyListeners();
  }

  void setGlobalSearch(String q) {
    _searchDebounce?.cancel();
    _globalSearch = q;
    _searchDebounce = Timer(const Duration(milliseconds: 300), () {
      notifyListeners();
    });
  }

  void clearSearch() {
    _searchDebounce?.cancel();
    _globalSearch = '';
    notifyListeners();
  }

  void toggleSidebar() {
    _sidebarOpen = !_sidebarOpen;
    notifyListeners();
  }

  void setSidebarIndex(int i) {
    if (i < 0 || i >= AppSection.values.length) return;
    _sidebarIndex = i;
    _section = AppSection.values[i];
    notifyListeners();
  }

  Future<void> setUserName(String n) async {
    _userName = n;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('userName', n);
    notifyListeners();
  }

  Future<void> completeOnboarding() async {
    _onboarded = true;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarded', true);
    notifyListeners();
  }

  Future<void> loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    _isDarkMode = prefs.getBool('darkMode') ?? false;
    _sidebarOpen = prefs.getBool('sidebarOpen') ?? true;
    _onboarded = prefs.getBool('onboarded') ?? false;
    _userName = prefs.getString('userName') ?? '';
    notifyListeners();
  }

  Future<void> toggleDarkMode() async {
    _isDarkMode = !_isDarkMode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('darkMode', _isDarkMode);
    notifyListeners();
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    super.dispose();
  }
}
