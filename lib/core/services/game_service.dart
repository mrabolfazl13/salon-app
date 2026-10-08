import '../services/api_service.dart';

class GameService {
  static final GameService _instance = GameService._internal();
  factory GameService() => _instance;

  final ApiService _api = ApiService();

  GameService._internal();

  /// Get all games with filters
  Future<List<Map<String, dynamic>>> getGames({
    String? sport,
    String? visibility,
    int limit = 50,
    int offset = 0,
  }) async {
    try {
      final response = await _api.get('/games/', queryParameters: {
        if (sport != null) 'sport': sport,
        if (visibility != null) 'visibility': visibility,
        'limit': limit,
        'offset': offset,
      });

      return List<Map<String, dynamic>>.from(response.data['items'] ?? []);
    } catch (e) {
      print('Error fetching games: $e');
      return [];
    }
  }

  /// Get game by ID
  Future<Map<String, dynamic>?> getGameById(int id) async {
    try {
      final response = await _api.get('/games/$id');
      return response.data;
    } catch (e) {
      print('Error fetching game: $e');
      return null;
    }
  }

  /// Create a new game
  Future<Map<String, dynamic>> createGame({
    required int bookingId,
    required String name,
    String? description,
    String sport = 'futsal',
    int maxPlayers = 8,
    String skillLevel = 'intermediate',
    String visibility = 'public',
    String paymentMode = 'split_payment',
  }) async {
    try {
      final response = await _api.post('/games/', data: {
        'booking_id': bookingId,
        'name': name,
        if (description != null) 'description': description,
        'sport': sport,
        'max_players': maxPlayers,
        'skill_level': skillLevel,
        'visibility': visibility,
        'payment_mode': paymentMode,
      });

      return {
        'success': true,
        'game': response.data,
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'خطا در ایجاد بازی',
      };
    }
  }

  /// Join a game
  Future<Map<String, dynamic>> joinGame(int gameId) async {
    try {
      final response = await _api.post('/games/$gameId/join');

      return {
        'success': true,
        'message': response.data['message'],
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'خطا در پیوستن به بازی',
      };
    }
  }

  /// Leave a game
  Future<Map<String, dynamic>> leaveGame(int gameId) async {
    try {
      await _api.delete('/games/$gameId/leave');

      return {
        'success': true,
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'خطا در خروج از بازی',
      };
    }
  }

  /// Get game participants
  Future<List<Map<String, dynamic>>> getGameParticipants(int gameId) async {
    try {
      final response = await _api.get('/games/$gameId/participants');
      return List<Map<String, dynamic>>.from(response.data ?? []);
    } catch (e) {
      print('Error fetching participants: $e');
      return [];
    }
  }

  /// Invite user to game
  Future<Map<String, dynamic>> inviteToGame(int gameId, int userId) async {
    try {
      await _api.post('/games/$gameId/invite', data: {
        'user_id': userId,
      });

      return {'success': true};
    } catch (e) {
      return {
        'success': false,
        'error': 'خطا در ارسال دعوت',
      };
    }
  }

  /// Get my games
  Future<List<Map<String, dynamic>>> getMyGames() async {
    try {
      final response = await _api.get('/games/my');
      return List<Map<String, dynamic>>.from(response.data ?? []);
    } catch (e) {
      print('Error fetching my games: $e');
      return [];
    }
  }
}
