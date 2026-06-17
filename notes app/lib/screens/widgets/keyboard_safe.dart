import 'package:flutter/material.dart';

/// Wrap a screen body so its content slides above the keyboard automatically,
/// and a sticky action bar can sit at the bottom (above the keyboard).
class KeyboardSafeScaffold extends StatelessWidget {
  final PreferredSizeWidget? appBar;
  final Widget body;
  final Widget? bottomBar;
  final Widget? fab;
  final FloatingActionButtonLocation? fabLocation;
  final Color? backgroundColor;
  final bool resizeToAvoidBottomInset;
  final bool extendBodyBehindAppBar;
  final Widget? bottomNavigationBar;

  const KeyboardSafeScaffold({
    super.key,
    this.appBar,
    required this.body,
    this.bottomBar,
    this.fab,
    this.fabLocation,
    this.backgroundColor,
    this.resizeToAvoidBottomInset = true,
    this.extendBodyBehindAppBar = false,
    this.bottomNavigationBar,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: appBar,
      backgroundColor: backgroundColor,
      resizeToAvoidBottomInset: resizeToAvoidBottomInset,
      extendBodyBehindAppBar: extendBodyBehindAppBar,
      floatingActionButton: fab,
      floatingActionButtonLocation: fabLocation,
      bottomNavigationBar: bottomNavigationBar,
      body: Column(
        children: [
          Expanded(child: body),
          if (bottomBar != null) bottomBar!,
        ],
      ),
    );
  }
}

/// A bottom sheet that respects keyboard insets and never traps input.
/// Use this for any input/edit sheet so the field never gets hidden.
Future<T?> showAppSheet<T>({
  required BuildContext context,
  required WidgetBuilder builder,
  bool isDismissible = true,
  bool useSafeArea = true,
  double initialChildSize = 0.6,
  double maxChildSize = 0.95,
  double minChildSize = 0.3,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: useSafeArea,
    isDismissible: isDismissible,
    backgroundColor: Theme.of(context).cardColor,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    builder: builder,
  );
}
