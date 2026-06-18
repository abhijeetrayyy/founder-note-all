import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/note.dart';
import '../../providers/notes_provider.dart';
import '../../theme/app_theme.dart';
import '../widgets/empty_state.dart';
import '../widgets/quick_add_sheet.dart';
import 'note_editor_screen.dart';

class NotesScreen extends StatefulWidget {
  const NotesScreen({super.key});
  @override State<NotesScreen> createState() => _NotesScreenState();
}

class _NotesScreenState extends State<NotesScreen> {
  final _search = TextEditingController();
  String _categoryFilter = 'All';

  @override
  void dispose() { _search.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final p = context.watch<NotesProvider>();
    final all = p.notes;
    final q = _search.text.trim().toLowerCase();
    final filtered = all.where((n) {
      if (_categoryFilter != 'All' && n.category != _categoryFilter) return false;
      if (q.isEmpty) return true;
      return n.title.toLowerCase().contains(q) || n.content.toLowerCase().contains(q);
    }).toList();
    final categories = ['All', ...{for (final n in all) n.category}];

    return Scaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            pinned: true, floating: true, backgroundColor: Theme.of(context).scaffoldBackgroundColor, automaticallyImplyLeading: false,
            title: const Text('Notes', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
            actions: [
              IconButton(icon: Icon(p.grid ? Icons.view_list_rounded : Icons.grid_view_rounded), onPressed: () => p.toggleGrid()),
              PopupMenuButton<NoteSortMode>(
                icon: const Icon(Icons.sort_rounded),
                onSelected: (s) => p.setSort(s),
                itemBuilder: (_) => [
                  const PopupMenuItem(value: NoteSortMode.updatedDesc, child: Text('Last updated')),
                  const PopupMenuItem(value: NoteSortMode.createdDesc, child: Text('Date created')),
                  const PopupMenuItem(value: NoteSortMode.titleAsc, child: Text('Title A-Z')),
                ],
              ),
              const SizedBox(width: 4),
            ],
          ),
          if (all.isEmpty)
            SliverFillRemaining(hasScrollBody: false, child: EmptyState(
              icon: Icons.notes_rounded,
              title: 'No notes yet',
              subtitle: 'Capture thoughts, ideas, and meeting notes.',
              actionLabel: 'Quick add',
              onAction: () => showQuickAdd(context, initialType: QuickAddType.note),
            ))
          else ...[
            SliverToBoxAdapter(child: SizedBox(
              height: 36,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  for (final c in categories) Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: Semantics(
                      button: true, selected: _categoryFilter == c, label: c,
                      child: InkWell(
                        onTap: () { HapticFeedback.selectionClick(); setState(() => _categoryFilter = c); },
                        borderRadius: BorderRadius.circular(22),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          height: 36,
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: _categoryFilter == c ? AppTheme.primary : (Theme.of(context).brightness == Brightness.dark ? AppTheme.darkSurface : AppTheme.lightSurface),
                            borderRadius: BorderRadius.circular(22),
                            border: Border.all(color: _categoryFilter == c ? AppTheme.primary : Theme.of(context).dividerColor, width: 1.5),
                          ),
                          child: Text(c, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: _categoryFilter == c ? Colors.white : (Theme.of(context).brightness == Brightness.dark ? AppTheme.darkText : AppTheme.lightText))),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            )),
            if (filtered.isEmpty)
              SliverFillRemaining(hasScrollBody: false, child: Center(child: Padding(padding: const EdgeInsets.all(32), child: Text('No notes match your filter.', style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)))))
            else if (p.grid)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                sliver: SliverGrid(gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(maxCrossAxisExtent: 220, mainAxisSpacing: 10, crossAxisSpacing: 10, childAspectRatio: 0.95), delegate: SliverChildBuilderDelegate((_, i) => _GridNote(note: filtered[i], onTap: () => _open(filtered[i].id)), childCount: filtered.length)),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                sliver: SliverList.builder(itemCount: filtered.length, itemBuilder: (_, i) => _ListNote(note: filtered[i], onTap: () => _open(filtered[i].id), onArchive: () => context.read<NotesProvider>().toggleArchive(filtered[i].id), onDelete: () => context.read<NotesProvider>().remove(filtered[i].id))),
              ),
          ],
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showQuickAdd(context, initialType: QuickAddType.note),
        icon: const Icon(Icons.add_rounded, size: 20),
        label: const Text('New note'),
      ),
    );
  }

  void _open(String id) {
    HapticFeedback.lightImpact();
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => NoteEditorScreen(noteId: id), fullscreenDialog: true));
  }
}

class _GridNote extends StatelessWidget {
  final Note note;
  final VoidCallback onTap;
  const _GridNote({required this.note, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: Color(note.color).withValues(alpha: isDark ? 0.12 : 0.07), borderRadius: BorderRadius.circular(14), border: Border.all(color: Color(note.color).withValues(alpha: 0.3))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(width: 8, height: 8, decoration: BoxDecoration(color: Color(note.color), shape: BoxShape.circle)),
              const SizedBox(width: 6),
              if (note.isPinned) const Icon(Icons.push_pin_rounded, size: 12, color: AppTheme.warning),
              const Spacer(),
              Text(note.category, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, letterSpacing: 1)),
            ]),
            const Spacer(),
            Text(note.title.isEmpty ? 'Untitled' : note.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, height: 1.3)),
            if (note.content.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 4), child: Text(note.content, maxLines: 4, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, height: 1.4))),
            const SizedBox(height: 6),
            Text(DateFormat('MMM d').format(note.updatedAt), style: TextStyle(fontSize: 10, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, fontWeight: FontWeight.w600)),
          ]),
        ),
      ),
    );
  }
}

class _ListNote extends StatelessWidget {
  final Note note;
  final VoidCallback onTap;
  final VoidCallback onArchive;
  final VoidCallback onDelete;
  const _ListNote({required this.note, required this.onTap, required this.onArchive, required this.onDelete});
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Dismissible(
      key: ValueKey(note.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        margin: const EdgeInsets.only(bottom: 6),
        decoration: BoxDecoration(color: AppTheme.energyMedium, borderRadius: BorderRadius.circular(14)),
        child: const Row(mainAxisAlignment: MainAxisAlignment.end, children: [Icon(Icons.archive_rounded, color: Colors.white), SizedBox(width: 8), Text('Archive', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700))]),
      ),
      onDismissed: (_) => onArchive(),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          onLongPress: onDelete,
          child: Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(14)),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(width: 4, height: 40, decoration: BoxDecoration(color: Color(note.color), borderRadius: BorderRadius.circular(2))),
              const SizedBox(width: 10),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    if (note.isPinned) const Padding(padding: EdgeInsets.only(right: 4), child: Icon(Icons.push_pin_rounded, size: 12, color: AppTheme.warning)),
                    Expanded(child: Text(note.title.isEmpty ? 'Untitled' : note.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700))),
                  ]),
                  if (note.content.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 2), child: Text(note.content, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, height: 1.4))),
                  const SizedBox(height: 4),
                  Text('${note.category} · ${DateFormat('MMM d').format(note.updatedAt)}', style: TextStyle(fontSize: 10, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, fontWeight: FontWeight.w600)),
                ]),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}
