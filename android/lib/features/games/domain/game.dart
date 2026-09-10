/// Group-games domain — mirrors backend schemas/game.py (snake_case kept).
library;

enum GameVisibility { private, public, publicApproval }

GameVisibility gameVisibilityFrom(String? raw) => switch (raw) {
      'private' => GameVisibility.private,
      'public_approval' => GameVisibility.publicApproval,
      _ => GameVisibility.public,
    };

extension GameVisibilityX on GameVisibility {
  String get wire => switch (this) {
        GameVisibility.private => 'private',
        GameVisibility.public => 'public',
        GameVisibility.publicApproval => 'public_approval',
      };

  String get labelFa => switch (this) {
        GameVisibility.private => 'خصوصی',
        GameVisibility.public => 'عمومی',
        GameVisibility.publicApproval => 'عمومی با تأیید',
      };
}

enum SkillLevel { beginner, intermediate, advanced, pro }

SkillLevel skillLevelFrom(String? raw) => switch (raw) {
      'beginner' => SkillLevel.beginner,
      'advanced' => SkillLevel.advanced,
      'pro' => SkillLevel.pro,
      _ => SkillLevel.intermediate,
    };

extension SkillLevelX on SkillLevel {
  String get wire => switch (this) {
        SkillLevel.beginner => 'beginner',
        SkillLevel.intermediate => 'intermediate',
        SkillLevel.advanced => 'advanced',
        SkillLevel.pro => 'pro',
      };

  String get labelFa => switch (this) {
        SkillLevel.beginner => 'مبتدی',
        SkillLevel.intermediate => 'متوسط',
        SkillLevel.advanced => 'پیشرفته',
        SkillLevel.pro => 'حرفه‌ای',
      };
}

enum PaymentMode { organizerPays, splitPayment, free }

PaymentMode paymentModeFrom(String? raw) => switch (raw) {
      'organizer_pays' => PaymentMode.organizerPays,
      'free' => PaymentMode.free,
      _ => PaymentMode.splitPayment,
    };

extension PaymentModeX on PaymentMode {
  String get wire => switch (this) {
        PaymentMode.organizerPays => 'organizer_pays',
        PaymentMode.splitPayment => 'split_payment',
        PaymentMode.free => 'free',
      };

  String get labelFa => switch (this) {
        PaymentMode.organizerPays => 'پرداخت برگزارکننده',
        PaymentMode.splitPayment => 'سهمی (هر بازیکن)',
        PaymentMode.free => 'رایگان',
      };
}

enum GameSort { sonest, nearest, cheapest, mcostAvailable, popular }

extension GameSortX on GameSort {
  String get wire => switch (this) {
        GameSort.sonest => 'sonest',
        GameSort.nearest => 'nearest',
        GameSort.cheapest => 'cheapest',
        GameSort.mcostAvailable => 'mcost_available',
        GameSort.popular => 'popular',
      };

  String get labelFa => switch (this) {
        GameSort.sonest => 'نزدیک‌ترین زمان',
        GameSort.nearest => 'نزدیک‌ترین مکان',
        GameSort.cheapest => 'ارزان‌ترین',
        GameSort.mcostAvailable => 'بیشترین ظرفیت',
        GameSort.popular => 'محبوب‌ترین',
      };
}

String gameStatusLabel(String status) => switch (status) {
      'draft' => 'پیش‌نویس',
      'open' => 'باز',
      'full' => 'تکمیل شده',
      'started' => 'شروع شده',
      'completed' => 'به پایان رسیده',
      'cancelled' => 'لغو شده',
      _ => status,
    };

String participantStatusLabel(String status) => switch (status) {
      'invited' => 'دعوت‌شده',
      'pending' => 'در انتظار',
      'acepted' => 'عضو',
      'rejected' => 'رد شده',
      'left' => 'خارج شده',
      'removed' => 'حذف شده',
      _ => status,
    };

String participantRoleLabel(String role) => switch (role) {
      'organizer' => 'برگزارکننده',
      'admin' => 'ادمین',
      _ => 'عضو',
    };

String sportEmoji(String sport) => switch (sport) {
      'football' || 'futsal' => '⚽',
      'basketball' => '🏀',
      'volleyball' => '🏐',
      'tennis' => '🎾',
      'badminton' => '🏸',
      'gym' => '🏋️',
      'pool' => '🎱',
      _ => '🎮',
    };

