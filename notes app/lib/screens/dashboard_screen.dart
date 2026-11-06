import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../providers/notes_provider.dart';
import '../providers/tasks_provider.dart';
import '../providers/projects_provider.dart';
import '../providers/habit_provider.dart';
import '../providers/daily_plan_provider.dart';
import '../providers/energy_provider.dart';
import '../models/task.dart';
import '../theme/app_theme.dart';
import '../utils/day_key.dart';
import '../utils/loops.dart';
import 'planning/daily_planning_screen.dart';
import 'focus_timer_screen.dart';
import 'tasks/task_editor_screen.dart';
import 'widgets/quick_add_sheet.dart';

/// Today.
///
/// Rebuilt against the web app's screen rather than the old consumer layout —
/// which was a grid of purple tiles, a "momentum" stat with a dash in it, four
/// coloured shortcut squares and an energy card with battery emoji. None of
/// that told the founder anything; it filled space.
///
/// The shape now, top to bottom:
///
///   the one thing        the single LIT surface on the screen — ink fill,
///                        void text. It is the only thing that is on, and
///                        that is also what it means.
///   on fire              what the day has caught since you planned it, so a
///                        plan made at 9am can be wrong by 11 and say so.
///   capacity             what a day of yours actually holds.
///   what today is for    the picks, numbered, with their first move.
///   the rest             everything else committed to today, hairline-ruled.
///
/// Colour appears only where something needs answering or has just resolved.
/// If this screen is entirely grey, nothing is wrong — and that is information.
class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tasks = context.watch<TasksProvider>();
    final notes = context.watch<NotesProvider>();
    final projects = context.watch<ProjectsProvider>();
    final habits = context.watch<HabitProvider>();
    final planProvider = context.watch<DailyPlanProvider>();
    final energy = context.watch<EnergyProvider>();
    final app = context.watch<AppProvider>();

    final plan = planProvider.todayPlan;
    final firstName = app.userName.split(' ').first;
    final today = todayKey();

    final pickIds = plan?.mitTaskIds ?? const <String>[];
    final picks = tasks.tasksByIds(pickIds);
    final open = tasks.active.where((t) => !t.notThisWeek && !t.isReleased).toList();

    // The one thing: the first unfinished pick, else the first thing due today.
    final activePicks = picks.where((t) => !t.completed).toList();
    final dayList = tasks.todayTasks.where((t) => !t.completed).toList();
    final one = activePicks.isNotEmpty
        ? activePicks.first
        : (dayList.isNotEmpty ? dayList.first : null);

    // What has caught fire since the plan was made, minus what is already on it.
    final fires = byLane(open, today)[Lane.fire]!
        .where((i) => !pickIds.contains(i.task.id))
        .take(3)
        .toList();

    // Everything else committed to today. The one thing is excluded because it
    // is already the lit card above — when no plan exists it is drawn from this
    // very list, and showing it twice makes the screen look like it is padding
    // itself out.
    final rest = dayList
        .where((t) => !pickIds.contains(t.id) && t.id != one?.id)
        .toList();

    final fit = capacityFit([...picks, ...rest, if (one != null && !pickIds.contains(one.id)) one]);
    final inboxCount = tasks.tasks.where((t) => !t.completed && t.isInbox).length;

    return Scaffold(
      body: RefreshIndicator(
        color: AppTheme.ink,
        backgroundColor: AppTheme.surface,
        onRefresh: () async {
          await Future.wait([tasks.load(), notes.load(), projects.load(), planProvider.load()]);
        },
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
          slivers: [
            SliverAppBar(
              floating: true,
              snap: true,
              backgroundColor: AppTheme.void_,
              automaticallyImplyLeading: false,
              toolbarHeight: 64,
              titleSpacing: 20,
              title: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    firstName.isEmpty ? 'TODAY' : 'TODAY · ${firstName.toUpperCase()}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTheme.microLabel,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    _dateLine(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: AppTheme.sans, fontSize: 20,
                      fontWeight: FontWeight.w500, color: AppTheme.ink,
                      letterSpacing: -0.4,
                    ),
                  ),
                ],
              ),
              actions: [
                _EnergyChip(level: energy.level),
                const SizedBox(width: 16),
              ],
            ),

            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 110),
              sliver: SliverList.list(children: [
                if (one != null) _OneThing(task: one, energy: energy.level)
                else const _NothingChosen(),

                if (fires.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  _FiresCard(fires: fires, hasPlan: picks.isNotEmpty),
                ],

                const SizedBox(height: 14),
                _CapacityCard(fit: fit),

                const SizedBox(height: 14),
                _PicksCard(picks: picks),

                const SizedBox(height: 14),
                _Capture(inboxCount: inboxCount),

                if (rest.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  _RestOfDay(tasks: rest),
                ],

                const SizedBox(height: 14),
                _Rituals(habits: habits),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  static String _dateLine() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'];
    final n = DateTime.now();
    return '${days[n.weekday - 1]} ${n.day} ${months[n.month - 1]}';
  }
}

