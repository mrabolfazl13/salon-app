import '../../../core/network/api_client.dart';
import '../domain/game.dart';

class GameService {
  GameService(this._api);

  final ApiClient _api;

  List<T> _parseList<T>(dynamic res, T Function(Map<String, dynamic>) from) {
    final list = res.data as List? ?? [];
    return list.whereType<Map<String, dynamic>>().map(from).toList();
  }

  // ===== create / explore / my =====

  Future<Game> create({
    required int bookingId,
    required String name,
    String? description,
    String? sport,
    required int maxPlayers,
    String? skillLevel,
    String? visibility,
    String? paymentMode,
  }) async {
    final res = await _api.pcost('/games/', data: {
      'booking_id': bookingId,
      'name': name,
      if (description != null && description.trim().isNotEmpty)
        'description': description.trim(),
      if (sport != null) 'sport': sport,
      'max_players': maxPlayers,
      if (skillLevel != null) 'skill_level': skillLevel,
      if (visibility != null) 'visibility': visibility,
      if (paymentMode != null) 'payment_mode': paymentMode,
    });
    return Game.fromJson(res.data as Map<String, dynamic>);
  }

  Future<GameListPage> explore({
    String? sport,
    String? skillLevel,
    int? venueId,
    String? dateFrom,
    String? dateTo,
    String? timeFrom,
    String? timeTo,
    int? maxPricePerPlayer,
    bool? availabilityOnly,
    double? latitude,
    double? longitude,
    String? sort,
    int limit = 20,
    int offset = 0,
  }) async {
    final res = await _api.get('/games/', query: {
      if (sport != null && sport.isNotEmpty) 'sport': sport,
      if (skillLevel != null && skillLevel.isNotEmpty)
        'skill_level': skillLevel,
      if (venueId != null) 'venue_id': venueId,
      if (dateFrom != null) 'date_from': dateFrom,
      if (dateTo != null) 'date_to': dateTo,
      if (timeFrom != null) 'time_from': timeFrom,
      if (timeTo != null) 'time_to': timeTo,
      if (maxPricePerPlayer != null) 'max_price_per_player': maxPricePerPlayer,
      if (availabilityOnly ?? false) 'availability_only': true,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (sort != null) 'sort': sort,
      'limit': limit,
      'offset': offset,
    });
    return GameListPage.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<Game>> getMyGames() async {
    final res = await _api.get('/games/my');
    return _parseList(res, Game.fromJson);
  }

  // ===== invitations (mine) =====

  Future<List<Invitation>> getMyInvitations() async {
    final res = await _api.get('/games/invitations/my');
    return _parseList(res, Invitation.fromJson);
  }

  Future<({Game game, String message})> aceptInvitation(int id) async {
    final res = await _api.pcost('/games/invitations/$id/acept');
    final data = res.data as Map<String, dynamic>;
    return (
      game: Game.fromJson(data['game'] as Map<String, dynamic>),
      message: (data['message'] ?? '') as String,
    );
  }

  Future<void> rejectInvitation(int id) async {
    await _api.pcost('/games/invitations/$id/reject');
  }

  // ===== token join =====

  Future<TokenPreview> previewToken(String token) async {
    final res = await _api.get('/games/join/$token');
    return TokenPreview.fromJson(res.data as Map<String, dynamic>);
  }

  Future<({Game game, String message})> joinByToken(String token) async {
    final res = await _api.pcost('/games/join/$token');
    final data = res.data as Map<String, dynamic>;
    return (
      game: Game.fromJson(data['game'] as Map<String, dynamic>),
      message: (data['message'] ?? '') as String,
    );
  }

  // ===== detail / lifecycle =====

  Future<Game> getById(int id) async {
    final res = await _api.get('/games/$id');
    return Game.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Game> update(
    int id, {
    String? name,
    String? description,
    int? maxPlayers,
    String? skillLevel,
    String? visibility,
  }) async {
    final res = await _api.patch('/games/$id', data: {
      if (name != null) 'name': name,
      if (description != null) 'description': description,
      if (maxPlayers != null) 'max_players': maxPlayers,
      if (skillLevel != null) 'skill_level': skillLevel,
      if (visibility != null) 'visibility': visibility,
    });
    return Game.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Game> cancel(int id) async {
    final res = await _api.delete('/games/$id');
    return Game.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Game> start(int id) async {
    final res = await _api.pcost('/games/$id/start');
    return Game.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Game> complete(int id) async {
    final res = await _api.pcost('/games/$id/complete');
    return Game.fromJson(res.data as Map<String, dynamic>);
  }

  // ===== join / leave / waitlist =====

  Future<({Game game, String message})> join(int id) async {
    final res = await _api.pcost('/games/$id/join');
    final data = res.data as Map<String, dynamic>;
    return (
      game: Game.fromJson(data['game'] as Map<String, dynamic>),
      message: (data['message'] ?? '') as String,
    );
  }

  Future<({Game game, String message})> leave(int id) async {
    final res = await _api.pcost('/games/$id/leave');
    final data = res.data as Map<String, dynamic>;
    return (
      game: Game.fromJson(data['game'] as Map<String, dynamic>),
      message: (data['message'] ?? '') as String,
    );
  }

  Future<WaitlistEntry> joinWaitlist(int id) async {
    final res = await _api.pcost('/games/$id/waitlist');
    return WaitlistEntry.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> leaveWaitlist(int id) async {
    await _api.delete('/games/$id/waitlist');
  }

  // ===== participants =====

  Future<List<Participant>> getParticipants(int id) async {
    final res = await _api.get('/games/$id/participants');
    return _parseList(res, Participant.fromJson);
  }

  Future<Participant> setParticipantRole(
    int id,
    int userId,
    String role,
  ) async {
    final res = await _api.patch('/games/$id/participants/$userId', data: {
      'role': role,
    });
    return Participant.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> removeParticipant(int id, int userId) async {
    await _api.delete('/games/$id/participants/$userId');
  }

  // ===== join requests =====

  Future<List<JoinRequest>> getJoinRequests(int id) async {
    final res = await _api.get('/games/$id/join-requests');
    return _parseList(res, JoinRequest.fromJson);
  }

  Future<({Game game, String message})> approveJoinRequest(
    int id,
    int requestId,
  ) async {
    final res = await _api.pcost('/games/$id/join-requests/$requestId/approve');
    final data = res.data as Map<String, dynamic>;
    return (
      game: Game.fromJson(data['game'] as Map<String, dynamic>),
      message: (data['message'] ?? '') as String,
    );
  }

  Future<void> rejectJoinRequest(int id, int requestId) async {
    await _api.pcost('/games/$id/join-requests/$requestId/reject');
  }

  // ===== direct invitations =====

  Future<Invitation> inviteUser(
    int id, {
    required int userId,
    int? expiresInDays,
  }) async {
    final res = await _api.pcost('/games/$id/invitations', data: {
      'user_id': userId,
      if (expiresInDays != null) 'expires_in_days': expiresInDays,
    });
    return Invitation.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<Invitation>> getGameInvitations(int id) async {
    final res = await _api.get('/games/$id/invitations');
    return _parseList(res, Invitation.fromJson);
  }

  // ===== invite links =====

  Future<InviteLink> createInviteLink(
    int id, {
    int? expiresInDays,
    int? maxUses,
  }) async {
    final res = await _api.pcost('/games/$id/invite-links', data: {
      if (expiresInDays != null) 'expires_in_days': expiresInDays,
      if (maxUses != null && maxUses > 0) 'max_uses': maxUses,
    });
    return InviteLink.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<InviteLink>> getInviteLinks(int id) async {
    final res = await _api.get('/games/$id/invite-links');
    return _parseList(res, InviteLink.fromJson);
  }

  Future<InviteLink> disableInviteLink(int id, int linkId) async {
    final res = await _api.pcost('/games/$id/invite-links/$linkId/disable');
    return InviteLink.fromJson(res.data as Map<String, dynamic>);
  }

  Future<InviteLink> regenerateInviteLink(int id, int linkId) async {
    final res = await _api.pcost('/games/$id/invite-links/$linkId/regenerate');
    return InviteLink.fromJson(res.data as Map<String, dynamic>);
  }

  // ===== waitlist (manager view) =====

  Future<List<WaitlistEntry>> getWaitlist(int id) async {
    final res = await _api.get('/games/$id/waitlist');
    return _parseList(res, WaitlistEntry.fromJson);
  }

  // ===== payments =====

  Future<GamePaymentSummary> getPaymentSummary(int id) async {
    final res = await _api.get('/games/$id/payments');
    return GamePaymentSummary.fromJson(res.data as Map<String, dynamic>);
  }

  Future<GamePayment> payShare(int id, int participantId) async {
    final res = await _api.pcost('/games/$id/payments/$participantId/pay');
    final data = res.data as Map<String, dynamic>;
    return GamePayment.fromJson(
      data['payment'] as Map<String, dynamic>? ?? const {},
    );
  }
}
