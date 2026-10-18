// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Ukrainian (`uk`).
class FormBuilderLocalizationsImplUk extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplUk([String locale = 'uk']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Значення поля має бути номером кредитної картки.';

  @override
  String get dateStringErrorText => 'Поле має бути датою.';

  @override
  String get emailErrorText => 'Поле має бути email адресою.';

  @override
  String equalErrorText(String value) {
    return 'Значення поля має дорівнювати $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Значення повинно мати довжину, рівну $length.';
  }

  @override
  String get integerErrorText => 'Поле має бути цілим числом.';

  @override
  String get ipErrorText => 'Поле має бути IP адресою.';

  @override
  String get matchErrorText => 'Значення має відповідати шаблону.';

  @override
  String maxErrorText(num max) {
    return 'Значення має бути менше або дорівнювати $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Довжина значення має бути менше або дорівнювати $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Значення повинно мати кількість слів менше або дорівнювати $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'Значення має бути більше або дорівнювати $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Довжина значення має бути більше або дорівнювати $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Значення повинно мати кількість слів більше або дорівнювати $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Значення поля не повинно дорівнювати $value.';
  }

  @override
  String get numericErrorText => 'Значення має бути числом.';

  @override
  String get requiredErrorText => 'Поле не може бути порожнім.';

  @override
  String get urlErrorText => 'Поле має бути URL адресою.';

  @override
  String get phoneErrorText => 'Поле має бути дійсним номером телефону.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Поле має бути дійсною датою закінчення терміну дії кредитної картки.';

  @override
  String get creditCardExpiredErrorText =>
      'Термін дії кредитної картки закінчився.';

  @override
  String get creditCardCVCErrorText =>
      'Поле має бути дійсним CVC кодом кредитної картки.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Поле має бути дійсним кольоровим кодом.';
  }

  @override
  String get uppercaseErrorText => 'Поле має містити великі літери.';

  @override
  String get lowercaseErrorText => 'Поле має містити малі літери.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Поле має бути дійсним розширенням файлу.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Цей файл перевищує максимально допустимий розмір.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Дата має бути в дозволеному діапазоні.';
  }

  @override
  String get mustBeTrueErrorText => 'Поле має бути істинним.';

  @override
  String get mustBeFalseErrorText => 'Поле має бути хибним.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Поле має містити спеціальний символ.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Поле має містити великі літери.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Поле має містити малі літери.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Поле має містити число.';
  }

  @override
  String get alphabeticalErrorText => 'Поле має містити тільки літери.';

  @override
  String get uuidErrorText => 'Поле має бути дійсним UUID.';

  @override
  String get jsonErrorText => 'Поле має бути дійсним JSON.';

  @override
  String get latitudeErrorText => 'Поле має бути дійсною широтою.';

  @override
  String get longitudeErrorText => 'Поле має бути дійсною довготою.';

  @override
  String get base64ErrorText => 'Поле має бути дійсним рядком Base64.';

  @override
  String get pathErrorText => 'Поле має бути дійсним шляхом.';

  @override
  String get oddNumberErrorText => 'Поле має бути непарним числом.';

  @override
  String get evenNumberErrorText => 'Поле має бути парним числом.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Поле має бути дійсним номером порту.';
  }

  @override
  String get macAddressErrorText => 'Поле має бути дійсною MAC адресою.';

  @override
  String startsWithErrorText(String value) {
    return 'Значення має починатися з $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Значення має закінчуватися на $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'Значення має містити $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Значення має бути між $min і $max.';
  }

  @override
  String get containsElementErrorText =>
      'Значення має бути в списку дозволених значень.';

  @override
  String get ibanErrorText => 'Поле має бути дійсним IBAN номером.';

  @override
  String get uniqueErrorText => 'Поле має бути унікальним.';

  @override
  String get bicErrorText => 'Поле має бути дійсним BIC кодом.';

  @override
  String get isbnErrorText => 'Поле має бути дійсним ISBN номером.';

  @override
  String get singleLineErrorText => 'Поле має бути однорядковим.';

  @override
  String get timeErrorText => 'Поле має бути дійсним часом.';

  @override
  String get dateMustBeInTheFutureErrorText =>
      'Дата повинна бути у майбутньому.';

  @override
  String get dateMustBeInThePastErrorText => 'Дата повинна бути в минулому.';

  @override
  String get fileNameErrorText => 'Значення повинно бути дійсним ім\'ям файлу.';

  @override
  String get negativeNumberErrorText =>
      'Значення повинно бути від\'ємним числом.';

  @override
  String get positiveNumberErrorText =>
      'Значення повинно бути позитивним числом.';

  @override
  String get notZeroNumberErrorText => 'Значення не повинно бути нулем.';

  @override
  String get ssnErrorText =>
      'Значення повинно бути дійсним номером соціального страхування.';

  @override
  String get zipCodeErrorText =>
      'Значення повинно бути дійсним поштовим індексом.';

  @override
  String get usernameErrorText =>
      'Значення має бути дійсним ім\'ям користувача.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Ім\'я користувача не може містити цифри.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Ім\'я користувача не може містити символ підкреслення.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Ім\'я користувача не може містити спеціальні символи.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Ім\'я користувача не може містити пробіли.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Ім\'я користувача не може містити крапки.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Ім\'я користувача не може містити дефіси.';

  @override
  String get invalidMimeTypeErrorText => 'Недійсний MIME тип.';

  @override
  String get timezoneErrorText =>
      'Значення повинно бути дійсним часовим поясом.';

  @override
  String get cityErrorText => 'Значення повинно бути дійсним назвою міста.';

  @override
  String get countryErrorText => 'Значення повинно бути дійсною країною.';

  @override
  String get stateErrorText => 'Значення повинно бути дійсним штатом.';

  @override
  String get streetErrorText => 'Значення повинно бути дійсною назвою вулиці.';

  @override
  String get firstNameErrorText => 'Значення повинно бути дійсним ім\'ям.';

  @override
  String get lastNameErrorText => 'Значення повинно бути дійсним прізвищем.';

  @override
  String get passportNumberErrorText =>
      'Значення повинно бути дійсним номером паспорта.';

  @override
  String get primeNumberErrorText => 'Значення повинно бути простим числом.';

  @override
  String get dunsErrorText => 'Значення повинно бути дійсним номером DUNS.';

  @override
  String get licensePlateErrorText =>
      'Значення повинно бути дійсним номерним знаком автомобіля.';

  @override
  String get vinErrorText => 'Значення повинно бути дійсним VIN.';

  @override
  String get languageCodeErrorText =>
      'Значення повинно бути дійсним кодом мови.';

  @override
  String get floatErrorText =>
      'Значення повинно бути дійсним числом з плаваючою комою.';

  @override
  String get hexadecimalErrorText =>
      'Значення повинно бути дійсним шістнадцятковим числом.';
}
