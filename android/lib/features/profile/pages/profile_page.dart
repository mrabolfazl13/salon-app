import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/skeletons.dart';
import '../../auth/domain/user.dart';
import '../../auth/providers/auth_provider.dart';

class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  final _name = TextEditingController();
  final _oldPassword = TextEditingController();
  final _newPassword = TextEditingController();
  final _confirmPassword = TextEditingController();
  bool _savingName = false;
  bool _savingPassword = false;

  @override
  void dispose() {
    _name.dispose();
    _oldPassword.dispose();
    _newPassword.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  Future<void> _saveName() async {
    if (_name.text.trim().length < 3) {
      AppSnack.error(context, 'نام باید حداقل ۳ کاراکتر باشد');
      return;
    }
    setState(() => _savingName = true);
    try {
      await ref.read(authProvider.notifier).updateFullName(_name.text.trim());
      if (!mounted) return;
      AppSnack.success(context, 'پروفایل با موفقیت به‌روزرسانی شد!');
    } on ApiException catch (e) {
      if (mounted) AppSnack.error(context, e.message);
    } catch (_) {
      if (mounted) AppSnack.error(context, 'خطا در به‌روزرسانی پروفایل');
    } finally {
      if (mounted) setState(() => _savingName = false);
    }
  }

  Future<void> _savePassword() async {
    if (_newPassword.text.length < 4) {
      AppSnack.error(context, 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد');
      return;
    }
    if (_newPassword.text != _confirmPassword.text) {
      AppSnack.error(context, 'رمز عبور جدید و تکرار آن مطابقت ندارند');
      return;
    }
    setState(() => _savingPassword = true);
    try {
      await ref.read(authProvider.notifier).changePassword(
            oldPassword: _oldPassword.text,
            newPassword: _newPassword.text,
          );
      if (!mounted) return;
      AppSnack.success(context, 'رمز عبور با موفقیت تغییر کرد!');
      _oldPassword.clear();
      _newPassword.clear();
      _confirmPassword.clear();
    } on ApiException catch (e) {
      if (mounted) AppSnack.error(context, e.message);
    } catch (_) {
      if (mounted) AppSnack.error(context, 'خطا در تغییر رمز عبور');
    } finally {
      if (mounted) setState(() => _savingPassword = false);
    }
  }

  Future<void> _logout() async {
    final ok = await showAppConfirm(
      context,
      title: 'خروج از حساب',
      description: 'آیا از خروج از حساب کاربری اطمینان دارید؟',
      confirmText: 'خروج',
      destructive: true,
    );
    if (ok && mounted) {
      await ref.read(authProvider.notifier).logout();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final user = auth.user;

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('پروفایل کاربری')),
        body: const SingleChildScrollView(
          padding: EdgeInsets.all(AppSpacing.xl),
          child: ListTileSkeleton(count: 3, height: 90),
        ),
      );
    }
    if (_name.text.isEmpty && user.fullName.isNotEmpty) {
      _name.text = user.fullName;
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('پروفایل کاربری'),
        actions: [
          TextButton(
            onPressed: _logout,
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('خروج'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.xl),
        children: [
          // Profile header card
          Container(
            padding: const EdgeInsets.all(AppSpacing.xl),
            decoration: BoxDecoration(
              color: Theme.of(context).cardTheme.color,
              borderRadius: BorderRadius.circular(AppRadius.card),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: Column(
              children: [
                Container(
                  width: 84,
                  height: 84,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AppColors.gradientPrimary,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    getInitials(user.fullName),
                    style: const TextStyle(
                      fontFamily: 'Vazirmatn',
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  user.fullName,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  user.role.labelFa,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: AppSpacing.md),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(
                    color: user.isVerified
                        ? AppColors.success.withValues(alpha: 0.1)
                        : Theme.of(context).dividerColor,
                    borderRadius: BorderRadius.circular(99),
                  ),
                  child: Text(
                    user.isVerified ? 'تایید شده' : 'در انتظار تایید',
                    style: TextStyle(
                      fontFamily: 'Vazirmatn',
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: user.isVerified
                          ? AppColors.successDark
                          : Theme.of(context).textTheme.bodySmall?.color,
                    ),
                  ),
                ),
                const Divider(height: AppSpacing.xxl),
                Row(
                  children: [
                    const Icon(Icons.phone_rounded,
                        size: 17, color: AppColors.primary),
                    const SizedBox(width: 8),
                    Text(
                      toPersianDigits(user.phone),
                      style: Theme.of(context).textTheme.bodyMedium,
                      textDirection: TextDirection.ltr,
                    ),
                  ],
                ),
                if (user.createdAt != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today_rounded,
                          size: 16, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Text(
                        'عضویت: ${formatDate(user.createdAt)}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),

          // Quick links
          if (user.role.isManager) ...[
            _LinkTile(
              icon: Icons.dashboard_outlined,
              title: 'داشبورد مدیریت',
              onTap: () => context.push('/manager-dashboard'),
            ),
          ] else
            _LinkTile(
              icon: Icons.dashboard_outlined,
              title: 'داشبورد',
              onTap: () => context.push('/dashboard'),
            ),
          if (user.role.isAdmin)
            _LinkTile(
              icon: Icons.admin_panel_settings_outlined,
              title: 'پنل ادمین',
              onTap: () => context.push('/admin'),
            ),
          _LinkTile(
            icon: Icons.description_outlined,
            title: 'قراردادها',
            onTap: () => context.push('/contracts'),
          ),
          _LinkTile(
            icon: Icons.emoji_events_outlined,
            title: 'رقابت‌ها',
            onTap: () => context.push('/competitions'),
          ),
          const SizedBox(height: AppSpacing.lg),

          // Edit profile
          _SectionCard(
            title: 'اطلاعات شخصی',
            children: [
              AppTextField(
                controller: _name,
                label: 'نام کامل',
                prefixIcon: Icons.person_outline_rounded,
              ),
              const SizedBox(height: AppSpacing.md),
              AppTextField(
                controller: TextEditingController(text: user.phone),
                label: 'شماره موبایل',
                enabled: false,
                ltr: true,
              ),
              const SizedBox(height: 4),
              Align(
                alignment: AlignmentDirectional.centerStart,
                child: Text(
                  'شماره موبایل قابل تغییر نیست',
                  style: Theme.of(context).textTheme.labelSmall,
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              AppGradientButton(
                label: 'ذخیره تغییرات',
                loading: _savingName,
                onPressed: _saveName,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),

          // Change password
          _SectionCard(
            title: 'تغییر رمز عبور',
            children: [
              AppTextField(
                controller: _oldPassword,
                label: 'رمز عبور فعلی',
                obscure: true,
              ),
              const SizedBox(height: AppSpacing.md),
              AppTextField(
                controller: _newPassword,
                label: 'رمز عبور جدید',
                obscure: true,
              ),
              const SizedBox(height: AppSpacing.md),
              AppTextField(
                controller: _confirmPassword,
                label: 'تکرار رمز عبور جدید',
                obscure: true,
              ),
              const SizedBox(height: AppSpacing.lg),
              AppGradientButton(
                label: 'تغییر رمز عبور',
                loading: _savingPassword,
                onPressed: _savePassword,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LinkTile extends StatelessWidget {
  const _LinkTile({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: ListTile(
        onTap: onTap,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.image),
          side: BorderSide(color: Theme.of(context).dividerColor),
        ),
        tileColor: Theme.of(context).cardTheme.color,
        leading: Icon(icon, color: AppColors.primary),
        title: Text(title, style: Theme.of(context).textTheme.titleSmall),
        trailing: const Icon(Icons.chevron_left, size: 20),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: AppSpacing.lg),
          ...children,
        ],
      ),
    );
  }
}
