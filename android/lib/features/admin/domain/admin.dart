/// Admin domain models — mirrors backend admin responses.
class AdminUser {
  const AdminUser({
    required this.id,
    required this.phone,
    required this.fullName,
    required this.role,
    required this.isActive,
    required this.isVerified,
    this.createdAt,
    this.lastLogin,
  });

  final int id;
  final String phone;
  final String fullName;
  final String role;
  final bool isActive;
  final bool isVerified;
  final DateTime? createdAt;
  final DateTime? lastLogin;

  factory AdminUser.fromJson(Map<String, dynamic> json) => AdminUser(
        id: (json['id'] as num).toInt(),
        phone: (json['phone'] ?? '') as String,
        fullName: (json['full_name'] ?? '') as String,
        role: (json['role'] ?? 'user') as String,
        isActive: (json['is_active'] ?? true) as bool,
        isVerified: (json['is_verified'] ?? false) as bool,
        createdAt: json['created_at'] == null
            ? null
            : DateTime.tryParse(json['created_at'] as String),
        lastLogin: json['last_login'] == null
            ? null
            : DateTime.tryParse(json['last_login'] as String),
      );
}

class UserStats {
  const UserStats({
    required this.totalUsers,
    required this.activeUsers,
    required this.inactiveUsers,
    required this.verifiedUsers,
    required this.unverifiedUsers,
    required this.byRole,
  });

  final int totalUsers;
  final int activeUsers;
  final int inactiveUsers;
  final int verifiedUsers;
  final int unverifiedUsers;
  final Map<String, int> byRole;

  factory UserStats.fromJson(Map<String, dynamic> json) => UserStats(
        totalUsers: (json['total_users'] as num?)?.toInt() ?? 0,
        activeUsers: (json['active_users'] as num?)?.toInt() ?? 0,
        inactiveUsers: (json['inactive_users'] as num?)?.toInt() ?? 0,
        verifiedUsers: (json['verified_users'] as num?)?.toInt() ?? 0,
        unverifiedUsers: (json['unverified_users'] as num?)?.toInt() ?? 0,
        byRole: (json['by_role'] as Map? ?? {})
            .map((k, v) => MapEntry('$k', (v as num?)?.toInt() ?? 0)),
      );
}

class VenueStats {
  const VenueStats({
    required this.totalVenues,
    required this.verifiedVenues,
    required this.pendingVenues,
  });

  final int totalVenues;
  final int verifiedVenues;
  final int pendingVenues;

  factory VenueStats.fromJson(Map<String, dynamic> json) => VenueStats(
        totalVenues: (json['total_venues'] as num?)?.toInt() ?? 0,
        verifiedVenues: (json['verified_venues'] as num?)?.toInt() ?? 0,
        pendingVenues: (json['pending_venues'] as num?)?.toInt() ?? 0,
      );
}
