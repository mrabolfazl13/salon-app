import 'api_client.dart';
import 'api_endpoints.dart';

class QuizService {
  static final _client = ApiClient.instance;

  /// Get current quiz
  static Future<Map<String, dynamic>> getCurrentQuiz() async {
    try {
      final response = await _client.get(ApiEndpoints.quiz);
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت آزمون: ${e.toString()}');
    }
  }

  /// Submit quiz answers
  static Future<Map<String, dynamic>> submitQuiz({
    required String quizId,
    required List<int> answers,
  }) async {
    try {
      final response = await _client.post(
        '${ApiEndpoints.quiz}/submit',
        data: {
          'quiz_id': quizId,
          'answers': answers,
        },
      );
      return response.data;
    } catch (e) {
      throw Exception('خطا در ارسال پاسخ‌ها: ${e.toString()}');
    }
  }
}
