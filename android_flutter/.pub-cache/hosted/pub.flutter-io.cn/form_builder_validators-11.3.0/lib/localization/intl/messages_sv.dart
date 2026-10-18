// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Swedish (`sv`).
class FormBuilderLocalizationsImplSv extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplSv([String locale = 'sv']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Detta fält kräver ett giltigt kreditkortsnummer.';

  @override
  String get dateStringErrorText => 'Detta fält kräver ett giltigt datum.';

  @override
  String get emailErrorText => 'Detta fält kräver en giltig e-postadress.';

  @override
  String equalErrorText(String value) {
    return 'Detta fältvärde måste vara lika med $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Värdet måste ha en längd lika med $length.';
  }

  @override
  String get integerErrorText => 'Värdet måste vara ett heltal.';

  @override
  String get ipErrorText => 'Detta fält kräver en giltig IP-adress.';

  @override
  String get matchErrorText => 'Värdet matchar inte mönstret.';

  @override
  String maxErrorText(num max) {
    return 'Värdet måste vara mindre än eller lika med $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Värdet måste ha en längd mindre än eller lika med $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Värdet måste ha ett antal ord som är mindre än eller lika med $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'Värdet måste vara större än eller lika med $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Värdet måste ha en längd större än eller lika med $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Värdet måste ha ett antal ord som är större än eller lika med $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Detta fältvärde får inte vara lika med $value.';
  }

  @override
  String get numericErrorText => 'Värdet måste vara numeriskt.';

  @override
  String get requiredErrorText => 'Detta fält får inte vara tomt.';

  @override
  String get urlErrorText => 'Detta fält kräver en giltig URL-adress.';

  @override
  String get phoneErrorText => 'Detta fält kräver ett giltigt telefonnummer.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Detta fält kräver ett giltigt utgångsdatum för kreditkortet.';

  @override
  String get creditCardExpiredErrorText => 'Kreditkortet har gått ut.';

  @override
  String get creditCardCVCErrorText =>
      'Detta fält kräver en giltig CVC-kod för kreditkortet.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Detta fält kräver en giltig färgkod.';
  }

  @override
  String get uppercaseErrorText => 'Detta fält kräver versaler.';

  @override
  String get lowercaseErrorText => 'Detta fält kräver gemener.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Detta fält kräver en giltig filtillägg.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Denna fil överskrider den maximalt tillåtna storleken.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Datumet måste vara inom det tillåtna intervallet.';
  }

  @override
  String get mustBeTrueErrorText => 'Detta fält måste vara sant.';

  @override
  String get mustBeFalseErrorText => 'Detta fält måste vara falskt.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Detta fält måste innehålla ett specialtecken.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Detta fält måste innehålla versaler.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Detta fält måste innehålla gemener.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Detta fält måste innehålla siffror.';
  }

  @override
  String get alphabeticalErrorText =>
      'Detta fält får endast innehålla bokstäver.';

  @override
  String get uuidErrorText => 'Detta fält kräver ett giltigt UUID.';

  @override
  String get jsonErrorText => 'Detta fält kräver en giltig JSON.';

  @override
  String get latitudeErrorText => 'Detta fält kräver en giltig latitud.';

  @override
  String get longitudeErrorText => 'Detta fält kräver en giltig longitud.';

  @override
  String get base64ErrorText => 'Detta fält kräver en giltig Base64-sträng.';

  @override
  String get pathErrorText => 'Detta fält kräver en giltig sökväg.';

  @override
  String get oddNumberErrorText => 'Detta fält kräver ett udda nummer.';

  @override
  String get evenNumberErrorText => 'Detta fält kräver ett jämnt nummer.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Detta fält kräver ett giltigt portnummer.';
  }

  @override
  String get macAddressErrorText => 'Detta fält kräver en giltig MAC-adress.';

  @override
  String startsWithErrorText(String value) {
    return 'Värdet måste börja med $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Värdet måste sluta med $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'Värdet måste innehålla $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Värdet måste vara mellan $min och $max.';
  }

  @override
  String get containsElementErrorText =>
      'Värdet måste vara med i listan över tillåtna värden.';

  @override
  String get ibanErrorText => 'Detta fält kräver ett giltigt IBAN-nummer.';

  @override
  String get uniqueErrorText => 'Detta fält kräver ett unikt värde.';

  @override
  String get bicErrorText => 'Detta fält kräver ett giltigt BIC-nummer.';

  @override
  String get isbnErrorText => 'Detta fält kräver ett giltigt ISBN-nummer.';

  @override
  String get singleLineErrorText => 'Detta fält kräver en enradig text.';

  @override
  String get timeErrorText => 'Detta fält kräver en giltig tid.';

  @override
  String get dateMustBeInTheFutureErrorText =>
      'Datumet måste vara i framtiden.';

  @override
  String get dateMustBeInThePastErrorText =>
      'Datumet måste vara i det förflutna.';

  @override
  String get fileNameErrorText => 'Värdet måste vara ett giltigt filnamn.';

  @override
  String get negativeNumberErrorText => 'Värdet måste vara ett negativt tal.';

  @override
  String get positiveNumberErrorText => 'Värdet måste vara ett positivt tal.';

  @override
  String get notZeroNumberErrorText => 'Värdet får inte vara noll.';

  @override
  String get ssnErrorText => 'Värdet måste vara ett giltigt personnummer.';

  @override
  String get zipCodeErrorText => 'Värdet måste vara en giltig postnummer.';

  @override
  String get usernameErrorText => 'Värdet måste vara ett giltigt användarnamn.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Användarnamnet får inte innehålla siffror.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Användarnamnet får inte innehålla understreck.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Användarnamnet får inte innehålla specialtecken.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Användarnamnet får inte innehålla mellanslag.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Användarnamnet får inte innehålla punkter.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Användarnamnet får inte innehålla bindestreck.';

  @override
  String get invalidMimeTypeErrorText => 'Ogiltig MIME-typ.';

  @override
  String get timezoneErrorText => 'Värdet måste vara en giltig tidszon.';

  @override
  String get cityErrorText => 'Värdet måste vara ett giltigt stadsnamn.';

  @override
  String get countryErrorText => 'Värdet måste vara ett giltigt land.';

  @override
  String get stateErrorText => 'Värdet måste vara en giltig stat.';

  @override
  String get streetErrorText => 'Värdet måste vara ett giltigt gatunamn.';

  @override
  String get firstNameErrorText => 'Värdet måste vara ett giltigt förnamn.';

  @override
  String get lastNameErrorText => 'Värdet måste vara ett giltigt efternamn.';

  @override
  String get passportNumberErrorText =>
      'Värdet måste vara ett giltigt passnummer.';

  @override
  String get primeNumberErrorText => 'Värdet måste vara ett primtal.';

  @override
  String get dunsErrorText => 'Värdet måste vara ett giltigt DUNS-nummer.';

  @override
  String get licensePlateErrorText =>
      'Värdet måste vara en giltig registreringsskylt.';

  @override
  String get vinErrorText => 'Värdet måste vara ett giltigt VIN.';

  @override
  String get languageCodeErrorText => 'Värdet måste vara en giltig språkkod.';

  @override
  String get floatErrorText => 'Värdet måste vara ett giltigt flyttal.';

  @override
  String get hexadecimalErrorText =>
      'Värdet måste vara ett giltigt hexadecimaltal.';
}
