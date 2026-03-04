import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../theme/hitchr_theme.dart';
import '../../providers/app_provider.dart';
import '../../models/ride.dart';
import '../../widgets/hitchr_widgets.dart';

class RidesScreen extends ConsumerStatefulWidget {
  const RidesScreen({super.key});
  @override
  ConsumerState<RidesScreen> createState() => _RidesScreenState();
}

class _RidesScreenState extends ConsumerState<RidesScreen> with WidgetsBindingObserver {
  bool _loading = true;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _load();
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) => _load());
  }

  Future<void> _load() async {
    final user = ref.read(userProvider);
    if (user == null) return;
    await ref.read(ridesProvider.notifier).loadForUser(user.id, user.role);
    if (mounted) setState(() => _loading = false);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _pollTimer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(userProvider);
    final rides = ref.watch(ridesProvider);
    final sorted = List<Ride>.from(rides)..sort((a, b) {
      const order = {'active': 0, 'waiting': 1, 'completed': 2};
      return (order[a.status] ?? 3).compareTo(order[b.status] ?? 3);
    });

    return Scaffold(
      backgroundColor: HColors.gray100,
      body: SafeArea(
        child: Column(children: [
          Container(
            color: HColors.white,
            padding: const EdgeInsets.fromLTRB(HSpacing.md, HSpacing.md, HSpacing.md, HSpacing.md),
            child: const Row(children: [
              Text('Journeys', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: HColors.gray900)),
            ]),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: HColors.coral500))
                : sorted.isEmpty
                    ? const EmptyState(icon: Icons.route_rounded, title: 'No journeys yet', subtitle: 'Your rides will appear here.\nPost a route or join one to get started!')
                    : RefreshIndicator(
                        color: HColors.coral500,
                        onRefresh: _load,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(HSpacing.md),
                          itemCount: sorted.length,
                          itemBuilder: (context, index) {
                            final ride = sorted[index];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: HSpacing.sm),
                              child: _RideCard(ride: ride, isPilot: user?.role == 'pilot'),
                            );
                          },
                        ),
                      ),
          ),
        ]),
      ),
    );
  }
}

class _RideCard extends StatelessWidget {
  final Ride ride;
  final bool isPilot;
  const _RideCard({required this.ride, this.isPilot = false});

  @override
  Widget build(BuildContext context) {
    final statusColors = {'active': HColors.trustGreen, 'waiting': HColors.warning, 'completed': HColors.trustBlue};
    final statusLabels = {'active': 'In Progress', 'waiting': 'Waiting', 'completed': 'Completed'};

    return HCard(
      onTap: () {
        if (ride.status == 'completed' && !isPilot) {
          context.push('/complete-ride/${ride.id}');
        } else {
          context.push('/riding/${ride.id}');
        }
      },
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          HAvatar(name: isPilot ? ride.riderName : ride.pilotName, size: 36),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(isPilot ? ride.riderName : ride.pilotName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            Text(isPilot ? 'Rider' : 'Pilot', style: const TextStyle(fontSize: 12, color: HColors.gray500)),
          ])),
          HChip(label: statusLabels[ride.status] ?? ride.status, color: statusColors[ride.status] ?? HColors.gray400, selected: true),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          Column(children: [
            Container(width: 8, height: 8, decoration: const BoxDecoration(shape: BoxShape.circle, color: HColors.coral500)),
            Container(width: 2, height: 20, color: HColors.gray200),
            Container(width: 8, height: 8, decoration: const BoxDecoration(shape: BoxShape.circle, color: HColors.trustBlue)),
          ]),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(ride.origin, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: HColors.gray800)),
            const SizedBox(height: 10),
            Text(ride.destination, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: HColors.gray800)),
          ])),
          if (ride.status == 'active')
            Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(color: HColors.trustGreenLight, shape: BoxShape.circle),
              child: const Icon(Icons.navigation_rounded, size: 16, color: HColors.trustGreen),
            ),
        ]),
      ]),
    );
  }
}
