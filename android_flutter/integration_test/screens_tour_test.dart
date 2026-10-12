// تور کامل صفحه‌ها روی امولاتور با API واقعی — از هر صفحه اسکرین‌شات گرفته می‌شود
// اجرا با flutter drive (درایور test_driver/integration_test.dart) تا اسکرین‌شات‌ها ذخیره شوند
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:integration_test/integration_test.dart';

import 'package:salon_app/main.dart' as app;
import 'package:salon_app/app/router/app_router.dart';

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  binding.framePolicy = LiveTestWidgetsFlutterBindingFramePolicy.fullyLive;

  testWidgets('screens tour with screenshots', (tester) async {
    app.main();
    await tester.pump(const Duration(seconds: 6));

    Future<void> idle(Duration d) async {
      final end = DateTime.now().add(d);
      while (DateTime.now().isBefore(end)) {
        await tester.pump(const Duration(milliseconds: 300));
      }
    }

    Future<void> shot(String name) async {
      await binding.takeScreenshot(name);
      // ignore: avoid_print
      print('TOUR_SHOT $name');
    }

    Future<void> visit(String name, String route, {Duration wait = const Duration(seconds: 5)}) async {
      final ctx = tester.element(find.byType(Navigator).first);
      ProviderScope.containerOf(ctx, listen: false).read(appRouterProvider).go(route);
      await idle(wait);
      await shot(name);
    }

    Future<void> fillAndTapLogin(String phone, String password, Finder successMarker) async {
      final fields = find.byType(TextField);
      await tester.ensureVisible(fields.at(0));
      await tester.enterText(fields.at(0), phone);
      await tester.ensureVisible(fields.at(1));
      await tester.enterText(fields.at(1), password);
      await tester.pump(const Duration(seconds: 1));
      FocusManager.instance.primaryFocus?.unfocus();
      await tester.pump(const Duration(milliseconds: 500));

      final btn = find.text('ورود');
      await tester.ensureVisible(btn);
      await tester.pump(const Duration(milliseconds: 400));
      if (btn.evaluate().isNotEmpty) {
        await tester.tap(btn, warnIfMissed: false);
      }
      var graceUntil = DateTime.now().add(const Duration(seconds: 10));
      final end = DateTime.now().add(const Duration(seconds: 90));
      var ok = false;
      while (DateTime.now().isBefore(end) && !ok) {
        await tester.pump(const Duration(milliseconds: 500));
        if (successMarker.evaluate().isNotEmpty) {
          ok = true;
          break;
        }
        if (DateTime.now().isAfter(graceUntil)) {
          final b = find.text('ورود');
          final btnBack = b.evaluate().isNotEmpty;
          final loading = find.byType(CircularProgressIndicator).evaluate().isNotEmpty;
          if (btnBack && !loading) {
            await tester.ensureVisible(b);
            await tester.pump(const Duration(milliseconds: 400));
            if (b.evaluate().isNotEmpty) {
              await tester.tap(b, warnIfMissed: false);
              await tester.pump(const Duration(milliseconds: 300));
            }
            graceUntil = DateTime.now().add(const Duration(seconds: 10));
          }
        }
      }
      if (!ok) fail('login failed for $phone');
      await idle(const Duration(seconds: 2));
    }

    // ---------- مهمان ----------
    await visit('01-guest-home', '/');
    await visit('02-guest-search', '/search');
    await visit('03-guest-favorites', '/favorites');
    await visit('04-login', '/login', wait: const Duration(seconds: 3));
    await visit('05-register', '/register', wait: const Duration(seconds: 3));
    await visit('06-forgot-password', '/forgot-password', wait: const Duration(seconds: 3));

    // ---------- ورود کاربر عادی (کاربر تست تأییدشده) ----------
    await visit('07-login-screen', '/login', wait: const Duration(seconds: 3));
    await fillAndTapLogin('09351234501', 'Test1234', find.text('رزرو جدید'));
    await shot('08-dashboard-user');

    // گارد نقش: کاربر عادی نباید به /admin برسد — باید به داشبورد برگردد
    await visit('09-role-guard-admin-redirect', '/admin', wait: const Duration(seconds: 4));
    if (find.text('دسترسی سریع').evaluate().isEmpty) {
      fail('role guard failed: normal user reached admin');
    }

    // ---------- صفحه‌های کاربر ----------
    await visit('10-venues', '/venues');
    await visit('11-venue-detail', '/venues/8', wait: const Duration(seconds: 7));
    await visit('12-bookings', '/bookings');
    await visit('13-teams', '/teams');
    await visit('14-team-discover', '/teams/discover');
    await visit('15-competitions', '/competitions');
    await visit('16-deals', '/deals');
    await visit('17-quiz', '/quiz');
    await visit('18-contracts', '/contracts');
    await visit('19-games', '/games');
    await visit('20-profile', '/profile', wait: const Duration(seconds: 6));

    // ---------- خروج و ورود به‌عنوان super_admin (کاربر فقط-خواندنی سید‌شده) ----------
    final logoutTile = find.text('خروج از حساب');
    await tester.ensureVisible(logoutTile);
    await tester.tap(logoutTile, warnIfMissed: false);
    await tester.pump(const Duration(seconds: 1));
    final confirm = find.text('خروج').last;
    if (confirm.evaluate().isNotEmpty) {
      await tester.tap(confirm, warnIfMissed: false);
    }
    await idle(const Duration(seconds: 3));

    await visit('21-login-screen-2', '/login', wait: const Duration(seconds: 3));
    await fillAndTapLogin('09123456789', 'admin123', find.text('کاربران'));
    await visit('22-admin-dashboard', '/admin', wait: const Duration(seconds: 6));
    await visit('23-admin-users', '/admin/users');
    await visit('24-admin-venues', '/admin/venues');
    await visit('25-manager-hub-superadmin', '/manager', wait: const Duration(seconds: 6));

    // ignore: avoid_print
    print('TOUR_OK');
  });
}
