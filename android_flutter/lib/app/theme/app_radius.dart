import 'package:flutter/material.dart';

/// Border radius system matching Tauri design
abstract final class AppRadius {
  static const double card = 20;
  static const double sheet = 24;
  static const double button = 14;
  static const double chip = 10;
  static const double image = 16;
  static const double dialog = 24;
  static const double small = 8;
  static const double medium = 12;
  static const double large = 16;
  
  // Predefined BorderRadius objects
  static final cardBorderRadius = BorderRadius.circular(card);
  static final buttonBorderRadius = BorderRadius.circular(button);
  static final chipBorderRadius = BorderRadius.circular(chip);
  static final imageBorderRadius = BorderRadius.circular(image);
  static final smallBorderRadius = BorderRadius.circular(small);
  static final mediumBorderRadius = BorderRadius.circular(medium);
  static final largeBorderRadius = BorderRadius.circular(large);
}
