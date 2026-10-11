import 'api_client.dart';
import 'api_endpoints.dart';

class DealService {
  static final _client = ApiClient.instance;

  /// GET /deals/available → [{slot_id, venue_id, venue_name, slot_date,
  /// start_time, duration, original_price, deal_price, savings, discount_percent, ...}]
  static Future<List<dynamic>> getAvailableDeals() async {
    try {
      final response = await _client.get('${ApiEndpoints.deals}/available');
      return response.data is List ? response.data : const [];
    } catch (e) {
      throw Exception('خطا در دریافت تخفیف‌ها: ${e.toString()}');
    }
  }
}
