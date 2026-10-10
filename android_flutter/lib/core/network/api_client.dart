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
    // Auth interceptor + refresh token + error unwrapping
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
          // Try to refresh token
          final refreshToken = await TokenStorage.getRefreshToken();
          if (refreshToken != null && refreshToken.isNotEmpty) {
            try {
              final response = await Dio().post(
                '${instance.options.baseUrl}/auth/refresh',
                data: {'refresh_token': refreshToken},
                options: Options(contentType: 'application/json'),
              );
              
              if (response.statusCode == 200) {
                final newToken = response.data['access_token'];
                await TokenStorage.saveToken(newToken);
                
                // Retry original request with new token
                final opts = error.requestOptions;
                opts.headers['Authorization'] = 'Bearer $newToken';
                final retryResponse = await instance.fetch(opts);
                return handler.resolve(retryResponse);
              }
            } catch (_) {
              // Refresh failed, clear tokens
              await TokenStorage.clearToken();
            }
          } else {
            await TokenStorage.clearToken();
          }
        }
        
        // Unwrap FastAPI error envelope {detail: "..."}.
        // DioException.message is final, so build a replacement exception
        // instead of assigning to it.
        final detail = error.response?.data?['detail'];
        String? unwrapped;
        if (detail is String && detail.isNotEmpty) {
          unwrapped = detail;
        } else if (detail is List && detail.isNotEmpty) {
          // Validation errors
          unwrapped = detail.map((e) => e['msg'] ?? '').where((s) => s.isNotEmpty).join('\n');
        }
        if (unwrapped != null && unwrapped.isNotEmpty) {
          return handler.reject(DioException(
            requestOptions: error.requestOptions,
            response: error.response,
            type: error.type,
            error: error.error,
            message: unwrapped,
          ));
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
