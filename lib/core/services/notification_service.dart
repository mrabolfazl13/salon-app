import 'dart:async';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter/foundation.dart';
import '../services/auth_service.dart';

class NotificationService extends ChangeNotifier {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;

  WebSocketChannel? _channel;
  final List<Map<String, dynamic>> _notifications = [];
  bool _isConnected = false;
  Timer? _reconnectTimer;

  List<Map<String, dynamic>> get notifications => _notifications;
  bool get isConnected => _isConnected;
  int get unreadCount => _notifications.where((n) => n['read'] == false).length;

  NotificationService._internal();

  /// Connect to WebSocket
  Future<void> connect() async {
    if (_isConnected) return;

    try {
      final token = await AuthService().getToken();
      if (token == null) {
        print('No auth token for WebSocket');
        return;
      }

      // Use production WebSocket URL
      final wsUrl = const String.fromEnvironment(
        'WS_URL',
        defaultValue: 'wss://school.absadeghi.ir/ws',
      );

      _channel = WebSocketChannel.connect(
        Uri.parse('$wsUrl?token=$token'),
      );

      _isConnected = true;
      notifyListeners();

      // Listen for messages
      _channel!.stream.listen(
        (message) {
          _handleMessage(message);
        },
        onError: (error) {
          print('WebSocket error: $error');
          _isConnected = false;
          notifyListeners();
          _scheduleReconnect();
        },
        onDone: () {
          print('WebSocket closed');
          _isConnected = false;
          notifyListeners();
          _scheduleReconnect();
        },
      );
    } catch (e) {
      print('Error connecting to WebSocket: $e');
      _scheduleReconnect();
    }
  }

  /// Handle incoming WebSocket message
  void _handleMessage(dynamic message) {
    try {
      // Parse message (adjust based on your backend format)
      final data = message is String ? {'message': message} : message;

      _notifications.insert(0, {
        ...data,
        'id': DateTime.now().millisecondsSinceEpoch,
        'timestamp': DateTime.now().toIso8601String(),
        'read': false,
      });

      // Keep only last 100 notifications
      if (_notifications.length > 100) {
        _notifications.removeRange(100, _notifications.length);
      }

      notifyListeners();
    } catch (e) {
      print('Error handling notification: $e');
    }
  }

  /// Schedule reconnection attempt
  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 5), () {
      connect();
    });
  }

  /// Mark notification as read
  void markAsRead(int id) {
    final index = _notifications.indexWhere((n) => n['id'] == id);
    if (index != -1) {
      _notifications[index]['read'] = true;
      notifyListeners();
    }
  }

  /// Mark all notifications as read
  void markAllAsRead() {
    for (var notif in _notifications) {
      notif['read'] = true;
    }
    notifyListeners();
  }

  /// Clear all notifications
  void clearAll() {
    _notifications.clear();
    notifyListeners();
  }

  /// Disconnect from WebSocket
  void disconnect() {
    _reconnectTimer?.cancel();
    _channel?.sink.close();
    _isConnected = false;
    _channel = null;
    notifyListeners();
  }

  @override
  void dispose() {
    disconnect();
    super.dispose();
  }
}
