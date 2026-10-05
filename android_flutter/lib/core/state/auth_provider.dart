import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../network/auth_service.dart';
import '../network/models.dart';
import '../storage/token_storage.dart';

class AuthNotifier extends StateNotifier<AsyncValue<User?>> {
  AuthNotifier() : super(const AsyncValue.data(null)) {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final isAuthenticated = await TokenStorage.isAuthenticated();
    if (isAuthenticated) {
      try {
        final user = await AuthService.getMe();
        state = AsyncValue.data(user);
      } catch (e) {
        await TokenStorage.clearToken();
        state = const AsyncValue.data(null);
      }
    } else {
      state = const AsyncValue.data(null);
    }
  }

  Future<void> login(String phone, String password) async {
    state = const AsyncValue.loading();
    try {
      final response = await AuthService.login(phone, password);
      await TokenStorage.saveToken(response.accessToken);
      state = AsyncValue.data(response.user);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }

  Future<void> register({
    required String fullName,
    required String phone,
    required String password,
  }) async {
    state = const AsyncValue.loading();
    try {
      await AuthService.register(
        fullName: fullName,
        phone: phone,
        password: password,
      );
      // After registration, user needs to login
      state = const AsyncValue.data(null);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }

  Future<void> logout() async {
    await TokenStorage.clearToken();
    state = const AsyncValue.data(null);
  }

  Future<void> fetchUser() async {
    try {
      final user = await AuthService.getMe();
      state = AsyncValue.data(user);
    } catch (e) {
      await TokenStorage.clearToken();
      state = const AsyncValue.data(null);
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<User?>>(
  (ref) => AuthNotifier(),
);

final isAuthenticatedProvider = Provider<bool>((ref) {
  final authState = ref.watch(authProvider);
  return authState.value != null;
});
