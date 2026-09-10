import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Simple key-value storage abstraction shared across the app.
/// Secure values (tokens) go to flutter_secure_storage; the rest to
/// SharedPreferences.
class KeyValueStore {
  KeyValueStore(this._prefs, [this._secure = const FlutterSecureStorage()]);

  final SharedPreferences _prefs;
  final FlutterSecureStorage _secure;

  // ---- plain ----
  String? getString(String key) => _prefs.getString(key);
  Future<void> setString(String key, String value) => _prefs.setString(key, value);
  Future<void> remove(String key) => _prefs.remove(key);

  List<String>? getStringList(String key) => _prefs.getStringList(key);
  Future<void> setStringList(String key, List<String> value) =>
      _prefs.setStringList(key, value);

  // ---- secure ----
  Future<String?> readSecure(String key) => _secure.read(key: key);
  Future<void> writeSecure(String key, String value) =>
      _secure.write(key: key, value: value);
  Future<void> deleteSecure(String key) => _secure.delete(key: key);
  Future<void> clearSecure() => _secure.deleteAll();
}

final keyValueStoreProvider = Provider<KeyValueStore>((ref) {
  throw UnimplementedError('Overridden in main()');
});
