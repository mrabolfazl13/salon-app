import '../services/api_service.dart';

class BookingService {
  static final BookingService _instance = BookingService._internal();
  factory BookingService() => _instance;

  final ApiService _api = ApiService();

  BookingService._internal();

  /// Create a new booking
  Future<Map<String, dynamic>> createBooking({
    required int slotId,
    required int paymentAmount,
  }) async {
    try {
      final response = await _api.post('/bookings/', data: {
        'slot_id': slotId,
        'payment_amount': paymentAmount,
      });

      return {
        'success': true,
        'booking': response.data,
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'خطا در ایجاد رزرو',
      };
    }
  }

  /// Get user's bookings
  Future<List<Map<String, dynamic>>> getMyBookings({
    String? status,
    int limit = 50,
    int offset = 0,
  }) async {
    try {
      final response = await _api.get('/bookings/my', queryParameters: {
        if (status != null) 'status': status,
        'limit': limit,
        'offset': offset,
      });

      return List<Map<String, dynamic>>.from(response.data ?? []);
    } catch (e) {
      print('Error fetching bookings: $e');
      return [];
    }
  }

  /// Get booking by ID
  Future<Map<String, dynamic>?> getBookingById(int id) async {
    try {
      final response = await _api.get('/bookings/$id');
      return response.data;
    } catch (e) {
      print('Error fetching booking: $e');
      return null;
    }
  }

  /// Cancel booking
  Future<Map<String, dynamic>> cancelBooking(int bookingId) async {
    try {
      final response = await _api.delete('/bookings/$bookingId/cancel');

      return {
        'success': true,
        'refund_amount': response.data['refund_amount'] ?? 0,
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'خطا در لغو رزرو',
      };
    }
  }

  /// Get upcoming bookings
  Future<List<Map<String, dynamic>>> getUpcomingBookings() async {
    return getMyBookings(status: 'confirmed');
  }

  /// Get past bookings
  Future<List<Map<String, dynamic>>> getPastBookings() async {
    return getMyBookings(status: 'completed');
  }
}
