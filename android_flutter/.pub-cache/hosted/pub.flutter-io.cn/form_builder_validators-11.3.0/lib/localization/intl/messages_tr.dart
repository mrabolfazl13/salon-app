// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Turkish (`tr`).
class FormBuilderLocalizationsImplTr extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplTr([String locale = 'tr']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Bu alan geçerli bir kredi kartı numarası gerektirir.';

  @override
  String get dateStringErrorText => 'Bu alan geçerli bir tarih gerektirir.';

  @override
  String get emailErrorText => 'Bu alan geçerli bir e-posta adresi gerektirir.';

  @override
  String equalErrorText(String value) {
    return 'Bu alanın değeri, $value değerine eşit olmalıdır.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Değerin uzunluğu $length değerine eşit olmalıdır.';
  }

  @override
  String get integerErrorText => 'Bu alan geçerli bir tamsayı gerektirir.';

  @override
  String get ipErrorText => 'Bu alan geçerli bir IP adresi gerektirir.';

  @override
  String get matchErrorText => 'Lütfen geçerli bir değer giriniz.';

  @override
  String maxErrorText(num max) {
    return 'Değer $max değerinden küçük veya eşit olmalıdır.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Değerin uzunluğu $maxLength değerinden küçük veya eşit olmalıdır.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Değer, $maxWordsCount \'dan daha az veya eşit bir kelimeye sahip olmalıdır.';
  }

  @override
  String minErrorText(num min) {
    return 'Değer $min değerinden büyük veya eşit olmalıdır.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Değerin uzunluğu $minLength değerinden büyük veya eşit olmalıdır.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Değer, $minWordsCount \'dan daha büyük veya eşit bir kelimeye sahip olmalıdır.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Bu alanın değeri, $value değerine eşit olmamalıdır.';
  }

  @override
  String get numericErrorText => 'Değer sayısal olmalıdır.';

  @override
  String get requiredErrorText => 'Bu alan boş olamaz.';

  @override
  String get urlErrorText => 'Bu alan geçerli bir URL adresi gerektirir.';

  @override
  String get phoneErrorText =>
      'Bu alan geçerli bir telefon numarası gerektirir.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Bu alan geçerli bir kredi kartı son kullanma tarihi gerektirir.';

  @override
  String get creditCardExpiredErrorText =>
      'Kredi kartının son kullanma tarihi geçmiş.';

  @override
  String get creditCardCVCErrorText =>
      'Bu alan geçerli bir kredi kartı CVC kodu gerektirir.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Bu alan geçerli bir renk kodu gerektirir.';
  }

  @override
  String get uppercaseErrorText => 'Bu alan büyük harfler içermelidir.';

  @override
  String get lowercaseErrorText => 'Bu alan küçük harfler içermelidir.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Bu alan geçerli bir dosya uzantısı gerektirir.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Bu dosya, izin verilen maksimum boyutu aşıyor.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Tarih izin verilen aralıkta olmalıdır.';
  }

  @override
  String get mustBeTrueErrorText => 'Bu alan doğru olmalıdır.';

  @override
  String get mustBeFalseErrorText => 'Bu alan yanlış olmalıdır.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Bu alan özel karakter içermelidir.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Bu alan büyük harf içermelidir.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Bu alan küçük harf içermelidir.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Bu alan bir rakam içermelidir.';
  }

  @override
  String get alphabeticalErrorText => 'Bu alan sadece harf içermelidir.';

  @override
  String get uuidErrorText => 'Bu alan geçerli bir UUID gerektirir.';

  @override
  String get jsonErrorText => 'Bu alan geçerli bir JSON gerektirir.';

  @override
  String get latitudeErrorText => 'Bu alan geçerli bir enlem gerektirir.';

  @override
  String get longitudeErrorText => 'Bu alan geçerli bir boylam gerektirir.';

  @override
  String get base64ErrorText => 'Bu alan geçerli bir Base64 dizesi gerektirir.';

  @override
  String get pathErrorText => 'Bu alan geçerli bir yol gerektirir.';

  @override
  String get oddNumberErrorText => 'Bu alan tek sayı gerektirir.';

  @override
  String get evenNumberErrorText => 'Bu alan çift sayı gerektirir.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Bu alan geçerli bir port numarası gerektirir.';
  }

  @override
  String get macAddressErrorText =>
      'Bu alan geçerli bir MAC adresi gerektirir.';

  @override
  String startsWithErrorText(String value) {
    return 'Değer $value ile başlamalıdır.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Değer $value ile bitmelidir.';
  }

  @override
  String containsErrorText(String value) {
    return 'Değer $value içermelidir.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Değer $min ile $max arasında olmalıdır.';
  }

  @override
  String get containsElementErrorText =>
      'Değer izin verilen değerler listesinde olmalıdır.';

  @override
  String get ibanErrorText => 'Bu alan geçerli bir IBAN gerektirir.';

  @override
  String get uniqueErrorText => 'Bu alanın değeri benzersiz olmalıdır.';

  @override
  String get bicErrorText => 'Bu alan geçerli bir BIC gerektirir.';

  @override
  String get isbnErrorText => 'Bu alan geçerli bir ISBN gerektirir.';

  @override
  String get singleLineErrorText => 'Bu alan tek satır olmalıdır.';

  @override
  String get timeErrorText => 'Bu alan geçerli bir saat gerektirir.';

  @override
  String get dateMustBeInTheFutureErrorText => 'Tarih gelecekte olmalı.';

  @override
  String get dateMustBeInThePastErrorText => 'Tarih geçmişte olmalı.';

  @override
  String get fileNameErrorText => 'Değer geçerli bir dosya adı olmalıdır.';

  @override
  String get negativeNumberErrorText => 'Değer negatif bir sayı olmalıdır.';

  @override
  String get positiveNumberErrorText => 'Değer pozitif bir sayı olmalıdır.';

  @override
  String get notZeroNumberErrorText => 'Değer sıfır olmamalıdır.';

  @override
  String get ssnErrorText =>
      'Değer geçerli bir Sosyal Güvenlik Numarası olmalıdır.';

  @override
  String get zipCodeErrorText => 'Değer geçerli bir Posta Kodu olmalıdır.';

  @override
  String get usernameErrorText => 'Değer geçerli bir kullanıcı adı olmalıdır.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Kullanıcı adı sayı içeremez.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Kullanıcı adı alt çizgi içeremez.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Kullanıcı adı özel karakter içeremez.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Kullanıcı adı boşluk içeremez.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Kullanıcı adı nokta içeremez.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Kullanıcı adı tire içeremez.';

  @override
  String get invalidMimeTypeErrorText => 'Geçersiz mime türü.';

  @override
  String get timezoneErrorText => 'Değer geçerli bir saat dilimi olmalıdır.';

  @override
  String get cityErrorText => 'Değer geçerli bir şehir adı olmalıdır.';

  @override
  String get countryErrorText => 'Değer geçerli bir ülke olmalıdır.';

  @override
  String get stateErrorText => 'Değer geçerli bir eyalet olmalıdır.';

  @override
  String get streetErrorText => 'Değer geçerli bir sokak adı olmalıdır.';

  @override
  String get firstNameErrorText => 'Değer geçerli bir ad olmalıdır.';

  @override
  String get lastNameErrorText => 'Değer geçerli bir soyadı olmalıdır.';

  @override
  String get passportNumberErrorText =>
      'Değer geçerli bir pasaport numarası olmalıdır.';

  @override
  String get primeNumberErrorText => 'Değer bir asal sayı olmalıdır.';

  @override
  String get dunsErrorText => 'Değer geçerli bir DUNS numarası olmalıdır.';

  @override
  String get licensePlateErrorText => 'Değer geçerli bir plaka olmalıdır.';

  @override
  String get vinErrorText => 'Değer geçerli bir VIN numarası olmalıdır.';

  @override
  String get languageCodeErrorText => 'Değer geçerli bir dil kodu olmalıdır.';

  @override
  String get floatErrorText => 'Değer geçerli bir noktalı sayı olmalıdır.';

  @override
  String get hexadecimalErrorText =>
      'Değer geçerli bir onaltılık sayı olmalıdır.';
}
