import '../../../core/network/api_client.dart';
import '../../bookings/domain/booking.dart';

class PaymentService {
  PaymentService(this._api);

  final ApiClient _api;

  /// Creates (or retrieves) the invoice of a confirmed booking.
  Future<Payment> create(int bookingId) async {
    final res = await _api.pcost('/payments/', data: {'booking_id': bookingId});
    return Payment.fromJson(res.data as Map<String, dynamic>);
  }

  /// Mock gateway pay with card data (Persian digits normalized upstream).
  Future<Payment> pay(
    int paymentId, {
    required String cardNumber,
    required String cvv,
    required int month,
    required int year,
  }) async {
    final res = await _api.pcost('/payments/$paymentId/pay', data: {
      'card_number': cardNumber,
      'cvv': cvv,
      'month': month,
      'year': year,
    });
    return Payment.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<Payment>> getMy({int limit = 50, int offset = 0}) async {
    final res = await _api.get(
      '/payments/my',
      query: {'limit': limit, 'offset': offset},
    );
    final list = res.data as List? ?? [];
    return list
        .whereType<Map<String, dynamic>>()
        .map(Payment.fromJson)
        .toList();
  }
}
