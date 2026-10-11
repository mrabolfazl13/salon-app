import 'api_client.dart';
import 'api_endpoints.dart';

class ContractService {
  static final _client = ApiClient.instance;

  /// قراردادهای من — GET /contracts (لیست ساده؛ فاقد venue_name)
  static Future<List<dynamic>> getContracts() async {
    try {
      final response = await _client.get(ApiEndpoints.contracts);
      final data = response.data;
      if (data is Map) return (data['items'] ?? data['contracts'] ?? []) as List;
      return (data ?? []) as List;
    } catch (e) {
      throw Exception('خطا در دریافت قراردادها: ${e.toString()}');
    }
  }

  /// جزئیات قرارداد — GET /contracts/{id}
  static Future<Map<String, dynamic>> getContract(String id) async {
    try {
      final response = await _client.get(ApiEndpoints.contract(id));
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت اطلاعات قرارداد: ${e.toString()}');
    }
  }

  /// لغو قرارداد — POST /contracts/{id}/cancel
  static Future<Map<String, dynamic>> cancelContract(
      String id, String reason) async {
    try {
      final response = await _client.post(
        '${ApiEndpoints.contract(id)}/cancel',
        data: {'reason': reason},
      );
      return response.data;
    } catch (e) {
      throw Exception('خطا در لغو قرارداد: ${e.toString()}');
    }
  }

  /// اقساط/پرداخت‌های قرارداد — GET /contracts/{id}/payments
  static Future<List<dynamic>> getPayments(String id) async {
    try {
      final response =
          await _client.get('${ApiEndpoints.contract(id)}/payments');
      final data = response.data;
      if (data is Map) return (data['items'] ?? []) as List;
      return (data ?? []) as List;
    } catch (e) {
      throw Exception('خطا در دریافت اقساط: ${e.toString()}');
    }
  }
}
