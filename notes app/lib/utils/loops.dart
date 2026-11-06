import 'package:flutter/material.dart';
import '../models/task.dart';
import '../theme/app_theme.dart';
import 'day_key.dart';

/// The loop model, as pure functions.
///
/// A direct port of the web app's `lib/loops.ts`. Both apps read the same rows
/// out of the same Postgres, so they have to answer "is this on fire" the same
/// way — otherwise the phone and the laptop disagree about the founder's day,
/// and the one that disagrees is the one that stops being trusted.
///
/// Keep this in step with `founder-web/lib/loops.ts`. Every rule lives in one
/// function per app and nowhere else.

// ---------------------------------------------------------------------------
// Decay
// ---------------------------------------------------------------------------

/// Days a raw loop gets before it starts to age. Capture is free inside this.
const int graceDays = 7;
/// Days after which a raw loop is rotting and sorts to the top of triage.
const int rotDays = 14;
/// Friday amnesty releases raw loops older than this.
const int amnestyDays = 21;
/// How long a released loop stays restorable.
const int restoreDays = 30;

int daysSince(DateTime then, [DateTime? now]) {
  final n = now ?? DateTime.now();
  final d = n.difference(then).inDays;
  return d < 0 ? 0 : d;
}

/// Age in days, but only for loops where age means something.
///
/// Once a loop has been answered it is a plan, not pressure — a task scheduled
/// three months out is not rotting, it is simply scheduled, and colouring it
/// red would be a lie.
int? loopAge(Task t, [DateTime? now]) =>
    t.answeredAt != null ? null : daysSince(t.createdAt, now);

// ---------------------------------------------------------------------------
// Lanes — "what is on fire, and what actually matters"
// ---------------------------------------------------------------------------

/// The four lanes everything open falls into.
///
/// A founder's real question in the morning is not "what is on my list" — they
/// know, it is the thing that woke them at 4am. It is "which of these actually
/// bites today, and which just feels loud". So the app answers it rather than
/// asking, and every lane is DERIVED from facts already on the row: a person
/// attached, a date passed, a project it belongs to, the energy it costs.
///
/// Nothing here reads a self-assigned "urgent" flag first, because that is the
/// least reliable signal in the system — everything a founder types in feels
/// urgent at the moment they type it.
///
/// Order is deliberate, and `needle` outranking `rot` is the non-obvious part:
/// a deep-work loop captured three weeks ago and never scheduled is not
/// rubbish to be swept out, it is the important thing being avoided. Filing it
/// under "rot" would tell the founder to drop exactly what they should protect.
enum Lane { fire, needle, rot, noise }

class LaneMeta {
  final String label;
  final String blurb;
  final Color tone;
  const LaneMeta(this.label, this.blurb, this.tone);
}

const Map<Lane, LaneMeta> laneMeta = {
  Lane.fire: LaneMeta('On fire',
      'Someone gets hurt, or something breaks, if today ends without these.',
      AppTheme.signal),
  Lane.needle: LaneMeta('Moves the needle',
      'Nothing important moves unless you protect time for these.',
      AppTheme.ink),
  Lane.rot: LaneMeta('Been sitting',
      'Old, and nothing about them is load-bearing. Answer or let go — do not schedule.',
      AppTheme.signalDim),
  Lane.noise: LaneMeta('Noise',
      'Feels urgent. Is not. Batch it into one admin block, or drop it.',
      AppTheme.muted),
};

class LaneVerdict {
  final Lane lane;
  /// Why THIS row landed here, as a fact. Never the lane's name back at you.
  final String why;
  const LaneVerdict(this.lane, this.why);
}

String _firstName(String s) => s.trim().split(RegExp(r'\s+')).first;

/// Whole days from `today` to the stored date. Negative means it has passed.
int? _dayDelta(DateTime stored, String today) {
  final a = DateTime.tryParse('${dayKey(stored)}T00:00:00');
  final b = DateTime.tryParse('${today}T00:00:00');
  if (a == null || b == null) return null;
  return a.difference(b).inDays;
}

