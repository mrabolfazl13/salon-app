import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../storage/token_storage.dart';

/// API Client configuration matching Tauri application
class ApiClient {
  static final Dio instance = Dio(_createOptions());
  
  static BaseOptions _createOptions() {
    final baseUrl = const String.fromEnvironment(
      'API_URL',
      defaultValue: 'http://2.189.255.225/api/v1',
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
    // Auth interceptor + error unwrapping
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
          await TokenStorage.clearToken();
        }
        // Unwrap FastAPI error envelope {detail: "..."}
        final detail = error.response?.data?['detail'];
        if (detail is String && detail.isNotEmpty) {
          error.message = detail;
        } else if (detail is List && detail.isNotEmpty) {
          // Validation errors
          error.message = detail.map((e) => e['msg'] ?? '').where((s) => s.isNotEmpty).join('\n');
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
