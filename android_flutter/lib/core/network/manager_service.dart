import 'api_client.dart';
import 'api_endpoints.dart';

class ManagerService {
  static final _client = ApiClient.instance;

  /// Get manager dashboard stats
  static Future<Map<String, dynamic>> getDashboard() async {
    try {
      final response = await _client.get(ApiEndpoints.managerDashboard);
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت داشبورد: ${e.toString()}');
    }
  }

  /// Get pricing rules
  static Future<List<dynamic>> getPricingRules() async {
    try {
      final response = await _client.get(ApiEndpoints.managerPricing);
      return response.data['rules'] ?? response.data;
    } catch (e) {
      throw Exception('خطا در دریافت قوانین قیمت‌گذاری: ${e.toString()}');
    }
  }

  /// Create pricing rule
  static Future<void> createPricingRule(Map<String, dynamic> rule) async {
    try {
      await _client.post(ApiEndpoints.managerPricing, data: rule);
    } catch (e) {
      throw Exception('خطا در ایجاد قانون: ${e.toString()}');
    }
  }

  /// Get manager contracts
  static Future<List<dynamic>> getContracts({String? status}) async {
    try {
      final response = await _client.get(
        ApiEndpoints.managerContracts,
        queryParameters: if (status != null) {'status': status},
      );
      return response.data['contracts'] ?? response.data;
    } catch (e) {
      throw Exception('خطا در دریافت قراردادها: ${e.toString()}');
    }
  }

  /// Get manager teams
  static Future<List<dynamic>> getTeams() async {
    try {
      final response = await _client.get(ApiEndpoints.managerTeams);
      return response.data['teams'] ?? response.data;
    } catch (e) {
      throw Exception('خطا در دریافت تیم‌ها: ${e.toString()}');
    }
  }

  /// Get CRM customers
  static Future<List<dynamic>> getCustomers({
    String? search,
    int? page,
    int? limit,
  }) async {
    try {
      final response = await _client.get(
        ApiEndpoints.managerCrm,
        queryParameters: {
          if (search != null) 'search': search,
          if (page != null) 'page': page,
          if (limit != null) 'limit': limit,
        },
      );
      return response.data['customers'] ?? response.data;
    } catch (e) {
      throw Exception('خطا در دریافت مشتریان: ${e.toString()}');
    }
  }

  /// Verify check-in code
  static Future<Map<String, dynamic>> verifyCheckin(String code) async {
    try {
      final response = await _client.post(
        ApiEndpoints.managerCheckin,
        data: {'code': code},
      );
      return response.data;
    } catch (e) {
      throw Exception('خطا در تأیید کد: ${e.toString()}');
    }
  }

  /// Get finance summary
  static Future<Map<String, dynamic>> getFinanceSummary() async {
    try {
      final response = await _client.get(ApiEndpoints.managerFinance);
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت اطلاعات مالی: ${e.toString()}');
    }
  }
}
