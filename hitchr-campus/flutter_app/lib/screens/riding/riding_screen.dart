import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../theme/hitchr_theme.dart';
import '../../providers/app_provider.dart';
import '../../models/ride.dart';
import '../../widgets/hitchr_widgets.dart';

class RidingScreen extends ConsumerStatefulWidget {
  final String rideId;
  const RidingScreen({super.key, required this.rideId});
  @override
  ConsumerState<RidingScreen> createState() => _RidingScreenState();
}

class _RidingScreenState extends ConsumerState<RidingScreen> {
  Ride? _ride;
  bool _loading = true;
  bool _actioning = false;
  Timer? _pollTimer;
  String? _loadError;

  @override
  void initState() {
    super.initState();
    _load();
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) => _load());
  }

  Future<void> _load() async {
    try {
      final data = await ref.read(apiProvider).getRide(widget.rideId);
      if (mounted) {
        setState(() {
          _ride = Ride.fromJson(data);
          _loading = false;
          _loadError = null;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _ride = null;
          _loading = false;
          _loadError = 'Ride no longer available. It may have been cancelled or removed.';
        });
      }
    }
  }

  Future<void> _startRide() async {
    setState(() => _actioning = true);
    try {
      await ref.read(apiProvider).startRide(widget.rideId);
      HapticFeedback.heavyImpact();
      _load();
    } catch (_) { HapticFeedback.vibrate(); }
    if (mounted) setState(() => _actioning = false);
  }

  Future<void> _completeRide() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Complete this ride?'),
        content: const Text('Mark this journey as completed. The rider will be prompted to contribute.'),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(HRadius.lg)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Complete')),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _actioning = true);
    try {
      await ref.read(apiProvider).completeRide(widget.rideId);
      HapticFeedback.heavyImpact();
      _load();
    } catch (_) { HapticFeedback.vibrate(); }
    if (mounted) setState(() => _actioning = false);
  }

  @override
  void dispose() { _pollTimer?.cancel(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(userProvider);
    final isPilot = user != null && _ride != null && user.id == _ride!.pilotId;

    return Scaffold(
      backgroundColor: HColors.gray100,
      appBar: AppBar(
        title: Text(_ride?.status == 'active' ? 'In Transit' : _ride?.status == 'completed' ? 'Completed' : 'Waiting to Start'),
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.pop()),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: HColors.coral500))
          : _ride == null
              ? _buildMissingRideState()
              : _buildBody(isPilot),
    );
  }

  Widget _buildMissingRideState() {
    return Padding(
      padding: const EdgeInsets.all(HSpacing.lg),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          EmptyState(
            icon: Icons.error_outline,
            title: 'Ride unavailable',
            subtitle: _loadError ?? 'Ride not found',
          ),
          const SizedBox(height: HSpacing.md),
          HButton(
            label: 'Back to Journeys',
            width: double.infinity,
            onPressed: () => context.go('/rides'),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(bool isPilot) {
    final r = _ride!;
    final statusColors = {'active': HColors.trustGreen, 'waiting': HColors.warning, 'completed': HColors.trustBlue};

    return SingleChildScrollView(
      padding: const EdgeInsets.all(HSpacing.md),
      child: Column(
        children: [
          // Status banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(HSpacing.lg),
            decoration: BoxDecoration(
              color: (statusColors[r.status] ?? HColors.gray400).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(HRadius.lg),
              border: Border.all(color: (statusColors[r.status] ?? HColors.gray400).withValues(alpha: 0.3)),
            ),
            child: Column(children: [
              Icon(
                r.status == 'active' ? Icons.navigation_rounded : r.status == 'completed' ? Icons.check_circle_rounded : Icons.schedule_rounded,
                size: 40, color: statusColors[r.status],
              ),
              const SizedBox(height: 8),
              Text(
                r.status == 'active' ? 'Journey in progress' : r.status == 'completed' ? 'Journey completed!' : 'Waiting for departure',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: statusColors[r.status]),
              ),
            ]),
          ),
          const SizedBox(height: HSpacing.md),
          MiniMapView(
            height: 160,
            fromPoint: r.pickup,
            toPoint: r.dropoff,
          ),
          const SizedBox(height: HSpacing.md),

          // People
          HCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('People', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: HColors.gray500)),
              const SizedBox(height: 12),
              _PersonRow(name: r.pilotName, role: 'Pilot', icon: Icons.directions_car_rounded),
              const Divider(height: 20, color: HColors.gray200),
              _PersonRow(name: r.riderName, role: 'Rider', icon: Icons.hail_rounded),
            ]),
          ),
          const SizedBox(height: HSpacing.md),

          // Route
          HCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Column(children: [
                  Container(width: 10, height: 10, decoration: const BoxDecoration(shape: BoxShape.circle, color: HColors.coral500)),
                  Container(width: 2, height: 30, color: HColors.gray200),
                  Container(width: 10, height: 10, decoration: const BoxDecoration(shape: BoxShape.circle, color: HColors.trustBlue)),
                ]),
                const SizedBox(width: 14),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(r.origin, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  Text(r.pickup.address, style: const TextStyle(fontSize: 11, color: HColors.gray500)),
                  const SizedBox(height: 14),
                  Text(r.destination, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  Text(r.dropoff.address, style: const TextStyle(fontSize: 11, color: HColors.gray500)),
                ])),
              ]),
              const SizedBox(height: 12),
              HChip(label: '${r.sharedDistanceKm.toStringAsFixed(1)} km shared', icon: Icons.straighten_rounded),
            ]),
          ),
          const SizedBox(height: HSpacing.md),

          // Safety
          HCard(
            color: HColors.trustGreenLight,
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
              SafetyButton(icon: Icons.share_location_rounded, label: 'Share', color: HColors.trustBlue),
              SafetyButton(icon: Icons.emergency_rounded, label: 'SOS', color: HColors.error),
              SafetyButton(icon: Icons.report_outlined, label: 'Report', color: HColors.warning),
            ]),
          ),
          const SizedBox(height: HSpacing.lg),

          // Actions
          if (isPilot && r.status == 'waiting')
            HButton(label: 'Start Journey', onPressed: _startRide, loading: _actioning, width: double.infinity, icon: Icons.play_arrow_rounded),
          if (isPilot && r.status == 'active')
            HButton(label: 'Complete Journey', onPressed: _completeRide, loading: _actioning, width: double.infinity, icon: Icons.check_rounded, color: HColors.trustGreen),
          if (!isPilot && r.status == 'completed')
            HButton(label: 'Leave a Contribution', onPressed: () => context.push('/complete-ride/${r.id}'), width: double.infinity, icon: Icons.volunteer_activism_rounded),

          const SizedBox(height: HSpacing.xxl),
        ],
      ),
    );
  }
}

class _PersonRow extends StatelessWidget {
  final String name;
  final String role;
  final IconData icon;
  const _PersonRow({required this.name, required this.role, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      HAvatar(name: name, size: 36),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        Text(role, style: const TextStyle(fontSize: 12, color: HColors.gray500)),
      ])),
      Icon(icon, color: HColors.gray400, size: 20),
    ]);
  }
}
