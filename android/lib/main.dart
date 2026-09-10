import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/storage/key_value_store.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/notifications/providers/notifications_provider.dart';
import 'router/app_router.dart';

class SalonApp extends ConsumerStatefulWidget {
  const SalonApp({super.key});

  @override
  ConsumerState<SalonApp> createState() => _SalonAppState();
}

class _SalonAppState extends ConsumerState<SalonApp> {
  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() {
      ref.read(authProvider.notifier).initialize();
      // Binds the notification socket once auth resolves.
      ref.read(notificationsSocketBinder);
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      title: 'فوتسال — رزرو سالن',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.system,
      locale: const Locale('fa', 'IR'),
      supportedLocales: const [Locale('fa', 'IR'), Locale('en', 'US')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: router,
    );
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load();
  final prefs = await SharedPreferences.getInstance();
  final container = ProviderContainer(
    overrides: [
      keyValueStoreProvider.overrideWithValue(KeyValueStore(prefs)),
    ],
  );
  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const SalonApp(),
    ),
  );
}
