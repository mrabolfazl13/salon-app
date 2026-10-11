import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/quiz_service.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/bottom_nav_bar.dart';

class QuizScreen extends ConsumerStatefulWidget {
  const QuizScreen({super.key});

  @override
  ConsumerState<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends ConsumerState<QuizScreen> {
  bool _loading = true;
  String? _error;
  List<dynamic> _questions = [];
  int _pointsPerCorrect = 0;
  Map<String, dynamic>? _weekStatus;

  int _currentQuestion = 0;
  int _score = 0;
  int? _selectedAnswer;
  bool _checking = false;
  bool? _lastCorrect;
  bool _showResult = false;

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
      final data = await QuizService.getWeeklyQuestions();
      if (!mounted) return;
      setState(() {
        _questions = (data['questions'] ?? []) as List;
        _pointsPerCorrect = (data['points_per_correct'] as num?)?.toInt() ?? 0;
        _weekStatus = data['status'] is Map
            ? (data['status'] as Map).cast<String, dynamic>()
            : null;
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

  Future<void> _answerQuestion(int answerIndex) async {
    if (_checking) return;
    setState(() {
      _selectedAnswer = answerIndex;
      _checking = true;
    });
    try {
      final question = _questions[_currentQuestion] as Map<String, dynamic>;
      final result = await QuizService.submitAnswer(
        questionId: (question['id'] as num).toInt(),
        answerIndex: answerIndex,
      );
      final correct = result['correct'] == true;
      if (!mounted) return;
      setState(() {
        _lastCorrect = correct;
        if (correct) _score++;
        _checking = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _checking = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('خطا: $e'),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  void _next() {
    if (_currentQuestion < _questions.length - 1) {
      setState(() {
        _currentQuestion++;
        _selectedAnswer = null;
        _lastCorrect = null;
      });
    } else {
      setState(() => _showResult = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const AppBottomNavBar(),
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Padding(
                          padding:
                              const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
                          child: Text(_error!, textAlign: TextAlign.center),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        ElevatedButton(onPressed: _load, child: const Text('تلاش مجدد')),
                      ],
                    ),
                  )
                : _questions.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.quiz_outlined,
                                size: 64,
                                color: Theme.of(context)
                                    .colorScheme
                                    .onSurface
                                    .withOpacity(0.3)),
                            const SizedBox(height: AppSpacing.md),
                            const Text('این هفته کوییز جدیدی نیست'),
                          ],
                        ),
                      )
                    : Padding(
                        padding: const EdgeInsets.all(AppSpacing.lg),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('کوییز هفتگی',
                                    style: AppTypography.h5
                                        .copyWith(fontWeight: FontWeight.w700)),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: AppSpacing.sm,
                                      vertical: AppSpacing.xs),
                                  decoration: BoxDecoration(
                                    color: AppColors.blue.withOpacity(0.1),
                                    borderRadius: AppRadius.chipBorderRadius,
                                  ),
                                  child: Text(
                                    _showResult
                                        ? 'پایان'
                                        : '${FaFormat.faNum(_currentQuestion + 1)}/${FaFormat.faNum(_questions.length)}',
                                    style: AppTypography.bodyMedium.copyWith(
                                        color: AppColors.blue,
                                        fontWeight: FontWeight.w600),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: AppSpacing.xl),

                            if (_showResult)
                              Expanded(child: Center(child: _buildResult()))
                            else ...[
                              Expanded(child: _buildQuestion()),
                              if (_lastCorrect != null)
                                AppButton(
                                  text: _currentQuestion < _questions.length - 1
                                      ? 'سوال بعدی'
                                      : 'مشاهده نتیجه',
                                  onPressed: _next,
                                  gradient: true,
                                ),
                            ],
                            const SizedBox(height: AppSpacing.lg),
                          ],
                        ),
                      ),
      ),
    );
  }

  Widget _buildQuestion() {
    final question = _questions[_currentQuestion] as Map<String, dynamic>;
    final options = (question['options'] ?? []) as List;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          (question['text'] ?? '').toString(),
          style: AppTypography.h6.copyWith(fontWeight: FontWeight.w600, height: 1.6),
        ),
        const SizedBox(height: AppSpacing.xl),
        ...options.asMap().entries.map((entry) {
          final index = entry.key;
          final option = entry.value.toString();
          final isSelected = _selectedAnswer == index;
          final revealed = _lastCorrect != null;
          Color? bg;
          if (revealed && isSelected) {
            bg = (_lastCorrect == true ? AppColors.success : AppColors.error)
                .withOpacity(0.12);
          } else if (isSelected) {
            bg = AppColors.blue.withOpacity(0.1);
          }
          return Container(
            width: double.infinity,
            margin: const EdgeInsets.only(bottom: AppSpacing.md),
            child: InkWell(
              onTap: _lastCorrect != null ? null : () => _answerQuestion(index),
              borderRadius: AppRadius.mediumBorderRadius,
              child: Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: bg ??
                      (Theme.of(context).brightness == Brightness.dark
                          ? AppColors.darkSurface
                          : Colors.white),
                  borderRadius: AppRadius.mediumBorderRadius,
                  border: Border.all(
                    color: isSelected ? AppColors.blue : Theme.of(context).dividerColor,
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(option, style: AppTypography.bodyMedium),
                    ),
                    if (revealed && isSelected)
                      Icon(
                        _lastCorrect == true ? Icons.check_circle : Icons.cancel,
                        size: 20,
                        color: _lastCorrect == true
                            ? AppColors.success
                            : AppColors.error,
                      ),
                  ],
                ),
              ),
            ),
          );
        }),
        if (_checking)
          const Padding(
            padding: EdgeInsets.all(AppSpacing.md),
            child: Center(child: SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(strokeWidth: 2))),
          ),
        if (_lastCorrect != null) ...[
          const SizedBox(height: AppSpacing.xs),
          Center(
            child: Text(
              _lastCorrect == true
                  ? '✓ درست بود! +${FaFormat.faNum(_pointsPerCorrect)} امتیاز'
                  : '✗ پاسخ اشتباه بود',
              style: AppTypography.bodyLarge.copyWith(
                fontWeight: FontWeight.w700,
                color: _lastCorrect == true ? AppColors.success : AppColors.error,
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildResult() {
    final answered = _weekStatus?['answered_count'];
    final correct = _weekStatus?['correct_count'];
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(AppSpacing.xl),
          decoration: const BoxDecoration(
              color: AppColors.success, shape: BoxShape.circle),
          child: const Icon(Icons.emoji_events, size: 48, color: Colors.white),
        ),
        const SizedBox(height: AppSpacing.xl),
        Text('پایان کوییز',
            style: AppTypography.h4.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: AppSpacing.md),
        Text(
          'امتیاز شما: ${FaFormat.faNum(_score * _pointsPerCorrect)}',
          style: AppTypography.h6
              .copyWith(fontWeight: FontWeight.w700, color: AppColors.amberDark),
        ),
        if (answered is num && correct is num) ...[
          const SizedBox(height: AppSpacing.sm),
          Text(
            'وضعیت این هفته: ${FaFormat.faNum(correct)} پاسخ درست از ${FaFormat.faNum(answered)}',
            style: AppTypography.bodyMedium
                .copyWith(color: AppColors.darkTextSecondary),
          ),
        ],
        const SizedBox(height: AppSpacing.xl),
        AppButton(text: 'برگشت به ابتدا', onPressed: () {
          setState(() {
            _showResult = false;
            _currentQuestion = 0;
            _score = 0;
            _selectedAnswer = null;
            _lastCorrect = null;
          });
        }, outlined: true),
      ],
    );
  }
}
