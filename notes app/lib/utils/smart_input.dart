/// NLP-lite parser for natural language task input.
/// Detects dates, times, priority, energy level, recurrence, MIT flag, projects, tags.
class SmartInput {
  final String original;
  final String cleanedTitle;
  final DateTime? date;
  final TimeOfDayValue? time;
  final int? priority; // 0=low, 1=med, 2=high
  final int? energy; // 0=admin, 1=med, 2=deep
  final int? recurrence; // see RecurrenceKind
  final bool isMIT;
  final String? projectHint;
  final List<String> tags;
  final bool isTask;

  const SmartInput({
    required this.original,
    required this.cleanedTitle,
    this.date,
    this.time,
    this.priority,
    this.energy,
    this.recurrence,
    this.isMIT = false,
    this.projectHint,
    this.tags = const [],
    this.isTask = true,
  });

  String get summary {
    final parts = <String>[];
    if (isMIT) parts.add('MIT');
    if (date != null) parts.add(_fmtDate(date!));
    if (time != null) parts.add('at ${time!.label}');
    if (priority != null && priority! > 0) parts.add(['Low', 'Medium', 'High'][priority!]);
    if (energy != null) parts.add(['Admin', 'Medium', 'Deep'][energy!]);
    if (recurrence != null) parts.add(['None', 'Daily', 'Weekly', 'Monthly'][recurrence!]);
    if (projectHint != null) parts.add('→ $projectHint');
    return parts.isEmpty ? 'Quick capture' : parts.join(' · ');
  }

