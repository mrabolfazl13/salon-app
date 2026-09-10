import 'package:flutter_test/flutter_test.dart';

import 'package:salon_app/core/utils/formatters.dart';

void main() {
  group('digit conversion', () {
    test('toPersianDigits converts ASCII digits', () {
      expect(toPersianDigits('0912'), '۰۹۱۲');
    });

    test('toEnglishDigits converts Persian digits', () {
      expect(toEnglishDigits('۰۹۱۲'), '0912');
    });

    test('digitsOnly strips separators', () {
      expect(digitsOnly('6037 9971 0000 0000'), '6037997100000000');
      expect(digitsOnly('۶۰۳۷-۹۹۷۱'), '60379971');
    });
  });

  group('price formatting', () {
    test('formatPriceOnly uses Persian grouping', () {
      expect(formatPriceOnly(380000), contains('۳۸۰'));
    });

    test('formatPriceCompact shows thousands', () {
      expect(formatPriceCompact(45000), contains('۴۵'));
      expect(formatPriceCompact(45000), contains('هزار'));
    });

    test('formatPriceCompact shows millions', () {
      expect(formatPriceCompact(2500000), contains('میلیون'));
      expect(formatPriceCompact(2500000), contains('۲'));
      expect(formatPriceCompact(2500000), contains('۵'));
    });
  });

  group('time formatting', () {
    test('slotEndTime adds duration', () {
      expect(slotEndTime('18:00', 90), '19:30');
      expect(slotEndTime('23:30', 60), '00:30');
    });

    test('formatTimeFa renders Persian clock', () {
      expect(formatTimeFa('18:30:00'), '۱۸:۳۰');
    });

    test('timeToMinutes parses', () {
      expect(timeToMinutes('18:30'), 1110);
      expect(timeToMinutes(null), isNull);
    });
  });

  group('formatGameDateTime', () {
    test('joins date and time', () {
      final result = formatGameDateTime('2026-09-09', '18:00:00');
      expect(result, contains('۱۸:۰۰'));
      expect(result, contains('-'));
    });
  });
}
