class Venue {
  final int id;
  final String name;
  final String address;
  final String? phone;
  final bool isVerified;
  final double price;
  final List<String> amenities;
  final String? category;
  final String? description;
  final List<String>? images;
  final double? latitude;
  final double? longitude;

  Venue({
    required this.id,
    required this.name,
    required this.address,
    this.phone,
    this.isVerified = false,
    required this.price,
    this.amenities = const [],
    this.category,
    this.description,
    this.images,
    this.latitude,
    this.longitude,
  });

  factory Venue.fromJson(Map<String, dynamic> json) {
    return Venue(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      phone: json['phone'],
      isVerified: json['is_verified'] ?? false,
      price: (json['price'] ?? 0).toDouble(),
      amenities: json['amenities'] != null
          ? List<String>.from(json['amenities'])
          : [],
      category: json['category'],
      description: json['description'],
      images: json['images'] != null
          ? List<String>.from(json['images'])
          : [],
      latitude: json['latitude']?.toDouble(),
      longitude: json['longitude']?.toDouble(),
    );
  }
}
