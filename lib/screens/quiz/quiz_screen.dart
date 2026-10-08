import 'package:flutter/material.dart';

class QuizScreen extends StatefulWidget {
  const QuizScreen({super.key});

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  int _currentQuestionIndex = 0;
  int _score = 0;
  int _questionAnswered = -1;
  bool _isLoading = true;
  List<Map<String, dynamic>> _questions = [];

  @override
  void initState() {
    super.initState();
    _loadQuiz();
  }

  Future<void> _loadQuiz() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // TODO: Implement quiz service and API call
      await Future.delayed(const Duration(milliseconds: 500));
      
      // Sample questions for now
      setState(() {
        _questions = [
          {
            'id': 1,
            'question': 'طول زمین فوتسال استاندارد چند متر است؟',
            'options': ['25-42 متر', '20-30 متر', '30-50 متر', '15-25 متر'],
            'correct': 0,
            'points': 10,
          },
          {
            'id': 2,
            'question': 'تعداد بازیکنان هر تیم در زمین چند نفر است؟',
            'options': ['6 نفر', '5 نفر', '7 نفر', '8 نفر'],
            'correct': 1,
            'points': 10,
          },
          {
            'id': 3,
            'question': 'مدت زمان بازی فوتسال چقدر است؟',
            'options': ['40 دقیقه', '60 دقیقه', '90 دقیقه', '45 دقیقه'],
            'correct': 0,
            'points': 10,
          },
        ];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _answerQuestion(int answerIndex) {
    if (_questionAnswered != -1) return;

    final currentQuestion = _questions[_currentQuestionIndex];
    final isCorrect = answerIndex == currentQuestion['correct'];

    setState(() {
      _questionAnswered = answerIndex;
      if (isCorrect) {
        _score += currentQuestion['points'];
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(isCorrect ? 'پاسخ صحیح! 🎉' : 'پاسخ اشتباه'),
        backgroundColor: isCorrect ? Colors.green : Colors.red,
        duration: const Duration(seconds: 2),
      ),
    );

    // Auto advance after delay
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted && _currentQuestionIndex < _questions.length - 1) {
        setState(() {
          _currentQuestionIndex++;
          _questionAnswered = -1;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('چالش ورزشی'),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.star, size: 16, color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: 4),
                Text(
                  '$_score امتیاز',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _questions.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.quiz,
                        size: 64,
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'سؤالی یافت نشد',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'در حال حاضر سؤالی برای پاسخ وجود ندارد',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                        ),
                      ),
                    ],
                  ),
                )
              : Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Progress indicator
                      LinearProgressIndicator(
                        value: (_currentQuestionIndex + 1) / _questions.length,
                        backgroundColor: Colors.grey[200],
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Theme.of(context).colorScheme.primary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'سؤال ${_currentQuestionIndex + 1} از ${_questions.length}',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Question card
                      Card(
                        elevation: 4,
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _questions[_currentQuestionIndex]['question'],
                                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Answer options
                      Expanded(
                        child: ListView.builder(
                          itemCount: (_questions[_currentQuestionIndex]['options'] as List).length,
                          itemBuilder: (context, index) {
                            final option = _questions[_currentQuestionIndex]['options'][index];
                            final isSelected = _questionAnswered == index;
                            final isCorrect = index == _questions[_currentQuestionIndex]['correct'];
                            final showResult = _questionAnswered != -1;

                            Color? backgroundColor;
                            Color? borderColor;

                            if (showResult) {
                              if (isCorrect) {
                                backgroundColor = Colors.green.withValues(alpha: 0.1);
                                borderColor = Colors.green;
                              } else if (isSelected) {
                                backgroundColor = Colors.red.withValues(alpha: 0.1);
                                borderColor = Colors.red;
                              }
                            }

                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: InkWell(
                                onTap: showResult ? null : () => _answerQuestion(index),
                                child: Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: backgroundColor ?? Colors.white,
                                    border: Border.all(
                                      color: borderColor ?? Colors.grey[300]!,
                                      width: isSelected || isCorrect ? 2 : 1,
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    children: [
                                      CircleAvatar(
                                        radius: 16,
                                        backgroundColor: isSelected || isCorrect
                                            ? borderColor
                                            : Colors.grey[200],
                                        child: Text(
                                          String.fromCharCode(65 + index),
                                          style: TextStyle(
                                            color: isSelected || isCorrect
                                                ? Colors.white
                                                : Colors.black,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Text(
                                          option,
                                          style: const TextStyle(fontSize: 16),
                                        ),
                                      ),
                                      if (showResult && isCorrect)
                                        Icon(Icons.check_circle, color: Colors.green),
                                      if (showResult && isSelected && !isCorrect)
                                        Icon(Icons.cancel, color: Colors.red),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),

                      // Next button or completion message
                      if (_questionAnswered != -1 && _currentQuestionIndex < _questions.length - 1)
                        Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: ElevatedButton(
                            onPressed: () {
                              setState(() {
                                _currentQuestionIndex++;
                                _questionAnswered = -1;
                              });
                            },
                            child: const Text('سؤال بعدی'),
                          ),
                        ),
                      if (_questionAnswered != -1 && _currentQuestionIndex == _questions.length - 1)
                        Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: Column(
                            children: [
                              Text(
                                'آفرین! شما $_score امتیاز کسب کردید',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: Theme.of(context).colorScheme.primary,
                                    ),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: () {
                                  setState(() {
                                    _currentQuestionIndex = 0;
                                    _questionAnswered = -1;
                                    _score = 0;
                                  });
                                },
                                child: const Text('شروع مجدد'),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
    );
  }
}
