import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  AppConfig._();

  static late String apiBaseUrl;
  static late String staticDomain;

  /// Build-time overrides (--dart-define) win over .env — used for emulator
  /// testing where the device has no direct internet:
  ///   --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1
  ///   --dart-define=STATIC_DOMAIN=http://10.0.2.2:8000
  static const _dartApi = String.fromEnvironment('API_BASE_URL');
  static const _dartDomain = String.fromEnvironment('STATIC_DOMAIN');

  static void load() {
    apiBaseUrl = _dartApi.isNotEmpty
        ? _dartApi
        : (dotenv.env['API_BASE_URL'] ?? 'http://2.189.255.225/api/v1');
    staticDomain = (_dartDomain.isNotEmpty
            ? _dartDomain
            : (dotenv.env['STATIC_DOMAIN'] ?? 'http://2.189.255.225'))
        .replaceAll(
      RegExp(r'/+$'),
      '',
    );
  }

  /// Converts a backend image filename to a full URL.
  static String imageUrl(String? filename) {
    if (filename == null || filename.isEmpty) return '';
    if (filename.startsWith(RegExp(r'https?://', caseSensitive: false))) {
      return filename;
    }
    return '$staticDomain/static/venues/${filename.replaceFirst(RegExp(r'^/+'), '')}';
  }

  static String wsBase() {
    final uri = Uri.tryParse(apiBaseUrl);
    if (uri == null || uri.host.isEmpty) return 'ws://localhost:8000';
    final scheme = uri.scheme == 'https' ? 'wss' : 'ws';
    return '$scheme://${uri.host}${uri.hasPort ? ':${uri.port}' : ''}';
  }
}
