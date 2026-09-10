import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../payments/data/payment_service.dart';
import '../data/booking_service.dart';
import '../domain/booking.dart';

final bookingsServiceProvider = Provider<BookingService>((ref) {
  return BookingService(ref.read(apiClientProvider));
});

final paymentsServiceProvider = Provider<PaymentService>((ref) {
  return PaymentService(ref.read(apiClientProvider));
});

enum BookingsFilter { all, confirmed, pending, cancelled, completed }

class BookingsState {
  const BookingsState({
    this.bookings = const [],
    this.pending = const [],
    this.payments = const [],
    this.loading = true,
    this.error = false,
  });

  final List<Booking> bookings;
  final List<Booking> pending;
  final List<Payment> payments;
  final bool loading;
  final bool error;

  /// Merged list: Redis-pending first (like the original merged array).
  List<Booking> get merged => [...pending, ...bookings];

  List<Booking> filtered(BookingsFilter filter) => switch (filter) {
        BookingsFilter.all => merged,
        BookingsFilter.pending => pending,
        _ => bookings.where((b) => b.status == filter.name).toList(),
      };

  /// Booking ids with a successful payment.
  Set<String> get paidBookingIds => {
        for (final p in payments)
          if (p.status == 'paid') p.bookingId.toString(),
      };

  /// Booking ids with refunded payments.
  Set<String> get refundedBookingIds => {
        for (final p in payments)
          if (p.status == 'refunded') p.bookingId.toString(),
      };

  BookingsState copyWith({
    List<Booking>? bookings,
    List<Booking>? pending,
    List<Payment>? payments,
    bool? loading,
    bool? error,
  }) =>
      BookingsState(
        bookings: bookings ?? this.bookings,
        pending: pending ?? this.pending,
        payments: payments ?? this.payments,
        loading: loading ?? this.loading,
        error: error ?? this.error,
      );
}

class BookingsController extends Notifier<BookingsState> {
  @override
  BookingsState build() => const BookingsState();

  Future<void> fetch() async {
    state = state.copyWith(loading: true, error: false);
    try {
      final service = ref.read(bookingsServiceProvider);
      final bookings = await service.getAll();
      final pending = await service.getMyPending().catchError((_) => <Booking>[]);
      final payments = await ref
          .read(paymentsServiceProvider)
          .getMy()
          .catchError((_) => <Payment>[]);
      state = state.copyWith(
        bookings: bookings,
        pending: pending,
        payments: payments,
        loading: false,
        error: false,
      );
    } catch (_) {
      state = state.copyWith(loading: false, error: true);
    }
  }

  Future<bool> cancel(Booking booking) async {
    try {
      final service = ref.read(bookingsServiceProvider);
      if (booking.isPendingRedis) {
        await service.cancelPending(booking.idString);
      } else {
        await service.cancel(booking.id as int);
      }
      await fetch();
      return true;
    } on ApiException {
      rethrow;
    }
  }

  /// Opens (or reuses) the invoice for a confirmed booking.
  Future<Payment> createInvoice(int bookingId) =>
      ref.read(paymentsServiceProvider).create(bookingId);
}

final bookingsProvider =
    NotifierProvider<BookingsController, BookingsState>(BookingsController.new);

/// Manager-side venue pending bookings + confirm/reject.
class ManagerBookingsController extends Notifier<List<Booking>> {
  @override
  List<Booking> build() => const [];

  Future<void> loadForVenues(List<int> venueIds) async {
    final service = ref.read(bookingsServiceProvider);
    final all = <Booking>[];
    for (final id in venueIds) {
      try {
        all.addAll(await service.getVenuePending(id));
      } catch (_) {
        // silent (original behavior)
      }
    }
    state = all;
  }

  Future<void> confirm(Booking pending) async {
    await ref
        .read(bookingsServiceProvider)
        .confirmPending(pending.idString);
  }

  Future<void> reject(Booking pending) async {
    await ref.read(bookingsServiceProvider).rejectPending(pending.idString);
  }
}

final managerPendingBookingsProvider =
    NotifierProvider<ManagerBookingsController, List<Booking>>(
  ManagerBookingsController.new,
);
