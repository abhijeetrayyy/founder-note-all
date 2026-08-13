import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});
  @override State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _name = TextEditingController(), _email = TextEditingController(), _password = TextEditingController();
  bool _obscure = true;

  @override void dispose() { _name.dispose(); _email.dispose(); _password.dispose(); super.dispose(); }

  Future<void> _signup() async {
    final auth = context.read<AuthProvider>();
    final ok = await auth.signUp(email: _email.text.trim(), password: _password.text, name: _name.text.trim());
    if (!ok && mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.error ?? 'Sign up failed'), behavior: SnackBarBehavior.floating));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              const SizedBox(height: 20),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [AppTheme.primary, AppTheme.primaryGlow], begin: Alignment.topLeft, end: Alignment.bottomRight),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.35), blurRadius: 16, offset: const Offset(0, 6))],
                  ),
                  child: const Center(child: Text('F', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 22))),
                ),
                const SizedBox(width: 14),
                Text('FounderOS', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: AppTheme.primary, letterSpacing: -0.5)),
              ]),
              const SizedBox(height: 56),
              Text('Create your account', textAlign: TextAlign.center, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: isDark ? AppTheme.darkText : AppTheme.lightText, letterSpacing: -0.5)),
              const SizedBox(height: 8),
              Text('One task at a time, starting today.', textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
              const SizedBox(height: 36),
              TextField(
                controller: _name, textCapitalization: TextCapitalization.words,
                style: TextStyle(fontSize: 15, color: isDark ? AppTheme.darkText : AppTheme.lightText),
                decoration: InputDecoration(
                  labelText: 'Name', labelStyle: TextStyle(fontSize: 14, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, fontWeight: FontWeight.w600),
                  prefixIcon: const Icon(Icons.person_outline, size: 20),
                  filled: true, fillColor: isDark ? AppTheme.darkSurfaceAlt : AppTheme.lightSurfaceAlt,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _email, keyboardType: TextInputType.emailAddress,
                style: TextStyle(fontSize: 15, color: isDark ? AppTheme.darkText : AppTheme.lightText),
                decoration: InputDecoration(
                  labelText: 'Email', labelStyle: TextStyle(fontSize: 14, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, fontWeight: FontWeight.w600),
                  prefixIcon: const Icon(Icons.email_outlined, size: 20),
                  filled: true, fillColor: isDark ? AppTheme.darkSurfaceAlt : AppTheme.lightSurfaceAlt,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _password, obscureText: _obscure,
                style: TextStyle(fontSize: 15, color: isDark ? AppTheme.darkText : AppTheme.lightText),
                decoration: InputDecoration(
                  labelText: 'Password', labelStyle: TextStyle(fontSize: 14, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, fontWeight: FontWeight.w600),
                  prefixIcon: const Icon(Icons.lock_outlined, size: 20),
                  suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_off_rounded : Icons.visibility_rounded), onPressed: () => setState(() => _obscure = !_obscure)),
                  filled: true, fillColor: isDark ? AppTheme.darkSurfaceAlt : AppTheme.lightSurfaceAlt,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                ),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: auth.loading ? null : _signup,
                style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                child: auth.loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Sign up'),
              ),
              const SizedBox(height: 20),
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Already have an account? Log in')),
            ]),
          ),
        ),
      ),
    );
  }
}
