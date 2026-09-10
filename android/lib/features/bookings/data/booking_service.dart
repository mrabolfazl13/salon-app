import '../../../core/network/api_client.dart';
import '../domain/booking.dart';

class BookingService {
  BookingService(this._api);

  final ApiClient _api;

  List<Booking> _parseList(dynamic res) {
    final list = res.data as List? ?? [];
    return list
        .whereType<Map<String, dynamic>>()
        .map(Booking.fromJson)
        .toList();
  }

  /// Creates a pending (Redis) booking for a slot.
  Future<Booking> create({required int slotId}) async {
    final res = await _api.pcost('/bookings/', data: {'slot_id': slotId});
    return Booking.fromJson(res.data as Map<String, dynamic>).withPendingFlag();
  }

  Future<List<Booking>> getAll() async {
    final res = await _api.get('/bookings/', query: {'limit': 100});
    return _parseList(res);
  }

  Future<Booking> getById(dynamic id) async {
    final res = await _api.get('/bookings/$id');
    return Booking.fromJson(res.data as Map<String, dynamic>);
  }

  /// Cancels a DB booking (DELETE /bookings/{id}).
  Future<void> cancel(int id) async {
    await _api.delete('/bookings/$id');
  }

  Future<List<Booking>> getUpcoming({int daysAhead = 7}) async {
    final res = await _api.get(
      '/bookings/upcoming',
      query: {'days_ahead': daysAhead},
    );
    return _parseList(res);
  }

  Future<List<Booking>> getPast({int limit = 20}) async {
    final res = await _api.get('/bookings/past', query: {'limit': limit});
    return _parseList(res);
  }

  Future<List<Booking>> getVenueBookings(
    int venueId, {
    String? startDate,
    String? endDate,
  }) async {
    final res = await _api.get('/bookings/venue/$venueId', query: {
      if (startDate != null) 'start_date': startDate,
      if (endDate != null) 'end_date': endDate,
    });
    return _parseList(res);
  }

  // ===== Redis pending bookings =====

  Future<List<Booking>> getMyPending() async {
    final res = await _api.get('/bookings/pending/my');
    return _parseList(res).map((b) => b.withPendingFlag()).toList();
  }

  Future<List<Booking>> getVenuePending(int venueId) async {
    final res = await _api.get('/bookings/venue/$venueId/pending');
    return _parseList(res).map((b) => b.withPendingFlag()).toList();
  }

  Future<Booking> confirmPending(String pendingId) async {
    final res = await _api.pcost('/bookings/pending/$pendingId/confirm');
    return Booking.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> rejectPending(String pendingId) async {
    await _api.pcost('/bookings/pending/$pendingId/reject');
  }

  Future<void> cancelPending(String pendingId) async {
    await _api.delete('/bookings/pending/$pendingId');
  }
}
