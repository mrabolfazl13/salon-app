import 'api_client.dart';
import 'api_endpoints.dart';

class BookingService {
  static final _client = ApiClient.instance;

  /// Create new booking
  static Future<Map<String, dynamic>> createBooking({
    required String venueId,
    required String slotId,
    required String date,
    String? couponCode,
  }) async {
    try {
      final response = await _client.post(
        ApiEndpoints.bookings,
        data: {
          'venue_id': venueId,
          'slot_id': slotId,
          'date': date,
          if (couponCode != null) 'coupon_code': couponCode,
        },
      );
      return response.data;
    } catch (e) {
      throw Exception('خطا در ثبت رزرو: ${e.toString()}');
    }
  }

  /// Get user bookings
  static Future<List<dynamic>> getBookings({
    String? status,
    int? page,
    int? limit,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        if (status != null) 'status': status,
        if (page != null) 'page': page,
        if (limit != null) 'limit': limit,
      };

      final response = await _client.get(
        ApiEndpoints.bookings,
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );
      return response.data['bookings'] ?? response.data;
    } catch (e) {
      throw Exception('خطا در دریافت رزروها: ${e.toString()}');
    }
  }

  /// Get booking by ID
  static Future<Map<String, dynamic>> getBooking(String id) async {
    try {
      final response = await _client.get(ApiEndpoints.booking(id));
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت اطلاعات رزرو: ${e.toString()}');
    }
  }

  /// Cancel booking
  static Future<void> cancelBooking(String id) async {
    try {
      await _client.post(ApiEndpoints.booking('$id/cancel'));
    } catch (e) {
      throw Exception('خطا در لغو رزرو: ${e.toString()}');
    }
  }

  /// Pay for booking
  static Future<Map<String, dynamic>> payBooking(String id) async {
    try {
      final response = await _client.post(ApiEndpoints.booking('$id/pay'));
      return response.data;
    } catch (e) {
      throw Exception('خطا در پرداخت رزرو: ${e.toString()}');
    }
  }
}
