import 'package:flutter_test/flutter_test.dart';

import 'package:salon_app/core/utils/validators.dart';

void main() {
  group('phone', () {
    test('acepts valid Iranian mobile', () {
      expect(Validators.phone('09123456789'), isNull);
    });

    test('rejects invalid prefixes', () {
      expect(Validators.phone('08123456789'), isNotNull);
      expect(Validators.phone('0912345678'), isNotNull);
      expect(Validators.phone('091234567890'), isNotNull);
      expect(Validators.phone(''), isNotNull);
      expect(Validators.phone(null), isNotNull);
    });
  });

  group('password', () {
    test('requires min length', () {
      expect(Validators.password('1234'), isNull);
      expect(Validators.password('123'), isNotNull);
    });
  });

  group('verification code', () {
    test('requires 6 digits', () {
      expect(Validators.verificationCode('123456'), isNull);
      expect(Validators.verificationCode('12345'), isNotNull);
      expect(Validators.verificationCode('abcdef'), isNotNull);
    });
  });

  group('card', () {
    test('card number must be 16 digits', () {
      expect(Validators.cardNumber('6037997100000000'), isNull);
      expect(Validators.cardNumber('603799710000000'), isNotNull);
    });

    test('cvv must be 3-4 digits', () {
      expect(Validators.cvv('123'), isNull);
      expect(Validators.cvv('1234'), isNull);
      expect(Validators.cvv('12'), isNotNull);
    });

    test('expiry validation', () {
      expect(Validators.expiryMonth('12'), isNull);
      expect(Validators.expiryMonth('13'), isNotNull);
      expect(Validators.expiryYear('1405'), isNull);
      expect(Validators.expiryYear('999'), isNotNull);
    });
  });

  group('group name', () {
    test('requires 3+ chars', () {
      expect(Validators.groupName('فوتسال پنجشنبه'), isNull);
      expect(Validators.groupName('فو'), isNotNull);
    });
  });
}
