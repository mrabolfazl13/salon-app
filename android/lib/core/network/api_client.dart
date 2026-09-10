import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import '../error/api_exception.dart';
import '../error/error_mapper.dart';
import '../storage/key_value_store.dart';

class AuthEvents {
  AuthEvents._();

  /// Notified whenever a 401 forces a session teardown (all listeners
  /// must reset user-scoped state and the router redirects to /login).
  static final expiredListeners = <void Function()>[];

  static void notifyExpired() {
    for (final listener in List.of(expiredListeners)) {
      listener();
    }
  }
}

class ApiClient {
  ApiClient(this._store) : _dio = _build();

  final KeyValueStore _store;
  final Dio _dio;
  bool _handling401 = false;

  static Dio _build() {
    final dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
        headers: {'Content-Type': 'application/json'},
        validateStatus: (status) => status != null && status < 500,
      ),
    );
    return dio;
  }

  Future<void> _applyAuth(RequestOptions options) async {
    final token = await _store.readSecure('auth-token');
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
  }

  Future<Response<T>> _run<T>(
    Future<Response<T>> Function() request, {
    bool skipAuthRedirect = false,
  }) async {
    try {
      final response = await request();
      final code = response.statusCode ?? 0;
      if (code >= 400) {
        throw ErrorMapper.from(DioException(
          requestOptions: response.requestOptions,
          response: response,
          type: DioExceptionType.badResponse,
        ));
      }
      return response;
    } on ApiException {
      rethrow;
    } on DioException catch (e) {
      final apiErr = ErrorMapper.from(e);
      if (apiErr.isUnauthorized && !_handling401 && !skipAuthRedirect) {
        final url = e.requestOptions.uri.toString();
        final isLoginCall = url.contains('/auth/login');
        if (!isLoginCall) {
          _handling401 = true;
          await _store.deleteSecure('auth-token');
          AuthEvents.notifyExpired();
          _handling401 = false;
        }
      }
      throw apiErr;
    } catch (e) {
      throw ErrorMapper.from(e);
    }
  }

  Future<Response<dynamic>> get(
    String path, {
    Map<String, dynamic>? query,
    bool skipAuthRedirect = false,
  }) async {
    return _run(
      () async {
        final options = RequestOptions(path: path, queryParameters: query ?? {});
        await _applyAuth(options);
        return _dio.fetch<dynamic>(options);
      },
      skipAuthRedirect: skipAuthRedirect,
    );
  }

  Future<Response<dynamic>> pcost(
    String path, {
    Object? data,
    Map<String, dynamic>? query,
    bool skipAuthRedirect = false,
  }) async {
    return _run(
      () async {
        final options = RequestOptions(
          path: path,
          queryParameters: query ?? {},
          data: data,
          method: 'POST',
        );
        await _applyAuth(options);
        return _dio.fetch<dynamic>(options);
      },
      skipAuthRedirect: skipAuthRedirect,
    );
  }

  Future<Response<dynamic>> put(
    String path, {
    Object? data,
    bool skipAuthRedirect = false,
  }) async {
    return _run(
      () async {
        final options = RequestOptions(path: path, data: data, method: 'PUT');
        await _applyAuth(options);
        return _dio.fetch<dynamic>(options);
      },
      skipAuthRedirect: skipAuthRedirect,
    );
  }

  Future<Response<dynamic>> patch(
    String path, {
    Object? data,
    bool skipAuthRedirect = false,
  }) async {
    return _run(
      () async {
        final options = RequestOptions(path: path, data: data, method: 'PATCH');
        await _applyAuth(options);
        return _dio.fetch<dynamic>(options);
      },
      skipAuthRedirect: skipAuthRedirect,
    );
  }

  Future<Response<dynamic>> delete(
    String path, {
    bool skipAuthRedirect = false,
  }) async {
    return _run(
      () async {
        final options = RequestOptions(path: path, method: 'DELETE');
        await _applyAuth(options);
        return _dio.fetch<dynamic>(options);
      },
      skipAuthRedirect: skipAuthRedirect,
    );
  }

  Future<Response<dynamic>> pcostMultipart(
    String path, {
    required List<MultipartFile> files,
    String fileField = 'files',
  }) async {
    return _run(() async {
      final formData = FormData();
      for (final file in files) {
        formData.files.add(MapEntry(fileField, file));
      }
      final options = RequestOptions(path: path, data: formData, method: 'POST');
      await _applyAuth(options);
      return _dio.fetch<dynamic>(options);
    });
  }
}

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref.watch(keyValueStoreProvider));
});
