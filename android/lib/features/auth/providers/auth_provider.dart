import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/key_value_store.dart';
import '../data/auth_service.dart';
import '../domain/user.dart';

enum AuthPhase { loading, authenticated, unauthenticated }

class AuthState {
  const AuthState({
    this.phase = AuthPhase.loading,
    this.user,
    this.error,
  });

  final AuthPhase phase;
  final User? user;
  final String? error;

  bool get isAuthenticated => phase == AuthPhase.authenticated;
  bool get isManager => user?.role.isManager ?? false;
  bool get isAdmin => user?.role.isAdmin ?? false;

  AuthState copyWith({AuthPhase? phase, User? user, String? error}) =>
      AuthState(
        phase: phase ?? this.phase,
        user: user ?? this.user,
        error: error,
      );
}

class AuthController extends Notifier<AuthState> {
  AuthService? _service;

  AuthService get _auth => _service ??= AuthService(ref.read(apiClientProvider));

  KeyValueStore get _store => ref.read(keyValueStoreProvider);

  @override
  AuthState build() {
    // Register the global 401 handler: any expired token tears the
    // session down and the router redirects to /login.
    AuthEvents.expiredListeners.add(_onSessionExpired);
    ref.onDispose(() {
      AuthEvents.expiredListeners.remove(_onSessionExpired);
    });
    return const AuthState();
  }

  void _onSessionExpired() {
    state = const AuthState(phase: AuthPhase.unauthenticated);
    ref.read(notificationsResetSignalProvider.notifier).state++;
  }

  /// Bootstrap: restore token → GET /auth/me.
  Future<void> initialize() async {
    if (state.phase != AuthPhase.loading) return;
    final token = await _store.readSecure('auth-token');
    if (token == null || token.isEmpty) {
      state = const AuthState(phase: AuthPhase.unauthenticated);
      return;
    }
    try {
      final user = await _auth.getMe();
      state = AuthState(phase: AuthPhase.authenticated, user: user);
    } catch (_) {
      await _store.deleteSecure('auth-token');
      state = const AuthState(phase: AuthPhase.unauthenticated);
    }
  }

  /// Login; returns the user so the caller can route by role.
  Future<User> login(String phone, String password) async {
    final result = await _auth.login(phone: phone, password: password);
    await _store.writeSecure('auth-token', result.token);
    state = AuthState(phase: AuthPhase.authenticated, user: result.user);
    return result.user;
  }

  Future<void> register({
    required String phone,
    required String fullName,
    required String password,
    required String role,
  }) async {
    await _auth.register(
      phone: phone,
      fullName: fullName,
      password: password,
      role: role,
    );
  }

  /// Returns dev_code when the backend runs in dev mode.
  Future<String?> devPasswordReset(String phone) =>
      _auth.forgotPassword(phone: phone);

  Future<void> resetPassword({
    required String phone,
    required String code,
    required String newPassword,
  }) =>
      _auth.resetPassword(phone: phone, code: code, newPassword: newPassword);

  /// Returns dev_code when the backend runs in dev mode.
  Future<String?> devEmailVerify({required String phone, required String email}) =>
      _auth.requestEmailVerify(phone: phone, email: email);

  Future<void> confirmEmailVerify({required String phone, required String code}) =>
      _auth.confirmEmailVerify(phone: phone, code: code);

  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
  }) =>
      _auth.changePassword(
        oldPassword: oldPassword,
        newPassword: newPassword,
      );

  Future<void> logout() async {
    await _store.deleteSecure('auth-token');
    state = const AuthState(phase: AuthPhase.unauthenticated);
    ref.read(notificationsResetSignalProvider.notifier).state++;
  }

  Future<void> updateFullName(String fullName) async {
    final user = await _auth.updateProfile(fullName: fullName);
    state = state.copyWith(user: user);
  }

  void refreshUser(User user) {
    state = state.copyWith(user: user);
  }
}

/// Bump signal that clears notification state on logout/session expiry.
final notificationsResetSignalProvider = StateProvider<int>((ref) => 0);

final authProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);

/// Convenience provider for the current user (null-safe).
final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authProvider).user;
});
