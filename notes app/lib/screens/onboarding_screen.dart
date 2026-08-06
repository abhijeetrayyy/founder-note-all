import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/app_provider.dart';
import '../providers/tasks_provider.dart';
import '../theme/app_theme.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pc = PageController();
  final _nameCtrl = TextEditingController();
  final _taskCtrl = TextEditingController();
  int _page = 0;
  int _energy = 1; // default medium
  bool _finishing = false;

  @override
  void dispose() {
    _pc.dispose();
    _nameCtrl.dispose();
    _taskCtrl.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    if (_finishing) return;
    setState(() => _finishing = true);
    final name = _nameCtrl.text.trim();
    final app = context.read<AppProvider>();
    if (name.isNotEmpty) await app.setUserName(name);
    // Save energy default
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('default_energy', _energy);
    // Create first task if provided
    final taskText = _taskCtrl.text.trim();
    if (taskText.isNotEmpty) {
      await context.read<TasksProvider>().add(title: taskText, energyLevel: _energy, isInbox: false);
    }
    await app.completeOnboarding();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
            child: Row(children: List.generate(4, (i) {
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
                // Step 1: Value prop
                _Page(
                  emoji: '🎯',
                  title: 'Less, but better.',
                  body: "You're not building a to-do list. You're building a system that protects what matters and ignores the rest.",
                ),
                // Step 2: Name
                _NamePage(controller: _nameCtrl),
                // Step 3: Default energy level
                _EnergyPage(energy: _energy, onChanged: (e) => setState(() => _energy = e)),
                // Step 4: First task (optional)
                _FirstTaskPage(controller: _taskCtrl),
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
                  if (_page < 3) {
                    _pc.nextPage(duration: const Duration(milliseconds: 250), curve: Curves.easeOutCubic);
                  } else {
                    _finish();
                  }
                },
                icon: Icon(_page < 3 ? Icons.arrow_forward_rounded : Icons.rocket_launch_rounded, size: 18),
                label: Text(_page < 3 ? 'Next' : "Let's go"),
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

class _EnergyPage extends StatelessWidget {
  final int energy;
  final ValueChanged<int> onChanged;
  const _EnergyPage({required this.energy, required this.onChanged});

  static const _energies = [
    (0, 'Admin', 'Quick emails, scheduling, light tasks', AppTheme.energyAdmin, Icons.inbox_rounded),
    (1, 'Medium', 'Focused execution on known work', AppTheme.energyMedium, Icons.bolt_rounded),
    (2, 'Deep', 'Creative, analytical, or strategic work', AppTheme.energyDeep, Icons.psychology_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(
          width: 130, height: 130,
          decoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.10), shape: BoxShape.circle),
          child: const Icon(Icons.bolt_rounded, size: 64, color: AppTheme.primary),
        ),
        const SizedBox(height: 36),
        Text('What\'s your default energy?', textAlign: TextAlign.center, style: Theme.of(context).textTheme.displaySmall),
        const SizedBox(height: 12),
        Text('New tasks will start at this level. You can change it anytime.', textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
        const SizedBox(height: 28),
        ...(_energies.map((e) {
          final active = energy == e.$1;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => onChanged(e.$1),
                borderRadius: BorderRadius.circular(16),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: active ? e.$4.withValues(alpha: 0.12) : (isDark ? AppTheme.darkSurfaceAlt : AppTheme.lightSurfaceAlt),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: active ? e.$4 : Colors.transparent, width: 2),
                  ),
                  child: Row(children: [
                    Icon(e.$5, color: e.$4, size: 24),
                    const SizedBox(width: 14),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(e.$2, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: e.$4)),
                      const SizedBox(height: 2),
                      Text(e.$3, style: TextStyle(fontSize: 13, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
                    ])),
                    if (active) Icon(Icons.check_circle_rounded, color: e.$4, size: 22),
                  ]),
                ),
              ),
            ),
          );
        })),
      ]),
    );
  }
}

class _FirstTaskPage extends StatelessWidget {
  final TextEditingController controller;
  const _FirstTaskPage({required this.controller});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(
          width: 130, height: 130,
          decoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.10), shape: BoxShape.circle),
          child: const Icon(Icons.checklist_rounded, size: 64, color: AppTheme.primary),
        ),
        const SizedBox(height: 36),
        Text('What\'s your first task?', textAlign: TextAlign.center, style: Theme.of(context).textTheme.displaySmall),
        const SizedBox(height: 12),
        Text('Capture one thing you want to get done. You can skip this for now.', textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
        const SizedBox(height: 28),
        TextField(
          controller: controller,
          autofocus: true,
          textAlign: TextAlign.center,
          textCapitalization: TextCapitalization.sentences,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
          decoration: InputDecoration(
            hintText: 'e.g. Draft the investor update',
            filled: true,
            fillColor: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkSurfaceAlt : AppTheme.lightSurfaceAlt,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          ),
          onSubmitted: (_) {},
        ),
        const SizedBox(height: 16),
        Text('Use natural language: "Call John tomorrow 2pm" works!', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
      ]),
    );
  }
}
