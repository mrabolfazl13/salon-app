// تست یکپارچگی مسیر رزرو — اجرا روی امولاتور با API واقعی پروداکشن
// ثبت‌نام کاربر جدید → ورود → سالن فوتسال فاتحی قم → اسلات ۲۱:۳۰ فردا → ثبت رزرو
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:salon_app/main.dart' as app;
import 'package:salon_app/core/utils/fa_format.dart';

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  binding.framePolicy = LiveTestWidgetsFlutterBindingFramePolicy.fullyLive;

  testWidgets('register → login → book slot end-to-end', (tester) async {
    app.main();
    await tester.pump(const Duration(seconds: 6));

    Future<void> waitFor(Finder finder, {Duration timeout = const Duration(seconds: 45)}) async {
      final end = DateTime.now().add(timeout);
      while (DateTime.now().isBefore(end)) {
        await tester.pump(const Duration(milliseconds: 300));
        if (finder.evaluate().isNotEmpty) return;
      }
      fail('waitFor timed out: $finder');
    }

    Future<void> tapWhenVisible(Finder finder, {Duration timeout = const Duration(seconds: 45)}) async {
      await waitFor(finder, timeout: timeout);
      await tester.tap(finder, warnIfMissed: false);
      await tester.pump(const Duration(seconds: 1));
    }

    // شماره یکتا در هر اجرا — ۰۹۱۳ + ۷ رقم
    final suffix = (DateTime.now().millisecondsSinceEpoch % 10000000).toString().padLeft(7, '0');
    final phone = '0913$suffix';

    // ---------- صفحه پروفایل → ورود ----------
    await waitFor(find.text('پروفایل'));
    await tester.tap(find.text('پروفایل'), warnIfMissed: false);
    await tester.pump(const Duration(seconds: 2));
    await waitFor(find.text('ورود به حساب'));

    // ---------- ثبت‌نام ----------
    await tapWhenVisible(find.text('ثبت‌نام کنید'));
    await waitFor(find.text('ایجاد حساب کاربری'));

    final fields = find.byType(TextField);
    await tester.ensureVisible(fields.at(0));
    await tester.enterText(fields.at(0), 'کاربر تست امولاتور');
    await tester.enterText(fields.at(1), phone);
    await tester.enterText(fields.at(2), 'test1234');
    await tester.enterText(fields.at(3), 'test1234');
    await tester.pump(const Duration(seconds: 1));

    await tester.ensureVisible(find.byType(Checkbox).first);
    await tester.tap(find.byType(Checkbox).first, warnIfMissed: false);
    await tester.pump(const Duration(milliseconds: 500));

    await tester.ensureVisible(find.text('ثبت‌نام'));
    await tester.tap(find.text('ثبت‌نام'), warnIfMissed: false);
    await waitFor(find.text('ورود به حساب'), timeout: const Duration(seconds: 60));

    // ---------- ورود ----------
    final loginFields = find.byType(TextField);
    await tester.enterText(loginFields.at(0), phone);
    await tester.enterText(loginFields.at(1), 'test1234');
    await tester.pump(const Duration(seconds: 1));
    await tester.tap(find.text('ورود'), warnIfMissed: false);
    await waitFor(find.text('مشاهده سالن‌ها'), timeout: const Duration(seconds: 60));

    // ---------- لیست سالن‌ها → سالن فوتسال فاتحی قم ----------
    await tester.tap(find.text('مشاهده سالن‌ها'), warnIfMissed: false);
    final venue = find.text('سالن فوتسال فاتحی قم').first;
    await waitFor(venue, timeout: const Duration(seconds: 60));
    await tester.tap(venue, warnIfMissed: false);
    await tester.pump(const Duration(seconds: 3));

    // ---------- انتخاب تاریخ فردا ----------
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    final chip = find.text(FaFormat.jalaliDay(tomorrow));
    await tester.dragUntilVisible(chip, find.byType(SingleChildScrollView).first,
        const Offset(0, -120));
    await tester.tap(chip, warnIfMissed: false);
    await tester.pump(const Duration(seconds: 1));

    // ---------- انتخاب اسلات ۲۱:۳۰ ----------
    final slotText = find.text(FaFormat.time('21:30:00'));
    await tester.dragUntilVisible(slotText, find.byType(SingleChildScrollView).first,
        const Offset(0, -250));
    await tester.tap(slotText, warnIfMissed: false);
    await tester.pump(const Duration(seconds: 1));

    // ---------- ثبت رزرو ----------
    await tapWhenVisible(find.text('رزرو سانس'));
    await waitFor(find.text('تأیید رزرو'));
    await tester.tap(find.text('ثبت رزرو'), warnIfMissed: false);
    await waitFor(find.text('رزرو ثبت شد'), timeout: const Duration(seconds: 60));

    expect(find.textContaining('در انتظار تأیید'), findsWidgets);
    // ignore: avoid_print
    print('BOOKING_FLOW_OK phone=$phone');
  });
}
