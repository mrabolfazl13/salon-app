import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';

class GameCreateScreen extends ConsumerStatefulWidget {
  const GameCreateScreen({super.key});

  @override
  ConsumerState<GameCreateScreen> createState() => _GameCreateScreenState();
}

class _GameCreateScreenState extends ConsumerState<GameCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  String _selectedVenue = '';
  String _selectedDate = '';
  String _selectedTime = '';
  String _selectedLevel = 'متوسط';
  int _maxPlayers = 10;

  Future<void> _handleCreate() async {
    if (!_formKey.currentState!.validate()) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('بازی با موفقیت ایجاد شد'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ),
    );
    
    if (mounted) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            title: Text('ایجاد بازی جدید', style: AppTypography.h6.copyWith(fontWeight: FontWeight.w700)),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AppTextField(
                      controller: _titleController,
                      label: 'عنوان بازی',
                      hintText: 'مثلاً: بازی دوستانه',
                      prefixIcon: Icons.title,
                      validator: (value) {
                        if (value == null || value.isEmpty) return 'لطفاً عنوان را وارد کنید';
                        return null;
                      },
                    ),
                    const SizedBox(height: AppSpacing.md),
                    
                    _buildDropdownField(
                      label: 'سالن',
                      value: _selectedVenue,
                      items: ['سالن المپیک', 'باشگاه قهرمان', 'سالن ستاره'],
                      onChanged: (value) => setState(() => _selectedVenue = value ?? ''),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    
                    Row(
                      children: [
                        Expanded(
                          child: _buildDropdownField(
                            label: 'تاریخ',
                            value: _selectedDate,
                            items: ['امروز', 'فردا', '۱۴۰۳/۰۹/۲۰'],
                            onChanged: (value) => setState(() => _selectedDate = value ?? ''),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: _buildDropdownField(
                            label: 'ساعت',
                            value: _selectedTime,
                            items: ['۱۶:۰۰', '۱۸:۰۰', '۲۰:۰۰'],
                            onChanged: (value) => setState(() => _selectedTime = value ?? ''),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                    
                    _buildDropdownField(
                      label: 'سطح بازی',
                      value: _selectedLevel,
                      items: ['مبتدی', 'متوسط', 'حرفه‌ای'],
                      onChanged: (value) => setState(() => _selectedLevel = value ?? ''),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    
                    Text('حداکثر بازیکنان: $_maxPlayers', style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
                    Slider(
                      value: _maxPlayers.toDouble(),
                      min: 4,
                      max: 20,
                      divisions: 16,
                      label: '$_maxPlayers',
                      onChanged: (value) => setState(() => _maxPlayers = value.toInt()),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    
                    AppButton(text: 'ایجاد بازی', onPressed: _handleCreate, gradient: true),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String value,
    required List<String> items,
    required void Function(String?) onChanged,
  }) {
    return DropdownButtonFormField<String>(
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: Theme.of(context).brightness == Brightness.dark ? AppColors.darkSurface : Colors.grey[50],
        border: OutlineInputBorder(borderRadius: AppRadius.mediumBorderRadius, borderSide: BorderSide(color: Theme.of(context).dividerColor)),
      ),
      value: value.isEmpty ? null : value,
      items: items.map((item) => DropdownMenuItem(value: item, child: Text(item))).toList(),
      onChanged: onChanged,
      validator: (value) {
        if (value == null || value.isEmpty) return 'لطفاً $label را انتخاب کنید';
        return null;
      },
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }
}
