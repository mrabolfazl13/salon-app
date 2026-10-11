import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/booking_service.dart';
import '../../../core/network/game_service.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/utils/jalali.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';

class GameCreateScreen extends ConsumerStatefulWidget {
  const GameCreateScreen({super.key});

  @override
  ConsumerState<GameCreateScreen> createState() => _GameCreateScreenState();
}

class _GameCreateScreenState extends ConsumerState<GameCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();

  List<dynamic> _confirmedBookings = [];
  String? _selectedBookingId;
  int _maxPlayers = 10;
  String _skillLevel = 'intermediate';
  String _visibility = 'public';
  String _paymentMode = 'split_payment';
  bool _loading = true;
  bool _submitting = false;
  String? _error;

  static const _skills = <String, String>{
    'beginner': 'مبتدی',
    'intermediate': 'متوسط',
    'advanced': 'پیشرفته',
    'pro': 'حرفه‌ای',
  };

  static const _visibilities = <String, String>{
    'public': 'عمومی — پیوستن آزاد',
    'public_approval': 'عمومی — با تأیید من',
    'private': 'خصوصی — فقط دعوت‌شده‌ها',
  };

  static const _paymentModes = <String, String>{
    'split_payment': 'تقسیم هزینه بین بازیکنان',
    'organizer_pays': 'خودم می‌پردازم',
    'free': 'رایگان',
  };

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
      final bookings = await BookingService.getBookings();
      final confirmed = bookings
          .where((b) => (b['status'] ?? '').toString() == 'confirmed')
          .toList();
      if (!mounted) return;
      setState(() {
        _confirmedBookings = confirmed;
        if (confirmed.isNotEmpty) {
          _selectedBookingId = confirmed.first['id'].toString();
        }
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

  String _bookingLabel(Map<String, dynamic> b) {
    final venue = b['venue_name']?.toString() ?? 'سالن';
    final date = (b['slot_date_persian'] ?? b['slot_date'])?.toString();
    final dateFa = date != null ? JalaliDate.formatIsoDate(date) : '';
    final time = b['start_time']?.toString();
    final timeFa = time != null ? FaFormat.time(time) : '';
    return '$venue — $dateFa $timeFa';
  }

  Future<void> _submit() async {
    if (_selectedBookingId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('اول یک سانس رزرو تأییدشده لازم است'),
        backgroundColor: AppColors.warning,
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    try {
      final game = await GameService.createGame(
        bookingId: _selectedBookingId!,
        name: _nameController.text.trim(),
        description: _descriptionController.text.trim(),
        maxPlayers: _maxPlayers,
        skillLevel: _skillLevel,
        visibility: _visibility,
        paymentMode: _paymentMode,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('بازی ایجاد شد و در حال جذب بازیکن است'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ));
      final id = game['id']?.toString();
      if (id != null) {
        context.pushReplacement('/games/$id');
      } else {
        context.pop();
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('خطا: $e'),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ));
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            title: Text('ایجاد بازی جدید',
                style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: _loading
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(AppSpacing.xl),
                        child: CircularProgressIndicator(),
                      ),
                    )
                  : _error != null
                      ? Center(
                          child: Column(
                            children: [
                              Text(_error!, textAlign: TextAlign.center),
                              const SizedBox(height: AppSpacing.md),
                              ElevatedButton(
                                  onPressed: _load, child: const Text('تلاش دوباره')),
                            ],
                          ),
                        )
                      : _confirmedBookings.isEmpty
                          ? _buildNoBookings(context)
                          : _buildForm(context),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNoBookings(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: AppSpacing.xl),
        Icon(Icons.event_busy, size: 56, color: Colors.grey[400]),
        const SizedBox(height: AppSpacing.md),
        Text(
          'بازی گروهی روی یک سانس رزرو تأییدشده ساخته می‌شود.\nهنوز رزرو تأییدشده‌ای نداری.',
          textAlign: TextAlign.center,
          style: AppTypography.bodyMedium,
        ),
        const SizedBox(height: AppSpacing.lg),
        AppButton(
          text: 'رزرو سالن',
          onPressed: () => context.push('/venues'),
          gradient: true,
        ),
      ],
    );
  }

  Widget _buildForm(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColors.blue.withOpacity(0.06),
              borderRadius: AppRadius.cardBorderRadius,
              border: Border.all(color: AppColors.blue.withOpacity(0.2)),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline, size: 20, color: AppColors.blue),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    'بازی روی سانس رزروشدهٔ شما ساخته می‌شود و بقیه می‌توانند در آن شرکت کنند.',
                    style: AppTypography.caption.copyWith(color: AppColors.blue),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          DropdownButtonFormField<String>(
            value: _selectedBookingId,
            decoration: InputDecoration(
              labelText: 'سانس رزرو تأییدشده',
              filled: true,
              fillColor: Theme.of(context).brightness == Brightness.dark
                  ? AppColors.darkSurface
                  : Colors.grey[50],
              border: OutlineInputBorder(
                  borderRadius: AppRadius.mediumBorderRadius,
                  borderSide: BorderSide(color: Theme.of(context).dividerColor)),
            ),
            items: _confirmedBookings
                .map((b) => DropdownMenuItem(
                      value: b['id'].toString(),
                      child: Text(_bookingLabel(b),
                          overflow: TextOverflow.ellipsis),
                    ))
                .toList(),
            onChanged: (v) => setState(() => _selectedBookingId = v),
            validator: (v) => v == null ? 'سانس را انتخاب کنید' : null,
          ),
          const SizedBox(height: AppSpacing.md),
          AppTextField(
            controller: _nameController,
            label: 'نام بازی',
            hintText: 'مثلاً: بازی دوستانه پنج‌شنبه‌ها',
            prefixIcon: Icons.sports_soccer,
            validator: (value) {
              if (value == null || value.trim().length < 3) {
                return 'نام بازی حداقل ۳ حرف باشد';
              }
              if (value.trim().length > 100) return 'نام بازی حداکثر ۱۰۰ حرف';
              return null;
            },
          ),
          const SizedBox(height: AppSpacing.md),
          AppTextField(
            controller: _descriptionController,
            label: 'توضیحات (اختیاری)',
            hintText: 'جزئیات بازی برای شرکت‌کننده‌ها',
            maxLines: 3,
          ),
          const SizedBox(height: AppSpacing.md),
          Text('حداکثر بازیکنان: ${FaFormat.faNum(_maxPlayers)} نفر',
              style: AppTypography.bodyMedium
                  .copyWith(fontWeight: FontWeight.w600)),
          Slider(
            value: _maxPlayers.toDouble(),
            min: 2,
            max: 22,
            divisions: 20,
            label: FaFormat.faNum(_maxPlayers),
            activeColor: AppColors.blue,
            onChanged: (value) => setState(() => _maxPlayers = value.toInt()),
          ),
          const SizedBox(height: AppSpacing.xs),
          _buildDropdown(
            label: 'سطح بازی',
            value: _skillLevel,
            items: _skills,
            onChanged: (v) => setState(() => _skillLevel = v ?? 'intermediate'),
          ),
          const SizedBox(height: AppSpacing.md),
          _buildDropdown(
            label: 'چه کسی می‌تواند بپیوندد؟',
            value: _visibility,
            items: _visibilities,
            onChanged: (v) => setState(() => _visibility = v ?? 'public'),
          ),
          const SizedBox(height: AppSpacing.md),
          _buildDropdown(
            label: 'حالت پرداخت',
            value: _paymentMode,
            items: _paymentModes,
            onChanged: (v) => setState(() => _paymentMode = v ?? 'split_payment'),
          ),
          const SizedBox(height: AppSpacing.xl),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: AppButton(
              text: 'ایجاد بازی',
              onPressed: _submitting ? () {} : _submit,
              gradient: true,
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
        ],
      ),
    );
  }

  Widget _buildDropdown({
    required String label,
    required String value,
    required Map<String, String> items,
    required void Function(String?) onChanged,
  }) {
    return DropdownButtonFormField<String>(
      value: value,
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: Theme.of(context).brightness == Brightness.dark
            ? AppColors.darkSurface
            : Colors.grey[50],
        border: OutlineInputBorder(
            borderRadius: AppRadius.mediumBorderRadius,
            borderSide: BorderSide(color: Theme.of(context).dividerColor)),
      ),
      items: items.entries
          .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
          .toList(),
      onChanged: onChanged,
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }
}
