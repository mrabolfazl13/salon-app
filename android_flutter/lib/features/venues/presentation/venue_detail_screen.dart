import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/waitlist_service.dart';
import '../../../core/utils/jalali.dart';
import '../../../app/theme/app_theme.dart';

class VenueDetailScreen extends ConsumerStatefulWidget {
  final String venueId;

  const VenueDetailScreen({super.key, required this.venueId});

  @override
  ConsumerState<VenueDetailScreen> createState() => _VenueDetailScreenState();
}

class _VenueDetailScreenState extends ConsumerState<VenueDetailScreen> {
  Map<String, dynamic>? _venue;
  List<dynamic> _slots = [];
  bool _loading = true;
  String? _error;
  final Set<String> _joiningSlots = {};

  @override
  void initState() {
    super.initState();
    _loadVenue();
  }

  Future<void> _loadVenue() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final client = ApiClient.instance;
      final resp = await client.get(ApiEndpoints.venue(widget.venueId));
      final slotsResp = await client.get(ApiEndpoints.venueSlots(widget.venueId));
      setState(() {
        _venue = resp.data;
        _slots = slotsResp.data is List ? slotsResp.data : [];
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _joinWaitlist(String slotId) async {
    if (_joiningSlots.contains(slotId)) return;
    setState(() => _joiningSlots.add(slotId));
    try {
      await WaitlistService.join(slotId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✓ به صف انتظار اضافه شد')),
        );
        await _loadVenue(); // refresh slots
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطا: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      setState(() => _joiningSlots.remove(slotId));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_venue?['name'] ?? 'جزئیات سالن')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _buildContent(),
    );
  }

  Widget _buildContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Venue info
          Text(
            _venue?['name'] ?? '',
            style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.bold),
          ),
          if (_venue?['address'] != null) ...[
            const SizedBox(height: 8),
            Text(_venue!['address'], style: AppTypography.bodyLarge),
          ],
          const Divider(height: 32),

          // Slots section
          Text('اسلات‌های موجود', style: AppTypography.titleLarge),
          const SizedBox(height: 12),
          if (_slots.isEmpty)
            const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('اسلاتی یافت نشد')))
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _slots.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, i) {
                final slot = _slots[i];
                final isBooked = slot['status'] == 'BOOKED';
                final dateStr = slot['slot_date'] ?? '';
                final timeStr = slot['start_time'] ?? '';
                final jalaliDate = JalaliDate.formatIsoDate(dateStr);
                final persianTime = JalaliDate._timeToPersian(timeStr);

                return Card(
                  child: ListTile(
                    title: Text('$jalaliDate - ساعت $persianTime'),
                    subtitle: Text('وضعیت: ${isBooked ? "رزرو شده" : "آزاد"}'),
                    trailing: isBooked
                        ? _joiningSlots.contains(slot['id'])
                            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2))
                            : ElevatedButton(
                                onPressed: () => _joinWaitlist(slot['id']),
                                child: const Text('صف انتظار'),
                              )
                        : const Icon(Icons.check_circle, color: Colors.green),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}

// Extension to access private method for time conversion
extension on JalaliDate {
  static String _timeToPersian(String time) {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    String toPersianDigits(String input) {
      return input.split('').map((c) {
        if (c.codeUnitAt(0) >= 48 && c.codeUnitAt(0) <= 57) {
          return persianDigits[c.codeUnitAt(0) - 48];
        }
        return c;
      }).join('');
    }
    final parts = time.split(':');
    if (parts.length >= 2) {
      return '${toPersianDigits(parts[0].padLeft(2, '0'))}:${toPersianDigits(parts[1].padLeft(2, '0'))}';
    }
    return time;
  }
}