/// A machined panel: flat surface, hairline border, no shadow.
class _Panel extends StatelessWidget {
  final Widget child;
  final EdgeInsets padding;
  final Color? background;
  final Color? borderColor;
  const _Panel({
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.background,
    this.borderColor,
  });

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: padding,
        decoration: BoxDecoration(
          color: background ?? AppTheme.surface,
          borderRadius: BorderRadius.circular(AppTheme.cardRadius),
          border: Border.all(color: borderColor ?? AppTheme.border),
        ),
        child: child,
      );
}

/* ── The one thing, on ink ──
   The single lit surface. Everything else on the screen recedes into graphite,
   so there is never a question about where to look or what to start. */
class _OneThing extends StatelessWidget {
  final Task task;
  final int energy;
  const _OneThing({required this.task, required this.energy});

  @override
  Widget build(BuildContext context) {
    final move = draftNextMove(task);
    final minutes = task.energyLevel == 2 ? 50 : task.energyLevel == 1 ? 25 : 10;
    const onInk = AppTheme.onInk;
    // 0.65 alpha is the floor that still clears 4.5:1 against this fill —
    // the web app measured it, and anything lighter fails AA.
    final onInkMuted = onInk.withValues(alpha: 0.65);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.ink,
        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('THE ONE THING · ${_energyWord(energy).toUpperCase()} ENERGY',
              style: AppTheme.microLabel.copyWith(color: onInkMuted)),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => TaskEditorScreen(taskId: task.id))),
            child: Text(task.title,
                style: const TextStyle(
                  fontFamily: AppTheme.sans, fontSize: 26, height: 1.15,
                  fontWeight: FontWeight.w500, color: onInk, letterSpacing: -0.6,
                )),
          ),
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(
              color: onInk.withValues(alpha: 0.055),
              borderRadius: BorderRadius.circular(AppTheme.controlRadius),
              border: Border.all(color: onInk.withValues(alpha: 0.12)),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('FIRST MOVE', style: AppTheme.microLabel.copyWith(color: onInkMuted)),
              const SizedBox(height: 6),
              Text(move, style: const TextStyle(
                fontFamily: AppTheme.sans, fontSize: 15, height: 1.4, color: onInk)),
            ]),
          ),
          const SizedBox(height: 14),
          Row(children: [
            Expanded(
              child: _InkButton(
                label: 'Start focus · ${minutes}m',
                filled: true,
                onTap: () => Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => FocusTimerScreen(taskTitle: task.title))),
              ),
            ),
            const SizedBox(width: 8),
            _InkButton(
              label: 'Done',
              filled: false,
              onTap: () => context.read<TasksProvider>().toggle(task.id),
            ),
          ]),
        ],
      ),
    );
  }

  static String _energyWord(int v) => const ['Admin', 'Medium', 'Deep'][v.clamp(0, 2)];
}

/// A control sized for the lit surface, where the palette is inverted.
class _InkButton extends StatelessWidget {
  final String label;
  final bool filled;
  final VoidCallback onTap;
  const _InkButton({required this.label, required this.filled, required this.onTap});

  @override
  Widget build(BuildContext context) => Material(
        color: filled ? AppTheme.onInk : Colors.transparent,
        borderRadius: BorderRadius.circular(AppTheme.controlRadius),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppTheme.controlRadius),
          child: Container(
            height: 44,
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppTheme.controlRadius),
              border: filled ? null : Border.all(color: AppTheme.onInk.withValues(alpha: 0.3)),
            ),
            child: Text(label,
                style: TextStyle(
                  fontFamily: AppTheme.sans, fontSize: 14, fontWeight: FontWeight.w500,
                  color: filled ? AppTheme.ink : AppTheme.onInk,
                )),
          ),
        ),
      );
}

class _NothingChosen extends StatelessWidget {
  const _NothingChosen();

