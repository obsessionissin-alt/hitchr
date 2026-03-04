import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hitchr_campus/main.dart';

void main() {
  testWidgets('App starts', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: HitchrApp()));
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
