import 'package:flutter/material.dart';

/// Typography system matching Tauri application
abstract final class AppTypography {
  static const fontFamily = 'Vazirmatn';
  
  static const h1 = TextStyle(
    fontFamily: fontFamily,
    fontWeight: FontWeight.w800,
    fontSize: 56, // 3.5rem
    height: 1.2,
    letterSpacing: -0.32,
  );
  
  static const h2 = TextStyle(
    fontFamily: fontFamily,
    fontWeight: FontWeight.w700,
    fontSize: 40, // 2.5rem
    height: 1.3,
    letterSpacing: -0.16,
  );
  
  static const h3 = TextStyle(
    fontFamily: fontFamily,
    fontWeight: FontWeight.w700,
    fontSize: 32, // 2rem
    height: 1.3,
  );
  
  static const h4 = TextStyle(
    fontFamily: fontFamily,
    fontWeight: FontWeight.w700,
    fontSize: 24, // 1.5rem
    height: 1.4,
  );
  
  static const h5 = TextStyle(
    fontFamily: fontFamily,
    fontWeight: FontWeight.w600,
    fontSize: 20, // 1.25rem
    height: 1.4,
  );
  
  static const h6 = TextStyle(
    fontFamily: fontFamily,
    fontWeight: FontWeight.w600,
    fontSize: 16, // 1rem
    height: 1.5,
  );
  
  static const bodyLarge = TextStyle(
    fontFamily: fontFamily,
    fontWeight: FontWeight.w400,
    fontSize: 16, // 1rem
    height: 1.7,
  );
  
  static const bodyMedium = TextStyle(
    fontFamily: fontFamily,
    fontWeight: FontWeight.w400,
    fontSize: 14, // 0.875rem
    height: 1.6,
  );
  
  static const button = TextStyle(
    fontFamily: fontFamily,
    fontWeight: FontWeight.w600,
    fontSize: 16,
    height: 1.4,
  );
  
  static const caption = TextStyle(
    fontFamily: fontFamily,
    fontWeight: FontWeight.w400,
    fontSize: 12,
    height: 1.5,
  );
}
