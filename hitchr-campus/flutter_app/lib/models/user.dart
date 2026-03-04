class HitchrUser {
  final String id;
  final String name;
  final String college;
  final String? email;
  final String? inviteCode;
  final bool campusVerified;
  final String role; // 'pilot' or 'rider'
  final List<String> badges;
  final int trustScore;
  final int totalRides;
  final List<String> communities;

  HitchrUser({
    required this.id,
    required this.name,
    required this.college,
    this.email,
    this.inviteCode,
    this.campusVerified = true,
    this.role = 'rider',
    this.badges = const [],
    this.trustScore = 100,
    this.totalRides = 0,
    this.communities = const [],
  });

  factory HitchrUser.fromJson(Map<String, dynamic> j) => HitchrUser(
        id: j['id'] ?? j['_id'] ?? '',
        name: j['name'] ?? '',
        college: j['college'] ?? '',
        email: j['email'],
        inviteCode: j['invite_code'],
        campusVerified: j['campus_verified'] ?? true,
        role: j['role'] ?? 'rider',
        badges: List<String>.from(j['badges'] ?? []),
        trustScore: j['trust_score'] ?? 100,
        totalRides: j['total_rides'] ?? 0,
        communities: List<String>.from(j['communities'] ?? []),
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'college': college,
        if (email != null) 'email': email,
      };
}
