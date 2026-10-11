import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/admin_service.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/utils/jalali.dart';

class AdminUsersScreen extends ConsumerStatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  ConsumerState<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends ConsumerState<AdminUsersScreen> {
  final _searchController = TextEditingController();
  List<dynamic> _users = [];
  String _filter = 'all';
  bool _loading = true;
  bool _acting = false;
  String? _error;

  static const _roles = <String, String>{
    'user': 'کاربر',
    'venue_manager': 'مدیر سالن',
    'club_admin': 'مدیر کلاب',
    'super_admin': 'ادمین',
  };

  static const _filterOptions = <String, String>{
    'all': 'همه',
    'pending_managers': 'مدیران در انتظار',
    'inactive': 'غیرفعال',
  };

  List<dynamic> _pendingManagers = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        AdminService.getUsers(),
        AdminService.getPendingManagers(),
      ]);
      if (!mounted) return;
      setState(() {
        _users = results[0] as List<dynamic>;
        _pendingManagers = results[1] as List<dynamic>;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  List<dynamic> get _visibleUsers {
    final q = _searchController.text.trim().toLowerCase();
    Iterable<dynamic> rows = _users;
    if (_filter == 'inactive') {
      rows = rows.where((u) => u['is_active'] != true);
    } else if (_filter == 'pending_managers') {
      final pendingIds = _pendingManagers
          .map((u) => (u['id'] as num?)?.toInt())
          .whereType<int>()
          .toSet();
      rows = rows.where((u) => pendingIds.contains((u['id'] as num).toInt()));
    }
    if (q.isNotEmpty) {
      rows = rows.where((u) =>
          (u['full_name']?.toString() ?? '').toLowerCase().contains(q) ||
          (u['phone']?.toString() ?? '').contains(q));
    }
    return rows.toList();
  }

  Future<void> _approve(Map<String, dynamic> user) async {
    setState(() => _acting = true);
    try {
      await AdminService.approveUser(user['id'].toString());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('ثبت‌نام تأیید شد'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ));
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('خطا: $e'),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ));
    } finally {
      if (mounted) setState(() => _acting = false);
    }
  }

  Future<void> _reject(Map<String, dynamic> user) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('رد ثبت‌نام'),
        content: Text('ثبت‌نام ${user['full_name'] ?? 'کاربر'} رد شود؟'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('انصراف')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error, foregroundColor: Colors.white),
            child: const Text('رد'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _acting = true);
    try {
      await AdminService.rejectUser(user['id'].toString());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('ثبت‌نام رد شد'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ));
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('خطا: $e'),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ));
    } finally {
      if (mounted) setState(() => _acting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('مدیریت کاربران')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: AppSpacing.md),
                        ElevatedButton(
                            onPressed: _load, child: const Text('تلاش دوباره')),
                      ],
                    ),
                  ),
                )
              : Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (_) => setState(() {}),
                        decoration: InputDecoration(
                          hintText: 'جستجوی نام یا شماره...',
                          prefixIcon: const Icon(Icons.search),
                          border: OutlineInputBorder(
                              borderRadius: AppRadius.mediumBorderRadius),
                        ),
                      ),
                    ),
                    SizedBox(
                      height: 40,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        padding:
                            const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                        children: _filterOptions.entries
                            .map((e) => Padding(
                                  padding:
                                      const EdgeInsets.only(left: AppSpacing.sm),
                                  child: GestureDetector(
                                    onTap: () =>
                                        setState(() => _filter = e.key),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: AppSpacing.md, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: _filter == e.key
                                            ? AppColors.blue
                                            : Colors.transparent,
                                        borderRadius:
                                            AppRadius.chipBorderRadius,
                                        border: Border.all(
                                            color: _filter == e.key
                                                ? AppColors.blue
                                                : Theme.of(context)
                                                    .dividerColor),
                                      ),
                                      child: Text(e.value,
                                          style: AppTypography.caption.copyWith(
                                              color: _filter == e.key
                                                  ? Colors.white
                                                  : Theme.of(context)
                                                      .colorScheme
                                                      .onSurface
                                                      .withOpacity(0.7))),
                                    ),
                                  ),
                                ))
                            .toList(),
                      ),
                    ),
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(AppSpacing.lg),
                          itemCount: _visibleUsers.length,
                          itemBuilder: (context, index) => _buildUserCard(
                              context, _visibleUsers[index]),
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildUserCard(BuildContext context, Map<String, dynamic> user) {
    final name = user['full_name']?.toString() ?? 'کاربر';
    final phone = user['phone']?.toString() ?? '';
    final role = user['role']?.toString() ?? 'user';
    final isActive = user['is_active'] == true;
    final isPending = _pendingManagers.any(
        (m) => (m['id'] as num?)?.toInt() == (user['id'] as num?)?.toInt());
    final createdAt = user['created_at']?.toString();

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark
            ? AppColors.darkSurface
            : Colors.white,
        borderRadius: AppRadius.cardBorderRadius,
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                  radius: 25,
                  backgroundColor: AppColors.blue.withOpacity(0.1),
                  child: Text(name.isNotEmpty ? name.substring(0, 1) : '؟',
                      style: AppTypography.bodyMedium.copyWith(
                          color: AppColors.blue, fontWeight: FontWeight.w700))),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                        style: AppTypography.bodyMedium
                            .copyWith(fontWeight: FontWeight.w700)),
                    Text('$phone • ${_roles[role] ?? role}',
                        style: AppTypography.caption),
                    if (createdAt != null)
                      Text('عضویت: ${JalaliDate.formatIsoDateTime(createdAt)}',
                          style: AppTypography.caption.copyWith(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurface
                                  .withOpacity(0.5))),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                decoration: BoxDecoration(
                  color: (isActive ? AppColors.success : AppColors.error)
                      .withOpacity(0.1),
                  borderRadius: AppRadius.chipBorderRadius,
                ),
                child: Text(isActive ? 'فعال' : 'غیرفعال',
                    style: AppTypography.caption.copyWith(
                        color: isActive ? AppColors.success : AppColors.error,
                        fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          if (isPending && !_acting) ...[
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _approve(user),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.success,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('تأیید ثبت‌نام'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _reject(user),
                    style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error)),
                    child: const Text('رد'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
