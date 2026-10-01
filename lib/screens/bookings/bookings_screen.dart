import 'package:flutter/material.dart';
import '../../core/models/booking.dart';

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> {
  final List<Booking> _bookings = [
    Booking(
      id: 1,
      venueId: 1,
      venueName: 'سالن فوتسال قهرمان',
      date: DateTime.now().add(const Duration(days: 2)),
      timeSlot: '18:00 - 19:30',
      price: 500000,
      status: 'confirmed',
      checkInCode: 'ABC123',
    ),
    Booking(
      id: 2,
      venueId: 2,
      venueName: 'سالن ورزشی اسپرت',
      date: DateTime.now().add(const Duration(days: 5)),
      timeSlot: '20:00 - 21:30',
      price: 450000,
      status: 'pending',
    ),
  ];

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0)} ریال';
  }

  String _formatDate(DateTime date) {
    final months = [
      'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
      'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'confirmed':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'confirmed':
        return 'تأیید شده';
      case 'pending':
        return 'در انتظار تأیید';
      case 'cancelled':
        return 'لغو شده';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('رزروهای من'),
      ),
      body: _bookings.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.event_busy,
                    size: 64,
                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'هنوز رزروی ندارید',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'اولین رزرو خود را ثبت کنید',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _bookings.length,
              itemBuilder: (context, index) {
                final booking = _bookings[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Venue name and status
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                booking.venueName,
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: _getStatusColor(booking.status).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                _getStatusText(booking.status),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: _getStatusColor(booking.status),
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Date and time
                        Row(
                          children: [
                            Icon(Icons.calendar_today, size: 16),
                            const SizedBox(width: 8),
                            Text(_formatDate(booking.date)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(Icons.access_time, size: 16),
                            const SizedBox(width: 8),
                            Text(booking.timeSlot),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Price
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'مبلغ:',
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                              ),
                            ),
                            Text(
                              _formatPrice(booking.price),
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: Theme.of(context).colorScheme.primary,
                                  ),
                            ),
                          ],
                        ),

                        // Check-in code if available
                        if (booking.checkInCode != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.secondary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.qr_code,
                                  color: Theme.of(context).colorScheme.secondary,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  'کد چک‌این: ${booking.checkInCode}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Theme.of(context).colorScheme.secondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
