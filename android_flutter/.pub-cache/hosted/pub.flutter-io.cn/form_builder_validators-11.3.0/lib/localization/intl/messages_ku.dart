// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Kurdish (`ku`).
class FormBuilderLocalizationsImplKu extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplKu([String locale = 'ku']) : super(locale);

  @override
  String get creditCardErrorText =>
      'ئەم خانە پێویستە ژمارەی کارتی کرێدیتێکی دروست هەبێت.';

  @override
  String get dateStringErrorText =>
      'ئەم خانە پێویستە دەستپێکی بەروارێکی دروست هەبێت.';

  @override
  String get emailErrorText =>
      'ئەم خانە پێویستە ناونیشانی ئیمەیڵێکی دروست هەبێت.';

  @override
  String equalErrorText(String value) {
    return 'نرخی ئەم خانەیە دەبێت یەکسان بە $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'نرخ دەبێت درێژایی هەبێت یەکسان بە $length';
  }

  @override
  String get integerErrorText =>
      'ئەم خانە پێویستە ژمارەی تەواوێکی دروست هەبێت.';

  @override
  String get ipErrorText => 'ئەم خانە پێویستە IP-ێکی دروست هەبێت.';

  @override
  String get matchErrorText => 'نرخ ناگونجێت پاتێرن.';

  @override
  String maxErrorText(num max) {
    return 'نرخ دەبێت کەمتر بێت یان یەکسان بێت بە $max';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'نرخ دەبێت درێژایی هەبێت کەمتر یان یەکسان بە $maxLength';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'نرخ دەبێت ژمارەی وشەکان هەبێت کەمتر یان یەکسان بە $maxWordsCount';
  }

  @override
  String minErrorText(num min) {
    return 'نرخ دەبێت زیاتر بێت یان یەکسان بێت بە $min';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'نرخ دەبێت درێژایی هەبێت زیاتر یان یەکسان بە $minLength';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'نرخ دەبێت ژمارەی وشەکان هەبێت زیاتر یان یەکسان بە $minWordsCount';
  }

  @override
  String notEqualErrorText(String value) {
    return 'نرخی ئەم خانەیە دەبێت نەبێت یەکسان بە $value.';
  }

  @override
  String get numericErrorText => 'نرخ دەبێت ژمارەی بێت.';

  @override
  String get requiredErrorText => 'ئەم خانە ناتوانرێت بەتاڵ بێت.';

  @override
  String get urlErrorText => 'ئەم خانە پێویستە ناونیشانی URL-ێکی دروست هەبێت.';

  @override
  String get phoneErrorText => 'ئەم خانە پێویستە ژمارەی تەلەفۆنی دروست هەبێت.';

  @override
  String get creditCardExpirationDateErrorText =>
      'ئەم خانە پێویستە بەرواری بەسەرچوونێکی دروست هەبێت.';

  @override
  String get creditCardExpiredErrorText => 'ئەم کارتی کرێدیتە بەسەرچووە.';

  @override
  String get creditCardCVCErrorText =>
      'ئەم خانە پێویستە کۆدی CVC-ێکی دروست هەبێت.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'نرخ دەبێت کۆدی ڕەنگی دروست بێت $colorCode.';
  }

  @override
  String get uppercaseErrorText => 'نرخ دەبێت گەورەنووس بێت.';

  @override
  String get lowercaseErrorText => 'نرخ دەبێت بچوکنووس بێت.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'پەیوەندی پەڕگە دەبێت بێت $extensions';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'قەبارەی پەڕگە دەبێت کەمتر بێت لە $maxSize کاتێک ئەوەی $fileSize';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'بەروار دەبێت لە ماوەی $minString - $maxString بێت';
  }

  @override
  String get mustBeTrueErrorText => 'ئەم خانە دەبێت ڕاست بێت.';

  @override
  String get mustBeFalseErrorText => 'ئەم خانە دەبێت هەڵە بێت.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'نرخ دەبێت بەلایەنی کەم $min کاراکتری تایبەتی تێدایە.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'نرخ دەبێت بەلایەنی کەم $min کاراکتری گەورەنووس تێدایە.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'نرخ دەبێت بەلایەنی کەم $min کاراکتری بچوکنووس تێدایە.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'نرخ دەبێت بەلایەنی کەم $min ژمارە تێدایە.';
  }

  @override
  String get alphabeticalErrorText => 'نرخ دەبێت ئەلفوبێت بێت.';

  @override
  String get uuidErrorText => 'نرخ دەبێت UUID-ێکی دروست بێت.';

  @override
  String get jsonErrorText => 'نرخ دەبێت JSON-ێکی دروست بێت.';

  @override
  String get latitudeErrorText => 'نرخ دەبێت لاتیتیودێکی دروست بێت.';

  @override
  String get longitudeErrorText => 'نرخ دەبێت لۆنگیتیودێکی دروست بێت.';

  @override
  String get base64ErrorText => 'نرخ دەبێت بەرزێکی base64 دروست بێت.';

  @override
  String get pathErrorText => 'نرخ دەبێت ڕێڕەوی دروست بێت.';

  @override
  String get oddNumberErrorText => 'نرخ دەبێت ژمارەی تاک بێت.';

  @override
  String get evenNumberErrorText => 'نرخ دەبێت ژمارەی جفت بێت.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'نرخ دەبێت ژمارەی پۆرتێکی دروست بێت لە نێوان $min و $max.';
  }

  @override
  String get macAddressErrorText => 'نرخ دەبێت ناونیشانی MAC-ێکی دروست بێت.';

  @override
  String startsWithErrorText(String value) {
    return 'نرخ دەبێت دەستپێ بکات بە $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'نرخ دەبێت کۆتایی پێببە بە $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'نرخ دەبێت تێبکەوێت $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'نرخ دەبێت لە نێوان $min و $max بێت.';
  }

  @override
  String get containsElementErrorText => 'نرخ دەبێت لە لیست بێت.';

  @override
  String get ibanErrorText => 'نرخ دەبێت IBAN-ێکی دروست بێت.';

  @override
  String get uniqueErrorText => 'نرخ دەبێت یەکتر بێت.';

  @override
  String get bicErrorText => 'نرخ دەبێت BIC-ێکی دروست بێت.';

  @override
  String get isbnErrorText => 'نرخ دەبێت ISBN-ێکی دروست بێت.';

  @override
  String get singleLineErrorText => 'نرخ دەبێت خطەکەی تەنها بێت.';

  @override
  String get timeErrorText => 'نرخ دەبێت کاتێکی دروست بێت.';

  @override
  String get dateMustBeInTheFutureErrorText =>
      'بەروارەکە دەبێت لە ئامادەی داڕایەوە.';

  @override
  String get dateMustBeInThePastErrorText =>
      'بەروارەکە دەبێت لە گێڕاندنەوەی داڕایەوە.';

  @override
  String get fileNameErrorText => 'گۆڕانکاری دەبێت تاقیبەتی ناونیشانی پەڕگەیە.';

  @override
  String get negativeNumberErrorText => 'گۆڕانکاری دەبێت ژمارەییەکی منفی بێت.';

  @override
  String get positiveNumberErrorText => 'گۆڕانکاری دەبێت ژمارەییەکی موجود بێت.';

  @override
  String get notZeroNumberErrorText => 'گۆڕانکاری دەبێت ژمارەییەکی ناکەوە.';

  @override
  String get ssnErrorText => 'گۆڕانکاری دەبێت ژمارەییەکی ژێر سندوقی ئەمنی بێت.';

  @override
  String get zipCodeErrorText => 'گۆڕانکاری دەبێت کۆدی ZIP یەکێکی تاقیبت بێت.';

  @override
  String get usernameErrorText => 'تێکستی بەکارهێنەر دەبێت ناوێکی دروست بێت.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'ناوی بەکارهێنەر نابێت ژمارە پێوی بگرێت.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'ناوی بەکارهێنەر نابێت ھەرفەی ژێر نابەڕە بگرێت.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'ناوی بەکارهێنەر نابێت پیت و نووسە تایبەتی بگرێت.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'ناوی بەکارهێنەر نابێت بەش ب بەش بێت.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'ناوی بەکارهێنەر نابێت نوکتەکان ب گرێت.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'ناوی بەکارهێنەر نابێت تیرە خال ب گرێت.';

  @override
  String get invalidMimeTypeErrorText => 'Mînka têkeve nîne.';

  @override
  String get timezoneErrorText => 'Nirxî divê yekem saet derbasdar be.';

  @override
  String get cityErrorText => 'Nirxî divê yekem navê bajarê derbasdar be.';

  @override
  String get countryErrorText => 'Nirxî divê yekem navê welatê derbasdar be.';

  @override
  String get stateErrorText =>
      'Nirxî divê yekem navê dewleta herêmê derbasdar be.';

  @override
  String get streetErrorText => 'Nirxî divê yekem navê kolanê derbasdar be.';

  @override
  String get firstNameErrorText => 'Nirxî divê yekem navê pêşî derbasdar be.';

  @override
  String get lastNameErrorText => 'Nirxî divê yekem navê paşîn derbasdar be.';

  @override
  String get passportNumberErrorText =>
      'Nirxî divê yekem hejmarê pasportê derbasdar be.';

  @override
  String get primeNumberErrorText =>
      'Nirxî divê yekem hejmarê binpê derbasdar be.';

  @override
  String get dunsErrorText => 'Nirxî divê yekem hejmarê DUNS derbasdar be.';

  @override
  String get licensePlateErrorText =>
      'Nirxî divê yekem pelka prezantiyê ya derbasdar be.';

  @override
  String get vinErrorText => 'Nirxî divê yekem hejmarê VIN derbasdar be.';

  @override
  String get languageCodeErrorText =>
      'Nirxî divê yekem kodê zimanê derbasdar be.';

  @override
  String get floatErrorText => 'Gerrdê hewce ye ku zêdeya rast bibe.';

  @override
  String get hexadecimalErrorText => 'Gerrdê hewce ye ku hexa de rast bibe.';
}
