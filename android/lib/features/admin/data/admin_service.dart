import '../../../core/network/api_client.dart';
import '../domain/admin.dart';

class AdminService {
  AdminService(this._api);

  final ApiClient _api;

  Future<List<AdminUser>> getUsers() async {
    final res = await _api.get('/admin/users');
    final list = res.data as List? ?? [];
    return list
        .whereType<Map<String, dynamic>>()
        .map(AdminUser.fromJson)
        .toList();
  }

  Future<UserStats> getUserStats() async {
    final res = await _api.get('/admin/stats/users');
    return UserStats.fromJson(res.data as Map<String, dynamic>);
  }

  Future<VenueStats> getVenueStats() async {
    final res = await _api.get('/admin/stats/venues');
    return VenueStats.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<Map<String, dynamic>>> getPendingVenues() async {
    final res = await _api.get('/admin/pending-venues');
    final list = res.data as List? ?? [];
    return list.whereType<Map<String, dynamic>>().toList();
  }

  Future<void> verifyVenue(int venueId) async {
    await _api.pcost('/admin/verify-venue/$venueId');
  }

  Future<List<AdminUser>> getPendingManagers() async {
    final res = await _api.get('/admin/pending-managers');
    final list = res.data as List? ?? [];
    return list
        .whereType<Map<String, dynamic>>()
        .map(AdminUser.fromJson)
        .toList();
  }

  Future<void> approveUser(int userId) async {
    await _api.pcost('/admin/users/$userId/approve');
  }

  Future<void> rejectUser(int userId) async {
    await _api.pcost('/admin/users/$userId/reject');
  }
}
