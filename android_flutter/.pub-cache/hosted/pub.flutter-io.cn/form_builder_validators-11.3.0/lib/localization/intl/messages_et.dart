// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Estonian (`et`).
class FormBuilderLocalizationsImplEt extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplEt([String locale = 'et']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Sellele väljale tuleb sisestada korrektne krediitkaardi number.';

  @override
  String get dateStringErrorText =>
      'Sellele väljale tuleb sisestada korrektne kuupäev.';

  @override
  String get emailErrorText => 'See väli nõuab kehtivat e-posti aadressi.';

  @override
  String equalErrorText(String value) {
    return 'See väärtus peab olema $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Väärtuse pikkus peab olema võrdne $length.';
  }

  @override
  String get integerErrorText => 'Sisend peab olema täisarv.';

  @override
  String get ipErrorText =>
      'Sellele väljale tuleb sisestada korrektne IP-aadress.';

  @override
  String get matchErrorText => 'Sisend ei vasta mustrile.';

  @override
  String maxErrorText(num max) {
    return 'Väärtus ei tohi olla üle $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Sisendi pikkus ei tohi olla üle $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Väärtuses peab olema sõnade arv vähem või võrdne $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'Väärtus peab olema vähemalt $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Sisendi pikkus peab olema vähemalt $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Väärtuse sõnade arv peab olema suurem kui $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'See väärtus ei tohi olla $value.';
  }

  @override
  String get numericErrorText => 'Sisend peab olema arv.';

  @override
  String get requiredErrorText => 'See väli ei tohi olla tühi.';

  @override
  String get urlErrorText => 'Sellele väljale tuleb sisestada korrektne URL.';

  @override
  String get phoneErrorText =>
      'Sellele väljale tuleb sisestada korrektne telefoninumber.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Sellele väljale tuleb sisestada krediitkaardi kehtivusaeg.';

  @override
  String get creditCardExpiredErrorText =>
      'Krediitkaardi kehtivusaeg on möödas.';

  @override
  String get creditCardCVCErrorText =>
      'Sellele väljale tuleb sisestada korrektne krediitkaardi CVC kood.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Sellele väljale tuleb sisestada korrektne värvikood.';
  }

  @override
  String get uppercaseErrorText => 'See väli nõuab suurtähti.';

  @override
  String get lowercaseErrorText => 'See väli nõuab väiketähti.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'See väli nõuab korrektset faililaiendit.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'See fail ületab maksimaalse lubatud suuruse.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Kuupäev peab olema lubatud vahemikus.';
  }

  @override
  String get mustBeTrueErrorText => 'See väli peab olema tõene.';

  @override
  String get mustBeFalseErrorText => 'See väli peab olema väär.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'See väli peab sisaldama erilist märki.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'See väli peab sisaldama suurtähte.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'See väli peab sisaldama väiketähte.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'See väli peab sisaldama numbrit.';
  }

  @override
  String get alphabeticalErrorText => 'See väli peab sisaldama ainult tähti.';

  @override
  String get uuidErrorText => 'See väli nõuab kehtivat UUID-d.';

  @override
  String get jsonErrorText => 'See väli nõuab kehtivat JSON-i.';

  @override
  String get latitudeErrorText => 'See väli nõuab kehtivat laiuskraadi.';

  @override
  String get longitudeErrorText => 'See väli nõuab kehtivat pikkuskraadi.';

  @override
  String get base64ErrorText => 'See väli nõuab kehtivat Base64 stringi.';

  @override
  String get pathErrorText => 'See väli nõuab kehtivat rada.';

  @override
  String get oddNumberErrorText => 'See väli nõuab paaritu arvu.';

  @override
  String get evenNumberErrorText => 'See väli nõuab paarisarvu.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'See väli nõuab kehtivat pordinumbrit.';
  }

  @override
  String get macAddressErrorText => 'See väli nõuab kehtivat MAC aadressi.';

  @override
  String startsWithErrorText(String value) {
    return 'Väärtus peab algama $value-ga.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Väärtus peab lõppema $value-ga.';
  }

  @override
  String containsErrorText(String value) {
    return 'Väärtus peab sisaldama $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Väärtus peab olema vahemikus $min kuni $max.';
  }

  @override
  String get containsElementErrorText =>
      'Väärtus peab olema lubatud väärtuste nimekirjas.';

  @override
  String get ibanErrorText => 'See väli nõuab kehtivat IBAN-i.';

  @override
  String get uniqueErrorText => 'See väli peab olema unikaalne.';

  @override
  String get bicErrorText => 'See väli nõuab kehtivat BIC koodi.';

  @override
  String get isbnErrorText => 'See väli nõuab kehtivat ISBN koodi.';

  @override
  String get singleLineErrorText => 'See väli nõuab ühekordset rida.';

  @override
  String get timeErrorText => 'See väli nõuab kehtivat kellaega.';

  @override
  String get dateMustBeInTheFutureErrorText => 'Kuupäev peab olema tulevikus.';

  @override
  String get dateMustBeInThePastErrorText => 'Kuupäev peab olema minevikus.';

  @override
  String get fileNameErrorText => 'Väärtus peab olema kehtiv failinimi.';

  @override
  String get negativeNumberErrorText => 'Väärtus peab olema negatiivne number.';

  @override
  String get positiveNumberErrorText => 'Väärtus peab olema positiivne number.';

  @override
  String get notZeroNumberErrorText => 'Väärtus ei tohi olla null.';

  @override
  String get ssnErrorText =>
      'Väärtus peab olema kehtiv sotsiaalkindlustuse number.';

  @override
  String get zipCodeErrorText => 'Väärtus peab olema kehtiv postiindeks.';

  @override
  String get usernameErrorText => 'Väärtus peab olema kehtiv kasutajanimi.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Kasutajanimi ei tohi sisaldada numbreid.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Kasutajanimi ei tohi sisaldada alakriipse.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Kasutajanimi ei tohi sisaldada erimärke.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Kasutajanimi ei tohi sisaldada tühikuid.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Kasutajanimi ei tohi sisaldada punkte.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Kasutajanimi ei tohi sisaldada kriipse.';

  @override
  String get invalidMimeTypeErrorText => 'Vigane MIME tüüp.';

  @override
  String get timezoneErrorText => 'Väärtus peab olema kehtiv ajavöönd.';

  @override
  String get cityErrorText => 'Väärtus peab olema kehtiv linna nimi.';

  @override
  String get countryErrorText => 'Väärtus peab olema kehtiv riik.';

  @override
  String get stateErrorText => 'Väärtus peab olema kehtiv osariik.';

  @override
  String get streetErrorText => 'Väärtus peab olema kehtiv tänava nimi.';

  @override
  String get firstNameErrorText => 'Väärtus peab olema kehtiv eesnimi.';

  @override
  String get lastNameErrorText => 'Väärtus peab olema kehtiv perekonnanimi.';

  @override
  String get passportNumberErrorText =>
      'Väärtus peab olema kehtiv passinumber.';

  @override
  String get primeNumberErrorText => 'Väärtus peab olema algarv.';

  @override
  String get dunsErrorText => 'Väärtus peab olema kehtiv DUNS number.';

  @override
  String get licensePlateErrorText => 'Väärtus peab olema kehtiv numbrimärk.';

  @override
  String get vinErrorText => 'Väärtus peab olema kehtiv VIN.';

  @override
  String get languageCodeErrorText => 'Väärtus peab olema kehtiv keelekood.';

  @override
  String get floatErrorText => 'Väärtus peab olema kehtiv ujukomaarv.';

  @override
  String get hexadecimalErrorText =>
      'Väärtus peab olema kehtiv kuueteistkümnendkohtade süsteemi arv.';
}