  static String _fmtDate(DateTime d) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final now = DateTime.now();
    if (d.year == now.year && d.month == now.month && d.day == now.day) return 'Today';
    if (d.year == now.year && d.month == now.month && d.day == now.day + 1) return 'Tomorrow';
    return '${months[d.month - 1]} ${d.day}';
  }

  static SmartInput parse(String text) {
    if (text.trim().isEmpty) {
      return SmartInput(original: '', cleanedTitle: '', isTask: false);
    }

    var remaining = text.trim();
    var date = _parseDate(remaining);
    var time = _parseTime(remaining);
    var priority = _parsePriority(remaining);
    var energy = _parseEnergy(remaining);
    var recurrence = _parseRecurrence(remaining);
    var isMIT = _parseMIT(remaining);
    final projectHint = _parseProject(remaining);
    final tags = _parseTags(remaining);

    // Strip matched keywords from title
    final toStrip = <RegExp>[
      RegExp(r'\b(today|tomorrow|tonight|tonite)\b', caseSensitive: false),
      RegExp(r'\bat \d{1,2}(:\d{2})?(\s?(am|pm))?\b', caseSensitive: false),
      RegExp(r'\b(morning|afternoon|evening|noon|midnight)\b', caseSensitive: false),
      RegExp(r'\b(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month)\b', caseSensitive: false),
      RegExp(r'\b(in \d+\s+(minute|minutes|hour|hours|day|days|week|weeks|month|months)\b)', caseSensitive: false),
      RegExp(r'\bon\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b', caseSensitive: false),
      RegExp(r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}\b', caseSensitive: false),
      RegExp(r'\b\d{1,2}/\d{1,2}(/\d{2,4})?\b'),
      RegExp(r'\b(urgent|asap|important|critical|low priority|high priority|deep work|deep focus|admin task|quick)\b', caseSensitive: false),
      RegExp(r'\b(every|daily|weekly|monthly|recurring)\b', caseSensitive: false),
      RegExp(r'\b(most important|mit|key task)\b', caseSensitive: false),
      RegExp(r'#[\w-]+', caseSensitive: false),
    ];
    for (final re in toStrip) {
      remaining = remaining.replaceAll(re, '').trim();
    }
    remaining = remaining.replaceAll(RegExp(r'\s+'), ' ').trim();
    // Strip leading verb-ish "to" if it's a leftover ("to the office")
    if (remaining.toLowerCase().startsWith('to ')) remaining = remaining.substring(3);

    final isTask = _looksLikeTask(text);

    return SmartInput(
      original: text,
      cleanedTitle: remaining,
      date: date,
      time: time,
      priority: priority,
      energy: energy,
      recurrence: recurrence,
      isMIT: isMIT,
      projectHint: projectHint,
      tags: tags,
      isTask: isTask,
    );
  }

  // ── Detection helpers ────────────────────────────────────────────────────
  static bool _looksLikeTask(String text) {
    final lower = text.toLowerCase();
    if (lower.startsWith('/task')) return true;
    if (lower.startsWith('/mit')) return true;
    if (lower.startsWith('/note')) return false;
    if (lower.startsWith('/idea')) return false;
    if (RegExp(r'^(buy|call|email|send|fix|write|review|ship|build|finish|complete|schedule|reply|book|reserve|pay|submit|prepare|draft|update|clean|organize|talk|meet|investigate|research|read|learn|practice|design|plan|create|make|tidy|sort|push|deploy|merge|test|verify|check|file|submit|print|order|return|reply|confirm|contact|reach out|follow up|setup|set up|clean up|clear|triage|prioritize|respond|audit|update|reach)\b').hasMatch(lower)) {
      return true;
    }
    if (text.endsWith('!') || text.endsWith('?')) return true;
    if (lower.contains(' by ') || lower.contains(' tomorrow') || lower.contains(' today')) return true;
    return false;
  }

  static DateTime? _parseDate(String text) {
    final lower = text.toLowerCase();
    final now = DateTime.now();
    if (RegExp(r'\btoday\b').hasMatch(lower)) return DateTime(now.year, now.month, now.day);
    if (RegExp(r'\btonight\b|\btonite\b').hasMatch(lower)) return DateTime(now.year, now.month, now.day);
    if (RegExp(r'\btomorrow\b').hasMatch(lower)) return DateTime(now.year, now.month, now.day + 1);

    final inDays = RegExp(r'\bin (\d+) days?\b').firstMatch(lower);
    if (inDays != null) return DateTime(now.year, now.month, now.day + int.parse(inDays.group(1)!));

    final inWeeks = RegExp(r'\bin (\d+) weeks?\b').firstMatch(lower);
    if (inWeeks != null) return DateTime(now.year, now.month, now.day + int.parse(inWeeks.group(1)!) * 7);

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (var i = 0; i < days.length; i++) {
      final re = RegExp(r'\b(next|this)?\s*${days[i]}\b');
      final m = re.firstMatch(lower);
      if (m != null) {
        final isNext = m.group(1) == 'next';
        var target = i - now.weekday + 1;
        if (target <= 0 || isNext) {
          if (isNext) target = (i - now.weekday + 1) + 7;
          else target += 7;
        }
        return DateTime(now.year, now.month, now.day + target);
      }
    }

    if (RegExp(r'\bnext week\b').hasMatch(lower)) return DateTime(now.year, now.month, now.day + 7);
    if (RegExp(r'\bnext month\b').hasMatch(lower)) return DateTime(now.year, now.month + 1, now.day);

    // "Dec 15" or "December 15"
    final monthMatch = RegExp(r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})\b', caseSensitive: false).firstMatch(lower);
    if (monthMatch != null) {
      final m = _monthIndex(monthMatch.group(1)!);
      final d = int.parse(monthMatch.group(2)!);
      var year = now.year;
      if (m < now.month || (m == now.month && d < now.day)) year += 1;
      return DateTime(year, m, d);
    }

    // MM/DD
    final slash = RegExp(r'\b(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?\b').firstMatch(text);
    if (slash != null) {
      final m = int.parse(slash.group(1)!);
      final d = int.parse(slash.group(2)!);
      var y = now.year;
      if (slash.group(3) != null) {
        y = int.parse(slash.group(3)!);
        if (y < 100) y += 2000;
      }
      return DateTime(y, m, d);
    }

    return null;
  }

  static int _monthIndex(String m) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return months.indexOf(m.substring(0, 3).toLowerCase()) + 1;
  }

  static TimeOfDayValue? _parseTime(String text) {
    final lower = text.toLowerCase();
    if (RegExp(r'\b(morning|am)\b').hasMatch(lower)) return const TimeOfDayValue(9, 0, 'Morning');
    if (RegExp(r'\b(afternoon|noon)\b').hasMatch(lower)) return const TimeOfDayValue(13, 0, 'Afternoon');
    if (RegExp(r'\b(evening|tonight|pm)\b').hasMatch(lower)) return const TimeOfDayValue(18, 0, 'Evening');

    final m = RegExp(r'\bat (\d{1,2})(:(\d{2}))?\s?(am|pm)?\b').firstMatch(lower);
    if (m != null) {
      var h = int.parse(m.group(1)!);
      final min = m.group(3) != null ? int.parse(m.group(3)!) : 0;
      final ampm = m.group(4);
      if (ampm == 'pm' && h < 12) h += 12;
      if (ampm == 'am' && h == 12) h = 0;
      return TimeOfDayValue(h, min, '${h.toString().padLeft(2, '0')}:${min.toString().padLeft(2, '0')}');
    }
    return null;
  }

  static int? _parsePriority(String text) {
    final lower = text.toLowerCase();
    if (RegExp(r'\b(urgent|asap|critical|important|!!!)\b').hasMatch(lower)) return 2;
    if (RegExp(r'\b(high priority|!)\b').hasMatch(lower)) return 2;
    if (RegExp(r'\b(low priority)\b').hasMatch(lower)) return 0;
    return null;
  }

  static int? _parseEnergy(String text) {
    final lower = text.toLowerCase();
    if (RegExp(r'\b(deep work|deep focus|focus work)\b').hasMatch(lower)) return 2;
    if (RegExp(r'\b(admin task|admin|quick win|quick)\b').hasMatch(lower)) return 0;
    if (RegExp(r'\b(medium|medium focus)\b').hasMatch(lower)) return 1;
    return null;
  }

  static int? _parseRecurrence(String text) {
    final lower = text.toLowerCase();
    if (RegExp(r'\bevery day\b|\bdaily\b').hasMatch(lower)) return 1;
    if (RegExp(r'\bevery week\b|\bweekly\b').hasMatch(lower)) return 2;
    if (RegExp(r'\bevery month\b|\bmonthly\b').hasMatch(lower)) return 3;
    return null;
  }

  static bool _parseMIT(String text) {
    final lower = text.toLowerCase();
    if (lower.startsWith('/mit')) return true;
    if (RegExp(r'\b(most important|key task|mit)\b').hasMatch(lower)) return true;
    return false;
  }

  static String? _parseProject(String text) {
    final m = RegExp(r'\b(?:in|for|@)([A-Z][\w-]+|\w[\w-]+)\b').firstMatch(text);
    return m?.group(1);
  }

  static List<String> _parseTags(String text) {
    return RegExp(r'#([\w-]+)').allMatches(text).map((m) => m.group(1)!).toList();
  }
}

class TimeOfDayValue {
  final int hour;
  final int minute;
  final String label;
  const TimeOfDayValue(this.hour, this.minute, this.label);
}
