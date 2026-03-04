class Community {
  final String id;
  final String name;
  final String description;
  final String type;
  final int memberCount;
  final String? college;

  Community({
    required this.id,
    required this.name,
    required this.description,
    this.type = 'campus',
    this.memberCount = 0,
    this.college,
  });

  factory Community.fromJson(Map<String, dynamic> j) => Community(
        id: j['_id'] ?? j['id'] ?? '',
        name: j['name'] ?? '',
        description: j['description'] ?? '',
        type: j['type'] ?? 'campus',
        memberCount: j['member_count'] ?? 0,
        college: j['college'],
      );
}
