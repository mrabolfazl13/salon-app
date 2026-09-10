import 'package:flutter/material.dart';

/// Notification model + WebSocket payload.
class NotificationItem {
  const NotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.isRead,
    required this.createdAt,
    this.userId,
    this.data = const {},
  });

  final dynamic id;
  final String title;
  final String message;
  final String type;
  final bool isRead;
  final DateTime? createdAt;
  final int? userId;
  final Map<String, dynamic> data;

  int? get gameId {
    final value = data['game_id'];
    return value is num ? value.toInt() : int.tryParse('$value');
  }

  factory NotificationItem.fromJson(Map<String, dynamic> json) =>
      NotificationItem(
        id: json['id'],
        userId: (json['user_id'] as num?)?.toInt(),
        title: (json['title'] ?? 'اعلان جدید') as String,
        message: (json['message'] ?? '') as String,
        type: (json['type'] ?? 'info') as String,
        isRead: (json['is_read'] ?? false) as bool,
        createdAt: json['created_at'] == null
            ? null
            : DateTime.tryParse(json['created_at'] as String),
        data: json['data'] is Map
            ? (json['data'] as Map).map((k, v) => MapEntry('$k', v))
            : const {},
      );

  NotificationItem markRead() => NotificationItem(
        id: id,
        userId: userId,
        title: title,
        message: message,
        type: type,
        isRead: true,
        createdAt: createdAt,
        data: data,
      );
}

/// Icon/color per notification type — mirrors the original NotificationPanel
/// typeIcons map (24 types).
(IconData, Color) notificationVisual(String type) {
  const map = <String, (IconData, Color)>{
    'booking_confirmed': (Icons.check_circle_outline_rounded, Color(0xFF16A34A)),
    'booking_cancelled': (Icons.cancel_outlined, Color(0xFFDC2626)),
    'booking_rejected': (Icons.cancel_rounded, Color(0xFFDC2626)),
    'new_booking': (Icons.notifications_active_outlined, Color(0xFF2563EB)),
    'competition': (Icons.emoji_events_outlined, Color(0xFFD97706)),
    'contract': (Icons.description_outlined, Color(0xFF7C3AED)),
    'payment': (Icons.credit_score_outlined, Color(0xFF0891B2)),
    'game_created': (Icons.add_circle_outline, Color(0xFF7C3AED)),
    'game_joined': (Icons.group_outlined, Color(0xFF16A34A)),
    'game_left': (Icons.logout_outlined, Color(0xFF6B7280)),
    'game_removed': (Icons.person_remove_outlined, Color(0xFFDC2626)),
    'game_join_request': (Icons.schedule_outlined, Color(0xFFD97706)),
    'game_request_approved': (Icons.verified_outlined, Color(0xFF16A34A)),
    'game_request_rejected': (Icons.cancel_schedule_send_outlined, Color(0xFFDC2626)),
    'game_invitation': (Icons.mark_email_unread_outlined, Color(0xFF7C3AED)),
    'game_invitation_accepted': (Icons.mark_email_read_outlined, Color(0xFF16A34A)),
    'game_waitlist_promoted': (Icons.low_priority_outlined, Color(0xFF0891B2)),
    'game_capacity_changed': (Icons.group_add_outlined, Color(0xFF2563EB)),
    'game_started': (Icons.play_circle_outline, Color(0xFF16A34A)),
    'game_completed': (Icons.flag_outlined, Color(0xFF6B7280)),
    'game_cancelled': (Icons.block_outlined, Color(0xFFDC2626)),
    'game_payment_paid': (Icons.credit_score_outlined, Color(0xFF0891B2)),
    'game': (Icons.sports_esports_outlined, Color(0xFF7C3AED)),
    'info': (Icons.info_outline, Color(0xFF6B7280)),
  };
  return map[type] ?? const (Icons.info_outline, Color(0xFF6B7280));
}