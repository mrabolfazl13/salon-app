import 'package:flutter/material.dart';
import '../../../core/network/waitlist_service.dart';
import '../../../core/utils/jalali.dart';
import '../../../app/theme/app_theme.dart';

class WaitlistScreen extends StatefulWidget {
  const WaitlistScreen({super.key});

  @override
  State<WaitlistScreen> createState() => _WaitlistScreenState();
}

class _WaitlistScreenState extends State<WaitlistScreen> {
  List<dynamic> _entries = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadWaitlist();
  }

  Future<void> _loadWaitlist() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await WaitlistService.getMyWaitlist();
      setState(() {
        _entries = data;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _leave(String slotId) async {
    try {
      await WaitlistService.leave(slotId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✓ از صف انتظار خارج شد')),
        );
        await _loadWaitlist();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطا: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('صف انتظارهای من')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _entries.isEmpty
                  ? const Center(child: Text('هنوز در صف انتظاری نیستید'))
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _entries.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, i) {
                        final entry = _entries[i];
                        final dateStr = entry['slot_date'] ?? '';
                        final timeStr = entry['start_time'] ?? '';
                        final jalaliDate = JalaliDate.formatIsoDate(dateStr);
                        final persianTime = _timeToPersian(timeStr);
                        final position = entry['position'] ?? 0;
                        final status = entry['status'] ?? '';
                        final venueName = entry['venue_name'] ?? '';

                        return Card(
                          child: ListTile(
                            title: Text('$venueName - $jalaliDate ساعت $persianTime'),
                            subtitle: Text('موقعیت: #$position | وضعیت: $status'),
                            trailing: ElevatedButton(
                              onPressed: () => _leave(entry['slot_id']),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red.shade100,
                                foregroundColor: Colors.red.shade900,
                              ),
                              child: const Text('خروج'),
                            ),
                          ),
                        );
                      },
                    ),
    );
  }

  String _timeToPersian(String time) {
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
