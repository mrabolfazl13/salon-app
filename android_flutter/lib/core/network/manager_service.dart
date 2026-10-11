import 'api_client.dart';
import 'api_endpoints.dart';

class ManagerService {
  static final _client = ApiClient.instance;

  /// سالن‌های تحت مدیریت — GET /venues/my-venues
  static Future<List<dynamic>> getMyVenues() async {
    try {
      final response = await _client.get('/venues/my-venues');
      return (response.data ?? []) as List;
    } catch (e) {
      throw Exception('خطا در دریافت سالن‌ها: ${e.toString()}');
    }
  }

  /// داشبورد مالی مدیر — GET /finance/dashboard
  static Future<Map<String, dynamic>> getFinanceDashboard({
    int? venueId,
  }) async {
    try {
      final response = await _client.get(
        '/finance/dashboard',
        queryParameters: {if (venueId != null) 'venue_id': venueId},
      );
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت داشبورد مالی: ${e.toString()}');
    }
  }

  /// تراکنش‌ها — GET /finance/transactions (پاکت items)
  static Future<List<dynamic>> getTransactions({int? venueId}) async {
    try {
      final response = await _client.get(
        '/finance/transactions',
        queryParameters: {
          if (venueId != null) 'venue_id': venueId,
          'limit': 50,
        },
      );
      final data = response.data;
      if (data is Map) return (data['items'] ?? []) as List;
      return (data ?? []) as List;
    } catch (e) {
      throw Exception('خطا در دریافت تراکنش‌ها: ${e.toString()}');
    }
  }

  /// قوانین قیمت‌گذاری — GET /pricing/rules
  static Future<List<dynamic>> getPricingRules() async {
    try {
      final response = await _client.get('/pricing/rules');
      return (response.data ?? []) as List;
    } catch (e) {
      throw Exception('خطا در دریافت قوانین قیمت‌گذاری: ${e.toString()}');
    }
  }

  /// ایجاد قانون قیمت‌گذاری — POST /pricing/rules
  static Future<Map<String, dynamic>> createPricingRule(
      Map<String, dynamic> rule) async {
    try {
      final response =
          await _client.post('/pricing/rules', data: rule);
      return response.data;
    } catch (e) {
      throw Exception('خطا در ایجاد قانون: ${e.toString()}');
    }
  }

  /// حذف قانون — DELETE /pricing/rules/{id}
  static Future<void> deletePricingRule(String ruleId) async {
    try {
      await _client.delete('/pricing/rules/$ruleId');
    } catch (e) {
      throw Exception('خطا در حذف قانون: ${e.toString()}');
    }
  }

  /// مشتریان CRM — GET /crm/customers?venue_id= (اجباری؛ پاکت items)
  static Future<List<dynamic>> getCrmCustomers({
    required int venueId,
    String? search,
  }) async {
    try {
      final response = await _client.get(
        '/crm/customers',
        queryParameters: {
          'venue_id': venueId,
          if (search != null) 'search': search,
        },
      );
      final data = response.data;
      if (data is Map) return (data['items'] ?? []) as List;
      return (data ?? []) as List;
    } catch (e) {
      throw Exception('خطا در دریافت مشتریان: ${e.toString()}');
    }
  }

  /// آمار CRM — GET /crm/stats?venue_id=
  static Future<Map<String, dynamic>> getCrmStats({required int venueId}) async {
    try {
      final response = await _client.get(
        '/crm/stats',
        queryParameters: {'venue_id': venueId},
      );
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت آمار مشتریان: ${e.toString()}');
    }
  }

  /// تیم‌های همکار — GET /teams/manager/partners (پاکت items)
  static Future<List<dynamic>> getManagerTeams({int? venueId}) async {
    try {
      final response = await _client.get(
        '/teams/manager/partners',
        queryParameters: {if (venueId != null) 'venue_id': venueId},
      );
      final data = response.data;
      if (data is Map) return (data['items'] ?? []) as List;
      return (data ?? []) as List;
    } catch (e) {
      throw Exception('خطا در دریافت تیم‌ها: ${e.toString()}');
    }
  }

  /// همه قراردادهای سالن‌های من — GET /contracts/manager/all
  static Future<List<dynamic>> getContracts({String? status}) async {
    try {
      final response = await _client.get(
        '/contracts/manager/all',
        queryParameters: {if (status != null) 'status': status},
      );
      final data = response.data;
      if (data is Map) return (data['items'] ?? []) as List;
      return (data ?? []) as List;
    } catch (e) {
      throw Exception('خطا در دریافت قراردادها: ${e.toString()}');
    }
  }

  /// درخواست‌های در انتظار تأیید — GET /contracts/manager/pending
  static Future<List<dynamic>> getPendingContracts() async {
    try {
      final response = await _client.get('/contracts/manager/pending');
      final data = response.data;
      if (data is Map) return (data['items'] ?? []) as List;
      return (data ?? []) as List;
    } catch (e) {
      throw Exception('خطا در دریافت درخواست‌ها: ${e.toString()}');
    }
  }

  /// تأیید قرارداد — POST /contracts/{id}/approve
  static Future<Map<String, dynamic>> approveContract(
      String contractId) async {
    try {
      final response = await _client
          .post('${ApiEndpoints.contract(contractId)}/approve');
      return response.data;
    } catch (e) {
      throw Exception('خطا در تأیید قرارداد: ${e.toString()}');
    }
  }

  /// رد قرارداد — POST /contracts/{id}/reject
  static Future<Map<String, dynamic>> rejectContract(
      String contractId, String reason) async {
    try {
      final response = await _client.post(
        '${ApiEndpoints.contract(contractId)}/reject',
        data: {'reason': reason},
      );
      return response.data;
    } catch (e) {
      throw Exception('خطا در رد قرارداد: ${e.toString()}');
    }
  }

  /// چک‌این — POST /checkin/verify?check_in_code=...
  static Future<Map<String, dynamic>> verifyCheckin(String code) async {
    try {
      final response = await _client.post(
        '/checkin/verify',
        queryParameters: {'check_in_code': code},
      );
      return response.data;
    } catch (e) {
      throw Exception('خطا در تأیید کد: ${e.toString()}');
    }
  }
}
