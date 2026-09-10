import 'package:flutter_test/flutter_test.dart';

import 'package:salon_app/features/contracts/domain/contract.dart';
import 'package:salon_app/features/contracts/providers/contracts_provider.dart';

void main() {
  group('countContractSessions', () {
    test('weekly recurrence counts matching weekday', () {
      // 2026-09-09 is a Wednesday (Dart weekday 3 → Python 2).
      final sessions = countContractSessions(
        '2026-09-09',
        '2026-10-07',
        2,
        Recurrence.weekly,
      );
      // Wednesdays: Sep 9, 16, 23, 30, Oct 7 → 5 sessions.
      expect(sessions, 5);
    });

    test('biweekly recurrence skips a week', () {
      final sessions = countContractSessions(
        '2026-09-09',
        '2026-10-07',
        2,
        Recurrence.biweekly,
      );
      // Sep 9, 23, Oct 7 → 3 sessions.
      expect(sessions, 3);
    });

    test('monthly recurrence', () {
      final sessions = countContractSessions(
        '2026-09-09',
        '2026-12-09',
        2,
        Recurrence.monthly,
      );
      // Sep 9, Oct 9(?), — Sep 9 is Wednesday; Oct 9 is Friday; Nov 9 Monday;
      // Dec 9 Wednesday. Only matching Python weekday 2 (Wednesday) → Sep 9 + Dec 9.
      expect(sessions, 2);
    });

    test('returns 0 for invalid range', () {
      expect(
        countContractSessions('2026-10-01', '2026-09-01', 2, Recurrence.weekly),
        0,
      );
    });
  });
}
