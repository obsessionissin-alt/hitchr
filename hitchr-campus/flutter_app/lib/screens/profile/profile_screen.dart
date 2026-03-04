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

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _toggling = false;
  bool _signingOut = false;

  static const int _defaultLiveSeats = 3;

  Future<void> _confirmSignOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text(
          'You\'ll be signed out of this account. '
          'You can sign back in with the same name and college later.',
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(HRadius.lg),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: HColors.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'Sign Out',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _signingOut = true);
    HapticFeedback.mediumImpact();

    // 1. Clear user session (SharedPreferences + user state)
    await ref.read(userProvider.notifier).logout();

    // 2. Reset all cached provider data so the next user starts fresh
    resetAllProviders(ref);

    // 3. Navigate to onboarding
    if (mounted) {
      context.go('/onboarding');
    }
  }

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
                content: Text('Backend URL updated to $url'),
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
        },
      ),
    );
  }

  Future<void> _doToggle(String targetRole) async {
    if (_toggling) return;
    setState(() => _toggling = true);
    HapticFeedback.mediumImpact();
    try {
      final currentUser = ref.read(userProvider);
      if (currentUser != null &&
          currentUser.role == 'pilot' &&
          targetRole.toLowerCase() == 'rider') {
        await ref.read(pilotLiveProvider.notifier).disableIfActive();
      }
      await ref.read(userProvider.notifier).toggleRole();
    } catch (e) {
      HapticFeedback.vibrate();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to switch to $targetRole mode: $e'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: HColors.error,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(HRadius.md),
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _toggling = false);
    }
  }

  Future<void> _setLive(bool enable) async {
    final user = ref.read(userProvider);
    if (user == null || user.role != 'pilot') return;
    try {
      if (enable) {
        await ref
            .read(pilotLiveProvider.notifier)
            .enable(user.id, seats: _defaultLiveSeats);
      } else {
        await ref.read(pilotLiveProvider.notifier).disable(user.id);
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Unable to update live mode: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final ref = this.ref;
    final user = ref.watch(userProvider);
    final liveState = ref.watch(pilotLiveProvider);

    if (user == null) {
      return const Scaffold(body: Center(child: Text('Not logged in')));
    }

    return Scaffold(
      backgroundColor: HColors.gray100,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // Header
              Container(
                color: HColors.white,
                padding: const EdgeInsets.all(HSpacing.lg),
                child: Column(
                  children: [
                    Row(
                      children: [
                        const Text(
                          'You',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: HColors.gray900,
                          ),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(
                            Icons.settings_outlined,
                            color: HColors.gray500,
                          ),
                          onPressed: _showBackendUrlSettings,
                        ),
                      ],
                    ),
                    const SizedBox(height: HSpacing.lg),
                    // Avatar and info
                    HAvatar(name: user.name, size: 72),
                    const SizedBox(height: HSpacing.md),
                    Text(
                      user.name,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: HColors.gray900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user.college,
                      style: const TextStyle(
                        fontSize: 14,
                        color: HColors.gray500,
                      ),
                    ),
                    const SizedBox(height: HSpacing.md),
                    // Stats
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _StatBadge(
                          label: 'Trust',
                          value: '${user.trustScore}',
                          icon: Icons.verified_rounded,
                          color: HColors.trustBlue,
                        ),
                        const SizedBox(width: HSpacing.md),
                        _StatBadge(
                          label: 'Rides',
                          value: '${user.totalRides}',
                          icon: Icons.route_rounded,
                          color: HColors.trustGreen,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: HSpacing.md),

              // Role toggle
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: HSpacing.md),
                child: HCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Current Mode',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: HColors.gray500,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: user.role != 'rider' && !_toggling
                                  ? () => _doToggle('Rider')
                                  : null,
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                decoration: BoxDecoration(
                                  color: user.role == 'rider'
                                      ? HColors.trustBlue
                                      : HColors.white,
                                  borderRadius: BorderRadius.circular(
                                    HRadius.md,
                                  ),
                                  border: Border.all(
                                    color: user.role == 'rider'
                                        ? HColors.trustBlue
                                        : HColors.gray200,
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    if (_toggling && user.role == 'pilot')
                                      SizedBox(
                                        width: 18,
                                        height: 18,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: HColors.gray400,
                                        ),
                                      )
                                    else
                                      Icon(
                                        Icons.hail_rounded,
                                        size: 20,
                                        color: user.role == 'rider'
                                            ? HColors.white
                                            : HColors.gray400,
                                      ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Rider',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                        color: user.role == 'rider'
                                            ? HColors.white
                                            : HColors.gray600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: GestureDetector(
                              onTap: user.role != 'pilot' && !_toggling
                                  ? () => _doToggle('Pilot')
                                  : null,
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                decoration: BoxDecoration(
                                  color: user.role == 'pilot'
                                      ? HColors.coral500
                                      : HColors.white,
                                  borderRadius: BorderRadius.circular(
                                    HRadius.md,
                                  ),
                                  border: Border.all(
                                    color: user.role == 'pilot'
                                        ? HColors.coral500
                                        : HColors.gray200,
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    if (_toggling && user.role == 'rider')
                                      SizedBox(
                                        width: 18,
                                        height: 18,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: HColors.gray400,
                                        ),
                                      )
                                    else
                                      Icon(
                                        Icons.directions_car_rounded,
                                        size: 20,
                                        color: user.role == 'pilot'
                                            ? HColors.white
                                            : HColors.gray400,
                                      ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Pilot',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                        color: user.role == 'pilot'
                                            ? HColors.white
                                            : HColors.gray600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        user.role == 'pilot'
                            ? 'You\'re offering rides. Post a route and let riders find you.'
                            : 'You\'re looking for rides. Search routes and request to join.',
                        style: const TextStyle(
                          fontSize: 12,
                          color: HColors.gray500,
                        ),
                      ),
                      if (user.role == 'pilot') ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: HColors.gray100,
                            borderRadius: BorderRadius.circular(HRadius.md),
                          ),
                          child: Row(
                            children: [
                              const Expanded(
                                child: Text(
                                  'Go Live',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: HColors.gray800,
                                  ),
                                ),
                              ),
                              if (liveState.busy)
                                const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              else
                                Switch(
                                  value: liveState.isLive,
                                  onChanged: _setLive,
                                  activeThumbColor: HColors.coral500,
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'You appear on rider radar only while Go Live is ON and location permission is granted.',
                          style: TextStyle(
                            fontSize: 11,
                            color: HColors.gray500,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: HSpacing.md),

              // Communities
              if (user.communities.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: HSpacing.md),
                  child: HCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Communities',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: HColors.gray500,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: user.communities
                              .map(
                                (c) =>
                                    HChip(label: c, icon: Icons.group_rounded),
                              )
                              .toList(),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: HSpacing.md),
              ],

              // Actions
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: HSpacing.md),
                child: Column(
                  children: [
                    _ActionTile(
                      icon: Icons.history_rounded,
                      label: 'Ride History',
                      onTap: () => context.go('/rides'),
                    ),
                    _ActionTile(
                      icon: Icons.people_outline_rounded,
                      label: 'Communities',
                      onTap: () => context.go('/communities'),
                    ),
                    _ActionTile(
                      icon: Icons.help_outline_rounded,
                      label: 'Help & Support',
                      onTap: () {},
                    ),
                    _ActionTile(
                      icon: Icons.info_outline_rounded,
                      label: 'About Hitchr',
                      onTap: () {},
                    ),
                    const SizedBox(height: HSpacing.md),
                    HButton(
                      label: _signingOut ? 'Signing Out...' : 'Sign Out',
                      onPressed: _signingOut ? null : _confirmSignOut,
                      loading: _signingOut,
                      outlined: true,
                      width: double.infinity,
                      color: HColors.error,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: HSpacing.xxl),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatBadge extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  const _StatBadge({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(HRadius.md),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 16,
              color: color,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(fontSize: 12, color: color.withValues(alpha: 0.8)),
          ),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _ActionTile({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.all(HSpacing.md),
        margin: const EdgeInsets.only(bottom: 1),
        decoration: BoxDecoration(
          color: HColors.white,
          border: Border(bottom: BorderSide(color: HColors.gray200)),
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: HColors.gray600),
            const SizedBox(width: 14),
            Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: HColors.gray800,
              ),
            ),
            const Spacer(),
            const Icon(
              Icons.chevron_right_rounded,
              size: 20,
              color: HColors.gray300,
            ),
          ],
        ),
      ),
    );
  }
}
