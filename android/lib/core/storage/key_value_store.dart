import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Simple key-value storage abstraction shared across the app.
/// Secure values (tokens) go to flutter_secure_storage; the rest to
/// SharedPreferences.
///
/// WEB CAVEAT: flutter_secure_storage relies on WebCrypto, which only exists
/// in secure contexts (https or localhost). When the web build is served over
/// plain http on an IP (e.g. dev against a VPS), every secure call throws —
/// and previously that exception happened *before* requests were sent,
/// killing the whole API layer (zero network calls, dead login).
/// On web we therefore fall back to SharedPreferences for secure values.
class KeyValueStore {
  KeyValueStore(this._prefs, [this._secure = const FlutterSecureStorage()]);

  final SharedPreferences _prefs;
  final FlutterSecureStorage _secure;

  /// Key prefix used on web when the secure store is unavailable.
  static const _fallbackPrefix = 'sec:';

  // ---- plain ----
  String? getString(String key) => _prefs.getString(key);
  Future<void> setString(String key, String value) => _prefs.setString(key, value);
  Future<void> remove(String key) => _prefs.remove(key);

  List<String>? getStringList(String key) => _prefs.getStringList(key);
  Future<void> setStringList(String key, List<String> value) =>
      _prefs.setStringList(key, value);

  // ---- secure ----
  Future<String?> readSecure(String key) async {
    if (!kIsWeb) return _secure.read(key: key);
    String? value;
    try {
      value = await _secure.read(key: key);
    } catch (_) {
      value = null;
    }
    if (value != null && value.isNotEmpty) return value;
    final fallback = _prefs.getString('$_fallbackPrefix$key');
    return (fallback != null && fallback.isNotEmpty) ? fallback : null;
  }

  Future<void> writeSecure(String key, String value) async {
    if (!kIsWeb) {
      await _secure.write(key: key, value: value);
      return;
    }
    try {
      await _secure.write(key: key, value: value);
      // Mirrored fallback is only authoritative when secure write failed.
      await _prefs.remove('$_fallbackPrefix$key');
    } catch (_) {
      await _prefs.setString('$_fallbackPrefix$key', value);
    }
  }

  Future<void> deleteSecure(String key) async {
    if (kIsWeb) {
      try {
        await _secure.delete(key: key);
      } catch (_) {
        // secure store unavailable on insecure origins — fallback below suffices
      }
      await _prefs.remove('$_fallbackPrefix$key');
      return;
    }
    await _secure.delete(key: key);
  }

  Future<void> clearSecure() async {
    if (kIsWeb) {
      try {
        await _secure.deleteAll();
      } catch (_) {
        // ignore — fallback cleanup below
      }
      for (final k in _prefs.getKeys().where((k) => k.startsWith(_fallbackPrefix)).toList()) {
        await _prefs.remove(k);
      }
      return;
    }
    await _secure.deleteAll();
  }
}

final keyValueStoreProvider = Provider<KeyValueStore>((ref) {
  throw UnimplementedError('Overridden in main()');
});
