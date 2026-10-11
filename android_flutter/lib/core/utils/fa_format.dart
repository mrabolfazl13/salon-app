/// Persian number/price/date formatting — parity with web `lib/utils.ts`
/// and the fa-IR Intl defaults (Persian calendar) used by the Tauri app.

import 'jalali.dart';

class FaFormat {
  static const _digits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  static String faNum(num value) =>
      value.toString().replaceAllMapped(RegExp(r'\d'), (m) => _digits[int.parse(m[0]!)]);

  /// تبدیل ارقام یک رشته (مثل شماره تلفن) به فارسی
  static String digits(String input) =>
      input.replaceAllMapped(RegExp(r'\d'), (m) => _digits[int.parse(m[0]!)]);

  static String _faGroup(String s) =>
      s.replaceAllMapped(RegExp(r'\d'), (m) => _digits[int.parse(m[0]!)]);

  /// «۱۲۳,۴۵۶ ریال» — همان formatPrice وب
  static String price(num amount) {
    final grouped = amount.round().toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
    return '${_faGroup(grouped)} ریال';
  }

  /// «۱۲۳,۴۵۶ تومان» برای جاهایی که وب تومان نشان می‌دهد
  static String toman(num amount) {
    final grouped = amount.round().toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
    return '${_faGroup(grouped)} تومان';
  }

  /// HH:MM با ارقام فارسی — همان formatTimeFa وب
  static String time(String hhmm) {
    final parts = hhmm.split(':');
    if (parts.length >= 2) {
      return '${_faGroup(parts[0].padLeft(2, '0'))}:${_faGroup(parts[1].padLeft(2, '0'))}';
    }
    return hhmm;
  }

  /// ساعت پایان اسلات = شروع + مدت (دقیقه) — همان getSlotEndTime وب
  static String slotEndTime(String startTime, int durationMinutes) {
    try {
      final parts = startTime.split(':');
      final total = int.parse(parts[0]) * 60 + int.parse(parts[1]) + durationMinutes;
      final h = ((total % 1440) ~/ 60).toString().padLeft(2, '0');
      final m = ((total % 1440) % 60).toString().padLeft(2, '0');
      return time('$h:$m');
    } catch (_) {
      return time(startTime);
    }
  }

  // DateTime.weekday: 1=دوشنبه … 6=شنبه 7=یکشنبه
  static const _weekdays = [
    'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه', 'یکشنبه',
  ];

  static String weekday(DateTime d) => _weekdays[d.weekday - 1];

  static const _jalaliMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
  ];

  /// نام ماه شمسی از تاریخ میلادی
  static String jalaliMonth(DateTime d) {
    final j = JalaliDate.fromGregorian(d);
    return _jalaliMonths[j.month - 1];
  }

  /// روز ماه شمسی با ارقام فارسی
  static String jalaliDay(DateTime d) => faNum(JalaliDate.fromGregorian(d).day);
}
