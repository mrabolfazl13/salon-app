/// Competition (price bidding) + contract + review models.
class Competition {
  const Competition({
    required this.id,
    required this.slotId,
    required this.venueId,
    required this.offeredPrice,
    required this.status,
    required this.expiresAt,
    this.createdAt,
  });

  final int id;
  final int slotId;
  final int venueId;
  final int offeredPrice;
  final String status; // active|won|lcost|expired
  final DateTime expiresAt;
  final DateTime? createdAt;

  factory Competition.fromJson(Map<String, dynamic> json) => Competition(
        id: (json['id'] as num).toInt(),
        slotId: (json['slot_id'] as num?)?.toInt() ?? 0,
        venueId: (json['venue_id'] as num?)?.toInt() ?? 0,
        offeredPrice: (json['offered_price'] as num?)?.toInt() ?? 0,
        status: (json['status'] ?? 'active') as String,
        expiresAt: DateTime.tryParse(json['expires_at'] as String? ?? '') ??
            DateTime.now().add(const Duration(days: 1)),
        createdAt: json['created_at'] == null
            ? null
            : DateTime.tryParse(json['created_at'] as String),
      );
}

enum Recurrence { weekly, biweekly, monthly }

Recurrence recurrenceFrom(String? raw) => switch (raw) {
      'biweekly' => Recurrence.biweekly,
      'monthly' => Recurrence.monthly,
      _ => Recurrence.weekly,
    };

extension RecurrenceX on Recurrence {
  String get wire => switch (this) {
        Recurrence.weekly => 'weekly',
        Recurrence.biweekly => 'biweekly',
        Recurrence.monthly => 'monthly',
      };

  String get labelFa => switch (this) {
        Recurrence.weekly => 'هفتگی',
        Recurrence.biweekly => 'دو هفته یکبار',
        Recurrence.monthly => 'ماهانه',
      };
}

class Contract {
  const Contract({
    required this.id,
    required this.venueId,
    required this.startDate,
    required this.endDate,
    required this.dayOfWeek,
    required this.startTime,
    required this.recurrence,
    required this.originalPrice,
    required this.discountedPrice,
    required this.totalAmcount,
    required this.status,
    this.description,
  });

  final int id;
  final int venueId;
  final String startDate;
  final String endDate;
  final int dayOfWeek; // Python weekday: 0=Monday … 6=Sunday
  final String startTime;
  final Recurrence recurrence;
  final int originalPrice;
  final int discountedPrice;
  final int totalAmcount;
  final String status; // active|expired|cancelled
  final String? description;

  String get statusFa => switch (status) {
        'active' => 'فعال',
        'expired' => 'منقضی',
        'cancelled' => 'لغو شده',
        _ => 'فعال',
      };

  factory Contract.fromJson(Map<String, dynamic> json) => Contract(
        id: (json['id'] as num).toInt(),
        venueId: (json['venue_id'] as num?)?.toInt() ?? 0,
        startDate: (json['start_date'] ?? '') as String,
        endDate: (json['end_date'] ?? '') as String,
        dayOfWeek: (json['day_of_week'] as num?)?.toInt() ?? 0,
        startTime: (json['start_time'] ?? '') as String,
        recurrence: recurrenceFrom(json['recurrence'] as String?),
        originalPrice: (json['original_price'] as num?)?.toInt() ?? 0,
        discountedPrice: (json['discounted_price'] as num?)?.toInt() ?? 0,
        totalAmcount: (json['total_amount'] as num?)?.toInt() ?? 0,
        status: (json['status'] ?? 'active') as String,
        description: json['description'] as String?,
      );
}

class Review {
  const Review({
    required this.id,
    required this.venueId,
    required this.userId,
    required this.rating,
    this.comment,
    this.createdAt,
    this.userName,
  });

  final int id;
  final int venueId;
  final int userId;
  final int rating;
  final String? comment;
  final DateTime? createdAt;
  final String? userName;

  factory Review.fromJson(Map<String, dynamic> json) => Review(
        id: (json['id'] as num).toInt(),
        venueId: (json['venue_id'] as num?)?.toInt() ?? 0,
        userId: (json['user_id'] as num?)?.toInt() ?? 0,
        rating: (json['rating'] as num?)?.toInt() ?? 0,
        comment: json['comment'] as String?,
        createdAt: json['created_at'] == null
            ? null
            : DateTime.tryParse(json['created_at'] as String),
        userName: json['user_name'] as String?,
      );
}

class VenueRatingSummary {
  const VenueRatingSummary({
    required this.venueId,
    required this.averageRating,
    required this.totalReviews,
  });

  final int venueId;
  final num averageRating;
  final int totalReviews;

  factory VenueRatingSummary.fromJson(Map<String, dynamic> json) =>
      VenueRatingSummary(
        venueId: (json['venue_id'] as num?)?.toInt() ?? 0,
        averageRating: json['average_rating'] as num? ?? 0,
        totalReviews: (json['total_reviews'] as num?)?.toInt() ?? 0,
      );
}
