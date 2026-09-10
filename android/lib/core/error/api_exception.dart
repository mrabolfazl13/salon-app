/// Centralized application exception carrying a friendly, user-facing
/// message plus the optional HTTP status code and raw payload for logging.
library;

import 'error_mapper.dart';

class ApiException implements Exception {
  const ApiException(
    this.message, {
    this.statusCode,
    this.errors = const {},
  });

  final String message;
  final int? statusCode;
  final Map<String, List<String>> errors;

  /// Maps any thrown object into an [ApiException].
  static ApiException map(Object error) => ErrorMapper.from(error);

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;
  bool get isConflict => statusCode == 409;

  @override
  String toString() => message;
}
