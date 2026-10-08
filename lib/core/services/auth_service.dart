import 'dart:convert';
import 'package:dio/dio.dart';
import '../services/api_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;

  final ApiService _api = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  AuthService._internal();

  /// Login with phone and password
  Future<Map<String, dynamic>> login(String phone, String password) async {
    try {
      final response = await _api.post('/auth/login', data: {
        'phone': phone,
        'password': password,
      });

      final data = response.data;
      final token = data['access_token'];

      // Store token securely
      await _storage.write(key: 'auth_token', value: token);
      if (data['refresh_token'] != null) {
        await _storage.write(key: 'refresh_token', value: data['refresh_token']);
      }

      // Set auth header for future requests
      _api.setAuthToken(token);

      return {
        'success': true,
        'token': token,
        'user': data['user'],
      };
    } on DioException catch (e) {
      String message = 'خطا در ورود';
      if (e.response?.statusCode == 401) {
        message = 'شماره موبایل یا رمز عبور اشتباه است';
      } else if (e.response?.statusCode == 422) {
        message = 'اطلاعات وارد شده معتبر نیست';
      }
      return {
        'success': false,
        'error': message,
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'خطا در اتصال به سرور',
      };
    }
  }

  /// Register new user
  Future<Map<String, dynamic>> register({
    required String phone,
    required String password,
    required String fullName,
    String? email,
  }) async {
    try {
      final response = await _api.post('/auth/register', data: {
        'phone': phone,
        'password': password,
        'full_name': fullName,
        if (email != null) 'email': email,
      });

      final data = response.data;
      final token = data['access_token'];

      await _storage.write(key: 'auth_token', value: token);
      _api.setAuthToken(token);

      return {
        'success': true,
        'token': token,
        'user': data['user'],
      };
    } on DioException catch (e) {
      String message = 'خطا در ثبت‌نام';
      if (e.response?.statusCode == 409) {
        message = 'این شماره موبایل قبلاً ثبت شده است';
      }
      return {
        'success': false,
        'error': message,
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'خطا در اتصال به سرور',
      };
    }
  }

  /// Get current user profile
  Future<Map<String, dynamic>?> getCurrentUser() async {
    try {
      final response = await _api.get('/auth/me');
      return response.data;
    } catch (e) {
      return null;
    }
  }

  /// Logout and clear stored credentials
  Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'refresh_token');
    _api.setAuthToken(null);
  }

  /// Get stored token
  Future<String?> getToken() async {
    return await _storage.read(key: 'auth_token');
  }

  /// Check if user is authenticated
  Future<bool> isAuthenticated() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  /// Initialize auth from stored token
  Future<void> initializeAuth() async {
    final token = await getToken();
    if (token != null) {
      _api.setAuthToken(token);
    }
  }
}
