import 'package:dio/dio.dart';
import 'api_client.dart';
import 'api_endpoints.dart';

class BookingService {
  static final _client = ApiClient.instance;

  /// POST /bookings — بدنه snake_case مثل وب: {slot_id, discount_code?, use_loyalty_points}
  static Future<Map<String, dynamic>> createBooking({
    required String slotId,
    String? discountCode,
    bool useLoyaltyPoints = false,
  }) async {
    try {
      final response = await _client.post(
        ApiEndpoints.bookings,
        data: {
          'slot_id': slotId,
          'use_loyalty_points': useLoyaltyPoints,
          if (discountCode != null && discountCode.isNotEmpty)
            'discount_code': discountCode,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException(
        statusCode: e.response?.statusCode,
        message: (e.message != null && e.message!.isNotEmpty)
            ? 'خطا در ثبت رزرو: ${e.message}'
            : 'خطا در ثبت رزرو',
      );
    } catch (e) {
      throw Exception('خطا در ثبت رزرو: ${e.toString()}');
    }
  }

  /// GET /bookings
  static Future<List<dynamic>> getBookings() async {
    try {
      final response = await _client.get(ApiEndpoints.bookings);
      return response.data is List ? response.data : const [];
    } catch (e) {
      throw Exception('خطا در دریافت رزروها: ${e.toString()}');
    }
  }

  /// GET /bookings/{id}
  static Future<Map<String, dynamic>> getBooking(String id) async {
    try {
      final response = await _client.get(ApiEndpoints.booking(id));
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('خطا در دریافت اطلاعات رزرو: ${e.toString()}');
    }
  }

  /// DELETE /bookings/{id} — لغو رزرو
  static Future<void> cancelBooking(String id) async {
    try {
      await _client.delete(ApiEndpoints.booking(id));
    } catch (e) {
      throw Exception('خطا در لغو رزرو: ${e.toString()}');
    }
  }
}
