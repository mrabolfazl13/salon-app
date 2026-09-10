import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_client.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/notification_service.dart';
import '../domain/notification.dart';

class NotificationsState {
  const NotificationsState({
    this.items = const [],
    this.unreadCount = 0,
    this.loading = false,
  });

  final List<NotificationItem> items;
  final int unreadCount;
  final bool loading;

  NotificationsState copyWith({
    List<NotificationItem>? items,
    int? unreadCount,
    bool? loading,
  }) =>
      NotificationsState(
        items: items ?? this.items,
        unreadCount: unreadCount ?? this.unreadCount,
        loading: loading ?? this.loading,
      );
}

class NotificationsController extends Notifier<NotificationsState> {
  NotificationService? _service;
  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  Timer? _reconnectTimer;
  int _retries = 0;
  bool _watchd = false;
  int? _boundUserId;

  NotificationService get _notifications =>
      _service ??= NotificationService(ref.read(apiClientProvider));

  @override
  NotificationsState build() {
    ref.listen(notificationsResetSignalProvider, (_, __) {
      reset();
    });
    ref.onDispose(_teardown);
    return const NotificationsState();
  }

  Future<void> fetchAll() async {
    state = state.copyWith(loading: true);
    try {
      final items = await _notifications.getAll();
      state = state.copyWith(items: items, loading: false);
    } catch (_) {
      state = state.copyWith(loading: false);
    }
  }

  Future<void> fetchUnreadcount() async {
    try {
      final count = await _notifications.getUnreadcount();
      state = state.copyWith(unreadCount: count);
    } catch (_) {
      // silent — mirrored from the original store
    }
  }

  /// Connects the live WebSocket for the authenticated user.
  void connect(int userId) {
    if (_boundUserId == userId && _channel != null) return;
    _teardown();
    _boundUserId = userId;
    _watchd = false;
    _openSocket(userId);
  }

  void _openSocket(int userId) {
    try {
      final url = '${AppConfig.wsBase()}/ws/user/$userId';
      _channel = WebSocketChannel.connect(Uri.parse(url));
      _subscription = _channel!.stream.listen(
        _onMessage,
        onDone: () => _scheduleReconnect(userId),
        onError: (_) => _scheduleReconnect(userId),
      );
      _retries = 0;
    } catch (_) {
      _scheduleReconnect(userId);
    }
  }

  void _scheduleReconnect(int userId) {
    if (_watchd) return;
    _reconnectTimer?.cancel();
    final delay = Duration(
      seconds: (2 * (1 << _retries)).clamp(2, 60),
    );
    _retries = (_retries + 1).clamp(0, 5);
    _reconnectTimer = Timer(delay, () {
      if (!_watchd) _openSocket(userId);
    });
  }

  void _onMessage(dynamic raw) {
    Map<String, dynamic>? payload;
    try {
      final decoded = jsonDecode(raw.toString());
      if (decoded is Map<String, dynamic>) payload = decoded;
    } catch (_) {
      return;
    }
    if (payload == null) return;
    if (payload['type'] != 'user_notification') return;
    final item = NotificationItem(
      id: payload['id'] ?? DateTime.now().millisecondsSinceEpoch,
      userId: null,
      title: (payload['title'] ?? 'اعلان جدید') as String,
      message: (payload['message'] ?? '') as String,
      type: (payload['notif_type'] ?? 'info') as String,
      isRead: false,
      createdAt: DateTime.now(),
      data: payload['data'] is Map
          ? (payload['data'] as Map).map((k, v) => MapEntry('$k', v))
          : const {},
    );
    final exists = state.items.any((x) => x.id == item.id);
    state = state.copyWith(
      items: exists ? state.items : [item, ...state.items].take(30).toList(),
      unreadCount: state.unreadCount + 1,
    );
  }

  Future<void> markAsRead(dynamic id) async {
    final item = state.items.firstWhere((n) => n.id == id);
    // Optimistic update (mirrors the original store).
    state = state.copyWith(
      items: state.items
          .map((n) => n.id == id ? n.markRead() : n)
          .toList(),
      unreadCount: item.isRead
          ? state.unreadCount
          : (state.unreadCount - 1).clamp(0, 1 << 30),
    );
    try {
      await _notifications.markAsRead(id);
    } catch (_) {
      // Resynced on next fetch.
    }
  }

  Future<void> markAllAsRead() async {
    state = state.copyWith(
      items: state.items.map((n) => n.markRead()).toList(),
      unreadCount: 0,
    );
    try {
      await _notifications.markAllAsRead();
    } catch (_) {
      // ignore
    }
  }

  void reset() {
    _teardown();
    state = const NotificationsState();
  }

  void _teardown() {
    _watchd = true;
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _subscription?.cancel();
    _subscription = null;
    _channel?.sink.close();
    _channel = null;
    _boundUserId = null;
  }
}

final notificationsProvider =
    NotifierProvider<NotificationsController, NotificationsState>(
  NotificationsController.new,
);

/// Live-syncs the WebSocket with auth changes (called from the shell).
final notificationsSocketBinder = Provider<void>((ref) {
  final auth = ref.watch(authProvider);
  final controller = ref.read(notificationsProvider.notifier);
  if (auth.isAuthenticated && auth.user != null) {
    Future<void>.microtask(() {
      controller.fetchUnreadcount();
      controller.connect(auth.user!.id);
    });
  }
});
