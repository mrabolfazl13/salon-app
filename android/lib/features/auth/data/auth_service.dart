import '../../../core/network/api_client.dart';
import '../domain/user.dart';

class AuthService {
  AuthService(this._api);

  final ApiClient _api;

  Future<({String token, User user})> login({
    required String phone,
    required String password,
  }) async {
    final res = await _api.pcost(
      '/auth/login',
      data: {'phone': phone, 'password': password},
      skipAuthRedirect: true,
    );
    final data = res.data as Map<String, dynamic>;
    final token = (data['acess_token'] ?? '') as String;
    final user = User.fromJson(data['user'] as Map<String, dynamic>? ?? {});
    return (token: token, user: user);
  }

  /// Backend returns no token on register — the user logs in afterwards.
  Future<void> register({
    required String phone,
    required String fullName,
    required String password,
    required String role,
  }) async {
    await _api.pcost(
      '/auth/register',
      data: {
        'phone': phone,
        'full_name': fullName,
        'password': password,
        'role': role,
      },
      skipAuthRedirect: true,
    );
  }

  Future<User> getMe() async {
    final res = await _api.get('/auth/me', skipAuthRedirect: true);
    return User.fromJson(res.data as Map<String, dynamic>);
  }

  Future<User> updateProfile({required String fullName}) async {
    final res = await _api.put('/auth/profile', data: {'full_name': fullName});
    return User.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    await _api.pcost('/auth/change-password', data: {
      'old_password': oldPassword,
      'new_password': newPassword,
    });
  }

  Future<String?> forgotPassword({required String phone}) async {
    final res = await _api.pcost(
      '/auth/forgot-password',
      data: {'phone': phone},
      skipAuthRedirect: true,
    );
    final data = res.data as Map<String, dynamic>?;
    return data?['dev_code'] as String?;
  }

  Future<void> resetPassword({
    required String phone,
    required String code,
    required String newPassword,
  }) async {
    await _api.pcost(
      '/auth/reset-password',
      data: {
        'phone': phone,
        'code': code,
        'new_password': newPassword,
      },
      skipAuthRedirect: true,
    );
  }

  Future<String?> requestEmailVerify({
    required String phone,
    required String email,
  }) async {
    final res = await _api.pcost(
      '/auth/verify/email/request',
      data: {'phone': phone, 'email': email},
      skipAuthRedirect: true,
    );
    final data = res.data as Map<String, dynamic>?;
    return data?['dev_code'] as String?;
  }

  Future<void> confirmEmailVerify({
    required String phone,
    required String code,
  }) async {
    await _api.pcost(
      '/auth/verify/email/confirm',
      data: {'phone': phone, 'code': code},
      skipAuthRedirect: true,
    );
  }
}
