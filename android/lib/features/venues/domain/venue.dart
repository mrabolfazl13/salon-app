/// Venue model — mirrors the backend VenueResponse (snake_case fields kept).
class Venue {
  const Venue({
    required this.id,
    required this.name,
    required this.category,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.phone,
    this.description,
    required this.amenities,
    required this.images,
    required this.price,
    required this.isVerified,
    required this.managerId,
    this.clubId,
    this.createdAt,
    this.managerName,
    this.averageRating,
    this.totalReviews,
  });

  final int id;
  final String name;
  final String category; // futsal | gym
  final String address;
  final double latitude;
  final double longitude;
  final String? phone;
  final String? description;
  final List<String> amenities;
  final List<String> images;
  final int price;
  final bool isVerified;
  final int managerId;
  final int? clubId;
  final DateTime? createdAt;
  final String? managerName;
  final num? averageRating;
  final int? totalReviews;

  bool get isGym => category == 'gym';

  factory Venue.fromJson(Map<String, dynamic> json) => Venue(
        id: (json['id'] as num).toInt(),
        name: (json['name'] ?? '') as String,
        category: (json['category'] ?? 'futsal') as String,
        address: (json['address'] ?? '') as String,
        latitude: (json['latitude'] as num?)?.toDouble() ?? 0,
        longitude: (json['longitude'] as num?)?.toDouble() ?? 0,
        phone: json['phone'] as String?,
        description: json['description'] as String?,
        amenities: parseStringList(json['amenities']),
        images: parseStringList(json['images']),
        price: (json['price'] as num?)?.toInt() ?? 0,
        isVerified: (json['is_verified'] ?? false) as bool,
        managerId: (json['manager_id'] as num?)?.toInt() ?? 0,
        clubId: (json['club_id'] as num?)?.toInt(),
        createdAt: json['created_at'] == null
            ? null
            : DateTime.tryParse(json['created_at'] as String),
        managerName: json['manager_name'] as String?,
        averageRating: json['average_rating'] as num?,
        totalReviews: (json['total_reviews'] as num?)?.toInt(),
      );

  /// Backend may send JSON-as-string for list fields — parse defensively.
  static List<String> parseStringList(dynamic value) {
    if (value is List) {
      return value.map((e) => e.toString()).toList();
    }
    if (value is String && value.trim().isNotEmpty) {
      try {
        final decoded = value.replaceAll(RegExp(r'^\[|\]$'), '');
        if (decoded.isEmpty) return const [];
        return decoded
            .split(',')
            .map((e) => e.trim().replaceAll(RegExp(r'^"|"'), ''))
            .where((e) => e.isNotEmpty)
            .toList();
      } catch (_) {
        return const [];
      }
    }
    return const [];
  }
}
