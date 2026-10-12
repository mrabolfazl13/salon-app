import 'api_client.dart';
import 'api_endpoints.dart';
import 'models.dart';
import '../storage/token_storage.dart';

class AuthService {
  static final _client = ApiClient.instance;

  /// Login with phone and password
  static Future<AuthResponse> login(String phone, String password) async {
    try {
      final response = await _client.post(
        ApiEndpoints.login,
        data: LoginRequest(phone: phone, password: password).toJson(),
      );
      final authResponse = AuthResponse.fromJson(response.data);

      // Save tokens
      await TokenStorage.saveToken(authResponse.accessToken);
      final refreshToken = response.data['refresh_token'];
      if (refreshToken is String && refreshToken.isNotEmpty) {
        await TokenStorage.saveRefreshToken(refreshToken);
      }
      
      return authResponse;
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

  /// Update current user profile (display name)
  static Future<User> updateProfile(String fullName) async {
    try {
      final response = await _client.put(
        ApiEndpoints.updateProfile,
        data: {'full_name': fullName.trim()},
      );
      return User.fromJson(response.data);
    } catch (e) {
      throw Exception('خطا در به‌روزرسانی پروفایل: ${e.toString()}');
    }
  }

  /// Change password with current password
  static Future<void> changePassword(String oldPassword, String newPassword) async {
    try {
      await _client.post(
        ApiEndpoints.changePassword,
        data: {'old_password': oldPassword, 'new_password': newPassword},
      );
    } catch (e) {
      throw Exception('خطا در تغییر رمز عبور: ${e.toString()}');
    }
  }

  /// Forgot password — sends a 6-digit recovery code via SMS
  static Future<void> forgotPassword(String phone) async {
    try {
      await _client.post(
        ApiEndpoints.forgotPassword,
        data: {'phone': phone},
      );
    } catch (e) {
      throw Exception('خطا در ارسال کد بازیابی: ${e.toString()}');
    }
  }

  /// Reset password with the 6-digit recovery code
  static Future<void> resetPassword({
    required String phone,
    required String code,
    required String newPassword,
  }) async {
    try {
      await _client.post(
        ApiEndpoints.resetPassword,
        data: {'phone': phone, 'code': code, 'new_password': newPassword},
      );
    } catch (e) {
      throw Exception('خطا در بازنشانی رمز عبور: ${e.toString()}');
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