class Game {
  const Game({
    required this.id,
    required this.bookingId,
    required this.organizerId,
    required this.name,
    required this.sport,
    required this.visibility,
    required this.joinPolicy,
    required this.maxPlayers,
    required this.skillLevel,
    required this.paymentMode,
    required this.status,
    required this.currentPlayers,
    required this.hasPendingJoinRequest,
    required this.hasPendingInvitation,
    this.description,
    this.createdAt,
    this.updatedAt,
    this.organizerName,
    this.venueId,
    this.venueName,
    this.venueAddress,
    this.latitude,
    this.longitude,
    this.slotDate,
    this.startTime,
    this.duration,
    this.totalPrice,
    this.pricePerPlayer,
    this.distanceKm,
    this.myParticipantStatus,
    this.myRole,
    this.myWaitlistPosition,
  });

  final int id;
  final int bookingId;
  final int organizerId;
  final String name;
  final String? description;
  final String sport;
  final GameVisibility visibility;
  final String joinPolicy;
  final int maxPlayers;
  final SkillLevel skillLevel;
  final PaymentMode paymentMode;
  final String status; // draft|open|full|started|completed|cancelled
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? organizerName;
  final int currentPlayers;
  final int? venueId;
  final String? venueName;
  final String? venueAddress;
  final double? latitude;
  final double? longitude;
  final String? slotDate;
  final String? startTime;
  final int? duration;
  final int? totalPrice;
  final int? pricePerPlayer;
  final double? distanceKm;
  final String? myParticipantStatus;
  final String? myRole;
  final int? myWaitlistPosition;
  final bool hasPendingJoinRequest;
  final bool hasPendingInvitation;

  bool get isOrganizerVisible => myRole == 'organizer';
  bool get canManage => myRole == 'organizer' || myRole == 'admin';
  bool get isParticipant => myParticipantStatus == 'acepted';
  int get remaining => (maxPlayers - currentPlayers).clamp(0, maxPlayers);
  bool get isFreeOrUnknown =>
      paymentMode == PaymentMode.free || pricePerPlayer == null;

  factory Game.fromJson(Map<String, dynamic> json) => Game(
        id: (json['id'] as num).toInt(),
        bookingId: (json['booking_id'] as num?)?.toInt() ?? 0,
        organizerId: (json['organizer_id'] as num?)?.toInt() ?? 0,
        name: (json['name'] ?? '') as String,
        description: json['description'] as String?,
        sport: (json['sport'] ?? 'football') as String,
        visibility: gameVisibilityFrom(json['visibility'] as String?),
        joinPolicy: (json['join_policy'] ?? 'direct') as String,
        maxPlayers: (json['max_players'] as num?)?.toInt() ?? 0,
        skillLevel: skillLevelFrom(json['skill_level'] as String?),
        paymentMode: paymentModeFrom(json['payment_mode'] as String?),
        status: (json['status'] ?? 'open') as String,
        createdAt: json['created_at'] == null
            ? null
            : DateTime.tryParse(json['created_at'] as String),
        updatedAt: json['updated_at'] == null
            ? null
            : DateTime.tryParse(json['updated_at'] as String),
        organizerName: json['organizer_name'] as String?,
        currentPlayers: (json['current_players'] as num?)?.toInt() ?? 0,
        venueId: (json['venue_id'] as num?)?.toInt(),
        venueName: json['venue_name'] as String?,
        venueAddress: json['venue_address'] as String?,
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
        slotDate: json['slot_date'] as String?,
        startTime: json['start_time'] as String?,
        duration: (json['duration'] as num?)?.toInt(),
        totalPrice: (json['total_price'] as num?)?.toInt(),
        pricePerPlayer: (json['price_per_player'] as num?)?.toInt(),
        distanceKm: (json['distance_km'] as num?)?.toDouble(),
        myParticipantStatus: json['my_participant_status'] as String?,
        myRole: json['my_role'] as String?,
        myWaitlistPosition: (json['my_waitlist_position'] as num?)?.toInt(),
        hasPendingJoinRequest: (json['has_pending_join_request'] ?? false) as bool,
        hasPendingInvitation: (json['has_pending_invitation'] ?? false) as bool,
      );
}

