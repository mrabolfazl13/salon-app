class Booking {
  final int id;
  final int venueId;
  final String venueName;
  final DateTime date;
  final String timeSlot;
  final double price;
  final String status;
  final String? checkInCode;

  Booking({
    required this.id,
    required this.venueId,
    required this.venueName,
    required this.date,
    required this.timeSlot,
    required this.price,
    required this.status,
    this.checkInCode,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'] ?? 0,
      venueId: json['venue_id'] ?? 0,
      venueName: json['venue_name'] ?? '',
      date: DateTime.parse(json['date'] ?? DateTime.now().toIso8601String()),
      timeSlot: json['time_slot'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      status: json['status'] ?? 'pending',
      checkInCode: json['check_in_code'],
    );
  }
}
