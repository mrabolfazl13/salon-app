// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Latvian (`lv`).
class FormBuilderLocalizationsImplLv extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplLv([String locale = 'lv']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Šis lauks prasa derīgu kredītkartes numuru.';

  @override
  String get dateStringErrorText => 'Šis lauks prasa derīgu datuma virkni.';

  @override
  String get emailErrorText => 'Šis lauks prasa derīgu e-pasta adresi.';

  @override
  String equalErrorText(String value) {
    return 'Šī lauka vērtībai jābūt vienādai ar $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Vērtībai jābūt garumā, kas vienāds ar $length.';
  }

  @override
  String get integerErrorText => 'Šis lauks prasa derīgu veselu skaitli.';

  @override
  String get ipErrorText => 'Šis lauks prasa derīgu IP adresi.';

  @override
  String get matchErrorText => 'Vērtība neatbilst paraugam.';

  @override
  String maxErrorText(num max) {
    return 'Vērtībai jābūt mazākai vai vienādai ar $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Vērtības garumam jābūt mazākam vai vienādam ar $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Vārdu skaitam jābūt mazākam vai vienādam ar $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'Vērtībai jābūt lielākai vai vienādai ar $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Vērtības garumam jābūt lielākam vai vienādam ar $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Vārdu skaitam jābūt lielākam vai vienādam ar $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Šī lauka vērtībai nevajadzētu būt vienādai ar $value.';
  }

  @override
  String get numericErrorText => 'Vērtībai jābūt skaitliskai.';

  @override
  String get requiredErrorText => 'Šis lauks nedrīkst būt tukšs.';

  @override
  String get urlErrorText => 'Šis lauks prasa derīgu URL adresi.';

  @override
  String get phoneErrorText => 'Šis lauks prasa derīgu tālruņa numuru.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Šis lauks prasa derīgu derīguma termiņu.';

  @override
  String get creditCardExpiredErrorText =>
      'Šīs kredītkartes derīguma termiņš ir beidzies.';

  @override
  String get creditCardCVCErrorText => 'Šis lauks prasa derīgu CVC kodu.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Vērtībai jābūt derīgam $colorCode krāsu kodam.';
  }

  @override
  String get uppercaseErrorText => 'Vērtībai jābūt lielajiem burtiem.';

  @override
  String get lowercaseErrorText => 'Vērtībai jābūt mazajiem burtiem.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Faila paplašinājumam jābūt $extensions.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Faila izmēram jābūt mazākam par $maxSize, bet tas ir $fileSize.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Datumam jābūt diapazonā no $minString līdz $maxString.';
  }

  @override
  String get mustBeTrueErrorText => 'Šim laukam jābūt patiesam.';

  @override
  String get mustBeFalseErrorText => 'Šim laukam jābūt nepatiesam.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Vērtībai jāsatur vismaz $min speciālas rakstzīmes.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Vērtībai jāsatur vismaz $min lielie burti.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Vērtībai jāsatur vismaz $min mazie burti.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Vērtībai jāsatur vismaz $min cipari.';
  }

  @override
  String get alphabeticalErrorText => 'Vērtībai jābūt alfabētiskai.';

  @override
  String get uuidErrorText => 'Vērtībai jābūt derīgam UUID.';

  @override
  String get jsonErrorText => 'Vērtībai jābūt derīgam JSON.';

  @override
  String get latitudeErrorText => 'Vērtībai jābūt derīgam platumam.';

  @override
  String get longitudeErrorText => 'Vērtībai jābūt derīgam garumam.';

  @override
  String get base64ErrorText => 'Vērtībai jābūt derīgai base64 virknei.';

  @override
  String get pathErrorText => 'Vērtībai jābūt derīgam ceļam.';

  @override
  String get oddNumberErrorText => 'Vērtībai jābūt nepāra skaitlim.';

  @override
  String get evenNumberErrorText => 'Vērtībai jābūt pāra skaitlim.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Vērtībai jābūt derīgam porta numuram starp $min un $max.';
  }

  @override
  String get macAddressErrorText => 'Vērtībai jābūt derīgai MAC adresei.';

  @override
  String startsWithErrorText(String value) {
    return 'Vērtībai jāsākas ar $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Vērtībai jābeidzas ar $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'Vērtībai jāsatur $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Vērtībai jābūt starp $min un $max.';
  }

  @override
  String get containsElementErrorText => 'Vērtībai jābūt sarakstā.';

  @override
  String get ibanErrorText => 'Vērtībai jābūt derīgam IBAN.';

  @override
  String get uniqueErrorText => 'Vērtībai jābūt unikālai.';

  @override
  String get bicErrorText => 'Vērtībai jābūt derīgam BIC.';

  @override
  String get isbnErrorText => 'Vērtībai jābūt derīgam ISBN.';

  @override
  String get singleLineErrorText => 'Vērtībai jābūt vienā rindā.';

  @override
  String get timeErrorText => 'Vērtībai jābūt derīgam laikam.';

  @override
  String get dateMustBeInTheFutureErrorText => 'Datumam jābūt nākotnē.';

  @override
  String get dateMustBeInThePastErrorText => 'Datumam jābūt pagātnē.';

  @override
  String get fileNameErrorText => 'Vērtībai jābūt derīgam faila nosaukumam.';

  @override
  String get negativeNumberErrorText => 'Vērtībai jābūt negatīvam skaitlim.';

  @override
  String get positiveNumberErrorText => 'Vērtībai jābūt pozitīvam skaitlim.';

  @override
  String get notZeroNumberErrorText => 'Vērtībai nevajadzētu būt nullei.';

  @override
  String get ssnErrorText =>
      'Vērtībai jābūt derīgam sociālās apdrošināšanas numuram.';

  @override
  String get zipCodeErrorText => 'Vērtībai jābūt derīgam pasta indeksam.';

  @override
  String get usernameErrorText => 'Vērtībai jābūt derīgam lietotājvārdam.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Lietotājvārdā nevar būt cipari.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Lietotājvārdā nevar būt pasvītrojumi.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Lietotājvārdā nevar būt speciālas rakstzīmes.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Lietotājvārdā nevar būt atstarpes.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Lietotājvārdā nevar būt punkti.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Lietotājvārdā nevar būt domuzīmes.';

  @override
  String get invalidMimeTypeErrorText => 'Nederīgs MIME tips.';

  @override
  String get timezoneErrorText => 'Vērtībai jābūt derīgai laika joslai.';

  @override
  String get cityErrorText => 'Vērtībai jābūt derīgam pilsētas nosaukumam.';

  @override
  String get countryErrorText => 'Vērtībai jābūt derīgai valstij.';

  @override
  String get stateErrorText =>
      'Vērtībai jābūt derīgam štata vai reģiona nosaukumam.';

  @override
  String get streetErrorText => 'Vērtībai jābūt derīgam ielas nosaukumam.';

  @override
  String get firstNameErrorText => 'Vērtībai jābūt derīgam vārdam.';

  @override
  String get lastNameErrorText => 'Vērtībai jābūt derīgam uzvārdam.';

  @override
  String get passportNumberErrorText => 'Vērtībai jābūt derīgam pases numuram.';

  @override
  String get primeNumberErrorText => 'Vērtībai jābūt pirmskaitlim.';

  @override
  String get dunsErrorText => 'Vērtībai jābūt derīgam DUNS numuram.';

  @override
  String get licensePlateErrorText => 'Vērtībai jābūt derīgai numurzīmei.';

  @override
  String get vinErrorText => 'Vērtībai jābūt derīgam VIN.';

  @override
  String get languageCodeErrorText => 'Vērtībai jābūt derīgam valodas kodam.';

  @override
  String get floatErrorText => 'Vērtībai jābūt derīgam decimālskaitlim.';

  @override
  String get hexadecimalErrorText =>
      'Vērtībai jābūt derīgam heksadecimālam skaitlim.';
}
