import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme/hitchr_theme.dart';
import '../../providers/app_provider.dart';
import '../../models/community.dart';
import '../../widgets/hitchr_widgets.dart';

class CommunitiesScreen extends ConsumerStatefulWidget {
  const CommunitiesScreen({super.key});
  @override
  ConsumerState<CommunitiesScreen> createState() => _CommunitiesScreenState();
}

class _CommunitiesScreenState extends ConsumerState<CommunitiesScreen> {
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    await ref.read(communitiesProvider.notifier).load();
    if (mounted) setState(() => _loading = false);
  }

  IconData _iconForType(String type) {
    switch (type) {
      case 'department': return Icons.school_rounded;
      case 'hostel': return Icons.apartment_rounded;
      case 'event': return Icons.event_rounded;
      case 'sports': return Icons.sports_rounded;
      case 'club': return Icons.groups_rounded;
      default: return Icons.people_rounded;
    }
  }

  Color _colorForType(String type) {
    switch (type) {
      case 'department': return HColors.trustBlue;
      case 'hostel': return HColors.coral500;
      case 'event': return HColors.warning;
      case 'sports': return HColors.trustGreen;
      case 'club': return const Color(0xFF8B5CF6);
      default: return HColors.gray500;
    }
  }

  @override
  Widget build(BuildContext context) {
    final communities = ref.watch(communitiesProvider);

    return Scaffold(
      backgroundColor: HColors.gray100,
      body: SafeArea(
        child: Column(
          children: [
            Container(
              color: HColors.white,
              padding: const EdgeInsets.fromLTRB(HSpacing.md, HSpacing.md, HSpacing.md, HSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Community', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: HColors.gray900)),
                  const SizedBox(height: 4),
                  Text(
                    'Find your people. Ride with your tribe.',
                    style: TextStyle(fontSize: 13, color: HColors.gray500),
                  ),
                ],
              ),
            ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: HColors.coral500))
                  : communities.isEmpty
                      ? const EmptyState(
                          icon: Icons.people_outline_rounded,
                          title: 'Communities coming soon',
                          subtitle: 'Department rides, hostel groups, event carpools — all in one place.',
                        )
                      : RefreshIndicator(
                          color: HColors.coral500,
                          onRefresh: _load,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(HSpacing.md),
                            itemCount: communities.length,
                            itemBuilder: (context, index) {
                              final c = communities[index];
                              return Padding(
                                padding: const EdgeInsets.only(bottom: HSpacing.sm),
                                child: _CommunityCard(
                                  community: c,
                                  icon: _iconForType(c.type),
                                  color: _colorForType(c.type),
                                ),
                              );
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CommunityCard extends StatelessWidget {
  final Community community;
  final IconData icon;
  final Color color;
  const _CommunityCard({required this.community, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return HCard(
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(HRadius.md),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(community.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: HColors.gray900)),
                const SizedBox(height: 2),
                Text(community.description, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: HColors.gray500)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            children: [
              Text('${community.memberCount}', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: color)),
              const Text('members', style: TextStyle(fontSize: 10, color: HColors.gray400)),
            ],
          ),
        ],
      ),
    );
  }
}
