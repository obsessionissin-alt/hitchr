import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../theme/hitchr_theme.dart';
import '../../providers/app_provider.dart';
import '../../widgets/backend_url_sheet.dart';
import '../../widgets/hitchr_widgets.dart';

const _kBackendUrlKey = 'backend_url';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});
  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> with TickerProviderStateMixin {
  final _nameController = TextEditingController();
  final _collegeController = TextEditingController();
  bool _loading = false;
  bool _checking = true;
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  void _showBackendUrlSettings() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(HRadius.xl)),
      ),
      builder: (ctx) => BackendUrlSheet(
        currentUrl: ref.read(apiProvider).baseUrl,
        onSave: (url) async {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(_kBackendUrlKey, url);
          ref.read(apiProvider).setBaseUrl(url);
          if (ctx.mounted) {
            Navigator.pop(ctx);
            ScaffoldMessenger.of(ctx).showSnackBar(
              SnackBar(
                content: Text('Backend URL updated. Try again.'),
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
        },
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
    _fadeAnimation = CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
    _checkExistingSession();
  }

  Future<void> _checkExistingSession() async {
    final restored = await ref.read(userProvider.notifier).restoreSession();
    if (restored && mounted) {
      await _seedOnce();
      if (!mounted) return;
      context.go('/home');
    } else {
      setState(() => _checking = false);
      _fadeController.forward();
    }
  }

  Future<void> _seedOnce() async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getBool('hitchr_has_seeded') == true) return;
    try {
      await ref.read(apiProvider).seedCampus();
      await prefs.setBool('hitchr_has_seeded', true);
    } catch (_) {}
  }

  Future<void> _join() async {
    if (_nameController.text.trim().isEmpty || _collegeController.text.trim().isEmpty) return;
    setState(() => _loading = true);
    try {
      await ref.read(userProvider.notifier).login(
        _nameController.text.trim(),
        _collegeController.text.trim(),
      );
      await _seedOnce();
      HapticFeedback.heavyImpact();
      if (mounted) context.go('/home');
    } catch (e) {
      HapticFeedback.vibrate();
      if (mounted) {
        final isConnectionFailure = e is DioException &&
            (e.type == DioExceptionType.connectionTimeout ||
                e.type == DioExceptionType.connectionError);
        final message = isConnectionFailure
            ? 'Can\'t reach server at ${ref.read(apiProvider).baseUrl}. Use same Wi‑Fi as your computer, ensure backend is running, then set the correct URL below.'
            : 'Could not connect: $e';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: HColors.error,
            action: isConnectionFailure
                ? SnackBarAction(
                    label: 'Set URL',
                    textColor: HColors.white,
                    onPressed: _showBackendUrlSettings,
                  )
                : null,
            duration: const Duration(seconds: 8),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _nameController.dispose();
    _collegeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_checking) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: HColors.coral500)),
      );
    }

    return Scaffold(
      backgroundColor: HColors.white,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: HSpacing.lg, vertical: HSpacing.md),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                    const SizedBox(height: 24),
                    // Logo
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [HColors.coral400, HColors.coral500],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        boxShadow: [BoxShadow(color: HColors.coral500.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 8))],
                      ),
                      child: const Icon(Icons.navigation_rounded, color: HColors.white, size: 36),
                    ),
                    const SizedBox(height: HSpacing.lg),
                    const Text(
                      'hitchr',
                      style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: HColors.gray900, letterSpacing: -1),
                    ),
                    const SizedBox(height: HSpacing.sm),
                    Text(
                      'Match with people already\nheaded your way.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 16, color: HColors.gray500, height: 1.4),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'A campus-first, human way to move.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: HColors.coral500),
                    ),
                    const SizedBox(height: 32),
                    // Fields
                    TextField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        hintText: 'Your name',
                        prefixIcon: Icon(Icons.person_outline_rounded, color: HColors.gray400),
                      ),
                      textCapitalization: TextCapitalization.words,
                    ),
                    const SizedBox(height: HSpacing.md),
                    TextField(
                      controller: _collegeController,
                      decoration: const InputDecoration(
                        hintText: 'Your campus / college',
                        prefixIcon: Icon(Icons.school_outlined, color: HColors.gray400),
                      ),
                      textCapitalization: TextCapitalization.words,
                    ),
                    const SizedBox(height: HSpacing.lg),
                    HButton(
                      label: 'Join the Movement',
                      onPressed: _join,
                      loading: _loading,
                      width: double.infinity,
                    ),
                    const SizedBox(height: 8),
                    GestureDetector(
                      onTap: _showBackendUrlSettings,
                      child: Text(
                        'Connection issues? Set backend URL',
                        style: TextStyle(fontSize: 12, color: HColors.coral500, fontWeight: FontWeight.w600, decoration: TextDecoration.underline),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Hitchr is not ride-hailing.\nIt\'s movement, together.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: HColors.gray400, height: 1.5),
                    ),
                    const SizedBox(height: HSpacing.md),
                  ],
            ),
          ),
        ),
      ),
    );
  }
}
