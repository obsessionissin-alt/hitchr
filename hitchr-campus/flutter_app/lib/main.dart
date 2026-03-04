import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'providers/app_provider.dart';
import 'services/push_notifications.dart';
import 'theme/hitchr_theme.dart';
import 'router.dart';

const _kBackendUrlKey = 'backend_url';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await PushNotificationsService.instance.initialize();
  
  // Initialize Mapbox token from --dart-define (if provided)
  const mapboxToken = String.fromEnvironment('MAPBOX_ACCESS_TOKEN', defaultValue: '');
  if (mapboxToken.isNotEmpty) {
    MapboxOptions.setAccessToken(mapboxToken);
  }
  
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: HColors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(const ProviderScope(child: BootWrapper(child: HitchrApp())));
}

/// Loads saved backend URL and applies it to the API. Use this as the root widget.
class BootWrapper extends ConsumerStatefulWidget {
  final Widget child;
  const BootWrapper({super.key, required this.child});

  @override
  ConsumerState<BootWrapper> createState() => _BootWrapperState();
}

class _BootWrapperState extends ConsumerState<BootWrapper> {
  bool _booted = false;

  @override
  void initState() {
    super.initState();
    _applySavedBackendUrl();
  }

  Future<void> _applySavedBackendUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final url = prefs.getString(_kBackendUrlKey);
    if (url != null && url.isNotEmpty) {
      ref.read(apiProvider).setBaseUrl(url);
    }
    if (mounted) setState(() => _booted = true);
  }

  @override
  Widget build(BuildContext context) {
    if (!_booted) {
      return const Material(
        child: Center(child: CircularProgressIndicator(color: HColors.coral500)),
      );
    }
    return widget.child;
  }
}

class HitchrApp extends StatelessWidget {
  const HitchrApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Hitchr Campus',
      theme: hitchrTheme(),
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
