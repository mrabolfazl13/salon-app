import '../services/api_service.dart';

class TeamService {
  static final TeamService _instance = TeamService._internal();
  factory TeamService() => _instance;

  final ApiService _api = ApiService();

  TeamService._internal();

  /// Create a new team
  Future<Map<String, dynamic>> createTeam({
    required String name,
    required String sport,
    String visibility = 'private',
    String? description,
  }) async {
    try {
      final response = await _api.post('/teams/', data: {
        'name': name,
        'sport': sport,
        'visibility': visibility,
        if (description != null) 'description': description,
      });

      return {
        'success': true,
        'team': response.data,
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'خطا در ایجاد تیم',
      };
    }
  }

  /// Get my teams
  Future<List<Map<String, dynamic>>> getMyTeams() async {
    try {
      final response = await _api.get('/teams/');
      return List<Map<String, dynamic>>.from(response.data ?? []);
    } catch (e) {
      print('Error fetching my teams: $e');
      return [];
    }
  }

  /// Discover teams
  Future<List<Map<String, dynamic>>> discoverTeams({
    String? search,
    String? sport,
    int limit = 50,
  }) async {
    try {
      final response = await _api.get('/teams/discover', queryParameters: {
        if (search != null) 'search': search,
        if (sport != null) 'sport': sport,
        'limit': limit,
      });

      return List<Map<String, dynamic>>.from(response.data['items'] ?? []);
    } catch (e) {
      print('Error discovering teams: $e');
      return [];
    }
  }

  /// Get team by ID
  Future<Map<String, dynamic>?> getTeamById(int id) async {
    try {
      final response = await _api.get('/teams/$id');
      return response.data;
    } catch (e) {
      print('Error fetching team: $e');
      return null;
    }
  }

  /// Get team members
  Future<List<Map<String, dynamic>>> getTeamMembers(int teamId) async {
    try {
      final response = await _api.get('/teams/$teamId/members');
      return List<Map<String, dynamic>>.from(response.data ?? []);
    } catch (e) {
      print('Error fetching team members: $e');
      return [];
    }
  }

  /// Invite member to team
  Future<Map<String, dynamic>> inviteMember(int teamId, String phone) async {
    try {
      await _api.post('/teams/$teamId/invite', data: {
        'phone': phone,
        'expires_in_days': 7,
      });

      return {'success': true};
    } catch (e) {
      return {
        'success': false,
        'error': 'خطا در ارسال دعوت',
      };
    }
  }

  /// Accept team invitation
  Future<Map<String, dynamic>> acceptInvitation(int teamId, int memberId) async {
    try {
      await _api.post('/teams/$teamId/invitations/$memberId/accept');
      return {'success': true};
    } catch (e) {
      return {
        'success': false,
        'error': 'خطا در پذیرش دعوت',
      };
    }
  }

  /// Leave team
  Future<Map<String, dynamic>> leaveTeam(int teamId) async {
    try {
      await _api.post('/teams/$teamId/leave');
      return {'success': true};
    } catch (e) {
      return {
        'success': false,
        'error': 'خطا در خروج از تیم',
      };
    }
  }

  /// Get team standings
  Future<List<Map<String, dynamic>>> getStandings({int limit = 50}) async {
    try {
      final response = await _api.get('/teams/standings', queryParameters: {
        'limit': limit,
      });

      return List<Map<String, dynamic>>.from(response.data['items'] ?? []);
    } catch (e) {
      print('Error fetching standings: $e');
      return [];
    }
  }

  /// Request to join team
  Future<Map<String, dynamic>> requestJoinTeam(int teamId, {String? message}) async {
    try {
      await _api.post('/teams/$teamId/join-request', data: {
        if (message != null) 'message': message,
      });

      return {'success': true};
    } catch (e) {
      return {
        'success': false,
        'error': 'خطا در ارسال درخواست عضویت',
      };
    }
  }
}
