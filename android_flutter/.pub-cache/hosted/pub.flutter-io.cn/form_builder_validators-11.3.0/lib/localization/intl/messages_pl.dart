// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Polish (`pl`).
class FormBuilderLocalizationsImplPl extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplPl([String locale = 'pl']) : super(locale);

  @override
  String get creditCardErrorText =>
      'To pole wymaga podania ważnego numeru karty kredytowej.';

  @override
  String get dateStringErrorText => 'To pole wymaga prawidłowej daty.';

  @override
  String get emailErrorText => 'To pole wymaga prawidłowego adresu e-mail.';

  @override
  String equalErrorText(String value) {
    return 'Wartość tego pola musi wynosić $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Wartość musi mieć długość równą $length.';
  }

  @override
  String get integerErrorText => 'Wartość musi być liczbą całkowitą.';

  @override
  String get ipErrorText => 'To pole wymaga prawidłowego adresu IP.';

  @override
  String get matchErrorText => 'Wartość nie pasuje do oczekiwanego wzorca.';

  @override
  String maxErrorText(num max) {
    return 'Wartość musi być mniejsza lub równa $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Wartość nie może mieć więcej niż $maxLength znaków.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Wartość musi mieć liczbę słów mniejszych lub równych $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'Wartość musi być większa lub równa $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Wartość musi mieć co najmniej $minLength znaków.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Wartość musi mieć liczbę słów większą lub równą $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Wartość tego pola nie może być $value.';
  }

  @override
  String get numericErrorText => 'Wartość musi być liczbą.';

  @override
  String get requiredErrorText => 'To pole nie może być puste.';

  @override
  String get urlErrorText => 'To pole wymaga prawidłowego adresu URL.';

  @override
  String get phoneErrorText => 'To pole wymaga prawidłowego numeru telefonu.';

  @override
  String get creditCardExpirationDateErrorText =>
      'To pole wymaga prawidłowej daty ważności karty kredytowej.';

  @override
  String get creditCardExpiredErrorText => 'Karta kredytowa straciła ważność.';

  @override
  String get creditCardCVCErrorText =>
      'To pole wymaga prawidłowego kodu CVC karty kredytowej.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'To pole wymaga prawidłowego kodu koloru.';
  }

  @override
  String get uppercaseErrorText => 'To pole wymaga wielkich liter.';

  @override
  String get lowercaseErrorText => 'To pole wymaga małych liter.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'To pole wymaga prawidłowego rozszerzenia pliku.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Plik przekracza maksymalny dozwolony rozmiar.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Data musi być w dozwolonym zakresie.';
  }

  @override
  String get mustBeTrueErrorText => 'To pole musi być prawdziwe.';

  @override
  String get mustBeFalseErrorText => 'To pole musi być fałszywe.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'To pole musi zawierać znak specjalny.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'To pole musi zawierać wielką literę.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'To pole musi zawierać małą literę.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'To pole musi zawierać cyfrę.';
  }

  @override
  String get alphabeticalErrorText => 'To pole może zawierać tylko litery.';

  @override
  String get uuidErrorText => 'To pole wymaga prawidłowego UUID.';

  @override
  String get jsonErrorText => 'To pole wymaga prawidłowego JSON.';

  @override
  String get latitudeErrorText =>
      'To pole wymaga prawidłowej szerokości geograficznej.';

  @override
  String get longitudeErrorText =>
      'To pole wymaga prawidłowej długości geograficznej.';

  @override
  String get base64ErrorText => 'To pole wymaga prawidłowego ciągu Base64.';

  @override
  String get pathErrorText => 'To pole wymaga prawidłowej ścieżki.';

  @override
  String get oddNumberErrorText => 'To pole wymaga liczby nieparzystej.';

  @override
  String get evenNumberErrorText => 'To pole wymaga liczby parzystej.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'To pole wymaga prawidłowego numeru portu.';
  }

  @override
  String get macAddressErrorText => 'To pole wymaga prawidłowego adresu MAC.';

  @override
  String startsWithErrorText(String value) {
    return 'Wartość musi zaczynać się od $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Wartość musi kończyć się na $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'Wartość musi zawierać $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Wartość musi być pomiędzy $min a $max.';
  }

  @override
  String get containsElementErrorText =>
      'Wartość musi być na liście dozwolonych wartości.';

  @override
  String get ibanErrorText => 'To pole wymaga prawidłowego numeru IBAN.';

  @override
  String get uniqueErrorText => 'To pole wymaga unikalnej wartości.';

  @override
  String get bicErrorText => 'To pole wymaga prawidłowego numeru BIC.';

  @override
  String get isbnErrorText => 'To pole wymaga prawidłowego numeru ISBN.';

  @override
  String get singleLineErrorText => 'To pole wymaga pojedynczej linii tekstu.';

  @override
  String get timeErrorText => 'To pole wymaga prawidłowej godziny.';

  @override
  String get dateMustBeInTheFutureErrorText => 'Data musi być w przyszłości.';

  @override
  String get dateMustBeInThePastErrorText => 'Data musi być w przeszłości.';

  @override
  String get fileNameErrorText => 'Wartość musi być prawidłową nazwą pliku.';

  @override
  String get negativeNumberErrorText => 'Wartość musi być liczbą ujemną.';

  @override
  String get positiveNumberErrorText => 'Wartość musi być liczbą dodatnią.';

  @override
  String get notZeroNumberErrorText => 'Wartość nie może być zerem.';

  @override
  String get ssnErrorText =>
      'Wartość musi być prawidłowym numerem ubezpieczenia społecznego.';

  @override
  String get zipCodeErrorText =>
      'Wartość musi być prawidłowym kodem pocztowym.';

  @override
  String get usernameErrorText =>
      'Wartość musi być prawidłową nazwą użytkownika.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Nazwa użytkownika nie może zawierać cyfr.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Nazwa użytkownika nie może zawierać podkreślenia.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Nazwa użytkownika nie może zawierać znaków specjalnych.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Nazwa użytkownika nie może zawierać spacji.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Nazwa użytkownika nie może zawierać kropek.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Nazwa użytkownika nie może zawierać myślników.';

  @override
  String get invalidMimeTypeErrorText => 'Nieprawidłowy typ MIME.';

  @override
  String get timezoneErrorText => 'Wartość musi być prawidłową strefą czasową.';

  @override
  String get cityErrorText => 'Wartość musi być prawidłową nazwą miasta.';

  @override
  String get countryErrorText => 'Wartość musi być prawidłowym krajem.';

  @override
  String get stateErrorText => 'Wartość musi być prawidłowym stanem.';

  @override
  String get streetErrorText => 'Wartość musi być prawidłową nazwą ulicy.';

  @override
  String get firstNameErrorText => 'Wartość musi być prawidłowym imieniem.';

  @override
  String get lastNameErrorText => 'Wartość musi być prawidłowym nazwiskiem.';

  @override
  String get passportNumberErrorText =>
      'Wartość musi być prawidłowym numerem paszportu.';

  @override
  String get primeNumberErrorText => 'Wartość musi być liczbą pierwszą.';

  @override
  String get dunsErrorText => 'Wartość musi być prawidłowym numerem DUNS.';

  @override
  String get licensePlateErrorText =>
      'Wartość musi być prawidłowym numerem tablicy rejestracyjnej.';

  @override
  String get vinErrorText => 'Wartość musi być prawidłowym numerem VIN.';

  @override
  String get languageCodeErrorText =>
      'Wartość musi być prawidłowym kodem języka.';

  @override
  String get floatErrorText =>
      'Wartość musi być prawidłową liczbą zmiennoprzecinkową.';

  @override
  String get hexadecimalErrorText =>
      'Wartość musi być prawidłową liczbą szesnastkową.';
}
