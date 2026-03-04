class Waypoint {
  final double lat;
  final double lng;
  final String address;
  final String name;

  Waypoint({required this.lat, required this.lng, required this.address, required this.name});

  factory Waypoint.fromJson(Map<String, dynamic> j) => Waypoint(
        lat: (j['lat'] as num).toDouble(),
        lng: (j['lng'] as num).toDouble(),
        address: j['address'] ?? '',
        name: j['name'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'lat': lat,
        'lng': lng,
        'address': address,
        'name': name,
      };

  /// Human-readable label
  String get label => name.isNotEmpty ? name : address;
}
