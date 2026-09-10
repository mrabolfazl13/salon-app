import 'package:intl/intl.dart';
import 'package:shamsi_date/shamsi_date.dart' as shamsi;

import '../constants/app_constants.dart';

final _faNumber = NumberFormat.decimalPattern('fa_IR');
final _enNumber = NumberFormat.decimalPattern('en_US');

/// Persian-digit grouped number, e.g. ۳۸۰٬۰۰۰
String formatFaNumber(num value) => _faNumber.format(value);

/// English-digit grouped number, e.g. 380,000
String formatEnNumber(num value) => _enNumber.format(value);

/// Persian price with تومان suffix, e.g. «۳۸۰٬۰۰۰ تومان»
String formatPrice(num value) => '${_faNumber.format(value)} تومان';

/// ۴۵۰٬۰۰۰ without unit.
String formatPriceOnly(num value) => _faNumber.format(value);

/// Converts a compact price (short form) — e.g. ۱۲٫۵ هزار.
String formatPriceCompact(num value) {
  if (value >= 1000000) {
    final m = value / 1000000;
    final text = m == m.truncateToDouble()
        ? formatFaNumber(m.truncate())
        : formatFaNumber(double.parse(m.toStringAsFixed(1)));
    return '$text میلیون تومان';
  }
  if (value >= 1000) {
    return '${formatFaNumber((value / 1000).truncate())} هزار تومان';
  }
  return formatPrice(value);
}

final _faDigitMap = {
  '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
  '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹',
};

/// Converts every ASCII digit in [input] to its Persian counterpart.
String toPersianDigits(String input) =>
    input.splitMapJoin('', onNonMatch: (ch) => _faDigitMap[ch] ?? ch);

/// Converts Persian/Arabic-Indic digits to ASCII digits.
String toEnglishDigits(String input) {
  final buffer = StringBuffer();
  for (final ch in input.runes) {
    if (ch >= 0x06F0 && ch <= 0x06F9) {
      buffer.writeCharCode(ch - 0x06F0 + 0x30);
    } else if (ch >= 0x0660 && ch <= 0x0669) {
      buffer.writeCharCode(ch - 0x0660 + 0x30);
    } else {
      buffer.writeCharCode(ch);
    }
  }
  return buffer.toString();
}

/// Strips every non-digit character.
String digitsOnly(String input) =>
    toEnglishDigits(input).replaceAll(RegExp(r'[^0-9]'), '');

/// Formats "HH:MM[:SS]" as «۱۸:۰۰». Empty input → «—».
String formatTimeFa(String? time) {
  if (time == null || time.isEmpty) return '—';
  final raw = time.length >= 5 ? time.substring(0, 5) : time;
  return toPersianDigits(raw);
}

/// Raw "HH:MM" (English digits) for compact displays.
String formatTimeRaw(String? time) {
  if (time == null || time.isEmpty) return '--:--';
  return time.length >= 5 ? time.substring(0, 5) : time;
}

/// End time of a slot: start + duration (defaults to 90 min like the backend).
String slotEndTime(String startTime, int? durationMin) {
  final parts = formatTimeRaw(startTime).split(':');
  final h = int.tryParse(parts.isNotEmpty ? parts[0] : '') ?? 0;
  final m = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
  final total = h * 60 + m + (durationMin ?? 90);
  final endH = (total ~/ 60) % 24;
  final endM = total % 60;
  String two(int v) => v.toString().padLeft(2, '0');
  return '${two(endH)}:${two(endM)}';
}

DateTime? _tryParseDate(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  final text = value.toString();
  return DateTime.tryParse(text)?.toLocal();
}

/// Jalali long date, e.g. «۲۴ شهریور ۱۴۰۴».
String formatDate(dynamic value) {
  final dt = _tryParseDate(value);
  if (dt == null) return '—';
  final j = shamsi.Jalali.fromDateTime(dt);
  return '${toPersianDigits(j.day.toString())} '
      '${Appconstants.jalaliMonths[j.month - 1]} '
      '${toPersianDigits(j.year.toString())}';
}

/// Jalali numeric date, e.g. «۱۴۰۴/۰۶/۲۴».
String formatDateNumeric(dynamic value) {
  final dt = _tryParseDate(value);
  if (dt == null) return '—';
  final j = shamsi.Jalali.fromDateTime(dt);
  String two(int v) => v.toString().padLeft(2, '0');
  return toPersianDigits(
      '${j.year}/${two(j.month)}/${two(j.day)}');
}

/// Jalali date + time, e.g. «۲۴ شهریور ۱۴۰۴، ۱۸:۰۰».
String formatDateTime(dynamic value) {
  final dt = _tryParseDate(value);
  if (dt == null) return '—';
  String two(int v) => v.toString().padLeft(2, '0');
  return '${formatDate(dt)}، '
      '${toPersianDigits('${two(dt.hour)}:${two(dt.minute)}')}';
}

/// yyyy/mm/dd HH:mm numeric Persian.
String formatDateTimeNumeric(dynamic value) {
  final dt = _tryParseDate(value);
  if (dt == null) return '—';
  final j = shamsi.Jalali.fromDateTime(dt);
  String two(int v) => v.toString().padLeft(2, '0');
  return toPersianDigits(
      '${j.year}/${two(j.month)}/${two(j.day)} '
      '${two(dt.hour)}:${two(dt.minute)}');
}

/// Used by game cards: «۱۴۰۴/۰۶/۱۹ - ۱۸:۰۰».
String formatGameDateTime(String? slotDate, String? startTime) {
  if (slotDate == null || slotDate.isEmpty) return '—';
  final date = formatDateNumeric(slotDate);
  final time = startTime == null || startTime.isEmpty
      ? ''
      : ' - ${toPersianDigits(startTime.length >= 5 ? startTime.substring(0, 5) : startTime)}';
  return '$date$time';
}

/// Relative time in Persian: «همین حالا», «۵ دقیقه پیش», ...
String timeAgo(dynamic value) {
  final dt = _tryParseDate(value);
  if (dt == null) return '—';
  final diff = DateTime.now().difference(dt);
  if (diff.inSeconds < 60) return 'همین حالا';
  if (diff.inMinutes < 60) return '${toPersianDigits(diff.inMinutes.toString())} دقیقه پیش';
  if (diff.inHours < 24) return '${toPersianDigits(diff.inHours.toString())} ساعت پیش';
  if (diff.inDays < 30) return '${toPersianDigits(diff.inDays.toString())} روز پیش';
  return formatDate(dt);
}

/// ISO date (yyyy-MM-dd) in local time.
String isoDate(DateTime dt) {
  String two(int v) => v.toString().padLeft(2, '0');
  return '${dt.year}-${two(dt.month)}-${two(dt.day)}';
}

/// Parses "HH:MM" into minutes since midnight.
int? timeToMinutes(String? time) {
  if (time == null || time.isEmpty) return null;
  final parts = toEnglishDigits(time).split(':');
  final h = int.tryParse(parts.first) ?? 0;
  final m = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
  return h * 60 + m;
}

/// First letters of words (up to 2) for avatars.
String getInitials(String? name) {
  if (name == null || name.trim().isEmpty) return 'ک';
  final words = name.trim().split(RegExp(r'\s+'));
  final buffer = StringBuffer();
  for (final word in words) {
    if (word.isNotEmpty) buffer.write(word[0]);
    if (buffer.length >= 2) break;
  }
  return buffer.toString();
}

String truncateText(String text, [int length = 50]) =>
    text.length <= length ? text : '${text.substring(0, length)}…';
