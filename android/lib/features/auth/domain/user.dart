enum UserRole { user, venueManager, clubAdmin, superAdmin }

UserRole? userRoleFrom(String? raw) => switch (raw) {
      'user' => UserRole.user,
      'venue_manager' => UserRole.venueManager,
      'club_admin' => UserRole.clubAdmin,
      'super_admin' => UserRole.superAdmin,
      _ => null,
    };

extension UserRoleX on UserRole {
  String get wire => switch (this) {
        UserRole.user => 'user',
        UserRole.venueManager => 'venue_manager',
        UserRole.clubAdmin => 'club_admin',
        UserRole.superAdmin => 'super_admin',
      };

  String get labelFa => switch (this) {
        UserRole.user => 'کاربر',
        UserRole.venueManager => 'مدیر سالن',
        UserRole.clubAdmin => 'مدیر باشگاه',
        UserRole.superAdmin => 'مدیر کل',
      };

  bool get isManager =>
      this == UserRole.venueManager ||
      this == UserRole.clubAdmin ||
      this == UserRole.superAdmin;

  bool get isAdmin => this == UserRole.superAdmin;
}

class User {
  const User({
    required this.id,
    required this.phone,
    required this.fullName,
    required this.role,
    this.isActive = true,
    this.isVerified = false,
    this.createdAt,
  });

  final int id;
  final String phone;
  final String fullName;
  final UserRole role;
  final bool isActive;
  final bool isVerified;
  final DateTime? createdAt;

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: (json['id'] as num).toInt(),
        phone: (json['phone'] ?? '') as String,
        fullName: (json['full_name'] ?? '') as String,
        role: userRoleFrom(json['role'] as String?) ?? UserRole.user,
        isActive: (json['is_active'] ?? true) as bool,
        isVerified: (json['is_verified'] ?? false) as bool,
        createdAt: json['created_at'] == null
            ? null
            : DateTime.tryParse(json['created_at'] as String),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'phone': phone,
        'full_name': fullName,
        'role': role.wire,
        'is_active': isActive,
        'is_verified': isVerified,
        'created_at': createdAt?.toIso8601String(),
      };
}
