import 'waypoint.dart';

class PlannedTrip {
  final String id;
  final String userId;
  final String userName;
  final String userCollege;
  final Waypoint fromPoint;
  final Waypoint toPoint;
  final String plannedDate;
  final int seatsNeeded;
  final String? description;
  final String? communityId;

  PlannedTrip({
    required this.id,
    required this.userId,
    required this.userName,
    this.userCollege = '',
    required this.fromPoint,
    required this.toPoint,
    required this.plannedDate,
    this.seatsNeeded = 1,
    this.description,
    this.communityId,
  });

  factory PlannedTrip.fromJson(Map<String, dynamic> j) {
    final defaultWp = {'lat': 0, 'lng': 0, 'address': '', 'name': ''};
    return PlannedTrip(
      id: j['id'] ?? j['_id'] ?? '',
      userId: j['user_id'] ?? '',
      userName: j['user_name'] ?? '',
      userCollege: j['user_college'] ?? '',
      fromPoint: Waypoint.fromJson(j['from_point'] ?? defaultWp),
      toPoint: Waypoint.fromJson(j['to_point'] ?? defaultWp),
      plannedDate: j['planned_date']?.toString() ?? '',
      seatsNeeded: j['seats_needed'] ?? 1,
      description: j['description'],
      communityId: j['community_id'],
    );
  }

  String get origin => fromPoint.label;
  String get destination => toPoint.label;
}