/// Which lane a loop is in, and the sentence that justifies it.
///
/// `today` is passed in rather than read from the clock so a list and its
/// header cannot disagree about what day it is mid-build.
LaneVerdict laneOf(Task t, String today, [DateTime? now]) {
  final owedDays = daysSince(t.updatedAt, now);

  // ── Fire. Something outside your head is already affected.
  if (t.dueDate != null) {
    final d = _dayDelta(t.dueDate!, today);
    if (d != null && d < 0) {
      final n = -d;
      return LaneVerdict(Lane.fire,
          'Was due ${n == 1 ? "yesterday" : "$n days ago"}.');
    }
  }
  if (t.isDecision && t.decideBy != null) {
    final d = _dayDelta(t.decideBy!, today);
    if (d != null && d <= 0) {
      return LaneVerdict(Lane.fire,
          d == 0 ? 'The decision is due today.' : 'The decision was due ${-d} days ago.');
    }
  }
  if (t.isOwedByYou) {
    return LaneVerdict(
        Lane.fire,
        owedDays >= 2
            ? '${_firstName(t.owedTo)} has been waiting $owedDays days.'
            : '${_firstName(t.owedTo)} is waiting on you.');
  }

  // ── Needle. Nothing breaks today, but nothing moves without it either.
  if (t.isDecision) {
    return const LaneVerdict(Lane.needle,
        'An open decision. Everything downstream of it is stalled.');
  }
  if (t.energyLevel == 2) {
    return const LaneVerdict(Lane.needle,
        'Deep work. It only ever happens on a day you protect it.');
  }
  if (t.projectId != null) {
    return const LaneVerdict(Lane.needle,
        'Attached to a project — this is how that project moves.');
  }
  if (t.priority == 2) {
    return const LaneVerdict(Lane.needle,
        'You marked this high when you wrote it down.');
  }

  // ── Rot. Old and unattached. The honest read: you are never doing this.
  final age = loopAge(t, now);
  if (age != null && age >= rotDays) {
    return LaneVerdict(Lane.rot,
        'Raw for $age days, with nobody and nothing waiting on it.');
  }

  // ── Noise.
  if (t.isBlockedOnThem) {
    return LaneVerdict(Lane.noise,
        'Sitting with ${_firstName(t.owedTo)}. Nudge it, do not schedule it.');
  }
  if (t.energyLevel == 0) {
    return const LaneVerdict(Lane.noise,
        'Admin. Worth ten minutes in a batch, not a slot in your day.');
  }
  return LaneVerdict(
      Lane.noise,
      age != null && age >= graceDays
          ? 'Been around $age days without ever mattering.'
          : 'Nothing is waiting on this.');
}

/// Triage order. Obligations to people first, then rot, then age — priority is
/// the last tiebreak rather than the first, because self-assigned priority is
/// the least reliable signal in the system.
int triageOrder(Task a, Task b, [DateTime? now]) {
  final owed = (b.isOwedByYou ? 1 : 0) - (a.isOwedByYou ? 1 : 0);
  if (owed != 0) return owed;
  final ageA = loopAge(a, now) ?? -1;
  final ageB = loopAge(b, now) ?? -1;
  if (ageA != ageB) return ageB - ageA;
  return b.priority - a.priority;
}

class LaneItem {
  final Task task;
  final String why;
  const LaneItem(this.task, this.why);
}

/// Group everything open into the four lanes, each already in triage order.
Map<Lane, List<LaneItem>> byLane(List<Task> tasks, String today, [DateTime? now]) {
  final out = <Lane, List<LaneItem>>{
    Lane.fire: [], Lane.needle: [], Lane.rot: [], Lane.noise: [],
  };
  for (final t in tasks) {
    if (t.completed || t.isReleased) continue;
    final v = laneOf(t, today, now);
    out[v.lane]!.add(LaneItem(t, v.why));
  }
  for (final k in out.keys) {
    out[k]!.sort((a, b) => triageOrder(a.task, b.task, now));
  }
  return out;
}

// ---------------------------------------------------------------------------
// The picks
// ---------------------------------------------------------------------------

