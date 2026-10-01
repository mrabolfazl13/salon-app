import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthProvider extends ChangeNotifier {
  bool _isAuthenticated = false;
  String? _token;
  Map<String, dynamic>? _user;

  bool get isAuthenticated => _isAuthenticated;
  String? get token => _token;
  Map<String, dynamic>? get user => _user;

  AuthProvider() {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    if (_token != null) {
      _isAuthenticated = true;
      _user = {
        'id': prefs.getInt('user_id'),
        'name': prefs.getString('user_name'),
        'role': prefs.getString('user_role'),
      };
      notifyListeners();
    }
  }

  Future<void> login(String token, Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    await prefs.setInt('user_id', user['id'] ?? 0);
    await prefs.setString('user_name', user['name'] ?? '');
    await prefs.setString('user_role', user['role'] ?? 'user');

    _token = token;
    _user = user;
    _isAuthenticated = true;
    notifyListeners();
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();

    _token = null;
    _user = null;
    _isAuthenticated = false;
    notifyListeners();
  }
}
