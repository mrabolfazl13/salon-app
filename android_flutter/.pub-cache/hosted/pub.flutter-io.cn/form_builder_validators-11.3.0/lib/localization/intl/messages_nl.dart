// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Dutch Flemish (`nl`).
class FormBuilderLocalizationsImplNl extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplNl([String locale = 'nl']) : super(locale);

  @override
  String get creditCardErrorText => 'Een geldig creditcardnummer is vereist.';

  @override
  String get dateStringErrorText => 'Een geldige datum is vereist.';

  @override
  String get emailErrorText => 'Een geldig e-mailadres is vereist.';

  @override
  String equalErrorText(String value) {
    return 'De waarde moet gelijk zijn aan $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Waarde moet een lengte hebben die gelijk is aan $length.';
  }

  @override
  String get integerErrorText => 'Dit veld vereist een geheel getal.';

  @override
  String get ipErrorText => 'Een geldig IP-adres is vereist.';

  @override
  String get matchErrorText => 'De waarde komt niet overeen met het patroon.';

  @override
  String maxErrorText(num max) {
    return 'De waarde moet kleiner of gelijk zijn aan $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'De waarde moet een lengte hebben die kleiner of gelijk is aan $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'De waarde moet een aantal woorden tellen die minder of gelijk zijn aan $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'De waarde moet groter of gelijk zijn aan $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'De waarde moet een lengte hebben die groter of gelijk is aan $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'De waarde moet een aantal woorden tellen groter of gelijk aan $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'De waarde mag niet gelijk zijn aan $value.';
  }

  @override
  String get numericErrorText => 'De waarde moet numeriek zijn.';

  @override
  String get requiredErrorText => 'Dit veld mag niet leeg zijn.';

  @override
  String get urlErrorText => 'Een geldige URL is vereist.';

  @override
  String get phoneErrorText => 'Een geldig telefoonnummer is vereist.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Een geldige vervaldatum van de creditcard is vereist.';

  @override
  String get creditCardExpiredErrorText => 'De creditcard is verlopen.';

  @override
  String get creditCardCVCErrorText =>
      'Een geldige CVC-code van de creditcard is vereist.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Een geldige kleurcode is vereist.';
  }

  @override
  String get uppercaseErrorText => 'Dit veld vereist hoofdletters.';

  @override
  String get lowercaseErrorText => 'Dit veld vereist kleine letters.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Een geldige bestandsextensie is vereist.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Dit bestand overschrijdt de maximaal toegestane grootte.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'De datum moet binnen het toegestane bereik liggen.';
  }

  @override
  String get mustBeTrueErrorText => 'Dit veld moet waar zijn.';

  @override
  String get mustBeFalseErrorText => 'Dit veld moet onwaar zijn.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Dit veld moet een speciaal teken bevatten.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Dit veld moet een hoofdletter bevatten.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Dit veld moet een kleine letter bevatten.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Dit veld moet een cijfer bevatten.';
  }

  @override
  String get alphabeticalErrorText => 'Dit veld mag alleen letters bevatten.';

  @override
  String get uuidErrorText => 'Een geldige UUID is vereist.';

  @override
  String get jsonErrorText => 'Een geldige JSON is vereist.';

  @override
  String get latitudeErrorText => 'Een geldige breedtegraad is vereist.';

  @override
  String get longitudeErrorText => 'Een geldige lengtegraad is vereist.';

  @override
  String get base64ErrorText => 'Een geldige Base64-tekenreeks is vereist.';

  @override
  String get pathErrorText => 'Een geldig pad is vereist.';

  @override
  String get oddNumberErrorText => 'Dit veld vereist een oneven getal.';

  @override
  String get evenNumberErrorText => 'Dit veld vereist een even getal.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Een geldig poortnummer is vereist.';
  }

  @override
  String get macAddressErrorText => 'Een geldig MAC-adres is vereist.';

  @override
  String startsWithErrorText(String value) {
    return 'De waarde moet beginnen met $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'De waarde moet eindigen met $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'De waarde moet $value bevatten.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'De waarde moet tussen $min en $max liggen.';
  }

  @override
  String get containsElementErrorText =>
      'De waarde moet in de lijst met toegestane waarden staan.';

  @override
  String get ibanErrorText => 'Een geldige IBAN is vereist.';

  @override
  String get uniqueErrorText => 'De waarde moet uniek zijn.';

  @override
  String get bicErrorText => 'Een geldige BIC is vereist.';

  @override
  String get isbnErrorText => 'Een geldige ISBN is vereist.';

  @override
  String get singleLineErrorText => 'Dit veld mag geen nieuwe regels bevatten.';

  @override
  String get timeErrorText => 'Een geldige tijd is vereist.';

  @override
  String get dateMustBeInTheFutureErrorText =>
      'Datum moet in de toekomst liggen.';

  @override
  String get dateMustBeInThePastErrorText =>
      'Datum moet in het verleden liggen.';

  @override
  String get fileNameErrorText => 'Waarde moet een geldige bestandsnaam zijn.';

  @override
  String get negativeNumberErrorText => 'Waarde moet een negatief getal zijn.';

  @override
  String get positiveNumberErrorText => 'Waarde moet een positief getal zijn.';

  @override
  String get notZeroNumberErrorText => 'Waarde mag niet nul zijn.';

  @override
  String get ssnErrorText => 'Waarde moet een geldig burgerservicenummer zijn.';

  @override
  String get zipCodeErrorText => 'Waarde moet een geldige postcode zijn.';

  @override
  String get usernameErrorText =>
      'Waarde moet een geldige gebruikersnaam zijn.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Gebruikersnaam mag geen cijfers bevatten.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Gebruikersnaam mag geen onderstrepingsteken bevatten.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Gebruikersnaam mag geen speciale tekens bevatten.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Gebruikersnaam mag geen spaties bevatten.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Gebruikersnaam mag geen punten bevatten.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Gebruikersnaam mag geen streepjes bevatten.';

  @override
  String get invalidMimeTypeErrorText => 'Ongeldig MIME-type.';

  @override
  String get timezoneErrorText => 'Waarde moet een geldige tijdzone zijn.';

  @override
  String get cityErrorText => 'Waarde moet een geldige plaatsnaam zijn.';

  @override
  String get countryErrorText => 'Waarde moet een geldig land zijn.';

  @override
  String get stateErrorText => 'Waarde moet een geldige staat zijn.';

  @override
  String get streetErrorText => 'Waarde moet een geldige straatnaam zijn.';

  @override
  String get firstNameErrorText => 'Waarde moet een geldige voornaam zijn.';

  @override
  String get lastNameErrorText => 'Waarde moet een geldige achternaam zijn.';

  @override
  String get passportNumberErrorText =>
      'Waarde moet een geldig paspoortnummer zijn.';

  @override
  String get primeNumberErrorText => 'Waarde moet een priemgetal zijn.';

  @override
  String get dunsErrorText => 'Waarde moet een geldig DUNS-nummer zijn.';

  @override
  String get licensePlateErrorText =>
      'Waarde moet een geldige kentekenplaat zijn.';

  @override
  String get vinErrorText => 'Waarde moet een geldig VIN zijn.';

  @override
  String get languageCodeErrorText => 'Waarde moet een geldige taalcode zijn.';

  @override
  String get floatErrorText =>
      'Waarde moet een geldig drijvend-komma getal zijn.';

  @override
  String get hexadecimalErrorText =>
      'Waarde moet een geldig hexadecimaal getal zijn.';
}
