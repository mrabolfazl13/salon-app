import 'api_client.dart';
import 'api_endpoints.dart';

class VenueService {
  static final _client = ApiClient.instance;

  /// Get all venues with optional filters
  static Future<List<dynamic>> getVenues({
    String? search,
    String? sportType,
    double? lat,
    double? lng,
    int? page,
    int? limit,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        if (search != null) 'search': search,
        if (sportType != null) 'sport_type': sportType,
        if (lat != null) 'lat': lat,
        if (lng != null) 'lng': lng,
        if (page != null) 'page': page,
        if (limit != null) 'limit': limit,
      };

      final response = await _client.get(
        ApiEndpoints.venues,
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );
      return response.data['venues'] ?? response.data;
    } catch (e) {
      throw Exception('خطا در دریافت لیست سالن‌ها: ${e.toString()}');
    }
  }

  /// Get venue by ID
  static Future<Map<String, dynamic>> getVenue(String id) async {
    try {
      final response = await _client.get(ApiEndpoints.venue(id));
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت اطلاعات سالن: ${e.toString()}');
    }
  }

  /// Get venue available slots
  static Future<List<dynamic>> getVenueSlots(
    String id, {
    required String date,
  }) async {
    try {
      final response = await _client.get(
        ApiEndpoints.venueSlots(id),
        queryParameters: {'date': date},
      );
      return response.data['slots'] ?? response.data;
    } catch (e) {
      throw Exception('خطا در دریافت زمان‌های خالی: ${e.toString()}');
    }
  }

  /// Add venue to favorites
  static Future<void> addToFavorites(String venueId) async {
    try {
      await _client.post('/favorites', data: {'venue_id': venueId});
    } catch (e) {
      throw Exception('خطا در افزودن به علاقه‌مندی‌ها: ${e.toString()}');
    }
  }

  /// Remove venue from favorites
  static Future<void> removeFromFavorites(String venueId) async {
    try {
      await _client.delete('/favorites/$venueId');
    } catch (e) {
      throw Exception('خطا در حذف از علاقه‌مندی‌ها: ${e.toString()}');
    }
  }

  /// Get user's favorite venues
  static Future<List<dynamic>> getFavorites() async {
    try {
      final response = await _client.get(ApiEndpoints.favorites);
      return response.data['venues'] ?? response.data;
    } catch (e) {
      throw Exception('خطا در دریافت علاقه‌مندی‌ها: ${e.toString()}');
    }
  }
}
