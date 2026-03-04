import 'waypoint.dart';

class Memory {
  final String id;
  final String userId;
  final String userName;
  final String userCollege;
  final Waypoint fromPoint;
  final Waypoint toPoint;
  final String story;
  final List<String> tags;
  final double distanceKm;
  final String? communityId;

  Memory({
    required this.id,
    required this.userId,
    required this.userName,
    this.userCollege = '',
    required this.fromPoint,
    required this.toPoint,
    required this.story,
    this.tags = const [],
    this.distanceKm = 0,
    this.communityId,
  });

  factory Memory.fromJson(Map<String, dynamic> j) {
    final defaultWp = {'lat': 0, 'lng': 0, 'address': '', 'name': ''};
    return Memory(
      id: j['id'] ?? j['_id'] ?? '',
      userId: j['user_id'] ?? '',
      userName: j['user_name'] ?? '',
      userCollege: j['user_college'] ?? '',
      fromPoint: Waypoint.fromJson(j['from_point'] ?? defaultWp),
      toPoint: Waypoint.fromJson(j['to_point'] ?? defaultWp),
      story: j['story'] ?? '',
      tags: List<String>.from(j['tags'] ?? []),
      distanceKm: (j['distance_km'] as num?)?.toDouble() ?? 0,
      communityId: j['community_id'],
    );
  }

  String get origin => fromPoint.label;
  String get destination => toPoint.label;
}
