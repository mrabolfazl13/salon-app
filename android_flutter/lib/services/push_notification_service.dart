/// Push Notification Service - Firebase Cloud Messaging (FCM)
///
/// Handles:
/// - FCM token generation and registration with backend
/// - Foreground notification handling
/// - Background notification handling
/// - Notification tap actions
library;

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../core/network/api_client.dart';

/// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('🔔 [FCM Background] Message ID: ${message.messageId}');
  debugPrint('   Title: ${message.notification?.title}');
  debugPrint('   Body: ${message.notification?.body}');
  debugPrint('   Data: ${message.data}');
}

class PushNotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final Dio _apiService = ApiClient.instance;

  String? _fcmToken;
  bool _isInitialized = false;

  /// Get current FCM token
  String? get fcmToken => _fcmToken;

  /// Check if service is initialized
  bool get isInitialized => _isInitialized;

  /// Initialize FCM and register with backend
  Future<void> initialize() async {
    if (_isInitialized) {
      debugPrint('⚠️ [FCM] Already initialized, skipping');
      return;
    }

    try {
      debugPrint('🚀 [FCM] Initializing...');

      // Request permission (iOS/macOS)
      await _requestPermission();

      // Get FCM token
      _fcmToken = await _messaging.getToken();
      debugPrint('✅ [FCM] Token received: ${_fcmToken?.substring(0, 20)}...');

      // Listen for token refresh
      _messaging.onTokenRefresh.listen(_onTokenRefresh);

      // Setup foreground message handler
      _setupForegroundHandler();

      // Register token with backend
      if (_fcmToken != null && _fcmToken!.isNotEmpty) {
        await _registerTokenWithBackend(_fcmToken!);
      }

      _isInitialized = true;
      debugPrint('✅ [FCM] Initialization complete');
    } catch (e) {
      debugPrint('❌ [FCM] Initialization failed: $e');
      rethrow;
    }
  }

  /// Request notification permission (iOS/macOS)
  Future<void> _requestPermission() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    debugPrint('📱 [FCM] Permission status: ${settings.authorizationStatus}');

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      debugPrint('⚠️ [FCM] User denied notification permission');
    }
  }

  /// Handle token refresh
  void _onTokenRefresh(String newToken) {
    debugPrint('🔄 [FCM] Token refreshed');
    _fcmToken = newToken;

    // Register new token with backend
    _registerTokenWithBackend(newToken);
  }

  /// Setup foreground message handler
  void _setupForegroundHandler() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('🔔 [FCM Foreground] Received message');
      debugPrint('   Title: ${message.notification?.title}');
      debugPrint('   Body: ${message.notification?.body}');
      debugPrint('   Data: ${message.data}');

      // Show local notification or update UI
      _handleForegroundNotification(message);
    });

    // Handle when user taps notification while app is in background
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('👆 [FCM] Notification tapped');
      _handleNotificationTap(message);
    });

    // Check if app was opened from notification
    _checkInitialMessage();
  }

  /// Handle foreground notification
  void _handleForegroundNotification(RemoteMessage message) {
    // TODO: Show custom in-app notification
    // For now, just log it
    final title = message.notification?.title ?? 'اعلان جدید';
    final body = message.notification?.body ?? '';

    debugPrint('📢 [FCM] Showing notification: $title - $body');
  }

  /// Handle notification tap
  void _handleNotificationTap(RemoteMessage message) {
    debugPrint('👆 [FCM] Handling notification tap');

    final data = message.data;
    final type = data['type'] as String?;

    switch (type) {
      case 'booking_confirmed':
        // Navigate to booking detail
        final bookingId = data['booking_id'];
        debugPrint('   → Navigate to booking: $bookingId');
        // TODO: Use GoRouter to navigate
        break;

      case 'booking_reminder':
        // Navigate to booking detail
        final bookingId = data['booking_id'];
        debugPrint('   → Navigate to booking reminder: $bookingId');
        break;

      case 'waitlist_accepted':
        // Navigate to venue/slot
        final slotId = data['slot_id'];
        debugPrint('   → Navigate to waitlist accepted: $slotId');
        break;

      case 'payment_received':
        // Navigate to payment detail
        final paymentId = data['payment_id'];
        debugPrint('   → Navigate to payment: $paymentId');
        break;

      default:
        debugPrint('   → Unknown notification type: $type');
    }
  }

  /// Check if app was opened from notification
  Future<void> _checkInitialMessage() async {
    final RemoteMessage? initialMessage = await _messaging.getInitialMessage();

    if (initialMessage != null) {
      debugPrint('🚀 [FCM] App opened from notification');
      _handleNotificationTap(initialMessage);
    }
  }

  /// Register FCM token with backend
  Future<void> _registerTokenWithBackend(String token) async {
    try {
      debugPrint('📤 [FCM] Registering token with backend...');

      final response = await _apiService.post(
        '/users/me/fcm-token',
        data: {'fcm_token': token},
      );

      if (response.statusCode == 200) {
        debugPrint('✅ [FCM] Token registered successfully');
      } else {
        debugPrint('❌ [FCM] Failed to register token: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('❌ [FCM] Error registering token: $e');
    }
  }

  /// Unregister FCM token (logout)
  Future<void> unregisterToken() async {
    if (_fcmToken == null) return;

    try {
      debugPrint('📤 [FCM] Unregistering token...');

      await _apiService.delete('/users/me/fcm-token');

      await _messaging.deleteToken();
      _fcmToken = null;

      debugPrint('✅ [FCM] Token unregistered');
    } catch (e) {
      debugPrint('❌ [FCM] Error unregistering token: $e');
    }
  }

  /// Subscribe to topic
  Future<void> subscribeToTopic(String topic) async {
    await _messaging.subscribeToTopic(topic);
    debugPrint('✅ [FCM] Subscribed to topic: $topic');
  }

  /// Unsubscribe from topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _messaging.unsubscribeFromTopic(topic);
    debugPrint('✅ [FCM] Unsubscribed from topic: $topic');
  }
}

// Singleton instance
final pushNotificationService = PushNotificationService();