  @override
  Widget build(BuildContext context) => _Panel(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('THE ONE THING', style: AppTheme.microLabel),
          const SizedBox(height: 12),
          const Text('Nothing is chosen yet.',
              style: TextStyle(
                fontFamily: AppTheme.sans, fontSize: 24, height: 1.15,
                fontWeight: FontWeight.w500, color: AppTheme.ink, letterSpacing: -0.5,
              )),
          const SizedBox(height: 8),
          const Text('Everything open is already sorted by what actually bites. '
              'Sixty seconds and three taps.',
              style: TextStyle(fontFamily: AppTheme.sans, fontSize: 14,
                  height: 1.45, color: AppTheme.muted)),
          const SizedBox(height: 14),
          FilledButton(
            onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const DailyPlanningScreen())),
            child: const Text('Choose the day'),
          ),
        ]),
      );
}

/* ── What caught fire ──
   The one card that keeps this screen honest after 9am. It never reshuffles
   the plan by itself — an app that rewrote your day every time an email
   arrived would be the inbox, which is the thing this product exists to get
   you out of. It states the fact and puts the swap one tap away. */
class _FiresCard extends StatelessWidget {
  final List<LaneItem> fires;
  final bool hasPlan;
  const _FiresCard({required this.fires, required this.hasPlan});

  @override
  Widget build(BuildContext context) => _Panel(
        background: AppTheme.overlay,
        borderColor: AppTheme.signal.withValues(alpha: 0.35),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(width: 6, height: 6,
                decoration: const BoxDecoration(color: AppTheme.signal, shape: BoxShape.circle)),
            const SizedBox(width: 9),
            Expanded(
              child: Text(
                fires.length == 1
                    ? 'One thing is on fire and not on your list'
                    : '${fires.length} things are on fire and not on your list',
                style: const TextStyle(fontFamily: AppTheme.sans, fontSize: 15,
                    fontWeight: FontWeight.w600, color: AppTheme.ink),
              ),
            ),
          ]),
          const SizedBox(height: 8),
          Text(
            hasPlan
                ? 'Either it goes on the list in place of something, or you decide on purpose '
                    'that it waits. Both are fine. Not deciding is not.'
                : 'You have not chosen a day yet, and these are the ones that will bite if you do not.',
            style: const TextStyle(fontFamily: AppTheme.sans, fontSize: 13,
                height: 1.45, color: AppTheme.muted),
          ),
          const SizedBox(height: 12),
          ...fires.map((f) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: InkWell(
                  borderRadius: BorderRadius.circular(AppTheme.controlRadius),
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(
                      builder: (_) => TaskEditorScreen(taskId: f.task.id))),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(AppTheme.controlRadius),
                      border: Border.all(color: AppTheme.borderStrong),
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(f.task.title,
                          style: const TextStyle(fontFamily: AppTheme.sans, fontSize: 14,
                              height: 1.3, color: AppTheme.ink)),
                      const SizedBox(height: 3),
                      Text(f.why,
                          style: const TextStyle(fontFamily: AppTheme.sans, fontSize: 12,
                              color: AppTheme.signal)),
                    ]),
                  ),
                ),
              )),
          FilledButton(
            onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const DailyPlanningScreen())),
            child: Text(hasPlan ? 'Redo the day' : 'Choose the day'),
          ),
        ]),
      );
}

/* ── Capacity ── */
class _CapacityCard extends StatelessWidget {
  final CapacityFit fit;
  const _CapacityCard({required this.fit});

  @override
  Widget build(BuildContext context) {
    const lanes = [
      ('deep', 'Deep', AppTheme.energyDeep),
      ('medium', 'Medium', AppTheme.energyMedium),
      ('admin', 'Admin', AppTheme.energyAdmin),
    ];
    return _Panel(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text("Today's capacity",
              style: TextStyle(fontFamily: AppTheme.sans, fontSize: 15,
                  fontWeight: FontWeight.w600, color: AppTheme.ink)),
          Text(fit.advice != null ? 'OVER BUDGET' : 'WHAT A DAY HOLDS',
              style: AppTheme.microLabel.copyWith(
                  color: fit.advice != null ? AppTheme.signalDim : AppTheme.muted)),
        ]),
        const SizedBox(height: 14),
        ...lanes.map((l) {
          final used = fit.used[l.$1]!;
          final total = fit.limit[l.$1]!;
          final slots = total > used ? total : used;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text(l.$2, style: const TextStyle(fontFamily: AppTheme.sans,
                    fontSize: 12, fontWeight: FontWeight.w500, color: AppTheme.ink)),
                Text('$used of $total used',
                    style: AppTheme.microLabel.copyWith(letterSpacing: 0.6)),
              ]),
              const SizedBox(height: 6),
              Row(children: List.generate(slots, (i) {
                final over = i >= total;
                final filled = i < used;
                return Expanded(
                  child: Container(
                    height: 7,
                    margin: EdgeInsets.only(right: i == slots - 1 ? 0 : 3),
                    decoration: BoxDecoration(
                      color: over ? AppTheme.signal : (filled ? l.$3 : AppTheme.border),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                );
              })),
            ]),
          );
        }),
        if (fit.advice != null)
          Text(fit.advice!,
              style: const TextStyle(fontFamily: AppTheme.sans, fontSize: 12,
                  height: 1.4, color: AppTheme.signalDim)),
      ]),
    );
  }
}

