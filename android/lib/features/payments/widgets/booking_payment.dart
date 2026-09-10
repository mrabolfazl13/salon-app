import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/formatters.dart';
import '../../bookings/domain/booking.dart';
import '../../bookings/providers/bookings_provider.dart';
import 'card_payment_sheet.dart';

/// Opens the mock gateway for a booking payment.
Future<void> showCardPaymentSheetForBooking(
  BuildContext context,
  Booking booking,
  VoidCallback onDone,
) async {
  final container = ProviderScope.containerOf(context);
  await showCardPaymentSheet(
    context,
    title: 'درگاه پرداخت',
    summaryRows: [
      ('سالن', booking.venueName ?? 'رزرو #${booking.idString}'),
      if (booking.slotDate != null)
        (
          'زمان',
          '${formatDateNumeric(booking.slotDate)} — ${formatTimeRaw(booking.startTime)}'
        ),
    ],
    amount: booking.paymentAmount,
    createInvoice: () async {
      final payment =
          await container.read(paymentsServiceProvider).create(booking.id as int);
      return (id: payment.id, amount: payment.amount);
    },
    pay: (id, card) async {
      final payment = await container.read(paymentsServiceProvider).pay(
            id,
            cardNumber: card.cardNumber,
            cvv: card.cvv,
            month: card.month,
            year: card.year,
          );
      return payment;
    },
    onSuccess: (_) => onDone(),
  );
}
