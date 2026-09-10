import '../../../core/network/api_client.dart';
import '../../contracts/domain/contract.dart';

class CompetitionService {
  CompetitionService(this._api);

  final ApiClient _api;

  Future<Competition> start({
    required int slotId,
    required int offeredPrice,
  }) async {
    final res = await _api.pcost('/competitions/start', data: {
      'slot_id': slotId,
      'offered_price': offeredPrice,
    });
    return Competition.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Competition> placeBid(int slotId, int offeredPrice) async {
    final res = await _api.pcost('/competitions/$slotId/bid', data: {
      'offered_price': offeredPrice,
    });
    return Competition.fromJson(res.data as Map<String, dynamic>);
  }

  Future<int?> getBestBid(int slotId) async {
    final res = await _api.get('/competitions/slot/$slotId/best');
    final data = res.data as Map<String, dynamic>?;
    return (data?['best_price'] as num?)?.toInt();
  }
}
