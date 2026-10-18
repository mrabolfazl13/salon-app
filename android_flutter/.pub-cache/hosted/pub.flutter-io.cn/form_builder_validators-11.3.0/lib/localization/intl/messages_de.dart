// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for German (`de`).
class FormBuilderLocalizationsImplDe extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplDe([String locale = 'de']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Für dieses Feld ist eine gültige Kreditkartennummer erforderlich.';

  @override
  String get dateStringErrorText => 'Dieses Feld erfordert ein gültiges Datum.';

  @override
  String get emailErrorText =>
      'Für dieses Feld ist eine gültige E-Mail-Adresse erforderlich.';

  @override
  String equalErrorText(String value) {
    return 'Dieser Feldwert muss gleich $value sein.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Der Wert muss eine Länge von $length haben.';
  }

  @override
  String get integerErrorText => 'Der Wert muss eine ganze Zahl sein.';

  @override
  String get ipErrorText => 'Dieses Feld erfordert eine gültige IP-Adresse.';

  @override
  String get matchErrorText => 'Der Wert stimmt nicht mit dem Muster überein.';

  @override
  String maxErrorText(num max) {
    return 'Der Wert muss kleiner oder gleich $max sein.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Der Wert muss eine Länge haben, die kleiner oder gleich $maxLength ist.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Der Wert muss eine Wortanzahl haben, die kleiner oder gleich $maxWordsCount ist.';
  }

  @override
  String minErrorText(num min) {
    return 'Der Wert muss größer oder gleich $min sein.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Der Wert muss eine Länge haben, die größer oder gleich $minLength ist.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Der Wert muss eine Wortanzahl haben, die größer oder gleich $minWordsCount ist.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Dieser Feldwert darf nicht gleich $value sein.';
  }

  @override
  String get numericErrorText => 'Der Wert muss numerisch sein.';

  @override
  String get requiredErrorText => 'Dieses Feld darf nicht leer sein.';

  @override
  String get urlErrorText =>
      'Für dieses Feld ist eine gültige URL-Adresse erforderlich.';

  @override
  String get phoneErrorText =>
      'Dieses Feld erfordert eine gültige Telefonnummer.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Dieses Feld erfordert ein gültiges Ablaufdatum der Kreditkarte.';

  @override
  String get creditCardExpiredErrorText => 'Die Kreditkarte ist abgelaufen.';

  @override
  String get creditCardCVCErrorText =>
      'Dieses Feld erfordert einen gültigen CVC-Code der Kreditkarte.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Dieses Feld erfordert einen gültigen Farbcode.';
  }

  @override
  String get uppercaseErrorText => 'Dieses Feld erfordert Großbuchstaben.';

  @override
  String get lowercaseErrorText => 'Dieses Feld erfordert Kleinbuchstaben.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Dieses Feld erfordert eine gültige Dateierweiterung.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Diese Datei überschreitet die maximal zulässige Größe.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Das Datum muss im erlaubten Bereich liegen.';
  }

  @override
  String get mustBeTrueErrorText => 'Dieses Feld muss wahr sein.';

  @override
  String get mustBeFalseErrorText => 'Dieses Feld muss falsch sein.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Dieses Feld muss ein Sonderzeichen enthalten.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Dieses Feld muss einen Großbuchstaben enthalten.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Dieses Feld muss einen Kleinbuchstaben enthalten.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Dieses Feld muss eine Zahl enthalten.';
  }

  @override
  String get alphabeticalErrorText =>
      'Dieses Feld darf nur Buchstaben enthalten.';

  @override
  String get uuidErrorText => 'Dieses Feld erfordert eine gültige UUID.';

  @override
  String get jsonErrorText => 'Dieses Feld erfordert ein gültiges JSON.';

  @override
  String get latitudeErrorText =>
      'Dieses Feld erfordert einen gültigen Breitengrad.';

  @override
  String get longitudeErrorText =>
      'Dieses Feld erfordert einen gültigen Längengrad.';

  @override
  String get base64ErrorText =>
      'Dieses Feld erfordert eine gültige Base64-Zeichenkette.';

  @override
  String get pathErrorText => 'Dieses Feld erfordert einen gültigen Pfad.';

  @override
  String get oddNumberErrorText => 'Dieses Feld erfordert eine ungerade Zahl.';

  @override
  String get evenNumberErrorText => 'Dieses Feld erfordert eine gerade Zahl.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Dieses Feld erfordert eine gültige Portnummer.';
  }

  @override
  String get macAddressErrorText =>
      'Dieses Feld erfordert eine gültige MAC-Adresse.';

  @override
  String startsWithErrorText(String value) {
    return 'Der Wert muss mit $value beginnen.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Der Wert muss mit $value enden.';
  }

  @override
  String containsErrorText(String value) {
    return 'Der Wert muss $value enthalten.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Der Wert muss zwischen $min und $max liegen.';
  }

  @override
  String get containsElementErrorText =>
      'Der Wert muss in der Liste der zulässigen Werte sein.';

  @override
  String get ibanErrorText => 'Dieses Feld erfordert eine gültige IBAN.';

  @override
  String get uniqueErrorText => 'Dieses Feld erfordert einen eindeutigen Wert.';

  @override
  String get bicErrorText => 'Dieses Feld erfordert eine gültige BIC.';

  @override
  String get isbnErrorText => 'Dieses Feld erfordert eine gültige ISBN.';

  @override
  String get singleLineErrorText =>
      'Dieses Feld darf keine Zeilenumbrüche enthalten.';

  @override
  String get timeErrorText => 'Dieses Feld erfordert eine gültige Uhrzeit.';

  @override
  String get dateMustBeInTheFutureErrorText =>
      'Datum muss in der Zukunft liegen.';

  @override
  String get dateMustBeInThePastErrorText =>
      'Datum muss in der Vergangenheit liegen.';

  @override
  String get fileNameErrorText => 'Wert muss ein gültiger Dateiname sein.';

  @override
  String get negativeNumberErrorText => 'Wert muss eine negative Zahl sein.';

  @override
  String get positiveNumberErrorText => 'Wert muss eine positive Zahl sein.';

  @override
  String get notZeroNumberErrorText => 'Wert darf nicht null sein.';

  @override
  String get ssnErrorText =>
      'Wert muss eine gültige Sozialversicherungsnummer sein.';

  @override
  String get zipCodeErrorText => 'Wert muss eine gültige Postleitzahl sein.';

  @override
  String get usernameErrorText =>
      'Der Wert muss ein gültiger Benutzername sein.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Der Benutzername darf keine Zahlen enthalten.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Der Benutzername darf keinen Unterstrich enthalten.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Der Benutzername darf keine Sonderzeichen enthalten.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Der Benutzername darf keine Leerzeichen enthalten.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Der Benutzername darf keine Punkte enthalten.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Der Benutzername darf keine Bindestriche enthalten.';

  @override
  String get invalidMimeTypeErrorText => 'Ungültiger MIME-Typ.';

  @override
  String get timezoneErrorText => 'Der Wert muss eine gültige Zeitzone sein.';

  @override
  String get cityErrorText => 'Der Wert muss ein gültiger Stadtname sein.';

  @override
  String get countryErrorText => 'Der Wert muss ein gültiges Land sein.';

  @override
  String get stateErrorText => 'Der Wert muss ein gültiger Bundesstaat sein.';

  @override
  String get streetErrorText => 'Der Wert muss ein gültiger Straßenname sein.';

  @override
  String get firstNameErrorText => 'Der Wert muss ein gültiger Vorname sein.';

  @override
  String get lastNameErrorText => 'Der Wert muss ein gültiger Nachname sein.';

  @override
  String get passportNumberErrorText =>
      'Der Wert muss eine gültige Passnummer sein.';

  @override
  String get primeNumberErrorText => 'Der Wert muss eine Primzahl sein.';

  @override
  String get dunsErrorText => 'Der Wert muss eine gültige DUNS-Nummer sein.';

  @override
  String get licensePlateErrorText =>
      'Der Wert muss ein gültiges Nummernschild sein.';

  @override
  String get vinErrorText =>
      'Der Wert muss eine gültige Fahrzeug-Identifizierungsnummer (VIN) sein.';

  @override
  String get languageCodeErrorText =>
      'Der Wert muss ein gültiger Sprachcode sein.';

  @override
  String get floatErrorText =>
      'Der Wert muss eine gültige Fließkommazahl sein.';

  @override
  String get hexadecimalErrorText =>
      'Der Wert muss eine gültige hexadezimale Zahl sein.';
}
