import 'api_client.dart';
import 'api_endpoints.dart';

class AdminService {
  static final _client = ApiClient.instance;

  /// آمار کاربران — GET /admin/stats/users
  static Future<Map<String, dynamic>> getUserStats() async {
    try {
      final response = await _client.get('/admin/stats/users');
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت آمار کاربران: ${e.toString()}');
    }
  }

  /// آمار سالن‌ها — GET /admin/stats/venues
  static Future<Map<String, dynamic>> getVenueStats() async {
    try {
      final response = await _client.get('/admin/stats/venues');
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت آمار سالن‌ها: ${e.toString()}');
    }
  }

  /// همه کاربران — GET /admin/users (لیست ساده)
  static Future<List<dynamic>> getUsers() async {
    try {
      final response = await _client.get(ApiEndpoints.adminUsers);
      final data = response.data;
      if (data is Map) return (data['users'] ?? data['items'] ?? []) as List;
      return (data ?? []) as List;
    } catch (e) {
      throw Exception('خطا در دریافت کاربران: ${e.toString()}');
    }
  }

  /// تأیید ثبت‌نام مدیر سالن — POST /admin/users/{id}/approve
  static Future<void> approveUser(String userId) async {
    try {
      await _client.post('${ApiEndpoints.adminUsers}/$userId/approve');
    } catch (e) {
      throw Exception('خطا در تأیید کاربر: ${e.toString()}');
    }
  }

  /// رد ثبت‌نام مدیر سالن — POST /admin/users/{id}/reject
  static Future<void> rejectUser(String userId) async {
    try {
      await _client.post('${ApiEndpoints.adminUsers}/$userId/reject');
    } catch (e) {
      throw Exception('خطا در رد کاربر: ${e.toString()}');
    }
  }

  /// مدیران در انتظار تأیید — GET /admin/pending-managers
  static Future<List<dynamic>> getPendingManagers() async {
    try {
      final response = await _client.get('/admin/pending-managers');
      final data = response.data;
      if (data is Map) return (data['items'] ?? []) as List;
      return (data ?? []) as List;
    } catch (e) {
      throw Exception('خطا در دریافت مدیران در انتظار: ${e.toString()}');
    }
  }

  /// سالن‌های در انتظار تأیید — GET /admin/pending-venues
  static Future<List<dynamic>> getPendingVenues() async {
    try {
      final response = await _client.get('/admin/pending-venues');
      final data = response.data;
      if (data is Map) return (data['items'] ?? []) as List;
      return (data ?? []) as List;
    } catch (e) {
      throw Exception('خطا در دریافت سالن‌های در انتظار: ${e.toString()}');
    }
  }

  /// تأیید سالن — POST /admin/verify-venue/{id}
  static Future<void> verifyVenue(String venueId) async {
    try {
      await _client.post('/admin/verify-venue/$venueId');
    } catch (e) {
      throw Exception('خطا در تأیید سالن: ${e.toString()}');
    }
  }
}
