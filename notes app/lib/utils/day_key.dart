/// Calendar-day keys, always in the device's local time.
///
/// Dates arrive here from two places that disagree. A task created on the
/// device carries a local `DateTime`; a task pulled from Supabase carries a
/// `timestamptz` that `DateTime.parse` returns as **UTC**. Calling
/// `toIso8601String().substring(0, 10)` on those two produces the local day for
/// one and the UTC day for the other — so a loop due at 01:30 on Thursday in
/// IST is stored as Wednesday 20:00 UTC and silently fails every "is this due
/// today" check, disappearing from the day it belongs to.
///
/// Every comparison of a due date against "today" goes through here so both
/// sides are reduced the same way.
String dayKey(DateTime d) {
  final l = d.toLocal();
  final m = l.month.toString().padLeft(2, '0');
  final day = l.day.toString().padLeft(2, '0');
  return '${l.year}-$m-$day';
}

/// Today, as a calendar-day key.
String todayKey() => dayKey(DateTime.now());
