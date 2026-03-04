import 'waypoint.dart';

class Ride {
  final String id;
  final String routeId;
  final String pilotId;
  final String pilotName;
  final String riderId;
  final String riderName;
  final Waypoint pickup;
  final Waypoint dropoff;
  final Waypoint pilotDestination;
  final String status; // waiting, active, completed
  final double sharedDistanceKm;
  final double suggestedContribution;
  final double actualContribution;
  final String contributionStatus; // pending, paid, waived
  final String? startedAt;
  final String? completedAt;

  Ride({
    required this.id,
    required this.routeId,
    required this.pilotId,
    required this.pilotName,
    required this.riderId,
    required this.riderName,
    required this.pickup,
    required this.dropoff,
    required this.pilotDestination,
    this.status = 'waiting',
    this.sharedDistanceKm = 0,
    this.suggestedContribution = 0,
    this.actualContribution = 0,
    this.contributionStatus = 'pending',
    this.startedAt,
    this.completedAt,
  });

  factory Ride.fromJson(Map<String, dynamic> j) {
    final defaultWp = {'lat': 0, 'lng': 0, 'address': '', 'name': ''};
    return Ride(
      id: j['id'] ?? j['_id'] ?? '',
      routeId: j['route_id'] ?? '',
      pilotId: j['pilot_id'] ?? '',
      pilotName: j['pilot_name'] ?? '',
      riderId: j['rider_id'] ?? '',
      riderName: j['rider_name'] ?? '',
      pickup: Waypoint.fromJson(j['pickup'] ?? defaultWp),
      dropoff: Waypoint.fromJson(j['dropoff'] ?? defaultWp),
      pilotDestination: Waypoint.fromJson(j['pilot_destination'] ?? defaultWp),
      status: j['status'] ?? 'waiting',
      sharedDistanceKm: (j['shared_distance_km'] as num?)?.toDouble() ?? 0,
      suggestedContribution: (j['suggested_contribution'] as num?)?.toDouble() ?? 0,
      actualContribution: (j['actual_contribution'] as num?)?.toDouble() ?? 0,
      contributionStatus: j['contribution_status'] ?? 'pending',
      startedAt: j['started_at']?.toString(),
      completedAt: j['completed_at']?.toString(),
    );
  }

  /// Convenience
  String get origin => pickup.label;
  String get destination => dropoff.label;
}
