import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pc = PageController();
  final _nameCtrl = TextEditingController();
  int _page = 0;
  bool _finishing = false;

  @override
  void dispose() {
    _pc.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    if (_finishing) return;
    setState(() => _finishing = true);
    final name = _nameCtrl.text.trim();
    final app = context.read<AppProvider>();
    if (name.isNotEmpty) await app.setUserName(name);
    await app.completeOnboarding();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
            child: Row(children: List.generate(3, (i) {
              final active = _page == i;
              return Expanded(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  height: 4,
                  decoration: BoxDecoration(color: active ? AppTheme.primary : Theme.of(context).dividerColor, borderRadius: BorderRadius.circular(2)),
                ),
              );
            })),
          ),
          Expanded(
            child: PageView(
              controller: _pc,
              onPageChanged: (i) => setState(() => _page = i),
              physics: const BouncingScrollPhysics(),
              children: [
                _Page(
                  emoji: '🎯',
                  title: 'Less, but better.',
                  body: "You're not building a to-do list. You're building a system that protects what matters and ignores the rest.",
                ),
                _Page(
                  emoji: '☀️',
                  title: 'Plan in 60 seconds.',
                  body: "Each morning, pick 3 MITs — Most Important Tasks. That's your commitment. Everything else is a bonus.",
                ),
                _NamePage(controller: _nameCtrl),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
            child: Row(children: [
              if (_page > 0)
                TextButton(onPressed: () => _pc.previousPage(duration: const Duration(milliseconds: 250), curve: Curves.easeOutCubic), child: const Text('Back'))
              else
                TextButton(onPressed: _skip, child: const Text('Skip')),
              const Spacer(),
              FilledButton.icon(
                onPressed: () {
                  if (_page < 2) {
                    _pc.nextPage(duration: const Duration(milliseconds: 250), curve: Curves.easeOutCubic);
                  } else {
                    _finish();
                  }
                },
                icon: Icon(_page < 2 ? Icons.arrow_forward_rounded : Icons.rocket_launch_rounded, size: 18),
                label: Text(_page < 2 ? 'Next' : "Let's go"),
              ),
            ]),
          ),
        ]),
      ),
    );
  }

  Future<void> _skip() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarded', true);
    await context.read<AppProvider>().completeOnboarding();
  }
}

class _Page extends StatelessWidget {
  final String emoji, title, body;
  const _Page({required this.emoji, required this.title, required this.body});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(
          width: 130, height: 130,
          decoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.10), shape: BoxShape.circle),
          child: Center(child: Text(emoji, style: const TextStyle(fontSize: 70))),
        ),
        const SizedBox(height: 36),
        Text(title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.displaySmall),
        const SizedBox(height: 12),
        Text(body, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
      ]),
    );
  }
}

class _NamePage extends StatelessWidget {
  final TextEditingController controller;
  const _NamePage({required this.controller});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(
          width: 130, height: 130,
          decoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.10), shape: BoxShape.circle),
          child: const Icon(Icons.waving_hand_rounded, size: 64, color: AppTheme.primary),
        ),
        const SizedBox(height: 36),
        Text("What should we call you?", textAlign: TextAlign.center, style: Theme.of(context).textTheme.displaySmall),
        const SizedBox(height: 12),
        Text("We'll greet you by name each morning.", textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
        const SizedBox(height: 28),
        TextField(
          controller: controller,
          autofocus: true,
          textAlign: TextAlign.center,
          textCapitalization: TextCapitalization.words,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
          inputFormatters: [LengthLimitingTextInputFormatter(30)],
          decoration: InputDecoration(
            hintText: 'Your first name',
            filled: true,
            fillColor: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkSurfaceAlt : AppTheme.lightSurfaceAlt,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          ),
          onSubmitted: (_) {},
        ),
      ]),
    );
  }
}
