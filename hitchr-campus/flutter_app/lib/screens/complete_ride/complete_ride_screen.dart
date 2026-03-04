import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../theme/hitchr_theme.dart';
import '../../providers/app_provider.dart';
import '../../models/ride.dart';
import '../../widgets/hitchr_widgets.dart';

class CompleteRideScreen extends ConsumerStatefulWidget {
  final String rideId;
  const CompleteRideScreen({super.key, required this.rideId});
  @override
  ConsumerState<CompleteRideScreen> createState() => _CompleteRideScreenState();
}

class _CompleteRideScreenState extends ConsumerState<CompleteRideScreen> {
  Ride? _ride;
  bool _loading = true;
  bool _submitting = false;
  bool _done = false;
  double _amount = 0;
  String _paymentMethod = 'upi';

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final data = await ref.read(apiProvider).getRide(widget.rideId);
      final ride = Ride.fromJson(data);
      setState(() { _ride = ride; _amount = ride.suggestedContribution; _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _submit() async {
    final user = ref.read(userProvider);
    if (user == null || _ride == null) return;
    setState(() => _submitting = true);
    try {
      await ref.read(apiProvider).submitContribution({
        'ride_id': _ride!.id,
        'rider_id': user.id,
        'amount': _amount,
        'payment_method': _paymentMethod,
      });
      HapticFeedback.heavyImpact();
      setState(() => _done = true);
    } catch (e) {
      HapticFeedback.vibrate();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: HColors.error));
    } finally { if (mounted) setState(() => _submitting = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HColors.gray100,
      appBar: AppBar(
        title: Text(_done ? 'Thank You!' : 'Contribution'),
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.pop()),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: HColors.coral500))
          : _ride == null
              ? const EmptyState(icon: Icons.error_outline, title: 'Ride not found', subtitle: '')
              : _done ? _buildReceipt() : _buildContribution(),
    );
  }

  Widget _buildReceipt() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(HSpacing.lg),
      child: Column(children: [
        const SizedBox(height: HSpacing.xl),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: const BoxDecoration(color: HColors.trustGreenLight, shape: BoxShape.circle),
          child: const Icon(Icons.check_rounded, size: 48, color: HColors.trustGreen),
        ),
        const SizedBox(height: HSpacing.lg),
        const Text('Contribution Sent!', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: HColors.gray900)),
        const SizedBox(height: HSpacing.sm),
        Text('Thank you for supporting ${_ride!.pilotName}\'s journey.', textAlign: TextAlign.center, style: const TextStyle(fontSize: 14, color: HColors.gray500)),
        const SizedBox(height: HSpacing.xl),
        HCard(child: Column(children: [
          _ReceiptRow('Pilot', _ride!.pilotName),
          _ReceiptRow('Route', '${_ride!.origin} → ${_ride!.destination}'),
          _ReceiptRow('Shared distance', '${_ride!.sharedDistanceKm.toStringAsFixed(1)} km'),
          _ReceiptRow('Amount', '\u20B9${_amount.toStringAsFixed(0)}'),
          _ReceiptRow('Method', _paymentMethod.toUpperCase()),
          const Divider(color: HColors.gray200),
          _ReceiptRow('Status', 'Paid', valueColor: HColors.trustGreen),
        ])),
        const SizedBox(height: HSpacing.xl),
        HButton(label: 'Back to Home', onPressed: () => context.go('/home'), width: double.infinity),
      ]),
    );
  }

  Widget _buildContribution() {
    final suggested = _ride!.suggestedContribution;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(HSpacing.md),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Ride summary
        HCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            HAvatar(name: _ride!.pilotName, size: 40),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(_ride!.pilotName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              const Text('Took you along their route', style: TextStyle(fontSize: 12, color: HColors.gray500)),
            ])),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            Column(children: [
              Container(width: 8, height: 8, decoration: const BoxDecoration(shape: BoxShape.circle, color: HColors.coral500)),
              Container(width: 2, height: 20, color: HColors.gray200),
              Container(width: 8, height: 8, decoration: const BoxDecoration(shape: BoxShape.circle, color: HColors.trustBlue)),
            ]),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(_ride!.origin, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 10),
              Text(_ride!.destination, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            ])),
          ]),
        ])),
        const SizedBox(height: HSpacing.lg),

        // Explanation
        HCard(color: HColors.trustBlueLight, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('How contributions work', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: HColors.trustBlue)),
          const SizedBox(height: 8),
          Text(
            'The pilot was already going A \u2192 C.\nYou shared part of their route (A \u2192 B).\nYour contribution covers only your shared ${_ride!.sharedDistanceKm.toStringAsFixed(1)} km \u2014 fair and transparent.',
            style: const TextStyle(fontSize: 13, color: HColors.gray700, height: 1.5),
          ),
        ])),
        const SizedBox(height: HSpacing.lg),

        // Amount options
        const Text('Choose amount', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: HColors.gray900)),
        const SizedBox(height: HSpacing.sm),
        Row(children: [
          _AmountOption(amount: 0, label: 'Waive', selected: _amount == 0, onTap: () => setState(() => _amount = 0)),
          _AmountOption(amount: (suggested * 0.5).roundToDouble(), label: 'Reduced', selected: _amount == (suggested * 0.5).roundToDouble(), onTap: () => setState(() => _amount = (suggested * 0.5).roundToDouble())),
          _AmountOption(amount: suggested, label: 'Suggested', selected: _amount == suggested, onTap: () => setState(() => _amount = suggested)),
          _AmountOption(amount: (suggested * 1.5).roundToDouble(), label: 'Generous', selected: _amount == (suggested * 1.5).roundToDouble(), onTap: () => setState(() => _amount = (suggested * 1.5).roundToDouble())),
        ]),
        const SizedBox(height: HSpacing.md),
        Center(child: Text('\u20B9${_amount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: HColors.coral500))),
        const SizedBox(height: HSpacing.lg),

        // Payment method
        const Text('Payment Method', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: HColors.gray900)),
        const SizedBox(height: HSpacing.sm),
        _PaymentMethodOption(label: 'UPI', icon: Icons.account_balance_rounded, selected: _paymentMethod == 'upi', onTap: () => setState(() => _paymentMethod = 'upi')),
        const SizedBox(height: 8),
        _PaymentMethodOption(label: 'Card', icon: Icons.credit_card_rounded, selected: _paymentMethod == 'card', onTap: () => setState(() => _paymentMethod = 'card')),
        const SizedBox(height: 8),
        _PaymentMethodOption(label: 'Cash', icon: Icons.payments_outlined, selected: _paymentMethod == 'cash', onTap: () => setState(() => _paymentMethod = 'cash')),
        const SizedBox(height: HSpacing.xl),

        HButton(
          label: _amount == 0 ? 'Waive Contribution' : 'Pay \u20B9${_amount.toStringAsFixed(0)}',
          onPressed: _submit, loading: _submitting, width: double.infinity,
        ),
        const SizedBox(height: HSpacing.xxl),
      ]),
    );
  }
}

