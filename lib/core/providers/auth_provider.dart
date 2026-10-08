import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  bool _isAuthenticated = false;
  String? _token;
  Map<String, dynamic>? _user;
  bool _isLoading = false;

  final AuthService _authService = AuthService();

  bool get isAuthenticated => _isAuthenticated;
  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;

  AuthProvider() {
    _initializeAuth();
  }

  Future<void> _initializeAuth() async {
    _isLoading = true;
    notifyListeners();

    final isAuth = await _authService.isAuthenticated();
    if (isAuth) {
      _token = await _authService.getToken();
      _isAuthenticated = true;
      
      // Fetch current user profile
      final user = await _authService.getCurrentUser();
      if (user != null) {
        _user = user;
      }
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>> login(String phone, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await _authService.login(phone, password);
      
      if (result['success'] == true) {
        _token = result['token'];
        _user = result['user'];
        _isAuthenticated = true;
      } else {
        _isAuthenticated = false;
      }

      _isLoading = false;
      notifyListeners();
      
      return result;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<Map<String, dynamic>> register({
    required String phone,
    required String password,
    required String fullName,
    String? email,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await _authService.register(
        phone: phone,
        password: password,
        fullName: fullName,
        email: email,
      );
      
      if (result['success'] == true) {
        _token = result['token'];
        _user = result['user'];
        _isAuthenticated = true;
      } else {
        _isAuthenticated = false;
      }

      _isLoading = false;
      notifyListeners();
      
      return result;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    
    _token = null;
    _user = null;
    _isAuthenticated = false;
    notifyListeners();
  }
}
