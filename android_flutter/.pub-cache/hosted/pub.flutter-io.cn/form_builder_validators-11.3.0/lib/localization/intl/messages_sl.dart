// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Slovenian (`sl`).
class FormBuilderLocalizationsImplSl extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplSl([String locale = 'sl']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Vnesite veljavno številko kreditne kartice.';

  @override
  String get dateStringErrorText => 'Vnesite veljaven datum.';

  @override
  String get emailErrorText => 'Vnesite veljaven e-mail naslov.';

  @override
  String equalErrorText(String value) {
    return 'Vrednost mora biti enaka $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Besedilo mora biti dolgo $length znakov.';
  }

  @override
  String get integerErrorText => 'Vnesite celo število.';

  @override
  String get ipErrorText => 'Vnesite veljaven IP naslov.';

  @override
  String get matchErrorText => 'Vrednost ne ustreza predpisanemu vzorcu.';

  @override
  String maxErrorText(num max) {
    return 'Vrednost ne sme presegati $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Besedilo mora biti krajše ali enako $maxLength znakov.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Vrednost mora imeti manj ali enako število besed kot $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'Vrednost mora biti večja ali enaka $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Besedilo mora biti daljše ali enako $minLength znakov.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Vrednost mora imeti več ali enako število besed kot $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Vrednost ne sme biti enaka $value.';
  }

  @override
  String get numericErrorText => 'Vrednost polja mora biti numerična.';

  @override
  String get requiredErrorText => 'Polje ne sme biti prazno.';

  @override
  String get urlErrorText => 'Vnesite veljaven URL naslov.';

  @override
  String get phoneErrorText => 'Vnesite veljavno telefonsko številko.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Vnesite veljaven datum poteka kreditne kartice.';

  @override
  String get creditCardExpiredErrorText => 'Kreditna kartica je potekla.';

  @override
  String get creditCardCVCErrorText =>
      'Vnesite veljavno CVC kodo kreditne kartice.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Vnesite veljavno barvno kodo.';
  }

  @override
  String get uppercaseErrorText => 'Vrednost mora vsebovati velike črke.';

  @override
  String get lowercaseErrorText => 'Vrednost mora vsebovati male črke.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Vnesite veljavno pripono datoteke.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Datoteka presega največjo dovoljeno velikost.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Datum mora biti v dovoljenem razponu.';
  }

  @override
  String get mustBeTrueErrorText => 'Polje mora biti resnično.';

  @override
  String get mustBeFalseErrorText => 'Polje mora biti neresnično.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Vrednost mora vsebovati posebne znake.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Vrednost mora vsebovati velike črke.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Vrednost mora vsebovati male črke.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Vrednost mora vsebovati številke.';
  }

  @override
  String get alphabeticalErrorText => 'Vrednost mora vsebovati samo črke.';

  @override
  String get uuidErrorText => 'Vnesite veljaven UUID.';

  @override
  String get jsonErrorText => 'Vnesite veljaven JSON.';

  @override
  String get latitudeErrorText => 'Vnesite veljavno zemljepisno širino.';

  @override
  String get longitudeErrorText => 'Vnesite veljavno zemljepisno dolžino.';

  @override
  String get base64ErrorText => 'Vnesite veljaven Base64 niz.';

  @override
  String get pathErrorText => 'Vnesite veljavno pot.';

  @override
  String get oddNumberErrorText => 'Vrednost mora biti liho število.';

  @override
  String get evenNumberErrorText => 'Vrednost mora biti sodo število.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Vnesite veljavno številko vrat.';
  }

  @override
  String get macAddressErrorText => 'Vnesite veljaven MAC naslov.';

  @override
  String startsWithErrorText(String value) {
    return 'Vrednost se mora začeti z $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Vrednost se mora končati z $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'Vrednost mora vsebovati $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Vrednost mora biti med $min in $max.';
  }

  @override
  String get containsElementErrorText =>
      'Vrednost mora biti v seznamu dovoljenih vrednosti.';

  @override
  String get ibanErrorText => 'Vnesite veljaven IBAN.';

  @override
  String get uniqueErrorText => 'Vrednost mora biti edinstvena.';

  @override
  String get bicErrorText => 'Vnesite veljaven BIC.';

  @override
  String get isbnErrorText => 'Vnesite veljaven ISBN.';

  @override
  String get singleLineErrorText => 'Vrednost mora biti enovrstična.';

  @override
  String get timeErrorText => 'Vnesite veljavno časovno vrednost.';

  @override
  String get dateMustBeInTheFutureErrorText => 'Datum mora biti v prihodnosti.';

  @override
  String get dateMustBeInThePastErrorText => 'Datum mora biti v preteklosti.';

  @override
  String get fileNameErrorText => 'Vrednost mora biti veljavno ime datoteke.';

  @override
  String get negativeNumberErrorText => 'Vrednost mora biti negativno število.';

  @override
  String get positiveNumberErrorText => 'Vrednost mora biti pozitivno število.';

  @override
  String get notZeroNumberErrorText => 'Vrednost ne sme biti enaka nič.';

  @override
  String get ssnErrorText =>
      'Vrednost mora biti veljavna številka socialnega zavarovanja.';

  @override
  String get zipCodeErrorText => 'Vrednost mora biti veljaven poštni številka.';

  @override
  String get usernameErrorText =>
      'Vrednost mora biti veljavno uporabniško ime.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Uporabniško ime ne sme vsebovati številk.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Uporabniško ime ne sme vsebovati podčrtajev.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Uporabniško ime ne sme vsebovati posebnih znakov.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Uporabniško ime ne sme vsebovati presledkov.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Uporabniško ime ne sme vsebovati pik.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Uporabniško ime ne sme vsebovati vezajev.';

  @override
  String get invalidMimeTypeErrorText => 'Neveljavna vrsta MIME.';

  @override
  String get timezoneErrorText => 'Vrednost mora biti veljaven časovni pas.';

  @override
  String get cityErrorText => 'Vrednost mora biti veljavno ime mesta.';

  @override
  String get countryErrorText => 'Vrednost mora biti veljavna država.';

  @override
  String get stateErrorText => 'Vrednost mora biti veljavna zvezna država.';

  @override
  String get streetErrorText => 'Vrednost mora biti veljavno ime ulice.';

  @override
  String get firstNameErrorText => 'Vrednost mora biti veljavno ime.';

  @override
  String get lastNameErrorText => 'Vrednost mora biti veljaven priimek.';

  @override
  String get passportNumberErrorText =>
      'Vrednost mora biti veljavna številka potnega lista.';

  @override
  String get primeNumberErrorText => 'Vrednost mora biti praštevilo.';

  @override
  String get dunsErrorText => 'Vrednost mora biti veljavna DUNS številka.';

  @override
  String get licensePlateErrorText =>
      'Vrednost mora biti veljavna registrska tablica.';

  @override
  String get vinErrorText =>
      'Vrednost mora biti veljavna identifikacijska številka vozila (VIN).';

  @override
  String get languageCodeErrorText =>
      'Vrednost mora biti veljavna koda jezika.';

  @override
  String get floatErrorText =>
      'Vrednost mora biti veljavno število s plavajočo vejico.';

  @override
  String get hexadecimalErrorText =>
      'Vrednost mora biti veljavno šestnajstiško število.';
}