/// What you commit to. Three is the promise.
const int committedPicks = 3;
/// A fourth is allowed, but it is explicitly a stretch, never a commitment.
const int maxPicks = 4;

/// The starting guess at a day's shape, not the truth. Advice, never a wall.
const Map<String, int> defaultCapacity = {'deep': 3, 'medium': 4, 'admin': 8};

class CapacityFit {
  final Map<String, int> used;
  final Map<String, int> limit;
  final List<String> over;
  /// Advice, phrased as a fact rather than a refusal. Null when it fits.
  final String? advice;
  const CapacityFit(this.used, this.limit, this.over, this.advice);
}

const _energyKey = {0: 'admin', 1: 'medium', 2: 'deep'};

CapacityFit capacityFit(List<Task> tasks, [Map<String, int>? limit]) {
  final lim = limit ?? defaultCapacity;
  final used = {'deep': 0, 'medium': 0, 'admin': 0};
  for (final t in tasks) {
    if (t.completed) continue;
    final k = _energyKey[t.energyLevel] ?? 'medium';
    used[k] = used[k]! + 1;
  }
  final over = used.keys.where((k) => used[k]! > (lim[k] ?? 0)).toList();
  if (over.isEmpty) return CapacityFit(used, lim, over, null);
  final worst = over.first;
  final excess = used[worst]! - lim[worst]!;
  return CapacityFit(used, lim, over,
      'That is $excess more $worst ${excess == 1 ? "block" : "blocks"} than a day of yours usually holds.');
}

class PlanVerdict {
  final String text;
  final bool warn;
  const PlanVerdict(this.text, this.warn);
}

/// What the app should say back about a set of picks.
///
/// This is the part a list cannot do. A founder who picks three admin tasks has
/// planned a day where the company does not move, and no checkbox will ever
/// tell them that. Returns null when the selection is genuinely fine —
/// commentary on every plan is noise, and noise is how advice stops being read.
PlanVerdict? planVerdict(List<Task> picks, List<Lane> lanes, int fireCount) {
  if (picks.isEmpty) return null;

  final deep = picks.where((t) => t.energyLevel == 2).length;
  final pickedFire = lanes.where((l) => l == Lane.fire).length;

  // The expensive mistake: fires burning while the day is spent elsewhere.
  if (fireCount > 0 && pickedFire == 0) {
    return PlanVerdict(
        '$fireCount ${fireCount == 1 ? "loop is" : "loops are"} on fire and you picked none of them. '
        'That is a choice — just make it on purpose.',
        true);
  }

  // The quiet mistake: a full day that moves nothing.
  if (picks.length >= 2 && lanes.every((l) => l == Lane.noise)) {
    return const PlanVerdict(
        'Every pick is noise. You have planned a busy day in which the company does not move.',
        true);
  }

  if (deep >= 3) {
    return const PlanVerdict(
        'Three deep blocks is more than almost any day actually holds. Expect to finish two — '
        'pick which two now rather than at 6pm.',
        true);
  }

  if (lanes.contains(Lane.needle) && picks.length <= committedPicks) {
    return PlanVerdict(
        fireCount > 0
            ? 'Every fire is on the list and something load-bearing is protected. '
                'That is what a good day looks like on paper.'
            : 'Nothing is burning and you have protected something that matters. '
                'That is the whole game.',
        false);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Next move
// ---------------------------------------------------------------------------

/// The next move to offer when a loop has none.
///
/// The fallbacks are deliberately concrete and small — "spend two minutes" is
/// startable at 8am in a way that "finish the pricing page" never is.
String draftNextMove(Task t) {
  final existing = t.firstStep.trim();
  if (existing.isNotEmpty) return existing;
  if (t.isDecision) {
    final unlock = t.decisionUnlock.trim();
    return unlock.isNotEmpty ? 'Get $unlock, then decide' : 'Write down what would make this obvious';
  }
  if (t.isBlockedOnThem) return 'Chase ${_firstName(t.owedTo)}';
  if (t.isOwedByYou) return 'Send ${_firstName(t.owedTo)} a holding reply';
  return 'Open it and spend two minutes';
}
