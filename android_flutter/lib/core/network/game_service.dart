import 'api_client.dart';
import 'api_endpoints.dart';

class GameService {
  static final _client = ApiClient.instance;

  /// Get all games with filters
  static Future<List<dynamic>> getGames({
    String? sportType,
    String? level,
    double? lat,
    double? lng,
    int? page,
    int? limit,
  }) async {
    try {
      final response = await _client.get(
        ApiEndpoints.games,
        queryParameters: {
          if (sportType != null) 'sport_type': sportType,
          if (level != null) 'level': level,
          if (lat != null) 'lat': lat,
          if (lng != null) 'lng': lng,
          if (page != null) 'page': page,
          if (limit != null) 'limit': limit,
        },
      );
      return response.data['games'] ?? response.data;
    } catch (e) {
      throw Exception('خطا در دریافت بازی‌ها: ${e.toString()}');
    }
  }

  /// Get game by ID
  static Future<Map<String, dynamic>> getGame(String id) async {
    try {
      final response = await _client.get(ApiEndpoints.game(id));
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت اطلاعات بازی: ${e.toString()}');
    }
  }

  /// Create new game
  static Future<Map<String, dynamic>> createGame({
    required String title,
    required String venueId,
    required String date,
    required String time,
    required int maxPlayers,
    String? description,
    String? level,
  }) async {
    try {
      final response = await _client.post(
        ApiEndpoints.games,
        data: {
          'title': title,
          'venue_id': venueId,
          'date': date,
          'time': time,
          'max_players': maxPlayers,
          if (description != null) 'description': description,
          if (level != null) 'level': level,
        },
      );
      return response.data;
    } catch (e) {
      throw Exception('خطا در ایجاد بازی: ${e.toString()}');
    }
  }

  /// Join game
  static Future<void> joinGame(String gameId) async {
    try {
      await _client.post('${ApiEndpoints.game(gameId)}/join');
    } catch (e) {
      throw Exception('خطا در عضویت بازی: ${e.toString()}');
    }
  }

  /// Leave game
  static Future<void> leaveGame(String gameId) async {
    try {
      await _client.post('${ApiEndpoints.game(gameId)}/leave');
    } catch (e) {
      throw Exception('خطا در خروج از بازی: ${e.toString()}');
    }
  }
}
