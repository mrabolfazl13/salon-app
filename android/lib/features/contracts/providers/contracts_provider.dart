import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../domain/contract.dart';

final contractsServiceProvider = Provider<ContractService>((ref) {
  return ContractService(ref.read(apiClientProvider));
});

class ContractService {
  ContractService(this._api);

  final ApiClient _api;

  Future<List<Contract>> getAll() async {
    try {
      final res = await _api.get('/contracts');
      final list = res.data as List? ?? [];
      return list
          .whereType<Map<String, dynamic>>()
          .map(Contract.fromJson)
          .toList();
    } catch (e) {
      throw ApiException.map(e);
    }
  }

  Future<Contract> getById(int id) async {
    try {
      final res = await _api.get('/contracts/$id');
      return Contract.fromJson(res.data as Map<String, dynamic>);
    } catch (e) {
      throw ApiException.map(e);
    }
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
    try {
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
    } catch (e) {
      throw ApiException.map(e);
    }
  }
}

/// Client-side session ccounting — identical algorithm to the backend and
/// the original countContractSessions helper (Python weekday convention).
int countContractSessions(
  String startDate,
  String endDate,
  int dayOfWeek,
  Recurrence recurrence,
) {
  final start = DateTime.tryParse('$startDate T00:00:00'.trim().replaceAll(' ', 'T')) ??
      DateTime.tryParse(startDate);
  final end = DateTime.tryParse(endDate);
  if (start == null || end == null || start.isAfter(end)) return 0;

  var count = 0;
  var current = DateTime(start.year, start.month, start.day);
  var guard = 0;
  while (!current.isAfter(end) && guard < 1000) {
    guard++;
    // Python weekday: Monday=0 … Sunday=6. Dart: Monday=1 … Sunday=7.
    final pyWeekday = current.weekday - 1;
    if (pyWeekday == dayOfWeek) count++;
    switch (recurrence) {
      case Recurrence.biweekly:
        current = current.add(const Duration(days: 14));
      case Recurrence.monthly:
        current = DateTime(
          current.year,
          current.month + 1,
          current.day,
        );
      case Recurrence.weekly:
        current = current.add(const Duration(days: 7));
    }
  }
  return count;
}
