/// Jalali (Shamsi) date conversion utilities — pure Dart, no extra deps.
/// Based on the algorithm from Rooznameh.ir / JDF library.

class JalaliDate {
  final int year;
  final int month;
  final int day;

  const JalaliDate(this.year, this.month, this.day);

  /// Convert Gregorian DateTime to Jalali
  static JalaliDate fromGregorian(DateTime gregorian) {
    final gy = gregorian.year;
    final gm = gregorian.month;
    final gd = gregorian.day;

    final gDaysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (_isLeap(gy)) gDaysInMonth[2] = 29;

    var gy2 = (gm > 2) ? gy + 1 : gy;
    var days = 355666 + (365 * gy) + ((gy2 + 3) ~/ 4) - ((gy2 + 99) ~/ 100) + ((gy2 + 399) ~/ 400) + gd;
    for (var i = 0; i < gm; i++) days += gDaysInMonth[i];

    var jy = -1595 + (33 * (days ~/ 12053));
    days %= 12053;
    jy += 4 * (days ~/ 1461);
    days %= 1461;

    if (days > 365) {
      jy += (days - 1) ~/ 365;
      days = (days - 1) % 365;
    }

    int jm, jd;
    if (days < 186) {
      jm = 1 + (days ~/ 31);
      jd = 1 + (days % 31);
    } else {
      jm = 7 + ((days - 186) ~/ 30);
      jd = 1 + ((days - 186) % 30);
    }

    return JalaliDate(jy, jm, jd);
  }

  static bool _isLeap(int year) =>
      (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);

  /// Format as Persian string with Persian digits: ۱۴۰۳/۰۸/۱۵
  String toPersianString() {
    return '${_toPersianDigits(year.toString())}/${_toPersianDigits(month.toString().padLeft(2, '0'))}/${_toPersianDigits(day.toString().padLeft(2, '0'))}';
  }

  /// Format with relative time: "امروز ۱۸:۰۰" or "فردا ۲۰:۰۰"
  static String formatRelative(DateTime dateTime, String timeStr) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final target = DateTime(dateTime.year, dateTime.month, dateTime.day);
    final diff = target.difference(today).inDays;

    final persianTime = _timeToPersian(timeStr);

    if (diff == 0) return 'امروز $persianTime';
    if (diff == 1) return 'فردا $persianTime';
    if (diff == -1) return 'دیروز $persianTime';

    final jalali = fromGregorian(dateTime);
    return '${jalali.toPersianString()} - ساعت $persianTime';
  }

  /// Public wrapper — private helpers are not visible outside this library.
  static String timeToPersian(String time) => _timeToPersian(time);

  static String _timeToPersian(String time) {
    // Handle "HH:MM" or "HH:MM:SS"
    final parts = time.split(':');
    if (parts.length >= 2) {
      return '${_toPersianDigits(parts[0].padLeft(2, '0'))}:${_toPersianDigits(parts[1].padLeft(2, '0'))}';
    }
    return time;
  }

  static String _toPersianDigits(String input) {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return input.split('').map((c) {
      if (c.codeUnitAt(0) >= 48 && c.codeUnitAt(0) <= 57) {
        return persianDigits[c.codeUnitAt(0) - 48];
      }
      return c;
    }).join('');
  }

  /// Parse ISO date string and format as Jalali Persian
  static String formatIsoDate(String isoDate) {
    try {
      final dt = DateTime.parse(isoDate);
      return fromGregorian(dt).toPersianString();
    } catch (_) {
      return isoDate;
    }
  }

  /// Format full date+time: "۱۴۰۳/۰۸/۱۵ - ساعت ۱۸:۰۰"
  static String formatIsoDateTime(String isoDate) {
    try {
      final dt = DateTime.parse(isoDate);
      final jalali = fromGregorian(dt);
      final time = '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
      return '${jalali.toPersianString()} - ساعت ${_timeToPersian(time)}';
    } catch (_) {
      return isoDate;
    }
  }
}
