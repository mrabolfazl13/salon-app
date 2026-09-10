import '../../../core/network/api_client.dart';
import '../domain/contract.dart';

class ContractService {
  ContractService(this._api);

  final ApiClient _api;

  Future<List<Contract>> getAll() async {
    final res = await _api.get('/contracts');
    final list = res.data as List? ?? [];
    return list
        .whereType<Map<String, dynamic>>()
        .map(Contract.fromJson)
        .toList();
  }

  Future<Contract> getById(int id) async {
    final res = await _api.get('/contracts/$id');
    return Contract.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Contract> create({
    required int venueId,
    required String startDate,
    required String endDate,
    required int dayOfWeek,
    required String startTime,
    required Recurrence recurrence,
    required int discountedPrice,
    String? description,
  }) async {
    final res = await _api.pcost('/contracts', data: {
      'venue_id': venueId,
      'start_date': startDate,
      'end_date': endDate,
      'day_of_week': dayOfWeek,
      'start_time': startTime,
      'recurrence': recurrence.wire,
      'discounted_price': discountedPrice,
      'description': (description?.trim().isEmpty ?? true)
          ? null
          : description!.trim(),
    });
    return Contract.fromJson(res.data as Map<String, dynamic>);
  }
}
