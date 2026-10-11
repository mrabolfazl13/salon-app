import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/admin_service.dart';
import '../../../core/utils/fa_format.dart';

class AdminVenuesScreen extends ConsumerStatefulWidget {
  const AdminVenuesScreen({super.key});

  @override
  ConsumerState<AdminVenuesScreen> createState() => _AdminVenuesScreenState();
}

class _AdminVenuesScreenState extends ConsumerState<AdminVenuesScreen> {
  List<dynamic> _pending = [];
  bool _loading = true;
  bool _acting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final venues = await AdminService.getPendingVenues();
      if (!mounted) return;
      setState(() {
        _pending = venues;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _verify(Map<String, dynamic> venue) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تأیید سالن'),
        content:
            Text('«${venue['name'] ?? 'سالن'}» تأیید شود و در فهرست عمومی منتشر گردد؟'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('انصراف')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success, foregroundColor: Colors.white),
            child: const Text('تأیید'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _acting = true);
    try {
      await AdminService.verifyVenue(venue['id'].toString());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('سالن تأیید شد'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ));
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('خطا: $e'),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ));
    } finally {
      if (mounted) setState(() => _acting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('سالن‌های در انتظار تأیید')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: AppSpacing.md),
                        ElevatedButton(
                            onPressed: _load, child: const Text('تلاش دوباره')),
                      ],
                    ),
                  ),
                )
              : _pending.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.verified_outlined,
                              size: 56, color: AppColors.success),
                          SizedBox(height: AppSpacing.md),
                          Text('همه سالن‌ها تأیید شده‌اند'),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(AppSpacing.lg),
                        itemCount: _pending.length,
                        itemBuilder: (context, index) =>
                            _buildVenueCard(context, _pending[index]),
                      ),
                    ),
    );
  }

  Widget _buildVenueCard(BuildContext context, Map<String, dynamic> venue) {
    final name = venue['name']?.toString() ?? 'سالن';
    final address = venue['address']?.toString() ?? '';
    final phone = venue['phone']?.toString() ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark
            ? AppColors.darkSurface
            : Colors.white,
        borderRadius: AppRadius.cardBorderRadius,
        border: Border.all(color: AppColors.warning.withOpacity(0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                      colors: [AppColors.navy, AppColors.blue]),
                  borderRadius: AppRadius.imageBorderRadius,
                ),
                child:
                    const Icon(Icons.store, color: Colors.white),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                        style: AppTypography.bodyMedium
                            .copyWith(fontWeight: FontWeight.w700)),
                    if (address.isNotEmpty) Text(address, style: AppTypography.caption),
                    if (phone.isNotEmpty) Text(phone, style: AppTypography.caption),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed:
                      _acting ? null : () => context.push('/venues/${venue['id']}'),
                  child: const Text('مشاهده'),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: ElevatedButton(
                  onPressed: _acting ? null : () => _verify(venue),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.success,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('تأیید سالن'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