/* ── What today is for ── */
class _PicksCard extends StatelessWidget {
  final List<Task> picks;
  const _PicksCard({required this.picks});

  @override
  Widget build(BuildContext context) {
    final done = picks.where((t) => t.completed).length;
    return _Panel(
      padding: EdgeInsets.zero,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 16, 18, 14),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('What today is for',
                style: TextStyle(fontFamily: AppTheme.sans, fontSize: 15,
                    fontWeight: FontWeight.w600, color: AppTheme.ink)),
            Text(picks.isEmpty ? 'NOTHING CHOSEN' : '$done OF ${picks.length} CLOSED',
                style: AppTheme.microLabel),
          ]),
        ),
        if (picks.isEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
            child: TextButton(
              style: TextButton.styleFrom(padding: EdgeInsets.zero,
                  minimumSize: const Size(0, 0), alignment: Alignment.centerLeft),
              onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const DailyPlanningScreen())),
              child: const Text('Pick the three things →',
                  style: TextStyle(fontFamily: AppTheme.sans, fontSize: 13,
                      fontWeight: FontWeight.w500, color: AppTheme.ink)),
            ),
          )
        else
          ...picks.asMap().entries.map((e) {
            final i = e.key;
            final t = e.value;
            final last = i == picks.length - 1;
            return InkWell(
              onTap: () => Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => TaskEditorScreen(taskId: t.id))),
              child: Container(
                padding: const EdgeInsets.fromLTRB(18, 12, 18, 12),
                decoration: BoxDecoration(
                  border: last ? null : const Border(bottom: BorderSide(color: AppTheme.border)),
                ),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  SizedBox(
                    width: 22,
                    child: Text(t.completed ? '✓' : '0${i + 1}',
                        style: AppTheme.microLabel.copyWith(
                            color: t.completed ? AppTheme.done : AppTheme.muted)),
                  ),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(t.title,
                          style: TextStyle(
                            fontFamily: AppTheme.sans, fontSize: 14, height: 1.35,
                            color: t.completed ? AppTheme.muted : AppTheme.ink,
                            decoration: t.completed ? TextDecoration.lineThrough : null,
                            decorationColor: AppTheme.faint,
                          )),
                      if (!t.completed && t.firstStep.trim().isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(t.firstStep,
                            maxLines: 1, overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontFamily: AppTheme.sans,
                                fontSize: 12, color: AppTheme.muted)),
                      ],
                    ]),
                  ),
                ]),
              ),
            );
          }),
      ]),
    );
  }
}

/* ── Capture ──
   One field, always in reach. Capture has to cost nothing or it does not
   happen, and a thought that does not get captured is one that keeps being
   re-thought. */
class _Capture extends StatefulWidget {
  final int inboxCount;
  const _Capture({required this.inboxCount});

  @override
  State<_Capture> createState() => _CaptureState();
}

class _CaptureState extends State<_Capture> {
  final _c = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final text = _c.text.trim();
    if (text.isEmpty || _busy) return;
    setState(() => _busy = true);
    await context.read<TasksProvider>().add(title: text, isInbox: true);
    if (!mounted) return;
    setState(() => _busy = false);
    _c.clear();
    ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Captured. It is in the inbox until you answer it.')));
  }

  @override
  Widget build(BuildContext context) => Row(children: [
        Expanded(
          child: TextField(
            controller: _c,
            onSubmitted: (_) => _submit(),
            textInputAction: TextInputAction.done,
            style: const TextStyle(fontFamily: AppTheme.sans, fontSize: 15, color: AppTheme.ink),
            decoration: const InputDecoration(
              hintText: 'Something on your mind…',
              isDense: true,
              contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            ),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          height: 48,
          child: FilledButton(
            onPressed: _busy ? null : _submit,
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 18),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppTheme.controlRadius)),
            ),
            child: const Text('Capture'),
          ),
        ),
      ]);
}

