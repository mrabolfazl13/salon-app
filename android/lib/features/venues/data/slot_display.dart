import '../../../core/utils/formatters.dart';
import '../../slots/domain/slot.dart';

/// UI-shaped slot used across venue detail & manager dashboard.
class DisplaySlot {
  const DisplaySlot({
    required this.id,
    required this.date,
    required this.duration,
    required this.startTime,
    required this.endTime,
    required this.price,
    required this.available,
  });

  final int id;
  final String date;
  final int duration;
  final String startTime;
  final String endTime;
  final int price;
  final bool available;
}

DisplaySlot displaySlotFrom(Slot slot) => DisplaySlot(
      id: slot.id,
      date: slot.slotDate,
      duration: slot.duration,
      startTime: formatTimeRaw(slot.startTime),
      endTime: slotEndTime(slot.startTime, slot.duration),
      price: slot.currentPrice != 0 ? slot.currentPrice : slot.basePrice,
      available: slot.isAvailable,
    );
