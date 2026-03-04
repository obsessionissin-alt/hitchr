class LivePilot {
  final String pilotId;
  final double lat;
  final double lng;
  final double? heading;
  final int seats;

  const LivePilot({
    required this.pilotId,
    required this.lat,
    required this.lng,
    required this.seats,
    this.heading,
  });

  factory LivePilot.fromJson(Map<String, dynamic> json) {
    final rawPilotId = json['pilot_id'] ?? json['pilotId'] ?? '';
    final rawLat = json['lat'] ?? json['latitude'] ?? 0;
    final rawLng = json['lng'] ?? json['longitude'] ?? 0;
    final rawHeading = json['heading'];
    final rawSeats = json['seats_available'] ?? json['seats'] ?? 0;

    return LivePilot(
      pilotId: rawPilotId.toString(),
      lat: (rawLat as num).toDouble(),
      lng: (rawLng as num).toDouble(),
      heading: rawHeading == null ? null : (rawHeading as num).toDouble(),
      seats: rawSeats is int ? rawSeats : int.tryParse(rawSeats.toString()) ?? 0,
    );
  }
}
