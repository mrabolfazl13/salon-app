// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Persian (`fa`).
class FormBuilderLocalizationsImplFa extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplFa([String locale = 'fa']) : super(locale);

  @override
  String get creditCardErrorText =>
      'این ورودی به شماره کارت اعتباری معتبر نیاز دارد.';

  @override
  String get dateStringErrorText => 'این ورودی به یک تاریخ معتبر نیاز دارد.';

  @override
  String get emailErrorText => 'این ورودی به یک آدرس ایمیل معتبر نیاز دارد.';

  @override
  String equalErrorText(String value) {
    return 'مقدار این ورودی باید برابر با $value باشد.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'طول مقدار باید برابر باشد $length.';
  }

  @override
  String get integerErrorText => 'این ورودی به یک عدد صحیح معتبر نیاز دارد.';

  @override
  String get ipErrorText => 'این قسمت نیاز به یک IP معتبر دارد.';

  @override
  String get matchErrorText => 'مقدار با الگو مطابقت ندارد.';

  @override
  String maxErrorText(num max) {
    return 'مقدار باید برابر یا کمتر از $max باشد.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'طول مقدار باید کمتر یا برابر با $maxLength باشد.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'مقدار باید تعداد کلمات کمتر یا مساوی با $maxWordsCount داشته باشد.';
  }

  @override
  String minErrorText(num min) {
    return 'مقدار باید برابر یا بیشتر از $min باشد.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'طول مقدار باید بیشتر یا برابر با $minLength باشد.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'مقدار باید تعداد کلمات بیشتر یا مساوی با $minWordsCount داشته باشد.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'مقدار این ورودی نباید برابر با $value باشد.';
  }

  @override
  String get numericErrorText => 'مقدار باید عددی باشد.';

  @override
  String get requiredErrorText => 'این ورودی نمی‌تواند خالی باشد.';

  @override
  String get urlErrorText => 'این ورودی به آدرس اینترنتی معتبر نیاز دارد.';

  @override
  String get phoneErrorText => 'این ورودی به شماره تلفن معتبر نیاز دارد.';

  @override
  String get creditCardExpirationDateErrorText =>
      'این ورودی به تاریخ انقضای معتبر کارت اعتباری نیاز دارد.';

  @override
  String get creditCardExpiredErrorText => 'کارت اعتباری منقضی شده است.';

  @override
  String get creditCardCVCErrorText =>
      'این ورودی به کد CVC معتبر کارت اعتباری نیاز دارد.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'این ورودی به کد رنگ معتبر نیاز دارد.';
  }

  @override
  String get uppercaseErrorText => 'این ورودی به حروف بزرگ نیاز دارد.';

  @override
  String get lowercaseErrorText => 'این ورودی به حروف کوچک نیاز دارد.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'این ورودی به پسوند فایل معتبر نیاز دارد.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'این فایل از حداکثر اندازه مجاز بیشتر است.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'تاریخ باید در محدوده مجاز باشد.';
  }

  @override
  String get mustBeTrueErrorText => 'این ورودی باید صحیح باشد.';

  @override
  String get mustBeFalseErrorText => 'این ورودی باید نادرست باشد.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'این ورودی باید دارای یک کاراکتر خاص باشد.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'این ورودی باید دارای یک حرف بزرگ باشد.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'این ورودی باید دارای یک حرف کوچک باشد.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'این ورودی باید دارای یک عدد باشد.';
  }

  @override
  String get alphabeticalErrorText =>
      'این ورودی باید فقط حروف الفبا را شامل شود.';

  @override
  String get uuidErrorText => 'این ورودی به UUID معتبر نیاز دارد.';

  @override
  String get jsonErrorText => 'این ورودی به JSON معتبر نیاز دارد.';

  @override
  String get latitudeErrorText => 'این ورودی به عرض جغرافیایی معتبر نیاز دارد.';

  @override
  String get longitudeErrorText =>
      'این ورودی به طول جغرافیایی معتبر نیاز دارد.';

  @override
  String get base64ErrorText => 'این ورودی به رشته معتبر Base64 نیاز دارد.';

  @override
  String get pathErrorText => 'این ورودی به مسیر معتبر نیاز دارد.';

  @override
  String get oddNumberErrorText => 'این ورودی به یک عدد فرد نیاز دارد.';

  @override
  String get evenNumberErrorText => 'این ورودی به یک عدد زوج نیاز دارد.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'این ورودی به شماره پورت معتبر نیاز دارد.';
  }

  @override
  String get macAddressErrorText => 'این ورودی به آدرس MAC معتبر نیاز دارد.';

  @override
  String startsWithErrorText(String value) {
    return 'مقدار باید با $value شروع شود.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'مقدار باید با $value پایان یابد.';
  }

  @override
  String containsErrorText(String value) {
    return 'مقدار باید شامل $value باشد.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'مقدار باید بین $min و $max باشد.';
  }

  @override
  String get containsElementErrorText => 'مقدار باید در لیست مقادیر مجاز باشد.';

  @override
  String get ibanErrorText => 'این ورودی به شماره IBAN معتبر نیاز دارد.';

  @override
  String get uniqueErrorText => 'این ورودی باید یکتا باشد.';

  @override
  String get bicErrorText => 'این ورودی به شماره BIC معتبر نیاز دارد.';

  @override
  String get isbnErrorText => 'این ورودی به شماره ISBN معتبر نیاز دارد.';

  @override
  String get singleLineErrorText => 'این ورودی باید یک خط باشد.';

  @override
  String get timeErrorText => 'این ورودی به زمان معتبر نیاز دارد.';

  @override
  String get dateMustBeInTheFutureErrorText => 'تاریخ باید در آینده باشد.';

  @override
  String get dateMustBeInThePastErrorText => 'تاریخ باید در گذشته باشد.';

  @override
  String get fileNameErrorText => 'مقدار باید یک نام فایل معتبر باشد.';

  @override
  String get negativeNumberErrorText => 'مقدار باید یک عدد منفی باشد.';

  @override
  String get positiveNumberErrorText => 'مقدار باید یک عدد مثبت باشد.';

  @override
  String get notZeroNumberErrorText => 'مقدار نباید صفر باشد.';

  @override
  String get ssnErrorText => 'مقدار باید یک شماره تأمین اجتماعی معتبر باشد.';

  @override
  String get zipCodeErrorText => 'مقدار باید یک کد پستی معتبر باشد.';

  @override
  String get usernameErrorText => 'مقدار باید یک نام کاربری معتبر باشد.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'نام کاربری نمی‌تواند شامل اعداد باشد.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'نام کاربری نمی‌تواند شامل زیر خط باشد.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'نام کاربری نمی‌تواند شامل کاراکترهای خاص باشد.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'نام کاربری نمی‌تواند شامل فاصله باشد.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'نام کاربری نمی‌تواند شامل نقطه باشد.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'نام کاربری نمی‌تواند شامل خط پیوند باشد.';

  @override
  String get invalidMimeTypeErrorText => 'نوع MIME نامعتبر است.';

  @override
  String get timezoneErrorText => 'مقدار باید یک منطقه زمانی معتبر باشد.';

  @override
  String get cityErrorText => 'مقدار باید یک نام شهر معتبر باشد.';

  @override
  String get countryErrorText => 'مقدار باید یک کشور معتبر باشد.';

  @override
  String get stateErrorText => 'مقدار باید یک ایالت معتبر باشد.';

  @override
  String get streetErrorText => 'مقدار باید یک نام خیابان معتبر باشد.';

  @override
  String get firstNameErrorText => 'مقدار باید یک نام معتبر باشد.';

  @override
  String get lastNameErrorText => 'مقدار باید یک نام خانوادگی معتبر باشد.';

  @override
  String get passportNumberErrorText =>
      'مقدار باید یک شماره پاسپورت معتبر باشد.';

  @override
  String get primeNumberErrorText => 'مقدار باید یک عدد اول باشد.';

  @override
  String get dunsErrorText => 'مقدار باید یک شماره DUNS معتبر باشد.';

  @override
  String get licensePlateErrorText => 'مقدار باید یک شماره پلاک معتبر باشد.';

  @override
  String get vinErrorText => 'مقدار باید یک شماره VIN معتبر باشد.';

  @override
  String get languageCodeErrorText => 'مقدار باید یک کد زبان معتبر باشد.';

  @override
  String get floatErrorText => 'مقدار باید یک عدد اعشاری معتبر باشد.';

  @override
  String get hexadecimalErrorText => 'مقدار باید یک عدد هگزادسیمال معتبر باشد.';
}