class GameListPage {
  const GameListPage({
    required this.items,
    required this.total,
    required this.limit,
    required this.offset,
  });

  final List<Game> items;
  final int total;
  final int limit;
  final int offset;

  factory GameListPage.fromJson(Map<String, dynamic> json) => GameListPage(
        items: (json['items'] as List? ?? [])
            .whereType<Map<String, dynamic>>()
            .map(Game.fromJson)
            .toList(),
        total: (json['total'] as num?)?.toInt() ?? 0,
        limit: (json['limit'] as num?)?.toInt() ?? 20,
        offset: (json['offset'] as num?)?.toInt() ?? 0,
      );
}

class Participant {
  const Participant({
    required this.id,
    required this.gameId,
    required this.userId,
    required this.role,
    required this.status,
    required this.joinedAt,
    this.fullName,
    this.paymentStatus,
  });

  final int id;
  final int gameId;
  final int userId;
  final String role;
  final String status;
  final DateTime? joinedAt;
  final String? fullName;
  final String? paymentStatus;

  factory Participant.fromJson(Map<String, dynamic> json) => Participant(
        id: (json['id'] as num).toInt(),
        gameId: (json['game_id'] as num?)?.toInt() ?? 0,
        userId: (json['user_id'] as num?)?.toInt() ?? 0,
        role: (json['role'] ?? 'member') as String,
        status: (json['status'] ?? '') as String,
        joinedAt: json['joined_at'] == null
            ? null
            : DateTime.tryParse(json['joined_at'] as String),
        fullName: json['full_name'] as String?,
        paymentStatus: json['payment_status'] as String?,
      );
}

class JoinRequest {
  const JoinRequest({
    required this.id,
    required this.gameId,
    required this.userId,
    required this.status,
    required this.createdAt,
    this.fullName,
    this.message,
  });

  final int id;
  final int gameId;
  final int userId;
  final String status;
  final DateTime? createdAt;
  final String? fullName;
  final String? message;

  factory JoinRequest.fromJson(Map<String, dynamic> json) => JoinRequest(
        id: (json['id'] as num).toInt(),
        gameId: (json['game_id'] as num?)?.toInt() ?? 0,
        userId: (json['user_id'] as num?)?.toInt() ?? 0,
        status: (json['status'] ?? '') as String,
        createdAt: json['created_at'] == null
            ? null
            : DateTime.tryParse(json['created_at'] as String),
        fullName: json['full_name'] as String?,
        message: json['message'] as String?,
      );
}

class Invitation {
  const Invitation({
    required this.id,
    required this.gameId,
    required this.invitedUserId,
    required this.status,
    required this.createdAt,
    this.invitedUserName,
    this.expiresAt,
    this.gameName,
  });

  final int id;
  final int gameId;
  final int invitedUserId;
  final String status;
  final DateTime? createdAt;
  final String? invitedUserName;
  final DateTime? expiresAt;
  final String? gameName;

  factory Invitation.fromJson(Map<String, dynamic> json) => Invitation(
        id: (json['id'] as num).toInt(),
        gameId: (json['game_id'] as num?)?.toInt() ?? 0,
        invitedUserId: (json['invited_user_id'] as num?)?.toInt() ?? 0,
        status: (json['status'] ?? '') as String,
        createdAt: json['created_at'] == null
            ? null
            : DateTime.tryParse(json['created_at'] as String),
        invitedUserName: json['invited_user_name'] as String?,
        expiresAt: json['expires_at'] == null
            ? null
            : DateTime.tryParse(json['expires_at'] as String),
        gameName: json['game_name'] as String?,
      );
}

class InviteLink {
  const InviteLink({
    required this.id,
    required this.gameId,
    required this.token,
    required this.joinPath,
    required this.usescount,
    required this.isActive,
    required this.createdAt,
    this.expiresAt,
    this.maxUses,
  });

  final int id;
  final int gameId;
  final String token;
  final String joinPath;
  final DateTime? expiresAt;
  final int? maxUses;
  final int usescount;
  final bool isActive;
  final DateTime? createdAt;

