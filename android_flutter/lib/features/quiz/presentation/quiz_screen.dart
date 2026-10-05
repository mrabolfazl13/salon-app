import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/widgets/app_button.dart';

class QuizScreen extends ConsumerStatefulWidget {
  const QuizScreen({super.key});

  @override
  ConsumerState<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends ConsumerState<QuizScreen> {
  int _currentQuestion = 0;
  int _score = 0;
  bool _showResult = false;

  final List<Map<String, dynamic>> _questions = [
    {
      'question': 'بهترین زمان برای رزرو سالن فوتسال چه موقع است؟',
      'options': ['صبح زود', 'بعدازظهر', 'شب', 'فرقی ندارد'],
      'correct': 1,
    },
    {
      'question': 'تعداد بازیکنان هر تیم در فوتسال چند نفر است؟',
      'options': ['۵ نفر', '۶ نفر', '۷ نفر', '۱۱ نفر'],
      'correct': 0,
    },
    {
      'question': 'مدت زمان استاندارد یک بازی فوتسال چقدر است؟',
      'options': ['۳۰ دقیقه', '۴۰ دقیقه', '۶۰ دقیقه', '۹۰ دقیقه'],
      'correct': 1,
    },
  ];

  void _answerQuestion(int answerIndex) {
    if (answerIndex == _questions[_currentQuestion]['correct']) {
      setState(() => _score++);
    }
    
    if (_currentQuestion < _questions.length - 1) {
      setState(() => _currentQuestion++);
    } else {
      setState(() => _showResult = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('آزمون فوتسال', style: AppTypography.h5.copyWith(fontWeight: FontWeight.w700)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                    decoration: BoxDecoration(
                      color: AppColors.blue.withOpacity(0.1),
                      borderRadius: AppRadius.chipBorderRadius,
                    ),
                    child: Text(
                      '${_currentQuestion + 1}/${_questions.length}',
                      style: AppTypography.bodyMedium.copyWith(color: AppColors.blue, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xl),

              if (!_showResult) ...[
                // Question card
                Expanded(
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    decoration: BoxDecoration(
                      color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkSurface : Colors.white,
                      borderRadius: AppRadius.cardBorderRadius,
                      border: Border.all(color: Theme.of(context).dividerColor),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.quiz, size: 48, color: AppColors.blue),
                        const SizedBox(height: AppSpacing.lg),
                        Text(
                          _questions[_currentQuestion]['question'],
                          style: AppTypography.h6.copyWith(fontWeight: FontWeight.w600),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),

                // Answer options
                ...List.generate(
                  _questions[_currentQuestion]['options'].length,
                  (index) => Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.md),
                    child: AppButton(
                      text: _questions[_currentQuestion]['options'][index],
                      onPressed: () => _answerQuestion(index),
                      outlined: true,
                    ),
                  ),
                ),
              ] else ...[
                // Results
                Expanded(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          _score >= 2 ? Icons.emoji_events : Icons.check_circle,
                          size: 64,
                          color: _score >= 2 ? AppColors.amber : AppColors.success,
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        Text('نتیجه آزمون', style: AppTypography.h5.copyWith(fontWeight: FontWeight.w700)),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          '$_score از ${_questions.length} پاسخ صحیح',
                          style: AppTypography.h6.copyWith(color: AppColors.blue),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(
                          _score >= 2 ? 'عالی بود! 🎉' : 'بیشتر تمرین کن!',
                          style: AppTypography.bodyLarge,
                        ),
                      ],
                    ),
                  ),
                ),
                AppButton(
                  text: 'شروع مجدد',
                  onPressed: () {
                    setState(() {
                      _currentQuestion = 0;
                      _score = 0;
                      _showResult = false;
                    });
                  },
                  gradient: true,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
