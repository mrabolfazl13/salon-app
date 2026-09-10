import 'package:flutter_test/flutter_test.dart';

import 'package:salon_app/core/utils/formatters.dart';
import 'package:salon_app/core/utils/validators.dart';
import 'package:salon_app/features/contracts/domain/contract.dart';
import 'package:salon_app/features/contracts/providers/contracts_provider.dart';

/// Simplified smoke tests for app composition roots that don't require
/// platform channels (dotenv/SharedPreferences are loaded in main()).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('App wiring sanity: pure logic layers construct cleanly', () {
    // Validators + formatters + contract logic are platform-independent.
    expect(Validators.phone('09123456789'), isNull);
    expect(isoDate(DateTime(2026, 9, 9)), '2026-09-09');
    expect(
      countContractSessions('2026-09-09', '2026-09-09', 2, Recurrence.weekly),
      1,
    );
  });
}
