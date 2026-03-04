import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../theme/hitchr_theme.dart';
import '../../providers/app_provider.dart';
import '../../services/notification_socket.dart';

class HomeShell extends ConsumerStatefulWidget {
  final Widget child;
  const HomeShell({super.key, required this.child});

  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  static const _tabs = [
    _Tab(icon: Icons.explore_rounded, label: 'Explore', path: '/home'),
    _Tab(icon: Icons.inbox_rounded, label: 'Inbox', path: '/requests'),
    _Tab(icon: Icons.route_rounded, label: 'Journeys', path: '/rides'),
    _Tab(icon: Icons.people_outline_rounded, label: 'Community', path: '/communities'),
    _Tab(icon: Icons.person_outline_rounded, label: 'You', path: '/profile'),
  ];

  final NotificationSocket _notificationSocket = NotificationSocket();
  String? _connectedUserId;
  String? _connectedBaseUrl;
  bool _connecting = false;
  bool _interceptDialogOpen = false;

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    for (int i = 0; i < _tabs.length; i++) {
      if (location.startsWith(_tabs[i].path)) return i;
    }
    return 0;
  }

  void _syncSocket() {
    final user = ref.read(userProvider);
    final api = ref.read(apiProvider);
    final baseUrl = api.baseUrl;

    if (user == null) {
      if (_connectedUserId != null || _connecting) {
        _disconnectSocket();
      }
      return;
    }

    final needsReconnect = _connectedUserId != user.id || _connectedBaseUrl != baseUrl;
    if (!needsReconnect || _connecting) return;

    _connecting = true;
    unawaited(_notificationSocket.connect(
      baseApiUrl: baseUrl,
      userId: user.id,
      onMessage: (message) {
        ref.read(notificationCenterProvider).emit(message);
        _handleInterceptRequestForPilot(message);
      },
    ).whenComplete(() {
      _connecting = false;
      _connectedUserId = user.id;
      _connectedBaseUrl = baseUrl;
    }));
  }

  Future<void> _disconnectSocket() async {
    _connectedUserId = null;
    _connectedBaseUrl = null;
    _connecting = false;
    await _notificationSocket.disconnect();
  }

  void _handleInterceptRequestForPilot(Map<String, dynamic> message) {
    if (!mounted) return;
    if (message['type'] != 'intercept_request') return;

    final user = ref.read(userProvider);
    if (user == null || user.role != 'pilot') return;
    if (_interceptDialogOpen) return;

    final riderId = (message['rider_id'] ?? '').toString();
    if (riderId.isEmpty) return;

    _interceptDialogOpen = true;
    unawaited(showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Rider Ahead'),
        content: const Text('A rider wants to intercept your live route.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Ignore'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              try {
                await ref.read(apiProvider).acceptIntercept(user.id, riderId);
              } catch (_) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Failed to accept intercept')),
                );
              }
            },
            child: const Text('Accept'),
          ),
        ],
      ),
    ).whenComplete(() {
      _interceptDialogOpen = false;
    }));
  }

  @override
  void dispose() {
    unawaited(_notificationSocket.dispose());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    _syncSocket();
    final idx = _currentIndex(context);
    final mapExpanded = ref.watch(mapExpandedProvider);
    return Scaffold(
      body: widget.child,
      floatingActionButton: mapExpanded
          ? null
          : FloatingActionButton(
        onPressed: () {
          HapticFeedback.mediumImpact();
          context.push('/composer');
        },
        backgroundColor: HColors.coral500,
        elevation: 4,
        shape: const CircleBorder(),
        child: const Icon(Icons.add_rounded, color: HColors.white, size: 28),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: mapExpanded
          ? null
          : Container(
        decoration: const BoxDecoration(
          color: HColors.white,
          border: Border(top: BorderSide(color: HColors.gray200, width: 1)),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 60,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                ..._tabs.take(2).map((t) => _NavItem(
                  icon: t.icon,
                  label: t.label,
                  selected: idx == _tabs.indexOf(t),
                  onTap: () {
                    HapticFeedback.selectionClick();
                    context.go(t.path);
                  },
                )),
                const SizedBox(width: 48), // space for FAB
                ..._tabs.skip(3).map((t) => _NavItem(
                  icon: t.icon,
                  label: t.label,
                  selected: idx == _tabs.indexOf(t),
                  onTap: () {
                    HapticFeedback.selectionClick();
                    context.go(t.path);
                  },
                )),
              ],
            ),
          ),
        ),
      ),
    );
  }
}


class _Tab {
  final IconData icon;
  final String label;
  final String path;
  const _Tab({required this.icon, required this.label, required this.path});
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _NavItem({required this.icon, required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 64,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 24, color: selected ? HColors.coral500 : HColors.gray400),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: selected ? HColors.coral500 : HColors.gray400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
