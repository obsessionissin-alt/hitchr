import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../theme/hitchr_theme.dart';
import '../../providers/app_provider.dart';
import '../../models/route_model.dart';
import '../../models/planned_trip.dart';
import '../../models/memory.dart';
import '../../models/waypoint.dart';
import '../../widgets/hitchr_widgets.dart';

enum FeedTab { nearby, popular, saved }

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});
  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  FeedTab _tab = FeedTab.nearby;
  bool _loading = true;
  bool _riderMapMode = true;
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        ref.read(mapExpandedProvider.notifier).state = false;
      }
    });
    _loadAll();
  }

  Future<void> _loadAll() async {
    setState(() => _loading = true);
    await Future.wait([
      ref.read(routesProvider.notifier).load(),
      ref.read(plannedTripsProvider.notifier).load(),
      ref.read(memoriesProvider.notifier).load(),
    ]);
    if (mounted) setState(() => _loading = false);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(userProvider);
    final routes = ref.watch(routesProvider);
    final plannedTrips = ref.watch(plannedTripsProvider);
    final memories = ref.watch(memoriesProvider);
    final mapExpanded = ref.watch(mapExpandedProvider);
    final isRider = user?.role == 'rider';
    final filteredRoutes = _filteredRoutes(routes);
    final ownPilotRoute = _findOwnPilotRoute(routes, user?.id);
    final mapFromPoint = isRider ? null : ownPilotRoute?.fromPoint;
    final mapToPoint = isRider ? null : ownPilotRoute?.toPoint;

    return Scaffold(
      backgroundColor: HColors.gray100,
      body: SafeArea(
        child: Stack(
          children: [
            RefreshIndicator(
              color: HColors.coral500,
              onRefresh: _loadAll,
              child: CustomScrollView(
                slivers: [
                  // Header
                  SliverToBoxAdapter(
                    child: Container(
                      color: HColors.white,
                      padding: const EdgeInsets.fromLTRB(HSpacing.md, HSpacing.md, HSpacing.md, 0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Text('hitchr', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: HColors.gray900, letterSpacing: -0.5)),
                              const Spacer(),
                              if (user != null)
                                GestureDetector(
                                  onTap: () => context.go('/profile'),
                                  child: HAvatar(name: user.name, size: 34),
                                ),
                            ],
                          ),
                          const SizedBox(height: HSpacing.md),
                          HSearchBar(
                            controller: _searchController,
                            hint: 'Where are you headed?',
                            onChanged: (v) => setState(() => _searchQuery = v.toLowerCase()),
                          ),
                          const SizedBox(height: HSpacing.md),
                          if (isRider)
                            Row(
                              children: [
                                _MapListToggleChip(
                                  label: 'Map',
                                  icon: Icons.map_rounded,
                                  selected: _riderMapMode,
                                  onTap: () {
                                    HapticFeedback.selectionClick();
                                    setState(() => _riderMapMode = true);
                                  },
                                ),
                                const SizedBox(width: 8),
                                _MapListToggleChip(
                                  label: 'List',
                                  icon: Icons.list_rounded,
                                  selected: !_riderMapMode,
                                  onTap: () {
                                    HapticFeedback.selectionClick();
                                    setState(() {
                                      _riderMapMode = false;
                                      ref.read(mapExpandedProvider.notifier).state = false;
                                    });
                                  },
                                ),
                              ],
                            ),
                          if (isRider) const SizedBox(height: HSpacing.md),
                          Row(
                            children: FeedTab.values.map((t) {
                              final selected = _tab == t;
                              return Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: GestureDetector(
                                  onTap: () {
                                    HapticFeedback.selectionClick();
                                    setState(() => _tab = t);
                                  },
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: selected ? HColors.coral500 : HColors.gray100,
                                      borderRadius: BorderRadius.circular(HRadius.pill),
                                    ),
                                    child: Text(
                                      t.name[0].toUpperCase() + t.name.substring(1),
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: selected ? HColors.white : HColors.gray600,
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: HSpacing.sm),
                        ],
                      ),
                    ),
                  ),
                  // Interactive map in normal scroll flow (no gesture interception)
                  if (!isRider || _riderMapMode)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(HSpacing.md, HSpacing.md, HSpacing.md, 0),
                        child: mapExpanded
                            ? Container(
                                height: 150,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(HRadius.lg),
                                  border: Border.all(color: HColors.gray200),
                                  color: HColors.gray100,
                                ),
                              )
                            : _HomeMapCard(
                                fromPoint: mapFromPoint,
                                toPoint: mapToPoint,
                                showOnlyRadar: isRider,
                                onExpand: () => ref.read(mapExpandedProvider.notifier).state = true,
                              ),
                      ),
                    ),
              // Section: Live Routes
              if ((!isRider || !_riderMapMode) && (filteredRoutes.isNotEmpty || _loading)) ...[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.only(top: HSpacing.md),
                    child: HSectionHeader(title: 'Live Now', action: '${routes.length} active'),
                  ),
                ),
                if (_loading)
                  const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.all(HSpacing.xl),
                      child: Center(child: CircularProgressIndicator(color: HColors.coral500)),
                    ),
                  )
                else
                  SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final route = filteredRoutes[index];
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: HSpacing.md, vertical: HSpacing.xs),
                          child: RouteCard(
                            pilotName: route.pilotName,
                            origin: route.origin,
                            destination: route.destination,
                            seatsLeft: route.seatsAvailable,
                            time: _formatTime(route.departureTime),
                            note: route.note,
                            onTap: () => context.push('/route/${route.id}'),
                          ),
                        );
                      },
                      childCount: filteredRoutes.length,
                    ),
                  ),
              ],
              // Section: Planned Trips
              if (_filteredTrips(plannedTrips).isNotEmpty) ...[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.only(top: HSpacing.sm),
                    child: HSectionHeader(title: 'Planned Trips', action: 'See all'),
                  ),
                ),
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final trip = _filteredTrips(plannedTrips)[index];
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: HSpacing.md, vertical: HSpacing.xs),
                        child: _PlannedTripCard(trip: trip),
                      );
                    },
                    childCount: _filteredTrips(plannedTrips).length,
                  ),
                ),
              ],
              // Section: Memories
              if (_filteredMemories(memories).isNotEmpty) ...[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.only(top: HSpacing.sm),
                    child: HSectionHeader(title: 'Journey Stories', action: '${memories.length} stories'),
                  ),
                ),
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final mem = _filteredMemories(memories)[index];
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: HSpacing.md, vertical: HSpacing.xs),
                        child: _MemoryCard(memory: mem),
                      );
                    },
                    childCount: _filteredMemories(memories).length,
                  ),
                ),
              ],
              // Empty state
              if (!_loading && routes.isEmpty && plannedTrips.isEmpty && memories.isEmpty)
                const SliverFillRemaining(
                  child: EmptyState(
                    icon: Icons.explore_outlined,
                    title: 'Your campus is waking up',
                    subtitle: 'Be the first to post a route or\nshare where you\'re headed.',
                  ),
                ),
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
                ],
              ),
            ),
            // Full-screen overlay shown only when expanded.
            if (mapExpanded)
              Positioned.fill(
                child: _ExpandedMapOverlay(
                  fromPoint: mapFromPoint,
                  toPoint: mapToPoint,
                  showOnlyRadar: isRider,
                  onCollapse: () => ref.read(mapExpandedProvider.notifier).state = false,
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _formatTime(String raw) {
    try {
      final dt = DateTime.parse(raw);
      final diff = dt.difference(DateTime.now());
      if (diff.inMinutes < 1) return 'Now';
      if (diff.inMinutes < 60) return 'Leaving in ${diff.inMinutes} min';
      return 'In ${diff.inHours}h';
    } catch (_) {
      return raw;
    }
  }

  List<RouteModel> _filteredRoutes(List<RouteModel> routes) {
    if (_searchQuery.isEmpty) return routes;
    return routes.where((r) =>
      r.origin.toLowerCase().contains(_searchQuery) ||
      r.destination.toLowerCase().contains(_searchQuery) ||
      r.pilotName.toLowerCase().contains(_searchQuery)
    ).toList();
  }

  RouteModel? _findOwnPilotRoute(List<RouteModel> routes, String? userId) {
    if (userId == null) return null;
    for (final route in routes) {
      if (route.pilotId == userId) {
        return route;
      }
    }
    return null;
  }

  List<PlannedTrip> _filteredTrips(List<PlannedTrip> trips) {
    if (_searchQuery.isEmpty) return trips;
    return trips.where((t) =>
      t.origin.toLowerCase().contains(_searchQuery) ||
      t.destination.toLowerCase().contains(_searchQuery)
    ).toList();
  }

  List<Memory> _filteredMemories(List<Memory> mems) {
    if (_searchQuery.isEmpty) return mems;
    return mems.where((m) =>
      m.story.toLowerCase().contains(_searchQuery) ||
      m.origin.toLowerCase().contains(_searchQuery)
    ).toList();
  }
}

class _HomeMapCard extends StatelessWidget {
  final Waypoint? fromPoint;
  final Waypoint? toPoint;
  final bool showOnlyRadar;
  final VoidCallback onExpand;

  const _HomeMapCard({
    this.fromPoint,
    this.toPoint,
    this.showOnlyRadar = false,
    required this.onExpand,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        MiniMapView(
          height: 150,
          fromPoint: fromPoint,
          toPoint: toPoint,
          showOnlyRadar: showOnlyRadar,
        ),
        Positioned(
          top: 8,
          right: 8,
          child: Material(
            color: HColors.white.withValues(alpha: 0.95),
            borderRadius: BorderRadius.circular(HRadius.pill),
            elevation: 1,
            child: IconButton(
              onPressed: onExpand,
              icon: const Icon(Icons.open_in_full_rounded, size: 18),
              style: IconButton.styleFrom(
                foregroundColor: HColors.gray700,
                minimumSize: const Size(34, 34),
                padding: const EdgeInsets.all(8),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ExpandedMapOverlay extends StatelessWidget {
  final Waypoint? fromPoint;
  final Waypoint? toPoint;
  final bool showOnlyRadar;
  final VoidCallback onCollapse;

  const _ExpandedMapOverlay({
    this.fromPoint,
    this.toPoint,
    this.showOnlyRadar = false,
    required this.onCollapse,
  });

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: HColors.white,
      child: Stack(
        children: [
          Positioned.fill(
            child: MiniMapView(
              height: MediaQuery.of(context).size.height,
              fromPoint: fromPoint,
              toPoint: toPoint,
              showOnlyRadar: showOnlyRadar,
            ),
          ),
          Positioned(
            top: MediaQuery.of(context).padding.top + HSpacing.sm,
            left: HSpacing.md,
            child: Material(
              color: HColors.white,
              borderRadius: BorderRadius.circular(HRadius.pill),
              elevation: 2,
              child: IconButton(
                onPressed: onCollapse,
                icon: const Icon(Icons.expand_more_rounded),
                style: IconButton.styleFrom(
                  foregroundColor: HColors.gray800,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapListToggleChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _MapListToggleChip({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? HColors.coral500 : HColors.gray100,
          borderRadius: BorderRadius.circular(HRadius.pill),
          border: Border.all(
            color: selected ? HColors.coral500 : HColors.gray200,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 14,
              color: selected ? HColors.white : HColors.gray600,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: selected ? HColors.white : HColors.gray600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PlannedTripCard extends StatelessWidget {
  final PlannedTrip trip;
  const _PlannedTripCard({required this.trip});

  @override
  Widget build(BuildContext context) {
    return HCard(
      child: Row(
        children: [
          HAvatar(name: trip.userName, size: 36),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(trip.userName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(height: 2),
                Text(
                  '${trip.origin} → ${trip.destination}',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: HColors.gray800),
                ),
                if (trip.description != null && trip.description!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(trip.description!, style: const TextStyle(fontSize: 12, color: HColors.gray500), maxLines: 2, overflow: TextOverflow.ellipsis),
                ],
                const SizedBox(height: 6),
                Row(
                  children: [
                    HChip(label: trip.seatsNeeded > 0 ? '${trip.seatsNeeded} seats' : 'Flexible', icon: Icons.event_seat_rounded),
                    const SizedBox(width: 6),
                    HChip(label: _formatDate(trip.plannedDate), icon: Icons.calendar_today_rounded),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String raw) {
    try {
      final dt = DateTime.parse(raw);
      final diff = dt.difference(DateTime.now());
      if (diff.inDays == 0) return 'Today';
      if (diff.inDays == 1) return 'Tomorrow';
      return 'In ${diff.inDays}d';
    } catch (_) {
      return raw;
    }
  }
}

class _MemoryCard extends StatelessWidget {
  final Memory memory;
  const _MemoryCard({required this.memory});

  @override
  Widget build(BuildContext context) {
    return HCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              HAvatar(name: memory.userName, size: 32),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(memory.userName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    if (memory.userCollege.isNotEmpty)
                      Text(memory.userCollege, style: const TextStyle(fontSize: 11, color: HColors.gray400)),
                  ],
                ),
              ),
              const Icon(Icons.auto_stories_rounded, size: 18, color: HColors.coral400),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            memory.story,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 13, color: HColors.gray600, height: 1.4),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: memory.tags.take(3).map((t) => HChip(label: '#$t')).toList(),
                ),
              ),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  '${memory.origin} → ${memory.destination}',
                  style: const TextStyle(fontSize: 11, color: HColors.gray400),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
