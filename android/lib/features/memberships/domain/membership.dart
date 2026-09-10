/// Membership plan/purchase — mirrors backend membership schemas.
class MembershipPlan {
  const MembershipPlan({
    required this.id,
    required this.venueId,
    required this.title,
    required this.planType,
    required this.price,
    this.sessionscount,
    this.durationDays,
    this.description,
    this.isActive = true,
    this.createdAt,
  });

  final int id;
  final int venueId;
  final String title;
  final String planType; // session|sessions_pack|monthly
  final int price;
  final int? sessionscount;
  final int? durationDays;
  final String? description;
  final bool isActive;
  final DateTime? createdAt;

  String get typeLabelFa => switch (planType) {
        'session' => 'جلسه‌ای',
        'sessions_pack' => 'پک جلسه‌ای',
        'monthly' => 'ماهانه',
        _ => planType,
      };

  factory MembershipPlan.fromJson(Map<String, dynamic> json) =>
      MembershipPlan(
        id: (json['id'] as num).toInt(),
        venueId: (json['venue_id'] as num?)?.toInt() ?? 0,
        title: (json['title'] ?? '') as String,
        planType: (json['plan_type'] ?? 'session') as String,
        price: (json['price'] as num?)?.toInt() ?? 0,
        sessionscount: (json['sessions_count'] as num?)?.toInt(),
        durationDays: (json['duration_days'] as num?)?.toInt(),
        description: json['description'] as String?,
        isActive: (json['is_active'] ?? true) as bool,
        createdAt: json['created_at'] == null
            ? null
            : DateTime.tryParse(json['created_at'] as String),
      );
}

class MembershipPurchase {
  const MembershipPurchase({
    required this.id,
    required this.planId,
    required this.userId,
    required this.venueId,
    this.planTitle,
    this.planType,
    this.venueName,
    required this.amount,
    required this.status,
    this.transactionId,
    this.cardPan,
    this.sessionsRemaining,
    this.startsAt,
    this.expiresAt,
    this.createdAt,
    this.paidAt,
  });

  final int id;
  final int planId;
  final int userId;
  final int venueId;
  final String? planTitle;
  final String? planType;
  final String? venueName;
  final int amount;
  final String status; // pending|paid|cancelled
  final String? transactionId;
  final String? cardPan;
  final int? sessionsRemaining;
  final DateTime? startsAt;
  final DateTime? expiresAt;
  final DateTime? createdAt;
  final DateTime? paidAt;

  String get typeLabelFa => switch (planType) {
        'session' => 'جلسه‌ای',
        'sessions_pack' => 'پک جلسه‌ای',
        'monthly' => 'ماهانه',
        _ => planType ?? '',
      };

  factory MembershipPurchase.fromJson(Map<String, dynamic> json) =>
      MembershipPurchase(
        id: (json['id'] as num).toInt(),
        planId: (json['plan_id'] as num?)?.toInt() ?? 0,
        userId: (json['user_id'] as num?)?.toInt() ?? 0,
        venueId: (json['venue_id'] as num?)?.toInt() ?? 0,
        planTitle: json['plan_title'] as String?,
        planType: json['plan_type'] as String?,
        venueName: json['venue_name'] as String?,
        amount: (json['amount'] as num?)?.toInt() ?? 0,
        status: (json['status'] ?? 'pending') as String,
        transactionId: json['transaction_id'] as String?,
        cardPan: json['card_pan'] as String?,
        sessionsRemaining: (json['sessions_remaining'] as num?)?.toInt(),
        startsAt: json['starts_at'] == null
            ? null
            : DateTime.tryParse(json['starts_at'] as String),
        expiresAt: json['expires_at'] == null
            ? null
            : DateTime.tryParse(json['expires_at'] as String),
        createdAt: json['created_at'] == null
            ? null
            : DateTime.tryParse(json['created_at'] as String),
        paidAt: json['paid_at'] == null
            ? null
            : DateTime.tryParse(json['paid_at'] as String),
      );
}
