import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Hitchr design tokens — ported from hitchr-final-prototype.html
class HColors {
  // Coral palette (primary)
  static const coral50 = Color(0xFFFFF5F5);
  static const coral100 = Color(0xFFFFE5E5);
  static const coral200 = Color(0xFFFFCCD0);
  static const coral400 = Color(0xFFFF8F8F);
  static const coral500 = Color(0xFFFF6B6B);
  static const coral600 = Color(0xFFE64545);

  // Trust colors
  static const trustBlue = Color(0xFF4A90E2);
  static const trustBlueLight = Color(0xFFE8F2FC);
  static const trustGreen = Color(0xFF52C41A);
  static const trustGreenLight = Color(0xFFE8F8E0);

  // Grays
  static const gray50 = Color(0xFFFAFAFA);
  static const gray100 = Color(0xFFF5F5F5);
  static const gray200 = Color(0xFFE8E8E8);
  static const gray300 = Color(0xFFD4D4D4);
  static const gray400 = Color(0xFFA3A3A3);
  static const gray500 = Color(0xFF737373);
  static const gray600 = Color(0xFF525252);
  static const gray700 = Color(0xFF404040);
  static const gray800 = Color(0xFF262626);
  static const gray900 = Color(0xFF171717);

  static const white = Colors.white;
  static const black = Colors.black;

  // Semantic
  static const success = trustGreen;
  static const error = Color(0xFFEF4444);
  static const warning = Color(0xFFF59E0B);
  static const info = trustBlue;
}

class HSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
}

class HRadius {
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double pill = 999;
}

class HShadows {
  static final soft = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.06),
      blurRadius: 20,
      offset: const Offset(0, 4),
    ),
  ];
  static final card = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.08),
      blurRadius: 12,
      offset: const Offset(0, 2),
    ),
  ];
  static final float = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.12),
      blurRadius: 30,
      offset: const Offset(0, 8),
    ),
  ];
}

ThemeData hitchrTheme() {
  final base = ThemeData.light(useMaterial3: true);
  final textTheme = GoogleFonts.interTextTheme(base.textTheme);

  return base.copyWith(
    colorScheme: ColorScheme.fromSeed(
      seedColor: HColors.coral500,
      primary: HColors.coral500,
      onPrimary: HColors.white,
      surface: HColors.white,
      onSurface: HColors.gray900,
      error: HColors.error,
    ),
    scaffoldBackgroundColor: HColors.gray100,
    textTheme: textTheme,
    appBarTheme: AppBarTheme(
      backgroundColor: HColors.white,
      foregroundColor: HColors.gray900,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: textTheme.titleLarge?.copyWith(
        fontWeight: FontWeight.w700,
        color: HColors.gray900,
      ),
    ),
    cardTheme: CardThemeData(
      color: HColors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(HRadius.lg),
        side: const BorderSide(color: HColors.gray200, width: 1),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: HColors.gray100,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: HSpacing.md,
        vertical: HSpacing.md,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(HRadius.md),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(HRadius.md),
        borderSide: const BorderSide(color: HColors.coral500, width: 2),
      ),
      hintStyle: const TextStyle(color: HColors.gray400),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: HColors.coral500,
        foregroundColor: HColors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(
          horizontal: HSpacing.lg,
          vertical: HSpacing.md,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(HRadius.lg),
        ),
        textStyle: const TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: 16,
        ),
      ),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: HColors.white,
      selectedItemColor: HColors.coral500,
      unselectedItemColor: HColors.gray400,
      elevation: 0,
      type: BottomNavigationBarType.fixed,
      selectedLabelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
      unselectedLabelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
    ),
  );
}
