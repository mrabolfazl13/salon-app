/// Validation helpers shared by forms — mirrors the Zod schemas of the
/// original frontend (regex, min lengths, Persian error strings).
class Validators {
  Validators._();

  static final _phoneRegex = RegExp(r'^09[0-9]{9}$');
  static final _codeRegex = RegExp(r'^[0-9]{6}$');

  static String? phone(String? value) {
    final v = value?.trim() ?? '';
    if (!_phoneRegex.hasMatch(v)) return 'شماره موبایل معتبر وارد کنید';
    return null;
  }

  static String? password(String? value) {
    if ((value ?? '').length < 4) return 'رمز عبور حداقل ۴ کاراکتر';
    return null;
  }

  static String? fullName(String? value) {
    if ((value ?? '').trim().length < 3) return 'نام حداقل ۳ کاراکتر';
    return null;
  }

  static String? verificationCode(String? value) {
    if (!_codeRegex.hasMatch(value ?? '')) return 'کد ۶ رقمی را وارد کنید';
    return null;
  }

  static String? cardNumber(String? value) {
    if ((value ?? '').length != 16) return 'شماره کارت باید ۱۶ رقم باشد';
    return null;
  }

  static String? cvv(String? value) {
    final len = (value ?? '').length;
    if (len < 3 || len > 4) return 'CVV2 نامعتبر است';
    return null;
  }

  static String? expiryMonth(String? value) {
    final m = int.tryParse(value ?? '');
    if (m == null || m < 1 || m > 12) return 'ماه نامعتبر است';
    return null;
  }

  static String? expiryYear(String? value) {
    final y = int.tryParse(value ?? '');
    if (y == null || y < 1300 || y > 1500) return 'سال نامعتبر است';
    return null;
  }

  static String? groupName(String? value) {
    if ((value ?? '').trim().length < 3) return 'نام بازی باید حداقل ۳ حرف باشد.';
    return null;
  }
}
