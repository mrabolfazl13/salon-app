import 'package:flutter/material.dart';

/// Brand colors extracted from Tauri application theme
abstract final class AppColors {
  // Primary brand colors
  static const amber = Color(0xFFF59E0B);
  static const amberLight = Color(0xFFFBBF24);
  static const amberDark = Color(0xFFD97706);
  static const amberInk = Color(0xFF1C1917);
  
  static const blue = Color(0xFF2563EB);
  static const blueDark = Color(0xFF1D4ED8);
  
  static const navy = Color(0xFF0F172A);
  static const pitch = Color(0xFF1E3A8A);
  
  // Light theme colors
  static const lightBackground = Color(0xFFF6F7F9);
  static const lightSurface = Color(0xFFFFFFFF);
  static const lightTextPrimary = Color(0xFF0F172A);
  static const lightTextSecondary = Color(0xFF5B6472);
  
  // Dark theme colors
  static const darkBackground = Color(0xFF0B1220);
  static const darkSurface = Color(0xFF121A2B);
  static const darkTextPrimary = Color(0xFFEEF2F7);
  static const darkTextSecondary = Color(0xFF9AA7B8);
  
  // Semantic colors
  static const success = Color(0xFF10B981);
  static const successLight = Color(0xFF34D399);
  static const error = Color(0xFFEF4444);
  static const errorLight = Color(0xFFF87171);
  static const warning = Color(0xFFF59E0B);
  static const info = Color(0xFF3B82F6);
  
  // Divider colors
  static const dividerLight = Color(0x140F172A); // rgba(15,23,42,0.08)
  static const dividerDark = Color(0x14FFFFFF); // rgba(255,255,255,0.08)
  
  // Gradient overlays
  static const heroOverlay = Color(0x26020617); // rgba(2,6,23,0.15)
}
