import 'api_client.dart';
import 'api_endpoints.dart';

/// Check-in service for QR code verification
class CheckinService {
  static final _client = ApiClient.instance;

  /// Get QR code data for a booking
  static Future<Map<String, dynamic>> getQrCode(String bookingId) async {
    try {
      final response = await _client.get(ApiEndpoints.checkinQrCode(bookingId));
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت کد QR: $e');
    }
  }

  /// Verify check-in code (manager only)
  static Future<Map<String, dynamic>> verify(String code) async {
    try {
      final response = await _client.post(ApiEndpoints.checkinVerify(code));
      return response.data;
    } catch (e) {
      throw Exception('خطا در تأیید چک‌این: $e');
    }
  }

  /// Get check-in status for a booking
  static Future<Map<String, dynamic>> getStatus(String bookingId) async {
    try {
      final response = await _client.get(ApiEndpoints.checkinStatus(bookingId));
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت وضعیت چک‌این: $e');
    }
  }
}