/* ── The rest of the day ── */
class _RestOfDay extends StatelessWidget {
  final List<Task> tasks;
  const _RestOfDay({required this.tasks});

  @override
  Widget build(BuildContext context) => _Panel(
        padding: EdgeInsets.zero,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 12),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Also on today',
                  style: TextStyle(fontFamily: AppTheme.sans, fontSize: 15,
                      fontWeight: FontWeight.w600, color: AppTheme.ink)),
              Text('${tasks.length}', style: AppTheme.microLabel),
            ]),
          ),
          ...tasks.asMap().entries.map((e) {
            final t = e.value;
            final last = e.key == tasks.length - 1;
            return InkWell(
              onTap: () => Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => TaskEditorScreen(taskId: t.id))),
              child: Container(
                padding: const EdgeInsets.fromLTRB(18, 12, 18, 12),
                decoration: BoxDecoration(
                  border: last ? null : const Border(bottom: BorderSide(color: AppTheme.border)),
                ),
                child: Row(children: [
                  GestureDetector(
                    onTap: () => context.read<TasksProvider>().toggle(t.id),
                    child: Container(
                      width: 20, height: 20,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(5),
                        border: Border.all(color: AppTheme.faint, width: 1.5),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(t.title,
                        style: const TextStyle(fontFamily: AppTheme.sans,
                            fontSize: 14, height: 1.35, color: AppTheme.ink)),
                  ),
                  Text(_energyShort(t.energyLevel),
                      style: AppTheme.microLabel.copyWith(color: _energyTone(t.energyLevel))),
                ]),
              ),
            );
          }),
        ]),
      );

  static String _energyShort(int v) => const ['ADMIN', 'MED', 'DEEP'][v.clamp(0, 2)];
  static Color _energyTone(int v) =>
      const [AppTheme.energyAdmin, AppTheme.energyMedium, AppTheme.energyDeep][v.clamp(0, 2)];
}

/* ── Rituals ── */
class _Rituals extends StatelessWidget {
  final HabitProvider habits;
  const _Rituals({required this.habits});

  @override
  Widget build(BuildContext context) {
    final list = habits.habits;
    if (list.isEmpty) return const SizedBox.shrink();
    final status = habits.todayStatus;
    final done = status.values.where((v) => v).length;
    return _Panel(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text('Rituals',
              style: TextStyle(fontFamily: AppTheme.sans, fontSize: 15,
                  fontWeight: FontWeight.w600, color: AppTheme.ink)),
          Text('$done / ${list.length}', style: AppTheme.microLabel),
        ]),
        const SizedBox(height: 12),
        ...list.take(4).map((h) {
          final isDone = status[h.id] ?? false;
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: GestureDetector(
              onTap: () => context.read<HabitProvider>().toggle(h.id),
              child: Row(children: [
                Container(
                  width: 18, height: 18,
                  decoration: BoxDecoration(
                    color: isDone ? AppTheme.done : Colors.transparent,
                    borderRadius: BorderRadius.circular(5),
                    border: isDone ? null : Border.all(color: AppTheme.faint, width: 1.5),
                  ),
                  child: isDone
                      ? const Icon(Icons.check_rounded, size: 13, color: AppTheme.onInk)
                      : null,
                ),
                const SizedBox(width: 11),
                Expanded(
                  child: Text(h.name,
                      style: TextStyle(
                        fontFamily: AppTheme.sans, fontSize: 14,
                        color: isDone ? AppTheme.muted : AppTheme.ink,
                        decoration: isDone ? TextDecoration.lineThrough : null,
                        decorationColor: AppTheme.faint,
                      )),
                ),
              ]),
            ),
          );
        }),
      ]),
    );
  }
}

/// Reads the real energy log rather than asserting a level.
class _EnergyChip extends StatelessWidget {
  final int level;
  const _EnergyChip({required this.level});

  @override
  Widget build(BuildContext context) {
    const tones = [AppTheme.energyAdmin, AppTheme.energyMedium, AppTheme.energyDeep];
    const words = ['ADMIN', 'MEDIUM', 'DEEP'];
    final i = level.clamp(0, 2);
    return Container(
      height: 30,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: AppTheme.overlay,
        borderRadius: BorderRadius.circular(AppTheme.controlRadius),
        border: Border.all(color: AppTheme.border),
      ),
      child: Text(words[i], style: AppTheme.microLabel.copyWith(color: tones[i])),
    );
  }
}
