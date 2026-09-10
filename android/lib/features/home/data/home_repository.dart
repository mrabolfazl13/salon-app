import 'package:geolocator/geolocator.dart';

import '../../../core/error/error_mapper.dart';
import '../../../core/network/api_client.dart';
import '../../venues/domain/venue.dart';

/// Thin facade used by Home to fetch venues and optional location.
class HomeRepository {
  HomeRepository(this._api);

  final ApiClient _api;

  Future<List<Venue>> getVenues({
    int? limit,
    double? latitude,
    double? longitude,
    double? radius,
  }) async {
    try {
      final res = await _api.get('/venues/', query: {
        if (limit != null) 'limit': limit,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        if (radius != null) 'radius': radius,
      });
      final list = res.data as List? ?? [];
      return list
          .whereType<Map<String, dynamic>>()
          .map(Venue.fromJson)
          .toList();
    } catch (e) {
      throw ErrorMapper.from(e);
    }
  }

  /// Returns null when permission is denied or the device has no fix —
  /// callers fall back to the plain venue list (original behavior).
  Future<({double latitude, double longitude})?> currentPosition() async {
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return null;
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.low,
          timeLimit: Duration(seconds: 8),
        ),
      );
      return (latitude: pos.latitude, longitude: pos.longitude);
    } catch (_) {
      return null;
    }
  }
}
