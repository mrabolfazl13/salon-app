import 'api_client.dart';
import 'api_endpoints.dart';

class CompetitionService {
  static final _client = ApiClient.instance;

  /// GET /competitions/active → {items: [{slot_id, venue_id, venue_name, date,
  /// start_time, duration_minutes, current_price, best_price, bid_count, expires_at}]}
  static Future<List<dynamic>> getActive() async {
    try {
      final response = await _client.get('${ApiEndpoints.competitions}/active');
      final data = response.data;
      if (data is Map) return (data['items'] ?? []) as List;
      return data is List ? data : const [];
    } catch (e) {
      throw Exception('خطا در دریافت رقابت‌های فعال: ${e.toString()}');
    }
  }

  /// POST /competitions/{slot_id}/bid — {offered_price} کمتر از بهترین پیشنهاد فعلی (مدیر سالن)
  static Future<Map<String, dynamic>> placeBid(String slotId, int offeredPrice) async {
    try {
      final response = await _client.post(
        '${ApiEndpoints.competitions}/$slotId/bid',
        data: {'offered_price': offeredPrice},
      );
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('خطا در ثبت پیشنهاد: ${e.toString()}');
    }
  }

  /// GET /competitions/slot/{slot_id}/best
  static Future<int?> getBestBid(String slotId) async {
    try {
      final response = await _client.get('${ApiEndpoints.competitions}/slot/$slotId/best');
      final best = response.data is Map ? response.data['best_price'] : null;
      return best is num ? best.toInt() : null;
    } catch (e) {
      throw Exception('خطا در دریافت بهترین پیشنهاد: ${e.toString()}');
    }
  }
}
