import 'dart:convert';

import 'package:dio/dio.dart';

import 'api_exception.dart';

/// Maps raw Dio/network/parse errors into friendly, user-facing
/// [ApiException]s. Technical details stay available for logging.
class ErrorMapper {
  ErrorMapper._();

  static const networkMessage = 'اتصال به سرور برقرار نشد. اینترنت خود را بررسی کنید.';
  static const timeoutMessage = 'زمان پاسخ سرور به پایان رسید. دوباره تلاش کنید.';
  static const serverMessage = 'خطایی در سرور رخ داد. بعداً تلاش کنید.';
  static const unknownMessage = 'خطای ناشناخته‌ای رخ داد. دوباره تلاش کنید.';

  static ApiException from(Object error) {
    if (error is ApiException) return error;
    if (error is DioException) {
      return _fromDio(error);
    }
    if (error is FormatException || error is TypeError) {
      return const ApiException('داده دریافتی از سرور معتبر نیست.');
    }
    return ApiException(error.toString());
  }

  static ApiException _fromDio(DioException e) {
    final code = e.response?.statusCode;
    switch (e.type) {
      case DioExceptionType.connectionError:
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        final msg =
            e.type == DioExceptionType.connectionError ? networkMessage : timeoutMessage;
        return ApiException(msg, statusCode: code);
      case DioExceptionType.badCertificate:
        return const ApiException('اتصال امن به سرور برقرار نشد.');
      case DioExceptionType.cancel:
        return const ApiException('درخواست لغو شد.');
      case DioExceptionType.badResponse:
        return _fromResponse(e.response);
      default:
        return const ApiException(networkMessage);
    }
  }

  static ApiException _fromResponse(Response<dynamic>? response) {
    final code = response?.statusCode;
    final data = response?.data;
    final detail = _extractDetail(data);
    return ApiException(
      detail ?? _defaultForStatus(code),
      statusCode: code,
      errors: _extractErrors(data),
    );
  }

  static String? _extractDetail(dynamic data) {
    if (data is! Map && data is! String) return null;
    if (data is String) {
      final trimmed = data.trim();
      return trimmed.isEmpty ? null : trimmed;
    }
    final map = data as Map<dynamic, dynamic>;
    final detail = map['detail'];
    if (detail == null) return null;
    if (detail is String) return detail.isEmpty ? null : detail;
    if (detail is Map) {
      // Games API error shape: {"code": "...", "message": "..."}
      final msg = detail['message'];
      if (msg is String && msg.isNotEmpty) return msg;
      return jsonEncode(detail);
    }
    if (detail is List && detail.isNotEmpty) {
      final first = detail.first;
      if (first is Map && first['msg'] is String) {
        return first['msg'] as String;
      }
      return detail.toString();
    }
    return detail.toString();
  }

  static Map<String, List<String>> _extractErrors(dynamic data) {
    if (data is! Map) return const {};
    final errors = data['errors'];
    if (errors is! Map) return const {};
    return errors.map((k, v) => MapEntry(
          k.toString(),
          v is List ? v.map((e) => e.toString()).toList() : [v.toString()],
        ));
  }

  static String _defaultForStatus(int? code) {
    switch (code) {
      case 400:
        return 'درخواست ارسالی معتبر نیست.';
      case 401:
        return 'شماره موبایل یا رمز عبور اشتباه است.';
      case 403:
        return 'دسترسی شما به این بخش مجاز نیست.';
      case 404:
        return 'مورد درخواستی یافت نشد.';
      case 409:
        return 'این عملیات قبلاً انجام شده است.';
      case 422:
        return 'اطلاعات ارسالی معتبر نیست.';
      case 500:
      case 502:
      case 503:
        return serverMessage;
      default:
        return unknownMessage;
    }
  }
}
