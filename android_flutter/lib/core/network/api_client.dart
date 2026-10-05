import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../storage/token_storage.dart';

/// API Client configuration matching Tauri application
class ApiClient {
  static final Dio instance = Dio(_createOptions());
  
  static BaseOptions _createOptions() {
    final baseUrl = const String.fromEnvironment(
      'API_URL',
      defaultValue: 'http://localhost:8000/api/v1',
    );
    
    return BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    );
  }
  
  /// Initialize interceptors
  static void initialize() {
    // Auth interceptor
    instance.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await TokenStorage.getToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Handle unauthorized - clear token and redirect to login
          await TokenStorage.clearToken();
          // Note: Navigation should be handled by the router based on auth state
        }
        return handler.next(error);
      },
    ));
    
    // Logger in debug mode
    if (kDebugMode) {
      instance.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
        error: true,
      ));
    }
  }
}
