// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class FormBuilderLocalizationsImplAr extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplAr([String locale = 'ar']) : super(locale);

  @override
  String get creditCardErrorText =>
      'القيمة المدخلة لا تصلح كرقم بطاقة إئتمانية.';

  @override
  String get dateStringErrorText => 'هذا الحقل يتطلب تاريخا صالحا.';

  @override
  String get emailErrorText => 'هذا الحقل يتطلب عنوان بريد إلكتروني صالح.';

  @override
  String equalErrorText(String value) {
    return 'يجب أن تكون القيمة المدخلة مساوية لـ $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'يجب أن يكون طول القيمة يساوي $length';
  }

  @override
  String get integerErrorText => 'القيمة المدخلة ليست رقما صحيحا.';

  @override
  String get ipErrorText => 'هذا الحقل يتطلب عنوان IP صالح.';

  @override
  String get matchErrorText => 'القيمة المدخلة لا تطابق الصيغة المطلوبة.';

  @override
  String maxErrorText(num max) {
    return 'يجب أن لا تزيد القيمة المدخلة عن $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'يجب أن لا يزيد طول القيمة المدخلة عن $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'يجب أن لا يزيد عدد الكلمات المدخلة عن $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'يجب أن لا تقل القيمة المدخلة عن $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'يجب أن لا يقل طول القيمة المدخلة عن $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'يجب أن لا يقل عدد الكلمات المدخلة عن $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'يجب أن لا تكون القيمة المدخلة مساوية لـ $value.';
  }

  @override
  String get numericErrorText => 'القيمة المدخلة ليست رقما.';

  @override
  String get requiredErrorText => 'هذا الحقل يجب ملؤه.';

  @override
  String get urlErrorText => 'هذا الحقل يتطلب عنوان URL صالح.';

  @override
  String get phoneErrorText => 'هذا الحقل يتطلب رقم هاتف صالح.';

  @override
  String get creditCardExpirationDateErrorText =>
      'هذا الحقل يتطلب تاريخ انتهاء صالح للبطاقة الائتمانية.';

  @override
  String get creditCardExpiredErrorText =>
      'البطاقة الائتمانية منتهية الصلاحية.';

  @override
  String get creditCardCVCErrorText =>
      'هذا الحقل يتطلب رمز CVC صالح للبطاقة الائتمانية.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'هذا الحقل يتطلب رمز لون صالح.';
  }

  @override
  String get uppercaseErrorText => 'هذا الحقل يتطلب حروفا كبيرة.';

  @override
  String get lowercaseErrorText => 'هذا الحقل يتطلب حروفا صغيرة.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'هذا الحقل يتطلب امتداد ملف صالح.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'حجم هذا الملف يتجاوز الحجم المسموح به.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'التاريخ يجب أن يكون ضمن النطاق المسموح به.';
  }

  @override
  String get mustBeTrueErrorText => 'يجب أن تكون هذه القيمة صحيحة.';

  @override
  String get mustBeFalseErrorText => 'يجب أن تكون هذه القيمة خاطئة.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'هذا الحقل يجب أن يحتوي على حرف خاص.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'هذا الحقل يجب أن يحتوي على حرف كبير.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'هذا الحقل يجب أن يحتوي على حرف صغير.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'هذا الحقل يجب أن يحتوي على رقم.';
  }

  @override
  String get alphabeticalErrorText =>
      'هذا الحقل يجب أن يحتوي على حروف أبجدية فقط.';

  @override
  String get uuidErrorText => 'هذا الحقل يتطلب UUID صالح.';

  @override
  String get jsonErrorText => 'هذا الحقل يتطلب JSON صالح.';

  @override
  String get latitudeErrorText => 'هذا الحقل يتطلب دائرة عرض صالحة.';

  @override
  String get longitudeErrorText => 'هذا الحقل يتطلب خط طول صالح.';

  @override
  String get base64ErrorText => 'هذا الحقل يتطلب سلسلة Base64 صالحة.';

  @override
  String get pathErrorText => 'هذا الحقل يتطلب مسارا صالحا.';

  @override
  String get oddNumberErrorText => 'هذا الحقل يتطلب رقما فرديا.';

  @override
  String get evenNumberErrorText => 'هذا الحقل يتطلب رقما زوجيا.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'هذا الحقل يتطلب رقما صالحا للمنفذ.';
  }

  @override
  String get macAddressErrorText => 'هذا الحقل يتطلب عنوان MAC صالح.';

  @override
  String startsWithErrorText(String value) {
    return 'القيمة يجب أن تبدأ بـ $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'القيمة يجب أن تنتهي بـ $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'القيمة يجب أن تحتوي على $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'القيمة يجب أن تكون بين $min و $max.';
  }

  @override
  String get containsElementErrorText =>
      'القيمة يجب أن تكون ضمن القائمة المسموح بها.';

  @override
  String get ibanErrorText => 'هذا الحقل يتطلب IBAN صالح.';

  @override
  String get uniqueErrorText => 'هذا الحقل يجب أن يحتوي على قيمة فريدة.';

  @override
  String get bicErrorText => 'هذا الحقل يتطلب رمز BIC صالح.';

  @override
  String get isbnErrorText => 'هذا الحقل يتطلب رقم ISBN صالح.';

  @override
  String get singleLineErrorText => 'هذا الحقل يجب أن يحتوي على سطر واحد فقط.';

  @override
  String get timeErrorText => 'هذا الحقل يتطلب وقت صالح.';

  @override
  String get dateMustBeInTheFutureErrorText =>
      'يجب أن يكون التاريخ في المستقبل.';

  @override
  String get dateMustBeInThePastErrorText => 'يجب أن يكون التاريخ في الماضي.';

  @override
  String get fileNameErrorText => 'يجب أن تكون القيمة اسم ملف صحيح.';

  @override
  String get negativeNumberErrorText => 'يجب أن تكون القيمة عددًا سالبًا.';

  @override
  String get positiveNumberErrorText => 'يجب أن تكون القيمة عددًا موجبًا.';

  @override
  String get notZeroNumberErrorText => 'يجب ألا تكون القيمة صفراً.';

  @override
  String get ssnErrorText => 'يجب أن تكون القيمة رقم تأمين اجتماعي صحيح.';

  @override
  String get zipCodeErrorText => 'يجب أن تكون القيمة رمز بريدي صحيح.';

  @override
  String get usernameErrorText => 'يجب أن تكون القيمة اسم مستخدم صالح.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'لا يمكن لاسم المستخدم أن يحتوي على أرقام.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'لا يمكن لاسم المستخدم أن يحتوي على شرطة سفلية.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'لا يمكن لاسم المستخدم أن يحتوي على أحرف خاصة.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'لا يمكن لاسم المستخدم أن يحتوي على مسافات.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'لا يمكن لاسم المستخدم أن يحتوي على نقاط.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'لا يمكن لاسم المستخدم أن يحتوي على شرطات.';

  @override
  String get invalidMimeTypeErrorText => 'نوع الميم غير صالح';

  @override
  String get timezoneErrorText => 'يجب أن تكون القيمة منطقة زمنية صالحة.';

  @override
  String get cityErrorText => 'يجب أن تكون القيمة اسم مدينة صالح.';

  @override
  String get countryErrorText => 'يجب أن تكون القيمة بلد صالح.';

  @override
  String get stateErrorText => 'يجب أن تكون القيمة ولاية صالحة.';

  @override
  String get streetErrorText => 'يجب أن تكون القيمة اسم شارع صالح.';

  @override
  String get firstNameErrorText => 'يجب أن تكون القيمة اسمًا أول صالحًا.';

  @override
  String get lastNameErrorText => 'يجب أن تكون القيمة اسم عائلة صالحًا.';

  @override
  String get passportNumberErrorText => 'يجب أن تكون القيمة رقم جواز سفر صالح.';

  @override
  String get primeNumberErrorText => 'يجب أن تكون القيمة عدد أولي.';

  @override
  String get dunsErrorText => 'يجب أن تكون القيمة رقم DUNS صالح.';

  @override
  String get licensePlateErrorText => 'يجب أن تكون القيمة لوحة ترخيص صالحة.';

  @override
  String get vinErrorText => 'يجب أن تكون القيمة رقم VIN صالح.';

  @override
  String get languageCodeErrorText => 'يجب أن تكون القيمة رمز لغة صالح.';

  @override
  String get floatErrorText => 'يجب أن تكون القيمة رقم عشري صالح.';

  @override
  String get hexadecimalErrorText => 'يجب أن تكون القيمة رقم سداسي عشري صالح.';
}
