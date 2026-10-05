import 'api_client.dart';
import 'api_endpoints.dart';

class DealService {
  static final _client = ApiClient.instance;

  /// Get active deals
  static Future<List<dynamic>> getDeals({
    String? category,
    int? page,
    int? limit,
  }) async {
    try {
      final response = await _client.get(
        ApiEndpoints.deals,
        queryParameters: {
          if (category != null) 'category': category,
          if (page != null) 'page': page,
          if (limit != null) 'limit': limit,
        },
      );
      return response.data['deals'] ?? response.data;
    } catch (e) {
      throw Exception('خطا در دریافت تخفیف‌ها: ${e.toString()}');
    }
  }

  /// Claim deal
  static Future<void> claimDeal(String dealId) async {
    try {
      await _client.post('${ApiEndpoints.deals}/$dealId/claim');
    } catch (e) {
      throw Exception('خطا در دریافت تخفیف: ${e.toString()}');
    }
  }
}
