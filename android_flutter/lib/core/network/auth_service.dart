import 'api_client.dart';
import 'api_endpoints.dart';
import 'models.dart';

class AuthService {
  static final _client = ApiClient.instance;

  /// Login with phone and password
  static Future<AuthResponse> login(String phone, String password) async {
    try {
      final response = await _client.post(
        ApiEndpoints.login,
        data: LoginRequest(phone: phone, password: password).toJson(),
      );
      return AuthResponse.fromJson(response.data);
    } catch (e) {
      throw Exception('خطا در ورود: ${e.toString()}');
    }
  }

  /// Register new user
  static Future<void> register({
    required String fullName,
    required String phone,
    required String password,
  }) async {
    try {
      await _client.post(
        ApiEndpoints.register,
        data: RegisterRequest(
          fullName: fullName,
          phone: phone,
          password: password,
        ).toJson(),
      );
    } catch (e) {
      throw Exception('خطا در ثبت‌نام: ${e.toString()}');
    }
  }

  /// Get current user info
  static Future<User> getMe() async {
    try {
      final response = await _client.get(ApiEndpoints.getMe);
      return User.fromJson(response.data);
    } catch (e) {
      throw Exception('خطا در دریافت اطلاعات کاربر: ${e.toString()}');
    }
  }

  /// Forgot password
  static Future<void> forgotPassword(String phone) async {
    try {
      await _client.post(
        ApiEndpoints.forgotPassword,
        data: {'phone': phone},
      );
    } catch (e) {
      throw Exception('خطا در بازیابی رمز عبور: ${e.toString()}');
    }
  }

  /// Verify email
  static Future<void> verifyEmail(String token) async {
    try {
      await _client.post(
        ApiEndpoints.verifyEmail,
        data: {'token': token},
      );
    } catch (e) {
      throw Exception('خطا در تأیید ایمیل: ${e.toString()}');
    }
  }
}
