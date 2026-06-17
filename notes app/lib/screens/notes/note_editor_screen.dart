import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/notes_provider.dart';
import '../../providers/projects_provider.dart';
import '../../providers/tag_provider.dart';
import '../widgets/tag_picker.dart';
import '../widgets/keyboard_safe.dart';
import '../../theme/app_theme.dart';

class NoteEditorScreen extends StatefulWidget {
  final String? noteId;
  const NoteEditorScreen({super.key, this.noteId});

  @override State<NoteEditorScreen> createState() => _NoteEditorScreenState();
}

class _NoteEditorScreenState extends State<NoteEditorScreen> {
  final _title = TextEditingController();
  final _content = TextEditingController();
  String _category = 'General';
  int _color = 0xFF5B4FE9;
  String? _projectId;
  Set<String> _tagIds = {};
  bool _locked = false;
  bool _dirty = false;
  bool _saving = false;
  String _saveStatus = 'Saved';
  Timer? _autosaveTimer;
  String? _loadedId;
  bool get _editing => widget.noteId != null;

  @override
  void initState() {
    super.initState();
    _title.addListener(_onChanged);
    _content.addListener(_onChanged);
    if (_editing) _load();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_editing && _loadedId == null) _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _saveStatus = 'Loading…'; });
    final p = context.read<NotesProvider>();
    final found = p.notes.where((x) => x.id == widget.noteId).firstOrNull;
    if (found != null) {
      setState(() {
        _title.text = found.title;
        _content.text = found.content;
        _category = found.category;
        _color = found.color;
        _locked = found.isLocked;
        _projectId = found.projectId;
        _loadedId = found.id;
        _dirty = false;
        _saveStatus = 'Saved';
      });
      if (!mounted) return;
      final tags = await context.read<TagProvider>().getForNote(widget.noteId!);
      if (!mounted) return;
      setState(() => _tagIds = tags.map((t) => t.id).toSet());
    }
  }

  @override
  void dispose() {
    _autosaveTimer?.cancel();
    _title.dispose();
    _content.dispose();
    super.dispose();
  }

  void _onChanged() {
    if (!_dirty) setState(() => _dirty = true);
    setState(() => _saveStatus = 'Editing…');
    _autosaveTimer?.cancel();
    _autosaveTimer = Timer(const Duration(milliseconds: 800), _autosave);
  }

  Future<void> _autosave() async {
    if (!_dirty || !_editing || _saving) return;
    await _save(silent: true);
  }

  Future<void> _save({bool silent = false, bool pop = true}) async {
    if (_saving) return;
    final t = _title.text.trim();
    final c = _content.text.trim();
    if (t.isEmpty && c.isEmpty) {
      if (!silent && mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Add a title or content')));
      return;
    }
    setState(() { _saving = true; _saveStatus = 'Saving…'; });
    final p = context.read<NotesProvider>();
    final tagp = context.read<TagProvider>();
    try {
      String? id = _loadedId;
      if (_editing && id != null) {
        await p.update(id: id, title: t, content: c, category: _category, color: _color, projectId: _projectId, clearProject: _projectId == null);
        await tagp.setNoteTags(id, _tagIds.toList());
      } else {
        await p.add(title: t.isEmpty ? 'Untitled' : t, content: c, category: _category, color: _color, projectId: _projectId);
        final created = p.notes.firstWhere((x) => x.title == (t.isEmpty ? 'Untitled' : t) && x.content == c, orElse: () => p.notes.first);
        id = created.id;
        await tagp.setNoteTags(id, _tagIds.toList());
      }
      if (mounted) {
        setState(() { _dirty = false; _saveStatus = 'Saved'; _loadedId = id; });
        if (pop) Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        setState(() { _saving = false; _saveStatus = 'Save failed'; });
        if (!silent) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  Future<void> _delete() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete note?'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), style: FilledButton.styleFrom(backgroundColor: AppTheme.danger), child: const Text('Delete')),
        ],
      ),
    );
    if (confirm != true || !mounted) return;
    await context.read<NotesProvider>().remove(widget.noteId!);
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final projects = context.watch<ProjectsProvider>().projects;

    return KeyboardSafeScaffold(
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () async { await _save(pop: false); if (mounted) Navigator.pop(context); }),
        title: Text(_editing ? 'Note' : 'New note', style: const TextStyle(fontSize: 18)),
        actions: [
          if (_editing) IconButton(icon: const Icon(Icons.delete_outline_rounded), onPressed: _delete),
          IconButton(icon: Icon(_locked ? Icons.lock_rounded : Icons.lock_open_rounded), tooltip: _locked ? 'Unlock' : 'Lock', onPressed: () => setState(() { _locked = !_locked; _dirty = true; })),
          TextButton(
            onPressed: _saving ? null : () => _save(),
            child: Text('Save', style: TextStyle(fontWeight: FontWeight.w700, color: _saveStatus == 'Saved' ? AppTheme.primary : null)),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
        children: [
          // ── Title (huge, bold, borderless)
          TextField(
            controller: _title,
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Color(_color), height: 1.2),
            maxLines: null,
            decoration: const InputDecoration(
              hintText: 'Title',
              border: InputBorder.none, filled: false, contentPadding: EdgeInsets.zero,
            ),
          ),
          const SizedBox(height: 6),
          // Save status
          Row(children: [
            Container(width: 6, height: 6, decoration: BoxDecoration(color: _saveStatus == 'Saved' ? AppTheme.success : AppTheme.warning, shape: BoxShape.circle)),
            const SizedBox(width: 6),
            Text(_saveStatus, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
          ]),
          const SizedBox(height: 14),
          // ── Content (full markdown)
          TextField(
            controller: _content,
            maxLines: null,
            minLines: 8,
            style: TextStyle(fontSize: 16, height: 1.65, color: isDark ? AppTheme.darkText : AppTheme.lightText),
            decoration: InputDecoration(
              hintText: 'Start writing… Markdown supported.',
              hintStyle: TextStyle(color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted),
              border: InputBorder.none,
              contentPadding: EdgeInsets.zero,
              isDense: false,
            ),
          ),
          const SizedBox(height: 20),
          const _SectionTitle('CATEGORY'),
          Wrap(spacing: 6, runSpacing: 6, children: [
            for (final c in ['General', 'Work', 'Personal', 'Ideas', 'Todo'])
              _Pill(label: c, selected: _category == c, color: AppTheme.primary, onTap: () => setState(() { _category = c; _dirty = true; })),
          ]),
          const SizedBox(height: 20),
          const _SectionTitle('PROJECT'),
          Wrap(spacing: 6, runSpacing: 6, children: [
            _Pill(label: 'None', selected: _projectId == null, color: Colors.grey, onTap: () => setState(() { _projectId = null; _dirty = true; })),
            ...projects.map((p) => _Pill(label: p.name, selected: _projectId == p.id, color: Color(p.color), onTap: () => setState(() { _projectId = p.id; _dirty = true; }))),
          ]),
          const SizedBox(height: 20),
          const _SectionTitle('COLOR'),
          Wrap(spacing: 10, runSpacing: 10, children: [
            for (final c in const [0xFF5B4FE9, 0xFF22C55E, 0xFFF59E0B, 0xFFEF4444, 0xFF3B82F6, 0xFFEC4899, 0xFF14B8A6, 0xFF8B5CF6, 0xFF64748B])
              GestureDetector(
                onTap: () => setState(() { _color = c; _dirty = true; }),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 32, height: 32,
                  decoration: BoxDecoration(
                    color: Color(c), shape: BoxShape.circle,
                    border: _color == c ? Border.all(color: Colors.white, width: 3) : null,
                    boxShadow: _color == c ? [BoxShadow(color: Color(c).withValues(alpha: 0.5), blurRadius: 8)] : null,
                  ),
                  child: _color == c ? const Icon(Icons.check, color: Colors.white, size: 16) : null,
                ),
              ),
          ]),
          const SizedBox(height: 20),
          const _SectionTitle('TAGS'),
          TagPicker(selectedTagIds: _tagIds, onChanged: (ids) => setState(() { _tagIds = ids; _dirty = true; })),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(left: 2, bottom: 8),
    child: Text(text, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.4, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
  );
}

class _Pill extends StatelessWidget {
  final String label;
  final bool selected;
  final Color color;
  final VoidCallback onTap;
  const _Pill({required this.label, required this.selected, required this.color, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? color : Colors.transparent,
          border: Border.all(color: selected ? color : Theme.of(context).dividerColor),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: selected ? Colors.white : (Theme.of(context).brightness == Brightness.dark ? AppTheme.darkText : AppTheme.lightText))),
      ),
    );
  }
}
