import '../../../core/network/api_client.dart';
import '../domain/notification.dart';

class NotificationService {
  NotificationService(this._api);

  final ApiClient _api;

  Future<List<NotificationItem>> getAll({int limit = 30}) async {
    final res = await _api.get(
      '/notifications/',
      query: {'limit': limit, 'offset': 0},
    );
    final list = res.data as List? ?? [];
    return list
        .whereType<Map<String, dynamic>>()
        .map(NotificationItem.fromJson)
        .toList();
  }

  Future<int> getUnreadcount() async {
    final res = await _api.get('/notifications/unread-count');
    final data = res.data as Map<String, dynamic>?;
    return (data?['count'] as num?)?.toInt() ?? 0;
  }

  Future<NotificationItem> markAsRead(dynamic id) async {
    final res = await _api.put('/notifications/$id/read');
    return NotificationItem.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> markAllAsRead() async {
    await _api.put('/notifications/read-all');
  }
}
