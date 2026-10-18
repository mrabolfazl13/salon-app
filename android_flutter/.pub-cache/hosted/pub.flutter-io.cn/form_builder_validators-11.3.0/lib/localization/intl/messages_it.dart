// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Italian (`it`).
class FormBuilderLocalizationsImplIt extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplIt([String locale = 'it']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Questo campo richiede un numero di carta di credito valido.';

  @override
  String get dateStringErrorText => 'Questo campo richiede una data valida.';

  @override
  String get emailErrorText =>
      'Questo campo richiede un indirizzo email valido.';

  @override
  String equalErrorText(String value) {
    return 'Il valore di questo campo deve essere uguale a $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Il valore deve avere una lunghezza uguale a $length.';
  }

  @override
  String get integerErrorText => 'Il valore deve essere un numero intero.';

  @override
  String get ipErrorText => 'Questo campo richiede un indirizzo IP valido.';

  @override
  String get matchErrorText =>
      'Il valore non corrisponde al formato richiesto.';

  @override
  String maxErrorText(num max) {
    return 'Il valore inserito deve essere minore o uguale a $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Il valore inserito deve avere una lunghezza minore o uguale a $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Il valore deve avere un conteggio di parole inferiore o uguale a $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'Il valore inserito deve essere maggiore o uguale a $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Il valore inserito deve avere una lunghezza maggiore o uguale a $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Il valore deve avere un conteggio di parole maggiore o uguale a $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Questo valore di campo non deve essere uguale a $value.';
  }

  @override
  String get numericErrorText => 'Il valore deve essere numerico.';

  @override
  String get requiredErrorText => 'Questo campo non può essere vuoto.';

  @override
  String get urlErrorText => 'Questo campo richiede una URL valida.';

  @override
  String get phoneErrorText =>
      'Questo campo richiede un numero di telefono valido.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Questo campo richiede una data di scadenza della carta di credito valida.';

  @override
  String get creditCardExpiredErrorText => 'La carta di credito è scaduta.';

  @override
  String get creditCardCVCErrorText =>
      'Questo campo richiede un codice CVC della carta di credito valido.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Questo campo richiede un codice colore valido.';
  }

  @override
  String get uppercaseErrorText => 'Questo campo richiede lettere maiuscole.';

  @override
  String get lowercaseErrorText => 'Questo campo richiede lettere minuscole.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Questo campo richiede un\'estensione del file valida.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Questo file supera la dimensione massima consentita.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'La data deve essere compresa nell\'intervallo consentito.';
  }

  @override
  String get mustBeTrueErrorText => 'Questo campo deve essere vero.';

  @override
  String get mustBeFalseErrorText => 'Questo campo deve essere falso.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Questo campo deve contenere un carattere speciale.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Questo campo deve contenere una lettera maiuscola.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Questo campo deve contenere una lettera minuscola.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Questo campo deve contenere un numero.';
  }

  @override
  String get alphabeticalErrorText =>
      'Questo campo deve contenere solo lettere.';

  @override
  String get uuidErrorText => 'Questo campo richiede un UUID valido.';

  @override
  String get jsonErrorText => 'Questo campo richiede un JSON valido.';

  @override
  String get latitudeErrorText =>
      'Questo campo richiede una latitudine valida.';

  @override
  String get longitudeErrorText =>
      'Questo campo richiede una longitudine valida.';

  @override
  String get base64ErrorText =>
      'Questo campo richiede una stringa Base64 valida.';

  @override
  String get pathErrorText => 'Questo campo richiede un percorso valido.';

  @override
  String get oddNumberErrorText => 'Questo campo richiede un numero dispari.';

  @override
  String get evenNumberErrorText => 'Questo campo richiede un numero pari.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Questo campo richiede un numero di porta valido.';
  }

  @override
  String get macAddressErrorText =>
      'Questo campo richiede un indirizzo MAC valido.';

  @override
  String startsWithErrorText(String value) {
    return 'Il valore deve iniziare con $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Il valore deve terminare con $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'Il valore deve contenere $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Il valore deve essere compreso tra $min e $max.';
  }

  @override
  String get containsElementErrorText =>
      'Il valore deve essere presente nell\'elenco dei valori consentiti.';

  @override
  String get ibanErrorText => 'Questo campo richiede un IBAN valido.';

  @override
  String get uniqueErrorText => 'Questo campo richiede un valore unico.';

  @override
  String get bicErrorText => 'Questo campo richiede un codice BIC valido.';

  @override
  String get isbnErrorText => 'Questo campo richiede un ISBN valido.';

  @override
  String get singleLineErrorText =>
      'Questo campo richiede un testo su una sola riga.';

  @override
  String get timeErrorText => 'Questo campo richiede un orario valido.';

  @override
  String get dateMustBeInTheFutureErrorText =>
      'La data deve essere nel futuro.';

  @override
  String get dateMustBeInThePastErrorText => 'La data deve essere nel passato.';

  @override
  String get fileNameErrorText => 'Il valore deve essere un nome file valido.';

  @override
  String get negativeNumberErrorText =>
      'Il valore deve essere un numero negativo.';

  @override
  String get positiveNumberErrorText =>
      'Il valore deve essere un numero positivo.';

  @override
  String get notZeroNumberErrorText => 'Il valore non deve essere zero.';

  @override
  String get ssnErrorText =>
      'Il valore deve essere un numero di previdenza sociale valido.';

  @override
  String get zipCodeErrorText =>
      'Il valore deve essere un codice postale valido.';

  @override
  String get usernameErrorText =>
      'Il valore deve essere un nome utente valido.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Il nome utente non può contenere numeri.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Il nome utente non può contenere underscore.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Il nome utente non può contenere caratteri speciali.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Il nome utente non può contenere spazi.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Il nome utente non può contenere punti.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Il nome utente non può contenere trattini.';

  @override
  String get invalidMimeTypeErrorText => 'Tipo mime non valido.';

  @override
  String get timezoneErrorText =>
      'Il valore deve essere un fuso orario valido.';

  @override
  String get cityErrorText => 'Il valore deve essere un nome di città valido.';

  @override
  String get countryErrorText => 'Il valore deve essere un paese valido.';

  @override
  String get stateErrorText => 'Il valore deve essere uno stato valido.';

  @override
  String get streetErrorText => 'Il valore deve essere un nome di via valido.';

  @override
  String get firstNameErrorText => 'Il valore deve essere un nome valido.';

  @override
  String get lastNameErrorText => 'Il valore deve essere un cognome valido.';

  @override
  String get passportNumberErrorText =>
      'Il valore deve essere un numero di passaporto valido.';

  @override
  String get primeNumberErrorText => 'Il valore deve essere un numero primo.';

  @override
  String get dunsErrorText => 'Il valore deve essere un numero DUNS valido.';

  @override
  String get licensePlateErrorText => 'Il valore deve essere una targa valida.';

  @override
  String get vinErrorText => 'Il valore deve essere un VIN valido.';

  @override
  String get languageCodeErrorText =>
      'Il valore deve essere un codice lingua valido.';

  @override
  String get floatErrorText =>
      'Il valore deve essere un numero in virgola mobile valido.';

  @override
  String get hexadecimalErrorText =>
      'Il valore deve essere un numero esadecimale valido.';
}
