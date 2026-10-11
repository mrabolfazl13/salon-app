import 'api_client.dart';
import 'api_endpoints.dart';

class GameService {
  static final _client = ApiClient.instance;

  /// بازی‌های عمومی قابل‌کشف — GET /games (پاکت dict با items)
  static Future<List<dynamic>> getGames({
    String? sport,
    String? skillLevel,
    int? venueId,
    String? dateFrom,
    String? dateTo,
    String? timeFrom,
    String? timeTo,
    int? maxPricePerPlayer,
    bool availabilityOnly = false,
    double? latitude,
    double? longitude,
    String sort = 'soonest',
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      final response = await _client.get(
        ApiEndpoints.games,
        queryParameters: {
          if (sport != null) 'sport': sport,
          if (skillLevel != null) 'skill_level': skillLevel,
          if (venueId != null) 'venue_id': venueId,
          if (dateFrom != null) 'date_from': dateFrom,
          if (dateTo != null) 'date_to': dateTo,
          if (timeFrom != null) 'time_from': timeFrom,
          if (timeTo != null) 'time_to': timeTo,
          if (maxPricePerPlayer != null) 'max_price_per_player': maxPricePerPlayer,
          if (availabilityOnly) 'availability_only': true,
          if (latitude != null) 'latitude': latitude,
          if (longitude != null) 'longitude': longitude,
          'sort': sort,
          'limit': limit,
          'offset': offset,
        },
      );
      final data = response.data;
      if (data is Map) {
        return (data['items'] ?? data['games'] ?? []) as List;
      }
      return (data ?? []) as List;
    } catch (e) {
      throw Exception('خطا در دریافت بازی‌ها: ${e.toString()}');
    }
  }

  /// بازی‌های من — GET /games/my
  static Future<List<dynamic>> getMyGames() async {
    try {
      final response = await _client.get('${ApiEndpoints.games}/my');
      return (response.data ?? []) as List;
    } catch (e) {
      throw Exception('خطا در دریافت بازی‌های من: ${e.toString()}');
    }
  }

  /// جزئیات بازی — GET /games/{id}
  static Future<Map<String, dynamic>> getGame(String id) async {
    try {
      final response = await _client.get(ApiEndpoints.game(id));
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت اطلاعات بازی: ${e.toString()}');
    }
  }

  /// ایجاد بازی روی یک رزرو تأییدشده — POST /games
  static Future<Map<String, dynamic>> createGame({
    required String bookingId,
    required String name,
    String? description,
    String sport = 'football',
    required int maxPlayers,
    String skillLevel = 'intermediate',
    String visibility = 'public',
    String paymentMode = 'split_payment',
  }) async {
    try {
      final response = await _client.post(
        ApiEndpoints.games,
        data: {
          'booking_id': int.tryParse(bookingId) ?? bookingId,
          'name': name,
          if (description != null && description.isNotEmpty)
            'description': description,
          'sport': sport,
          'max_players': maxPlayers,
          'skill_level': skillLevel,
          'visibility': visibility,
          'payment_mode': paymentMode,
        },
      );
      return response.data;
    } catch (e) {
      throw Exception('خطا در ایجاد بازی: ${e.toString()}');
    }
  }

  /// پیوستن به بازی — POST /games/{id}/join → {game, message}
  static Future<Map<String, dynamic>> joinGame(String gameId) async {
    try {
      final response = await _client.post('${ApiEndpoints.game(gameId)}/join');
      return response.data;
    } catch (e) {
      throw Exception('خطا در پیوستن به بازی: ${e.toString()}');
    }
  }

  /// خروج از بازی — POST /games/{id}/leave
  static Future<Map<String, dynamic>> leaveGame(String gameId) async {
    try {
      final response =
          await _client.post('${ApiEndpoints.game(gameId)}/leave');
      return response.data;
    } catch (e) {
      throw Exception('خطا در خروج از بازی: ${e.toString()}');
    }
  }

  /// شرکت‌کننده‌های بازی — GET /games/{id}/participants
  static Future<List<dynamic>> getParticipants(String gameId) async {
    try {
      final response =
          await _client.get('${ApiEndpoints.game(gameId)}/participants');
      return (response.data ?? []) as List;
    } catch (e) {
      throw Exception('خطا در دریافت شرکت‌کننده‌ها: ${e.toString()}');
    }
  }

  /// لغو بازی (فقط برگزارکننده) — DELETE /games/{id}
  static Future<Map<String, dynamic>> cancelGame(String gameId) async {
    try {
      final response = await _client.delete(ApiEndpoints.game(gameId));
      return response.data;
    } catch (e) {
      throw Exception('خطا در لغو بازی: ${e.toString()}');
    }
  }
}
