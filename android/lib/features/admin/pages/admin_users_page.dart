import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/skeletons.dart';
import '../../../core/widgets/states.dart';
import '../domain/admin.dart';
import '../providers/admin_provider.dart';

class AdminUsersPage extends ConsumerStatefulWidget {
  const AdminUsersPage({super.key});

  @override
  ConsumerState<AdminUsersPage> createState() => _AdminUsersPageState();
}

class _AdminUsersPageState extends ConsumerState<AdminUsersPage> {
  List<AdminUser> _users = [];
  List<AdminUser> _pending = [];
  bool _loading = true;
  String _tab = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final users = await ref.read(adminServiceProvider).getUsers();
      List<AdminUser> pending = [];
      try {
        pending = await ref.read(adminServiceProvider).getPendingManagers();
      } catch (_) {
        pending = [];
      }
      if (!mounted) return;
      setState(() {
        _users = users;
        _pending = pending;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _approve(AdminUser user) async {
    try {
      await ref.read(adminServiceProvider).approveUser(user.id);
      if (!mounted) return;
      AppSnack.success(context, 'کاربر تایید شد ✅');
      _load();
    } on ApiException catch (e) {
      if (mounted) AppSnack.error(context, e.message);
    }
  }

  Future<void> _reject(AdminUser user) async {
    try {
      await ref.read(adminServiceProvider).rejectUser(user.id);
      if (!mounted) return;
      AppSnack.info(context, 'درخواست کاربر رد شد');
      _load();
    } on ApiException catch (e) {
      if (mounted) AppSnack.error(context, e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final shown =
        _tab == 'pending' ? _pending : _users;
    return Scaffold(
      appBar: AppBar(title: const Text('مدیریت کاربران')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'all', label: Text('همه کاربران')),
                ButtonSegment(value: 'pending', label: Text('در انتظار تایید')),
              ],
              selected: {_tab},
              onSelectionChanged: (s) => setState(() => _tab = s.first),
            ),
          ),
          Expanded(
            child: _loading
                ? const SingleChildScrollView(
                    padding: EdgeInsets.all(AppSpacing.xl),
                    child: ListTileSkeleton(count: 4, height: 70),
                  )
                : shown.isEmpty
                    ? EmptyState(
                        emoji: _tab == 'pending' ? '✅' : '👥',
                        title: _tab == 'pending'
                            ? 'درخواست تاییدی وجود ندارد'
                            : 'کاربری یافت نشد',
                      )
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(
                            AppSpacing.xl, 0, AppSpacing.xl, AppSpacing.xxxl,
                          ),
                          itemCount: shown.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: AppSpacing.sm),
                          itemBuilder: (context, index) {
                            final user = shown[index];
                            final needsApproval = _tab == 'pending';
                            return ListTile(
                              shape: RoundedRectangleBorder(
                                borderRadius:
                                    BorderRadius.circular(AppRadius.image),
                                side: BorderSide(
                                  color: Theme.of(context).dividerColor,
                                ),
                              ),
                              tileColor: Theme.of(context).cardTheme.color,
                              leading: CircleAvatar(
                                backgroundColor: AppColors.primary,
                                child: Text(
                                  user.fullName.isNotEmpty
                                      ? user.fullName.characters.first
                                      : 'ک',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                              title: Text(
                                user.fullName,
                                style: Theme.of(context).textTheme.titleSmall,
                              ),
                              subtitle: Text(
                                '${toPersianDigits(user.phone)} • ${user.role}',
                                textDirection: TextDirection.ltr,
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                              trailing: needsApproval
                                  ? Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        IconButton(
                                          icon: const Icon(
                                            Icons.check_circle_rounded,
                                            color: AppColors.success,
                                          ),
                                          onPressed: () => _approve(user),
                                        ),
                                        IconButton(
                                          icon: const Icon(
                                            Icons.cancel_rounded,
                                            color: AppColors.error,
                                          ),
                                          onPressed: () => _reject(user),
                                        ),
                                      ],
                                    )
                                  : Icon(
                                      user.isVerified
                                          ? Icons.verified_rounded
                                          : Icons.verified_outlined,
                                      color: user.isVerified
                                          ? AppColors.success
                                          : AppColors.lightTextMuted,
                                      size: 20,
                                    ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
