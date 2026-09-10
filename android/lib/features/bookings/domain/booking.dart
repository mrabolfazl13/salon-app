/// Booking model — mirrors BookingResponse / PendingBookingResponse.
class Booking {
  const Booking({
    required this.id,
    required this.slotId,
    required this.userId,
    required this.bookedAt,
    required this.status,
    required this.paymentAmount,
    this.isPendingRedis = false,
    this.venueName,
    this.slotDate,
    this.startTime,
    this.duration,
    this.payment,
  });

  /// Numeric DB id or Redis UUID string (pending bookings).
  final dynamic id;
  final int slotId;
  final int userId;
  final DateTime? bookedAt;
  final String status; // pending|confirmed|cancelled|completed
  final int paymentAmount;
  final bool isPendingRedis;
  final String? venueName;
  final String? slotDate;
  final String? startTime;
  final int? duration;
  final Payment? payment;

  String get idString => id.toString();

  factory Booking.fromJson(Map<String, dynamic> json) => Booking(
        id: json['id'],
        slotId: (json['slot_id'] as num?)?.toInt() ?? 0,
        userId: (json['user_id'] as num?)?.toInt() ?? 0,
        bookedAt: json['booked_at'] == null
            ? null
            : DateTime.tryParse(json['booked_at'] as String),
        status: (json['status'] ?? 'pending') as String,
        paymentAmount: (json['payment_amount'] as num?)?.toInt() ?? 0,
        venueName: json['venue_name'] as String?,
        slotDate: json['slot_date'] as String?,
        startTime: json['start_time'] as String?,
        duration: (json['duration'] as num?)?.toInt(),
        payment: json['payment'] is Map<String, dynamic>
            ? Payment.fromJson(json['payment'] as Map<String, dynamic>)
            : null,
      );

  Booking withPendingFlag() => Booking(
        id: id,
        slotId: slotId,
        userId: userId,
        bookedAt: bookedAt,
        status: status,
        paymentAmount: paymentAmount,
        isPendingRedis: true,
        venueName: venueName,
        slotDate: slotDate,
        startTime: startTime,
        duration: duration,
        payment: payment,
      );
}

/// Payment invoice model — mirrors PaymentResponse.
class Payment {
  const Payment({
    required this.id,
    required this.bookingId,
    required this.userId,
    required this.amount,
    required this.status,
    required this.gateway,
    this.authority,
    this.transactionId,
    this.cardPan,
    this.createdAt,
    this.paidAt,
  });

  final int id;
  final int bookingId;
  final int userId;
  final int amount;
  final String status; // pending|paid|failed|refunded
  final String gateway;
  final String? authority;
  final String? transactionId;
  final String? cardPan;
  final DateTime? createdAt;
  final DateTime? paidAt;

  factory Payment.fromJson(Map<String, dynamic> json) => Payment(
        id: (json['id'] as num).toInt(),
        bookingId: (json['booking_id'] as num?)?.toInt() ?? 0,
        userId: (json['user_id'] as num?)?.toInt() ?? 0,
        amount: (json['amount'] as num?)?.toInt() ?? 0,
        status: (json['status'] ?? 'pending') as String,
        gateway: (json['gateway'] ?? '') as String,
        authority: json['authority'] as String?,
        transactionId: json['transaction_id'] as String?,
        cardPan: json['card_pan'] as String?,
        createdAt: json['created_at'] == null
            ? null
            : DateTime.tryParse(json['created_at'] as String),
        paidAt: json['paid_at'] == null
            ? null
            : DateTime.tryParse(json['paid_at'] as String),
      );
}
