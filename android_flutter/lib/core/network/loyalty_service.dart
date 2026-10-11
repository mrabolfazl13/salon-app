import 'api_client.dart';
import 'api_endpoints.dart';

class LoyaltyService {
  static final _client = ApiClient.instance;

  /// GET /loyalty/me → {user_id, balance, point_value_rial, history}
  static Future<Map<String, dynamic>> getMy() async {
    try {
      final response = await _client.get(ApiEndpoints.loyaltyMe);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('خطا در دریافت امتیاز باشگاه مشتریان: ${e.toString()}');
    }
  }
}
