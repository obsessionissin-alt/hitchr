import 'waypoint.dart';

class JoinRequest {
  final String id;
  final String routeId;
  final String riderId;
  final String riderName;
  final String riderCollege;
  final Waypoint pickup;
  final Waypoint dropoff;
  final String status; // pending, accepted, declined
  final String? requestedAt;

  JoinRequest({
    required this.id,
    required this.routeId,
    required this.riderId,
    required this.riderName,
    required this.riderCollege,
    required this.pickup,
    required this.dropoff,
    this.status = 'pending',
    this.requestedAt,
  });

  factory JoinRequest.fromJson(Map<String, dynamic> j) {
    final defaultWp = {'lat': 0, 'lng': 0, 'address': '', 'name': ''};
    return JoinRequest(
      id: j['id'] ?? j['_id'] ?? '',
      routeId: j['route_id'] ?? '',
      riderId: j['rider_id'] ?? '',
      riderName: j['rider_name'] ?? '',
      riderCollege: j['rider_college'] ?? '',
      pickup: Waypoint.fromJson(j['pickup'] ?? defaultWp),
      dropoff: Waypoint.fromJson(j['dropoff'] ?? defaultWp),
      status: j['status'] ?? 'pending',
      requestedAt: j['requested_at']?.toString(),
    );
  }
}
