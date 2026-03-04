import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../theme/hitchr_theme.dart';
import '../../providers/app_provider.dart';
import '../../models/route_model.dart';
import '../../models/join_request.dart';
import '../../models/ride.dart';
import '../../widgets/hitchr_widgets.dart';

class RequestsScreen extends ConsumerStatefulWidget {
  const RequestsScreen({super.key});
  @override
  ConsumerState<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends ConsumerState<RequestsScreen> {
  bool _loading = true;
  StreamSubscription<Map<String, dynamic>>? _notificationSub;

  // ── Pilot data: incoming join requests grouped by route ──
  Map<RouteModel, List<JoinRequest>> _pilotGrouped = {};
  int _totalRoutes = 0;

  // ── Rider data: outgoing join requests with status ──
  List<JoinRequest> _riderRequests = [];
  List<Ride> _riderRides = [];

  String? _debugError;

  @override
  void initState() {
    super.initState();
    _load();
    _subscribeRealtimeInboxUpdates();
  }

  void _subscribeRealtimeInboxUpdates() {
    _notificationSub?.cancel();
    _notificationSub = ref.read(notificationCenterProvider).stream.listen((message) {
      if (!mounted) return;
      if (message['type'] == 'join_request') {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('New join request received'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(HRadius.md),
            ),
          ),
        );
        _load();
      }
    });
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _debugError = null;
    });
    final user = ref.read(userProvider);
    if (user == null) {
      debugPrint('[Inbox] No user logged in — aborting load');
      setState(() => _loading = false);
      return;
    }

    debugPrint('[Inbox] Loading inbox for user=${user.id} (${user.name}), role=${user.role}');
    final api = ref.read(apiProvider);

    try {
      // ── Always load BOTH sides so the inbox is useful regardless of role ──

      // Pilot side: routes I created → pending join requests
      final routes = await api.getRoutesByPilot(user.id);
      debugPrint('[Inbox] Found ${routes.length} route(s) created by user=${user.id}');
      final Map<RouteModel, List<JoinRequest>> pilotGrouped = {};
      for (final rd in routes) {
        final route = RouteModel.fromJson(rd);
        final reqs = await api.getJoinRequestsByRoute(route.id, status: 'pending');
        debugPrint('[Inbox]   Route "${route.origin} → ${route.destination}" (${route.id}): ${reqs.length} pending');
        if (reqs.isNotEmpty) {
          pilotGrouped[route] = reqs.map((r) => JoinRequest.fromJson(r)).toList();
        }
      }

      // Rider side: join requests I sent → their statuses
      final riderReqData = await api.getJoinRequestsByRider(user.id);
      final riderRequests = riderReqData.map((r) => JoinRequest.fromJson(r)).toList();
      debugPrint('[Inbox] Found ${riderRequests.length} join request(s) sent by rider=${user.id}');

      // Rider rides: rides where I'm the rider
      final riderRideData = await api.getRidesByRider(user.id);
      final riderRides = riderRideData.map((r) => Ride.fromJson(r)).toList();
      debugPrint('[Inbox] Found ${riderRides.length} ride(s) as rider');

      if (mounted) {
        setState(() {
          _pilotGrouped = pilotGrouped;
          _totalRoutes = routes.length;
          _riderRequests = riderRequests;
          _riderRides = riderRides;
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('[Inbox] ERROR loading inbox: $e');
      if (mounted) {
        setState(() {
          _loading = false;
          _debugError = e.toString();
        });
      }
    }
  }

  Future<void> _respond(String reqId, String action, String riderName) async {
    try {
      final result = await ref.read(apiProvider).respondJoinRequest(reqId, action);
      HapticFeedback.heavyImpact();

      if (mounted) {
        if (action == 'accept') {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('$riderName is joining! Ride created.'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(HRadius.md)),
          ));

          // Navigate to the newly created ride
          final rideId = result['ride_id'];
          if (rideId != null) {
            context.push('/riding/$rideId');
            return;
          }
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: const Text('Request declined'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(HRadius.md)),
          ));
        }
      }
      _load();
    } catch (_) {
      HapticFeedback.vibrate();
    }
  }

  @override
  void dispose() {
    _notificationSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(userProvider);
    final isPilot = user?.role == 'pilot';

    return Scaffold(
      backgroundColor: HColors.gray100,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              color: HColors.white,
              padding: const EdgeInsets.fromLTRB(HSpacing.md, HSpacing.md, HSpacing.md, HSpacing.md),
              child: Row(
                children: [
                  const Text('Inbox', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: HColors.gray900)),
                  const Spacer(),
                  if (isPilot)
                    HChip(label: 'Pilot Mode', color: HColors.trustGreen, selected: true, icon: Icons.directions_car_rounded)
                  else
                    HChip(label: 'Rider Mode', color: HColors.trustBlue, selected: true, icon: Icons.hail_rounded),
                ],
              ),
            ),
            // Body
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: HColors.coral500))
                  : RefreshIndicator(
                      color: HColors.coral500,
                      onRefresh: _load,
                      child: _buildInboxContent(user, isPilot),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInboxContent(dynamic user, bool isPilot) {
    final hasPilotItems = _pilotGrouped.isNotEmpty;
    final hasRiderItems = _riderRequests.isNotEmpty || _riderRides.isNotEmpty;

    if (!hasPilotItems && !hasRiderItems) {
      return _buildEmptyState(user, isPilot);
    }

    return ListView(
      padding: const EdgeInsets.all(HSpacing.md),
      children: [
        // ── PILOT SECTION: incoming join requests ──
        if (hasPilotItems) ...[
          const Padding(
            padding: EdgeInsets.only(bottom: HSpacing.sm),
            child: Row(
              children: [
                Icon(Icons.directions_car_rounded, size: 16, color: HColors.trustGreen),
                SizedBox(width: 6),
                Text('Ride Requests (as Pilot)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: HColors.gray900)),
              ],
            ),
          ),
          ..._pilotGrouped.entries.map((entry) {
            final route = entry.key;
            final reqs = entry.value;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: HSpacing.sm),
                  child: Row(
                    children: [
                      const Icon(Icons.route_rounded, size: 16, color: HColors.coral500),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          '${route.origin} \u2192 ${route.destination}',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: HColors.gray900),
                        ),
                      ),
                      HChip(label: '${reqs.length} pending'),
                    ],
                  ),
                ),
                ...reqs.map((req) => Padding(
                  padding: const EdgeInsets.only(bottom: HSpacing.sm),
                  child: HCard(
                    child: Row(
                      children: [
                        HAvatar(name: req.riderName, size: 40),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(req.riderName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                              Text(req.riderCollege, style: const TextStyle(fontSize: 12, color: HColors.gray500)),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, color: HColors.error, size: 22),
                          onPressed: () => _respond(req.id, 'decline', req.riderName),
                        ),
                        const SizedBox(width: 4),
                        IconButton(
                          icon: const Icon(Icons.check_rounded, color: HColors.trustGreen, size: 24),
                          onPressed: () => _respond(req.id, 'accept', req.riderName),
                        ),
                      ],
                    ),
                  ),
                )),
                const SizedBox(height: HSpacing.sm),
              ],
            );
          }),
          if (hasRiderItems) const Divider(height: HSpacing.lg),
        ],

        // ── RIDER SECTION: my outgoing requests + active rides ──
        if (hasRiderItems) ...[
          const Padding(
            padding: EdgeInsets.only(bottom: HSpacing.sm),
            child: Row(
              children: [
                Icon(Icons.hail_rounded, size: 16, color: HColors.trustBlue),
                SizedBox(width: 6),
                Text('Your Requests (as Rider)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: HColors.gray900)),
              ],
            ),
          ),

          // Active rides from accepted requests — show first with CTA
          ..._riderRides.map((ride) {
            final statusColors = {
              'waiting': HColors.warning,
              'active': HColors.trustGreen,
              'completed': HColors.trustBlue,
            };
            final statusLabels = {
              'waiting': 'Accepted — Waiting to Start',
              'active': 'In Transit',
              'completed': 'Completed',
            };
            return Padding(
              padding: const EdgeInsets.only(bottom: HSpacing.sm),
              child: HCard(
                onTap: () {
                  if (ride.status == 'completed') {
                    context.push('/complete-ride/${ride.id}');
                  } else {
                    context.push('/riding/${ride.id}');
                  }
                },
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        HAvatar(name: ride.pilotName, size: 40),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(ride.pilotName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                              Text('Pilot', style: const TextStyle(fontSize: 12, color: HColors.gray500)),
                            ],
                          ),
                        ),
                        HChip(
                          label: statusLabels[ride.status] ?? ride.status,
                          color: statusColors[ride.status] ?? HColors.gray400,
                          selected: true,
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.route_rounded, size: 14, color: HColors.coral500),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            '${ride.origin} → ${ride.destination}',
                            style: const TextStyle(fontSize: 13, color: HColors.gray700),
                          ),
                        ),
                        const Icon(Icons.chevron_right_rounded, size: 20, color: HColors.gray400),
                      ],
                    ),
                  ],
                ),
              ),
            );
          }),

          // Pending/declined requests (not yet turned into rides)
          ..._riderRequests
              .where((req) => !_riderRides.any((ride) => ride.routeId == req.routeId && ride.riderId == req.riderId))
              .map((req) {
            final statusColors = {
              'pending': HColors.warning,
              'accepted': HColors.trustGreen,
              'declined': HColors.error,
            };
            final statusIcons = {
              'pending': Icons.hourglass_empty_rounded,
              'accepted': Icons.check_circle_rounded,
              'declined': Icons.cancel_rounded,
            };
            return Padding(
              padding: const EdgeInsets.only(bottom: HSpacing.sm),
              child: HCard(
                child: Row(
                  children: [
                    Icon(statusIcons[req.status] ?? Icons.help_outline, size: 24, color: statusColors[req.status] ?? HColors.gray400),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${req.pickup.label} → ${req.dropoff.label}',
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            req.status == 'pending'
                                ? 'Waiting for pilot to respond...'
                                : req.status == 'accepted'
                                    ? 'Accepted! Check your Journeys tab.'
                                    : 'Declined by pilot',
                            style: TextStyle(fontSize: 12, color: statusColors[req.status] ?? HColors.gray500),
                          ),
                        ],
                      ),
                    ),
                    HChip(
                      label: req.status[0].toUpperCase() + req.status.substring(1),
                      color: statusColors[req.status] ?? HColors.gray400,
                      selected: true,
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ],
    );
  }

  Widget _buildEmptyState(dynamic user, bool isPilot) {
    if (_debugError != null) {
      return EmptyState(
        icon: Icons.error_outline_rounded,
        title: 'Could not load inbox',
        subtitle: 'Check your connection and try again.\n'
            'Error: $_debugError',
      );
    }

    if (isPilot) {
      if (_totalRoutes == 0) {
        return const EmptyState(
          icon: Icons.add_road_rounded,
          title: 'No routes yet',
          subtitle: 'You haven\'t created any routes.\n'
              'Go to the Compose tab to post a route, then riders can request to join.',
        );
      }
      return EmptyState(
        icon: Icons.inbox_rounded,
        title: 'No pending requests',
        subtitle: 'You have $_totalRoutes route(s) but no pending join requests yet.\n'
            'When riders request to join, they\'ll appear here.',
      );
    }

    // Rider with no requests
    return const EmptyState(
      icon: Icons.hail_rounded,
      title: 'No requests yet',
      subtitle: 'Browse routes on the Explore tab and\ntap "Request to Join" to get started.',
    );
  }
}
