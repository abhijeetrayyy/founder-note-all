import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthProvider extends ChangeNotifier {
  final SupabaseClient _client = Supabase.instance.client;
  User? _user;
  bool _loading = true;
  String? _error;
  StreamSubscription<AuthState>? _sub;

  User? get user => _user;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null;
  String? get error => _error;

  Future<void> init() async {
    _user = _client.auth.currentUser;
    _loading = false;
    notifyListeners();

    _sub = _client.auth.onAuthStateChange.listen((event) {
      _user = event.session?.user;
      notifyListeners();
    });
  }

  Future<bool> signUp({required String email, required String password, String? name}) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final response = await _client.auth.signUp(
        email: email,
        password: password,
        data: {'display_name': name ?? email.split('@').first},
      );
      _user = response.user;
      if (_user != null) {
        await _client.from('users_profile').upsert({
          'id': _user!.id,
          'display_name': name ?? email.split('@').first,
          'energy_default': 1,
          'onboarding_completed': false,
          'preferences': {},
        });
      }
      return _user != null;
    } on AuthException catch (e) {
      _error = e.message;
      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<bool> signIn({required String email, required String password}) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final response = await _client.auth.signInWithPassword(
        email: email,
        password: password,
      );
      _user = response.user;
      return _user != null;
    } on AuthException catch (e) {
      _error = e.message;
      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
    _user = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
