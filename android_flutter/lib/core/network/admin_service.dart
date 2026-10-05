import 'api_client.dart';
import 'api_endpoints.dart';

class AdminService {
  static final _client = ApiClient.instance;

  /// Get admin dashboard stats
  static Future<Map<String, dynamic>> getDashboard() async {
    try {
      final response = await _client.get(ApiEndpoints.admin);
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت داشبورد ادمین: ${e.toString()}');
    }
  }

  /// Get all users
  static Future<List<dynamic>> getUsers({
    String? search,
    String? role,
    int? page,
    int? limit,
  }) async {
    try {
      final response = await _client.get(
        ApiEndpoints.adminUsers,
        queryParameters: {
          if (search != null) 'search': search,
          if (role != null) 'role': role,
          if (page != null) 'page': page,
          if (limit != null) 'limit': limit,
        },
      );
      return response.data['users'] ?? response.data;
    } catch (e) {
      throw Exception('خطا در دریافت کاربران: ${e.toString()}');
    }
  }

  /// Update user role
  static Future<void> updateUserRole(int userId, String role) async {
    try {
      await _client.patch(
        '${ApiEndpoints.adminUsers}/$userId',
        data: {'role': role},
      );
    } catch (e) {
      throw Exception('خطا در به‌روزرسانی نقش: ${e.toString()}');
    }
  }

  /// Block/unblock user
  static Future<void> toggleUserStatus(int userId, bool isActive) async {
    try {
      await _client.patch(
        '${ApiEndpoints.adminUsers}/$userId/status',
        data: {'is_active': isActive},
      );
    } catch (e) {
      throw Exception('خطا در تغییر وضعیت: ${e.toString()}');
    }
  }

  /// Get all venues
  static Future<List<dynamic>> getVenues({
    String? search,
    String? status,
    int? page,
    int? limit,
  }) async {
    try {
      final response = await _client.get(
        ApiEndpoints.adminVenues,
        queryParameters: {
          if (search != null) 'search': search,
          if (status != null) 'status': status,
          if (page != null) 'page': page,
          if (limit != null) 'limit': limit,
        },
      );
      return response.data['venues'] ?? response.data;
    } catch (e) {
      throw Exception('خطا در دریافت سالن‌ها: ${e.toString()}');
    }
  }

  /// Approve/reject venue
  static Future<void> updateVenueStatus(String venueId, String status) async {
    try {
      await _client.patch(
        '${ApiEndpoints.adminVenues}/$venueId',
        data: {'status': status},
      );
    } catch (e) {
      throw Exception('خطا در به‌روزرسانی وضعیت: ${e.toString()}');
    }
  }
}
