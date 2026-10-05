import 'api_client.dart';
import 'api_endpoints.dart';

class CompetitionService {
  static final _client = ApiClient.instance;

  /// Get all competitions
  static Future<List<dynamic>> getCompetitions({
    String? status,
    int? page,
    int? limit,
  }) async {
    try {
      final response = await _client.get(
        ApiEndpoints.competitions,
        queryParameters: {
          if (status != null) 'status': status,
          if (page != null) 'page': page,
          if (limit != null) 'limit': limit,
        },
      );
      return response.data['competitions'] ?? response.data;
    } catch (e) {
      throw Exception('خطا در دریافت مسابقات: ${e.toString()}');
    }
  }

  /// Get competition by ID
  static Future<Map<String, dynamic>> getCompetition(String id) async {
    try {
      final response = await _client.get('${ApiEndpoints.competitions}/$id');
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت اطلاعات مسابقه: ${e.toString()}');
    }
  }

  /// Register for competition
  static Future<void> register(String competitionId) async {
    try {
      await _client.post(
        '${ApiEndpoints.competitions}/$competitionId/register',
      );
    } catch (e) {
      throw Exception('خطا در ثبت‌نام مسابقه: ${e.toString()}');
    }
  }
}
