import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../theme/hitchr_theme.dart';
import '../../providers/app_provider.dart';
import '../../models/route_model.dart';
import '../../widgets/hitchr_widgets.dart';

class RouteDetailScreen extends ConsumerStatefulWidget {
  final String routeId;
  const RouteDetailScreen({super.key, required this.routeId});
  @override
  ConsumerState<RouteDetailScreen> createState() => _RouteDetailScreenState();
}

class _RouteDetailScreenState extends ConsumerState<RouteDetailScreen> {
  RouteModel? _route;
  bool _loading = true;
  bool _requesting = false;
  bool _alreadyRequested = false;
  final _pickupNoteController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ref.read(apiProvider).getRoute(widget.routeId);
      _route = RouteModel.fromJson(data);

      final user = ref.read(userProvider);
      if (user != null) {
        final reqs = await ref.read(apiProvider).getJoinRequestsByRider(user.id);
        _alreadyRequested = reqs.any((r) => r['route_id'] == widget.routeId);
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _requestJoin() async {
    final user = ref.read(userProvider);
    if (user == null || _route == null) return;

    setState(() => _requesting = true);
    try {
      // Join request requires Waypoint objects for pickup/dropoff
      await ref.read(apiProvider).createJoinRequest({
        'route_id': _route!.id,
        'rider_id': user.id,
        'rider_name': user.name,
        'rider_college': user.college,
        'pickup': _route!.fromPoint.toJson(), // default: same as route origin
        'dropoff': _route!.toPoint.toJson(),   // default: same as route destination
      });
      HapticFeedback.heavyImpact();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: const Text('Request sent! The pilot will be notified.'), behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(HRadius.md))),
        );
        setState(() => _alreadyRequested = true);
      }
    } catch (e) {
      HapticFeedback.vibrate();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: HColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _requesting = false);
    }
  }

  @override
  void dispose() { _pickupNoteController.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(userProvider);
    final isPilot = user != null && _route != null && user.id == _route!.pilotId;

    return Scaffold(
      backgroundColor: HColors.gray100,
      appBar: AppBar(
        title: const Text('Route Details'),
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.pop()),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: HColors.coral500))
          : _route == null
              ? const EmptyState(icon: Icons.error_outline, title: 'Route not found', subtitle: 'This route may have been removed.')
              : _buildBody(isPilot),
      bottomNavigationBar: _route != null && !isPilot
          ? Container(
              padding: const EdgeInsets.all(HSpacing.md),
              decoration: const BoxDecoration(color: HColors.white, border: Border(top: BorderSide(color: HColors.gray200))),
              child: SafeArea(
                child: HButton(
                  label: _alreadyRequested ? 'Request Sent' : 'Request to Join',
                  onPressed: _alreadyRequested ? null : _requestJoin,
                  loading: _requesting,
                  width: double.infinity,
                  color: _alreadyRequested ? HColors.gray300 : null,
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildBody(bool isPilot) {
    final r = _route!;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(HSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MiniMapView(
            height: 180,
            fromPoint: r.fromPoint,
            toPoint: r.toPoint,
          ),
          const SizedBox(height: HSpacing.md),

          // Pilot card
          HCard(
            child: Row(
              children: [
                HAvatar(name: r.pilotName, size: 48),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(r.pilotName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: HColors.gray900)),
                      const SizedBox(height: 2),
                      Text(r.pilotCollege, style: const TextStyle(fontSize: 12, color: HColors.gray500)),
                      const SizedBox(height: 2),
                      const Row(children: [
                        Icon(Icons.verified_rounded, size: 14, color: HColors.trustBlue),
                        SizedBox(width: 4),
                        Text('Campus Verified', style: TextStyle(fontSize: 12, color: HColors.trustBlue, fontWeight: FontWeight.w500)),
                      ]),
                    ],
                  ),
                ),
                if (isPilot) HChip(label: 'Your route', color: HColors.trustGreen, selected: true),
              ],
            ),
          ),
          const SizedBox(height: HSpacing.md),

          // Route details
          HCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Route', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: HColors.gray500)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Column(children: [
                      Container(width: 10, height: 10, decoration: const BoxDecoration(shape: BoxShape.circle, color: HColors.coral500)),
                      Container(width: 2, height: 36, color: HColors.gray200),
                      Container(width: 10, height: 10, decoration: const BoxDecoration(shape: BoxShape.circle, color: HColors.trustBlue)),
                    ]),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(r.origin, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: HColors.gray900)),
                          Text(r.fromPoint.address, style: const TextStyle(fontSize: 12, color: HColors.gray500)),
                          const SizedBox(height: 14),
                          Text(r.destination, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: HColors.gray900)),
                          Text(r.toPoint.address, style: const TextStyle(fontSize: 12, color: HColors.gray500)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8, runSpacing: 8,
                  children: [
                    _InfoChip(icon: Icons.event_seat_rounded, label: '${r.seatsAvailable} seats'),
                    _InfoChip(icon: Icons.straighten_rounded, label: '${r.distanceKm.toStringAsFixed(1)} km'),
                    _InfoChip(icon: Icons.schedule_rounded, label: '~${r.durationMins} min'),
                    _InfoChip(icon: Icons.timer_outlined, label: 'Window: ${r.timeWindowMins} min'),
                  ],
                ),
              ],
            ),
          ),

          if (r.note != null && r.note!.isNotEmpty) ...[
            const SizedBox(height: HSpacing.md),
            HCard(
              child: Row(
                children: [
                  const Icon(Icons.chat_bubble_outline_rounded, size: 18, color: HColors.coral400),
                  const SizedBox(width: 10),
                  Expanded(child: Text('"${r.note}"', style: const TextStyle(fontSize: 13, fontStyle: FontStyle.italic, color: HColors.gray600))),
                ],
              ),
            ),
          ],

          // Safety
          const SizedBox(height: HSpacing.lg),
          HCard(
            color: HColors.trustGreenLight,
            child: const Row(
              children: [
                Icon(Icons.shield_outlined, size: 20, color: HColors.trustGreen),
                SizedBox(width: 10),
                Expanded(child: Text('Campus-verified rides. Share your live location with friends.', style: TextStyle(fontSize: 12, color: HColors.gray700))),
              ],
            ),
          ),
          const SizedBox(height: HSpacing.xxl),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: HColors.gray100, borderRadius: BorderRadius.circular(HRadius.pill)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 14, color: HColors.gray500),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: HColors.gray600)),
      ]),
    );
  }
}
