import 'api_client.dart';
import 'api_endpoints.dart';

/// Waitlist service for slot waiting list management
class WaitlistService {
  static final _client = ApiClient.instance;

  /// Join waitlist for a slot
  static Future<Map<String, dynamic>> join(String slotId) async {
    try {
      final response = await _client.post(ApiEndpoints.waitlistJoin(slotId));
      return response.data;
    } catch (e) {
      throw Exception('خطا در عضویت صف انتظار: $e');
    }
  }

  /// Leave waitlist
  static Future<Map<String, dynamic>> leave(String slotId) async {
    try {
      final response = await _client.post(ApiEndpoints.waitlistLeave(slotId));
      return response.data;
    } catch (e) {
      throw Exception('خطا در خروج از صف انتظار: $e');
    }
  }

  /// Get my waitlist entries
  static Future<List<dynamic>> getMyWaitlist() async {
    try {
      final response = await _client.get(ApiEndpoints.waitlistMy);
      return response.data is List ? response.data : [];
    } catch (e) {
      throw Exception('خطا در دریافت لیست انتظار من: $e');
    }
  }

  /// Get waitlist for a specific slot (manager only)
  static Future<Map<String, dynamic>> getSlotWaitlist(String slotId) async {
    try {
      final response = await _client.get(ApiEndpoints.waitlistSlot(slotId));
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت لیست انتظار اسلات: $e');
    }
  }
}