class _AmountOption extends StatelessWidget {
  final double amount;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _AmountOption({required this.amount, required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: () { HapticFeedback.selectionClick(); onTap(); },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          margin: const EdgeInsets.symmetric(horizontal: 3),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selected ? HColors.coral500 : HColors.white,
            borderRadius: BorderRadius.circular(HRadius.md),
            border: Border.all(color: selected ? HColors.coral500 : HColors.gray200),
          ),
          child: Column(children: [
            Text('\u20B9${amount.toStringAsFixed(0)}', style: TextStyle(fontWeight: FontWeight.w700, color: selected ? HColors.white : HColors.gray800)),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 10, color: selected ? HColors.white.withValues(alpha: 0.8) : HColors.gray500)),
          ]),
        ),
      ),
    );
  }
}

class _PaymentMethodOption extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;
  const _PaymentMethodOption({required this.label, required this.icon, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () { HapticFeedback.selectionClick(); onTap(); },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.all(HSpacing.md),
        decoration: BoxDecoration(
          color: selected ? HColors.coral50 : HColors.white,
          borderRadius: BorderRadius.circular(HRadius.md),
          border: Border.all(color: selected ? HColors.coral500 : HColors.gray200, width: selected ? 2 : 1),
        ),
        child: Row(children: [
          Icon(icon, color: selected ? HColors.coral500 : HColors.gray400, size: 22),
          const SizedBox(width: 12),
          Text(label, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: selected ? HColors.coral500 : HColors.gray700)),
          const Spacer(),
          if (selected) const Icon(Icons.check_circle_rounded, color: HColors.coral500, size: 20),
        ]),
      ),
    );
  }
}

class _ReceiptRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  const _ReceiptRow(this.label, this.value, {this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: const TextStyle(fontSize: 13, color: HColors.gray500)),
        Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: valueColor ?? HColors.gray800)),
      ]),
    );
  }
}