  factory InviteLink.fromJson(Map<String, dynamic> json) => InviteLink(
        id: (json['id'] as num).toInt(),
        gameId: (json['game_id'] as num?)?.toInt() ?? 0,
        token: (json['token'] ?? '') as String,
        joinPath: (json['join_path'] ?? '') as String,
        expiresAt: json['expires_at'] == null
            ? null
            : DateTime.tryParse(json['expires_at'] as String),
        maxUses: (json['max_uses'] as num?)?.toInt(),
        usescount: (json['uses_count'] as num?)?.toInt() ?? 0,
        isActive: (json['is_active'] ?? true) as bool,
        createdAt: json['created_at'] == null
            ? null
            : DateTime.tryParse(json['created_at'] as String),
      );
}

class TokenPreview {
  const TokenPreview({required this.valid, this.game, this.reason});

  final bool valid;
  final Game? game;
  final String? reason;

  factory TokenPreview.fromJson(Map<String, dynamic> json) => TokenPreview(
        valid: (json['valid'] ?? false) as bool,
        game: json['game'] is Map<String, dynamic>
            ? Game.fromJson(json['game'] as Map<String, dynamic>)
            : null,
        reason: json['reason'] as String?,
      );
}

class WaitlistEntry {
  const WaitlistEntry({
    required this.id,
    required this.gameId,
    required this.userId,
    required this.position,
    required this.status,
    required this.createdAt,
  });

  final int id;
  final int gameId;
  final int userId;
  final int position;
  final String status;
  final DateTime? createdAt;

  factory WaitlistEntry.fromJson(Map<String, dynamic> json) => WaitlistEntry(
        id: (json['id'] as num).toInt(),
        gameId: (json['game_id'] as num?)?.toInt() ?? 0,
        userId: (json['user_id'] as num?)?.toInt() ?? 0,
        position: (json['position'] as num?)?.toInt() ?? 0,
        status: (json['status'] ?? '') as String,
        createdAt: json['created_at'] == null
            ? null
            : DateTime.tryParse(json['created_at'] as String),
      );
}

class GamePayment {
  const GamePayment({
    required this.id,
    required this.gameId,
    required this.participantId,
    required this.userId,
    required this.amount,
    required this.status,
    required this.createdAt,
    this.paidAt,
  });

  final int id;
  final int gameId;
  final int participantId;
  final int userId;
  final int amount;
  final String status;
  final DateTime? createdAt;
  final DateTime? paidAt;

  factory GamePayment.fromJson(Map<String, dynamic> json) => GamePayment(
        id: (json['id'] as num).toInt(),
        gameId: (json['game_id'] as num?)?.toInt() ?? 0,
        participantId: (json['participant_id'] as num?)?.toInt() ?? 0,
        userId: (json['user_id'] as num?)?.toInt() ?? 0,
        amount: (json['amount'] as num?)?.toInt() ?? 0,
        status: (json['status'] ?? '') as String,
        createdAt: json['created_at'] == null
            ? null
            : DateTime.tryParse(json['created_at'] as String),
        paidAt: json['paid_at'] == null
            ? null
            : DateTime.tryParse(json['paid_at'] as String),
      );
}

class GamePaymentSummary {
  const GamePaymentSummary({
    required this.paymentMode,
    required this.totalPrice,
    required this.paidcount,
    required this.pendingcount,
    required this.payments,
    this.pricePerPlayer,
  });

  final PaymentMode paymentMode;
  final int totalPrice;
  final int? pricePerPlayer;
  final int paidcount;
  final int pendingcount;
  final List<GamePayment> payments;

  factory GamePaymentSummary.fromJson(Map<String, dynamic> json) =>
      GamePaymentSummary(
        paymentMode: paymentModeFrom(json['payment_mode'] as String?),
        totalPrice: (json['total_price'] as num?)?.toInt() ?? 0,
        pricePerPlayer: (json['price_per_player'] as num?)?.toInt(),
        paidcount: (json['paid_count'] as num?)?.toInt() ?? 0,
        pendingcount: (json['pending_count'] as num?)?.toInt() ?? 0,
        payments: (json['payments'] as List? ?? [])
            .whereType<Map<String, dynamic>>()
            .map(GamePayment.fromJson)
            .toList(),
      );
}
