import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/hitchr_theme.dart';
import 'hitchr_widgets.dart';

/// Shared bottom sheet for setting Backend URL (used on onboarding and profile).
class BackendUrlSheet extends StatefulWidget {
  final String currentUrl;
  final Future<void> Function(String url) onSave;

  const BackendUrlSheet({super.key, required this.currentUrl, required this.onSave});

  @override
  State<BackendUrlSheet> createState() => _BackendUrlSheetState();
}

class _BackendUrlSheetState extends State<BackendUrlSheet> {
  late final TextEditingController _controller;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.currentUrl);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: HSpacing.md,
        right: HSpacing.md,
        top: HSpacing.lg,
        bottom: MediaQuery.of(context).viewInsets.bottom + HSpacing.lg,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Backend URL',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: HColors.gray900),
          ),
          const SizedBox(height: 4),
          Text(
            'For phone testing: use your computer\'s LAN IP (e.g. http://192.168.1.5:8001/api)',
            style: TextStyle(fontSize: 12, color: HColors.gray500),
          ),
          const SizedBox(height: HSpacing.md),
          TextField(
            controller: _controller,
            decoration: InputDecoration(
              hintText: 'http://192.168.x.x:8001/api',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(HRadius.md)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            keyboardType: TextInputType.url,
            autocorrect: false,
          ),
          const SizedBox(height: HSpacing.lg),
          HButton(
            label: _saving ? 'Saving...' : 'Save',
            onPressed: _saving ? null : () async {
              final url = _controller.text.trim();
              if (url.isEmpty) return;
              HapticFeedback.mediumImpact();
              setState(() => _saving = true);
              await widget.onSave(url);
              if (mounted) setState(() => _saving = false);
            },
            loading: _saving,
            width: double.infinity,
          ),
        ],
      ),
    );
  }
}
