// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Norwegian (`no`).
class FormBuilderLocalizationsImplNo extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplNo([String locale = 'no']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Dette feltet krever et gyldig kredittkortnummer.';

  @override
  String get dateStringErrorText => 'Dette feltet krever en gyldig dato.';

  @override
  String get emailErrorText => 'Dette feltet krever en gyldig e-postadresse.';

  @override
  String equalErrorText(String value) {
    return 'Verdien i dette feltet må være lik $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Verdien må ha lengden $length.';
  }

  @override
  String get integerErrorText => 'Verdien må være et heltall.';

  @override
  String get ipErrorText => 'Dette feltet krever en gyldig IP-adresse.';

  @override
  String get matchErrorText => 'Verdien samsvarer ikke med mønsteret.';

  @override
  String maxErrorText(num max) {
    return 'Verdien må være mindre enn eller lik $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Verdien må være mindre enn eller lik $maxLength tegn.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Antall ord må være mindre enn eller lik $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'Verdien må være større enn eller lik $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Verdien må være større enn eller lik $minLength tegn.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Antall ord må være større enn eller lik $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Verdien i feltet må ikke være lik $value.';
  }

  @override
  String get numericErrorText => 'Verdien må være numerisk.';

  @override
  String get requiredErrorText => 'Dette feltet må fylles ut.';

  @override
  String get urlErrorText => 'Må være en gyldig URL-adresse.';

  @override
  String get phoneErrorText => 'Dette feltet krever et gyldig telefonnummer.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Dette feltet krever en gyldig utløpsdato for kredittkortet.';

  @override
  String get creditCardExpiredErrorText => 'Kredittkortet er utløpt.';

  @override
  String get creditCardCVCErrorText =>
      'Dette feltet krever en gyldig CVC-kode for kredittkortet.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Dette feltet krever en gyldig fargekode.';
  }

  @override
  String get uppercaseErrorText => 'Dette feltet krever store bokstaver.';

  @override
  String get lowercaseErrorText => 'Dette feltet krever små bokstaver.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Dette feltet krever en gyldig filtype.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Denne filen overskrider maksimal tillatt størrelse.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Datoen må være innenfor det tillatte området.';
  }

  @override
  String get mustBeTrueErrorText => 'Dette feltet må være sant.';

  @override
  String get mustBeFalseErrorText => 'Dette feltet må være usant.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Dette feltet må inneholde spesialtegn.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Dette feltet må inneholde store bokstaver.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Dette feltet må inneholde små bokstaver.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Dette feltet må inneholde tall.';
  }

  @override
  String get alphabeticalErrorText =>
      'Dette feltet må inneholde kun bokstaver.';

  @override
  String get uuidErrorText => 'Dette feltet krever en gyldig UUID.';

  @override
  String get jsonErrorText => 'Dette feltet krever en gyldig JSON.';

  @override
  String get latitudeErrorText => 'Dette feltet krever en gyldig breddegrad.';

  @override
  String get longitudeErrorText => 'Dette feltet krever en gyldig lengdegrad.';

  @override
  String get base64ErrorText => 'Dette feltet krever en gyldig Base64-streng.';

  @override
  String get pathErrorText => 'Dette feltet krever en gyldig bane.';

  @override
  String get oddNumberErrorText => 'Dette feltet krever et oddetall.';

  @override
  String get evenNumberErrorText => 'Dette feltet krever et partall.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Dette feltet krever et gyldig portnummer.';
  }

  @override
  String get macAddressErrorText =>
      'Dette feltet krever en gyldig MAC-adresse.';

  @override
  String startsWithErrorText(String value) {
    return 'Verdien må starte med $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Verdien må slutte med $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'Verdien må inneholde $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Verdien må være mellom $min og $max.';
  }

  @override
  String get containsElementErrorText =>
      'Verdien må være i listen over tillatte verdier.';

  @override
  String get ibanErrorText => 'Dette feltet krever en gyldig IBAN.';

  @override
  String get uniqueErrorText => 'Dette feltet krever en unik verdi.';

  @override
  String get bicErrorText => 'Dette feltet krever en gyldig BIC.';

  @override
  String get isbnErrorText => 'Dette feltet krever en gyldig ISBN.';

  @override
  String get singleLineErrorText => 'Dette feltet må være en enkelt linje.';

  @override
  String get timeErrorText => 'Dette feltet krever en gyldig klokkeslett.';

  @override
  String get dateMustBeInTheFutureErrorText => 'Datoen må være i fremtiden.';

  @override
  String get dateMustBeInThePastErrorText => 'Datoen må være i fortiden.';

  @override
  String get fileNameErrorText => 'Verdien må være et gyldig filnavn.';

  @override
  String get negativeNumberErrorText => 'Verdien må være et negativt tall.';

  @override
  String get positiveNumberErrorText => 'Verdien må være et positivt tall.';

  @override
  String get notZeroNumberErrorText => 'Verdien kan ikke være null.';

  @override
  String get ssnErrorText => 'Verdien må være et gyldig personnummer.';

  @override
  String get zipCodeErrorText => 'Verdien må være en gyldig postnummer.';

  @override
  String get usernameErrorText => 'Verdien må være et gyldig brukernavn.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Brukernavn kan ikke inneholde tall.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Brukernavn kan ikke inneholde understrek.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Brukernavn kan ikke inneholde spesialtegn.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Brukernavn kan ikke inneholde mellomrom.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Brukernavn kan ikke inneholde prikker.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Brukernavn kan ikke inneholde bindestreker.';

  @override
  String get invalidMimeTypeErrorText => 'Ugyldig mime-type.';

  @override
  String get timezoneErrorText => 'Verdien må være en gyldig tidssone.';

  @override
  String get cityErrorText => 'Verdien må være et gyldig bynavn.';

  @override
  String get countryErrorText => 'Verdien må være et gyldig land.';

  @override
  String get stateErrorText => 'Verdien må være en gyldig delstat.';

  @override
  String get streetErrorText => 'Verdien må være et gyldig gatenavn.';

  @override
  String get firstNameErrorText => 'Verdien må være et gyldig fornavn.';

  @override
  String get lastNameErrorText => 'Verdien må være et gyldig etternavn.';

  @override
  String get passportNumberErrorText => 'Verdien må være et gyldig passnummer.';

  @override
  String get primeNumberErrorText => 'Verdien må være et primtall.';

  @override
  String get dunsErrorText => 'Verdien må være et gyldig DUNS-nummer.';

  @override
  String get licensePlateErrorText =>
      'Verdien må være et gyldig registreringsnummer.';

  @override
  String get vinErrorText => 'Verdien må være et gyldig VIN.';

  @override
  String get languageCodeErrorText => 'Verdien må være en gyldig språkkode.';

  @override
  String get floatErrorText => 'Verdien må være et gyldig flyttall.';

  @override
  String get hexadecimalErrorText =>
      'Verdien må være et gyldig heksadesimalt tall.';
}
