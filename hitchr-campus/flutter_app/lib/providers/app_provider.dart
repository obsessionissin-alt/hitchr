import 'dart:async';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart' as geo;
import 'package:shared_preferences/shared_preferences.dart';
import '../api/campus_api.dart';
import '../models/user.dart';
import '../models/route_model.dart';
import '../models/ride.dart';
import '../models/join_request.dart';
import '../models/planned_trip.dart';
import '../models/memory.dart';
import '../models/community.dart';
import '../services/push_notifications.dart';
import '../services/notification_center.dart';

/// Singleton API instance
final apiProvider = Provider<CampusApi>((ref) => CampusApi());

/// Global in-app notification event bus.
final notificationCenterProvider = Provider<NotificationCenter>((ref) {
  final center = NotificationCenter();
  ref.onDispose(center.dispose);
  return center;
});

/// Current user
class UserNotifier extends StateNotifier<HitchrUser?> {
  final CampusApi api;
  UserNotifier(this.api) : super(null);

  Future<void> login(String name, String college) async {
    final data = await api.createUser({'name': name, 'college': college});
    state = HitchrUser.fromJson(data);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_id', state!.id);
    await PushNotificationsService.instance.registerCurrentUser(api, state!.id);
  }

  Future<bool> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final id = prefs.getString('user_id');
    if (id == null) return false;
    try {
      final data = await api.getUser(id);
      state = HitchrUser.fromJson(data);
      await PushNotificationsService.instance.registerCurrentUser(
        api,
        state!.id,
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> toggleRole() async {
    if (state == null) {
      debugPrint('[UserNotifier] toggleRole called but state is null');
      return;
    }
    final oldRole = state!.role;
    final newRole = oldRole == 'pilot' ? 'rider' : 'pilot';
    debugPrint(
      '[UserNotifier] toggleRole: $oldRole → $newRole (user=${state!.id})',
    );

    final responseData = await api.toggleRole(state!.id, newRole);

    // Backend may return either a full user or just {"role": "..."}.
    final confirmedRole = (responseData['role'] as String?) ?? newRole;
    debugPrint(
      '[UserNotifier] toggleRole succeeded, server returned role=$confirmedRole',
    );
    final current = state;
    if (current == null) return;
    state = HitchrUser(
      id: current.id,
      name: current.name,
      college: current.college,
      email: current.email,
      inviteCode: current.inviteCode,
      campusVerified: current.campusVerified,
      role: confirmedRole,
      badges: current.badges,
      trustScore: current.trustScore,
      totalRides: current.totalRides,
      communities: current.communities,
    );
  }

  Future<void> logout() async {
    debugPrint('[UserNotifier] logout: clearing session for user=${state?.id}');
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_id');
    await PushNotificationsService.instance.clearUser();
    state = null;
    debugPrint('[UserNotifier] logout: session cleared, state=null');
  }
}

final userProvider = StateNotifierProvider<UserNotifier, HitchrUser?>((ref) {
  return UserNotifier(ref.read(apiProvider));
});

/// Routes feed
class RoutesNotifier extends StateNotifier<List<RouteModel>> {
  final CampusApi api;
  RoutesNotifier(this.api) : super([]);

  Future<void> load() async {
    try {
      // Backend defaults to showing posted/waiting/active — no filter needed
      final data = await api.getRoutes();
      state = data.map((j) => RouteModel.fromJson(j)).toList();
    } catch (_) {
      state = [];
    }
  }

  void reset() => state = [];
}

final routesProvider = StateNotifierProvider<RoutesNotifier, List<RouteModel>>((
  ref,
) {
  return RoutesNotifier(ref.read(apiProvider));
});

/// Planned trips
class PlannedTripsNotifier extends StateNotifier<List<PlannedTrip>> {
  final CampusApi api;
  PlannedTripsNotifier(this.api) : super([]);

  Future<void> load() async {
    try {
      final data = await api.getPlannedTrips();
      state = data.map((j) => PlannedTrip.fromJson(j)).toList();
    } catch (_) {
      state = [];
    }
  }

  void reset() => state = [];
}

final plannedTripsProvider =
    StateNotifierProvider<PlannedTripsNotifier, List<PlannedTrip>>((ref) {
      return PlannedTripsNotifier(ref.read(apiProvider));
    });

/// Memories
class MemoriesNotifier extends StateNotifier<List<Memory>> {
  final CampusApi api;
  MemoriesNotifier(this.api) : super([]);

  Future<void> load() async {
    try {
      final data = await api.getMemories();
      state = data.map((j) => Memory.fromJson(j)).toList();
    } catch (_) {
      state = [];
    }
  }

  void reset() => state = [];
}

final memoriesProvider = StateNotifierProvider<MemoriesNotifier, List<Memory>>((
  ref,
) {
  return MemoriesNotifier(ref.read(apiProvider));
});

/// Communities
class CommunitiesNotifier extends StateNotifier<List<Community>> {
  final CampusApi api;
  CommunitiesNotifier(this.api) : super([]);

  Future<void> load() async {
    try {
      final data = await api.getCommunities();
      state = data.map((j) => Community.fromJson(j)).toList();
    } catch (_) {
      state = [];
    }
  }

  void reset() => state = [];
}

final communitiesProvider =
    StateNotifierProvider<CommunitiesNotifier, List<Community>>((ref) {
      return CommunitiesNotifier(ref.read(apiProvider));
    });

/// Join requests for pilot
class JoinRequestsNotifier extends StateNotifier<List<JoinRequest>> {
  final CampusApi api;
  JoinRequestsNotifier(this.api) : super([]);

  Future<void> loadForRoute(String routeId) async {
    try {
      final data = await api.getJoinRequestsByRoute(routeId, status: 'pending');
      state = data.map((j) => JoinRequest.fromJson(j)).toList();
    } catch (_) {
      state = [];
    }
  }

  void reset() => state = [];
}

final joinRequestsProvider =
    StateNotifierProvider<JoinRequestsNotifier, List<JoinRequest>>((ref) {
      return JoinRequestsNotifier(ref.read(apiProvider));
    });

/// Rides list — loads rides for BOTH pilot and rider roles to show full history.
class RidesNotifier extends StateNotifier<List<Ride>> {
  final CampusApi api;
  RidesNotifier(this.api) : super([]);

  Future<void> loadForUser(String userId, String role) async {
    try {
      // Load rides for both roles — user might have rides as pilot AND rider
      final pilotData = await api.getRidesByPilot(userId);
      final riderData = await api.getRidesByRider(userId);

      // Merge and deduplicate by ride ID
      final Map<String, Ride> unique = {};
      for (final j in pilotData) {
        final ride = Ride.fromJson(j);
        unique[ride.id] = ride;
      }
      for (final j in riderData) {
        final ride = Ride.fromJson(j);
        unique[ride.id] = ride;
      }

      state = unique.values.toList();
      debugPrint(
        '[RidesNotifier] Loaded ${unique.length} ride(s) for user=$userId '
        '(${pilotData.length} as pilot, ${riderData.length} as rider)',
      );
    } catch (e) {
      debugPrint('[RidesNotifier] Error loading rides: $e');
      state = [];
    }
  }

  void reset() => state = [];
}

final ridesProvider = StateNotifierProvider<RidesNotifier, List<Ride>>((ref) {
  return RidesNotifier(ref.read(apiProvider));
});

/// Has seeded
final hasSeededProvider = StateProvider<bool>((ref) => false);

/// Home map expanded to full-screen (hides nav, search, cards).
final mapExpandedProvider = StateProvider<bool>((ref) => false);

class PilotLiveState {
  final bool isLive;
  final bool busy;
  final String? pilotId;

  const PilotLiveState({this.isLive = false, this.busy = false, this.pilotId});

  PilotLiveState copyWith({bool? isLive, bool? busy, String? pilotId}) {
    return PilotLiveState(
      isLive: isLive ?? this.isLive,
      busy: busy ?? this.busy,
      pilotId: pilotId ?? this.pilotId,
    );
  }
}

class PilotLiveNotifier extends StateNotifier<PilotLiveState> {
  final CampusApi api;

  PilotLiveNotifier(this.api) : super(const PilotLiveState());

  Timer? _liveTimer;
  StreamSubscription<geo.Position>? _positionStream;
  geo.Position? _latestPosition;

  Future<bool> _ensureLocationPermission() async {
    final enabled = await geo.Geolocator.isLocationServiceEnabled();
    if (!enabled) return false;

    var permission = await geo.Geolocator.checkPermission();
    if (permission == geo.LocationPermission.denied) {
      permission = await geo.Geolocator.requestPermission();
    }
    return permission != geo.LocationPermission.denied &&
        permission != geo.LocationPermission.deniedForever;
  }

  Future<void> enable(String pilotId, {int seats = 3}) async {
    if (state.busy) return;
    if (state.isLive && state.pilotId == pilotId) return;

    state = state.copyWith(busy: true);
    try {
      final hasPermission = await _ensureLocationPermission();
      if (!hasPermission) {
        state = state.copyWith(busy: false);
        return;
      }

      await api.liveStart(pilotId, seats);
      await _startPositionStream();
      _startTimer(pilotId);
      state = PilotLiveState(isLive: true, busy: false, pilotId: pilotId);
    } catch (_) {
      state = state.copyWith(busy: false);
    }
  }

  Future<void> disable(String pilotId) async {
    if (state.busy) return;
    state = state.copyWith(busy: true);
    await _stopTracking();
    try {
      await api.liveStop(pilotId);
    } catch (_) {}
    state = const PilotLiveState();
  }

  Future<void> disableIfActive() async {
    final id = state.pilotId;
    if (!state.isLive || id == null) return;
    await disable(id);
  }

  Future<void> _startPositionStream() async {
    if (_positionStream != null) return;
    _positionStream =
        geo.Geolocator.getPositionStream(
          locationSettings: const geo.LocationSettings(
            accuracy: geo.LocationAccuracy.high,
          ),
        ).listen((position) {
          _latestPosition = position;
        });
  }

  void _startTimer(String pilotId) {
    if (_liveTimer != null) return;
    _liveTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      final pos = _latestPosition;
      if (pos == null) return;
      try {
        await api.liveLocationUpdate(pilotId, pos.latitude, pos.longitude);
      } catch (_) {}
    });
  }

  Future<void> _stopTracking() async {
    _liveTimer?.cancel();
    _liveTimer = null;
    await _positionStream?.cancel();
    _positionStream = null;
    _latestPosition = null;
  }

  @override
  void dispose() {
    _liveTimer?.cancel();
    _positionStream?.cancel();
    super.dispose();
  }
}

final pilotLiveProvider =
    StateNotifierProvider<PilotLiveNotifier, PilotLiveState>((ref) {
      return PilotLiveNotifier(ref.read(apiProvider));
    });

/// Helper: reset all providers on sign-out.
/// Call from any screen that triggers logout to ensure clean state.
void resetAllProviders(WidgetRef ref) {
  debugPrint('[resetAllProviders] Clearing all cached provider state');
  ref.read(pilotLiveProvider.notifier).disableIfActive();
  ref.read(routesProvider.notifier).reset();
  ref.read(plannedTripsProvider.notifier).reset();
  ref.read(memoriesProvider.notifier).reset();
  ref.read(communitiesProvider.notifier).reset();
  ref.read(joinRequestsProvider.notifier).reset();
  ref.read(ridesProvider.notifier).reset();
  ref.invalidate(hasSeededProvider);
}
