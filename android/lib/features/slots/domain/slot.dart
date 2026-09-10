/// Time slot model — mirrors backend SlotResponse.
class Slot {
  const Slot({
    required this.id,
    required this.venueId,
    required this.slotDate,
    required this.startTime,
    required this.duration,
    required this.basePrice,
    required this.currentPrice,
    required this.status,
    this.isCompetitionEnabled = false,
  });

  final int id;
  final int venueId;
  final String slotDate; // yyyy-MM-dd
  final String startTime; // HH:MM[:SS]
  final int duration; // minutes
  final int basePrice;
  final int currentPrice;
  final String status; // available|booked|blocked|in_competition
  final bool isCompetitionEnabled;

  bool get isAvailable => status == 'available';

  factory Slot.fromJson(Map<String, dynamic> json) => Slot(
        id: (json['id'] as num).toInt(),
        venueId: (json['venue_id'] as num?)?.toInt() ?? 0,
        slotDate: (json['slot_date'] ?? '') as String,
        startTime: (json['start_time'] ?? '') as String,
        duration: (json['duration'] as num?)?.toInt() ?? 90,
        basePrice: (json['base_price'] as num?)?.toInt() ?? 0,
        currentPrice: (json['current_price'] as num?)?.toInt() ?? 0,
        status: (json['status'] ?? 'available') as String,
        isCompetitionEnabled: (json['is_competition_enabled'] ?? false) as bool,
      );
}
