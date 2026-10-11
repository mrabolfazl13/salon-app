import 'api_client.dart';
import 'api_endpoints.dart';

class QuizService {
  static final _client = ApiClient.instance;

  /// GET /quiz/questions → {week_tag, points_per_correct,
  /// questions: [{id, text, options: [...]}], status}
  static Future<Map<String, dynamic>> getWeeklyQuestions() async {
    try {
      final response = await _client.get('${ApiEndpoints.quiz}/questions');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('خطا در دریافت سوالات کوییز: ${e.toString()}');
    }
  }

  /// POST /quiz/answer {question_id, answer_index}
  static Future<Map<String, dynamic>> submitAnswer({
    required int questionId,
    required int answerIndex,
  }) async {
    try {
      final response = await _client.post(
        '${ApiEndpoints.quiz}/answer',
        data: {'question_id': questionId, 'answer_index': answerIndex},
      );
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('خطا در ثبت پاسخ: ${e.toString()}');
    }
  }
}
