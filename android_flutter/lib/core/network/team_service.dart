import 'api_client.dart';
import 'api_endpoints.dart';

class TeamService {
  static final _client = ApiClient.instance;

  /// GET /teams/ — تیم‌های من (لیست ساده)
  static Future<List<dynamic>> getMyTeams() async {
    try {
      final response = await _client.get(ApiEndpoints.teams);
      return response.data is List ? response.data : const [];
    } catch (e) {
      throw Exception('خطا در دریافت تیم‌ها: ${e.toString()}');
    }
  }

  /// GET /teams/discover — تیم‌های عمومی با جستجو
  static Future<List<dynamic>> discoverTeams({
    String? search,
    String? sport,
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      final response = await _client.get(
        '${ApiEndpoints.teams}/discover',
        queryParameters: {
          if (search != null && search.isNotEmpty) 'search': search,
          if (sport != null && sport.isNotEmpty) 'sport': sport,
          'limit': limit,
          'offset': offset,
        },
      );
      final data = response.data;
      if (data is Map) return (data['items'] ?? data['teams'] ?? []) as List;
      return data is List ? data : const [];
    } catch (e) {
      throw Exception('خطا در جستجوی تیم: ${e.toString()}');
    }
  }

  /// Get team by ID
  static Future<Map<String, dynamic>> getTeam(String id) async {
    try {
      final response = await _client.get(ApiEndpoints.team(id));
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت اطلاعات تیم: ${e.toString()}');
    }
  }

  /// Create team
  static Future<Map<String, dynamic>> createTeam({
    required String name,
    String? description,
    String? logo,
  }) async {
    try {
      final response = await _client.post(
        ApiEndpoints.teams,
        data: {
          'name': name,
          if (description != null) 'description': description,
          if (logo != null) 'logo': logo,
        },
      );
      return response.data;
    } catch (e) {
      throw Exception('خطا در ایجاد تیم: ${e.toString()}');
    }
  }

  /// Request to join team
  static Future<void> requestJoin(String teamId) async {
    try {
      await _client.post('${ApiEndpoints.team(teamId)}/join-request');
    } catch (e) {
      throw Exception('خطا در درخواست عضویت: ${e.toString()}');
    }
  }

  /// GET /teams/{id}/members
  static Future<List<dynamic>> getMembers(String teamId) async {
    try {
      final response = await _client.get('${ApiEndpoints.team(teamId)}/members');
      return response.data is List ? response.data : const [];
    } catch (e) {
      throw Exception('خطا در دریافت اعضا: ${e.toString()}');
    }
  }
}
