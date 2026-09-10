import '../../../core/network/api_client.dart';
import '../domain/slot.dart';

class SlotService {
  SlotService(this._api);

  final ApiClient _api;

  Future<List<Slot>> getByVenueAndDate(int venueId, String date) async {
    final res = await _api.get(
      '/slots/venue/$venueId',
      query: {'slot_date': date},
    );
    return _parse(res);
  }

  Future<List<Slot>> getAvailable(int venueId, String date) async {
    final res = await _api.get(
      '/slots/venue/$venueId/available',
      query: {'slot_date': date},
    );
    return _parse(res);
  }

  Future<List<Slot>> getRange(int venueId, String start, String end) async {
    final res = await _api.get(
      '/slots/venue/$venueId/range',
      query: {'start_date': start, 'end_date': end},
    );
    return _parse(res);
  }

  Future<void> generateForDate(int venueId, String date) async {
    await _api.pcost(
      '/slots/venue/$venueId/generate',
      query: {'slot_date': date},
    );
  }

  List<Slot> _parse(dynamic res) {
    final list = res.data as List? ?? [];
    return list
        .whereType<Map<String, dynamic>>()
        .map(Slot.fromJson)
        .toList();
  }
}
