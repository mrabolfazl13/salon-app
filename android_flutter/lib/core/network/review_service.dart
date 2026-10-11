import 'api_client.dart';
import 'api_endpoints.dart';

class ReviewService {
  static final _client = ApiClient.instance;

  /// GET /reviews/venue/{venue_id} — لیست نظرات
  static Future<List<dynamic>> getVenueReviews(String venueId) async {
    try {
      final response = await _client.get(ApiEndpoints.venueReviews(venueId));
      return response.data is List ? response.data : const [];
    } catch (e) {
      throw Exception('خطا در دریافت نظرات: ${e.toString()}');
    }
  }

  /// GET /reviews/venue/{venue_id}/summary
  static Future<Map<String, dynamic>> getVenueReviewSummary(String venueId) async {
    try {
      final response = await _client.get(ApiEndpoints.venueReviewsSummary(venueId));
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('خطا در دریافت خلاصه نظرات: ${e.toString()}');
    }
  }
}
