import 'waypoint.dart';

class RouteModel {
  final String id;
  final String pilotId;
  final String pilotName;
  final String pilotCollege;
  final Waypoint fromPoint;
  final Waypoint toPoint;
  final String departureTime;
  final int timeWindowMins;
  final int seatsAvailable;
  final int totalSeats;
  final double distanceKm;
  final int durationMins;
  final String? note;
  final String status; // posted, waiting, active, completed
  final List<String> activeRiders;
  final String? createdAt;

  RouteModel({
    required this.id,
    required this.pilotId,
    required this.pilotName,
    required this.pilotCollege,
    required this.fromPoint,
    required this.toPoint,
    this.departureTime = 'Now',
    this.timeWindowMins = 15,
    this.seatsAvailable = 3,
    this.totalSeats = 3,
    this.distanceKm = 0,
    this.durationMins = 0,
    this.note,
    this.status = 'posted',
    this.activeRiders = const [],
    this.createdAt,
  });

  factory RouteModel.fromJson(Map<String, dynamic> j) => RouteModel(
        id: j['id'] ?? j['_id'] ?? '',
        pilotId: j['pilot_id'] ?? '',
        pilotName: j['pilot_name'] ?? 'Unknown',
        pilotCollege: j['pilot_college'] ?? '',
        fromPoint: Waypoint.fromJson(j['from_point'] ?? {'lat': 0, 'lng': 0, 'address': '', 'name': ''}),
        toPoint: Waypoint.fromJson(j['to_point'] ?? {'lat': 0, 'lng': 0, 'address': '', 'name': ''}),
        departureTime: j['departure_time']?.toString() ?? 'Now',
        timeWindowMins: j['time_window_mins'] ?? 15,
        seatsAvailable: j['seats_available'] ?? 3,
        totalSeats: j['total_seats'] ?? 3,
        distanceKm: (j['distance_km'] as num?)?.toDouble() ?? 0,
        durationMins: j['duration_mins'] ?? 0,
        note: j['note'],
        status: j['status'] ?? 'posted',
        activeRiders: List<String>.from(j['active_riders'] ?? []),
        createdAt: j['created_at']?.toString(),
      );

  /// Convenience getters
  String get origin => fromPoint.label;
  String get destination => toPoint.label;
}
