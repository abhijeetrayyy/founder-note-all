import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config/supabase_config.dart';
import 'providers/app_provider.dart';
import 'providers/notes_provider.dart';
import 'providers/tasks_provider.dart';
import 'providers/projects_provider.dart';
import 'providers/reminder_provider.dart';
import 'providers/journal_provider.dart';
import 'providers/tag_provider.dart';
import 'providers/habit_provider.dart';
import 'providers/daily_plan_provider.dart';
import 'providers/goals_provider.dart';
import 'providers/energy_provider.dart';
import 'providers/auth_provider.dart';
import 'services/notifications/notification_service.dart';
import 'theme/app_theme.dart';
import 'screens/app_shell.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await NotificationService.instance.init();
  await Supabase.initialize(
    url: SupabaseConfig.url,
    publishableKey: SupabaseConfig.anonKey,
  );
  runApp(const FounderApp());
}

class FounderApp extends StatelessWidget {
  const FounderApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppProvider()..loadPreferences()),
        ChangeNotifierProvider(create: (_) => NotesProvider()..init()),
        ChangeNotifierProvider(create: (_) => TasksProvider()..load()),
        ChangeNotifierProvider(create: (_) => ProjectsProvider()..load()),
        ChangeNotifierProvider(create: (_) => ReminderProvider()..load()..checkMissed()),
        ChangeNotifierProvider(create: (_) => JournalProvider()..load()),
        ChangeNotifierProvider(create: (_) => TagProvider()..load()),
        ChangeNotifierProvider(create: (_) => HabitProvider()..load()),
        ChangeNotifierProvider(create: (_) => DailyPlanProvider()..load()),
        ChangeNotifierProvider(create: (_) => GoalsProvider()..load()),
        ChangeNotifierProvider(create: (_) => EnergyProvider()..load()),
        ChangeNotifierProvider(create: (_) => AuthProvider()..init()),
      ],
      child: Consumer<AppProvider>(
        builder: (context, app, _) {
          return MaterialApp(
            title: 'Founder',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light,
            darkTheme: AppTheme.dark,
            themeMode: app.isDarkMode ? ThemeMode.dark : ThemeMode.light,
            home: const AppShell(),
          );
        },
      ),
    );
  }
}
