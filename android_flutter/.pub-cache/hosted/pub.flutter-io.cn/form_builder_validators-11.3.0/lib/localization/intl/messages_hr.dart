// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Croatian (`hr`).
class FormBuilderLocalizationsImplHr extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplHr([String locale = 'hr']) : super(locale);

  @override
  String get creditCardErrorText => 'Unesite validan broj kreditne kartice.';

  @override
  String get dateStringErrorText => 'Unesite validan datum.';

  @override
  String get emailErrorText => 'Unesite validnu e-mail adresu.';

  @override
  String equalErrorText(String value) {
    return 'Vrijednost mora biti jednaka $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Vrijednost mora biti duga $length znakova.';
  }

  @override
  String get integerErrorText => 'Vrijednost mora biti cijeli broj.';

  @override
  String get ipErrorText => 'Unesite validnu IP adresu.';

  @override
  String get matchErrorText => 'Vrijednost ne odgovara uzorku.';

  @override
  String maxErrorText(num max) {
    return 'Vrijednost mora biti manja ili jednaka $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Vrijednost mora biti kraća ili jednaka $maxLength znakova.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Vrijednost mora imati riječi manje od ili jednake $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'Vrijednost mora biti veća ili jednaka $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Vrijednost mora biti duža ili jednaka $minLength znakova.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Vrijednost mora imati broj riječi veći ili jednak $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Vrijednost ne smije biti jednaka $value.';
  }

  @override
  String get numericErrorText => 'Vrijednost mora biti brojčana.';

  @override
  String get requiredErrorText => 'Ovo polje ne smije biti prazno.';

  @override
  String get urlErrorText => 'Unesite validnu URL adresu.';

  @override
  String get phoneErrorText => 'Unesite validan telefonski broj.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Unesite validan datum isteka kreditne kartice.';

  @override
  String get creditCardExpiredErrorText => 'Kreditna kartica je istekla.';

  @override
  String get creditCardCVCErrorText =>
      'Unesite validan CVC kod kreditne kartice.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Unesite validan kod boje.';
  }

  @override
  String get uppercaseErrorText => 'Ovo polje zahtijeva velika slova.';

  @override
  String get lowercaseErrorText => 'Ovo polje zahtijeva mala slova.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Unesite validnu ekstenziju fajla.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Ovaj fajl premašuje maksimalnu dozvoljenu veličinu.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Datum mora biti u dozvoljenom rasponu.';
  }

  @override
  String get mustBeTrueErrorText => 'Ovo polje mora biti istinito.';

  @override
  String get mustBeFalseErrorText => 'Ovo polje mora biti lažno.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Ovo polje mora sadržavati poseban znak.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Ovo polje mora sadržavati jedno veliko slovo.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Ovo polje mora sadržavati jedno malo slovo.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Ovo polje mora sadržavati jedan broj.';
  }

  @override
  String get alphabeticalErrorText => 'Ovo polje mora sadržavati samo slova.';

  @override
  String get uuidErrorText => 'Unesite validan UUID.';

  @override
  String get jsonErrorText => 'Unesite validan JSON.';

  @override
  String get latitudeErrorText => 'Unesite validnu geografsku širinu.';

  @override
  String get longitudeErrorText => 'Unesite validnu geografsku dužinu.';

  @override
  String get base64ErrorText => 'Unesite validan Base64 string.';

  @override
  String get pathErrorText => 'Unesite validnu putanju.';

  @override
  String get oddNumberErrorText => 'Ovo polje zahtijeva neparan broj.';

  @override
  String get evenNumberErrorText => 'Ovo polje zahtijeva paran broj.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Unesite validan broj porta.';
  }

  @override
  String get macAddressErrorText => 'Unesite validnu MAC adresu.';

  @override
  String startsWithErrorText(String value) {
    return 'Vrijednost mora početi sa $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Vrijednost mora završiti sa $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'Vrijednost mora sadržavati $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Vrijednost mora biti između $min i $max.';
  }

  @override
  String get containsElementErrorText =>
      'Vrijednost mora biti na listi dopuštenih vrijednosti.';

  @override
  String get ibanErrorText => 'Unesite validan IBAN.';

  @override
  String get uniqueErrorText => 'Vrijednost mora biti jedinstvena.';

  @override
  String get bicErrorText => 'Unesite validan BIC.';

  @override
  String get isbnErrorText => 'Unesite validan ISBN.';

  @override
  String get singleLineErrorText => 'Unesite samo jedan redak teksta.';

  @override
  String get timeErrorText => 'Unesite validno vrijeme.';

  @override
  String get dateMustBeInTheFutureErrorText => 'Datum mora biti u budućnosti.';

  @override
  String get dateMustBeInThePastErrorText => 'Datum mora biti u prošlosti.';

  @override
  String get fileNameErrorText => 'Vrijednost mora biti valjano ime datoteke.';

  @override
  String get negativeNumberErrorText => 'Vrijednost mora biti negativan broj.';

  @override
  String get positiveNumberErrorText => 'Vrijednost mora biti pozitivan broj.';

  @override
  String get notZeroNumberErrorText => 'Vrijednost ne smije biti nula.';

  @override
  String get ssnErrorText =>
      'Vrijednost mora biti valjani broj socijalnog osiguranja.';

  @override
  String get zipCodeErrorText => 'Vrijednost mora biti valjan poštanski broj.';

  @override
  String get usernameErrorText =>
      'Vrijednost mora biti valjano korisničko ime.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Korisničko ime ne može sadržavati brojeve.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Korisničko ime ne može sadržavati donju crtu.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Korisničko ime ne može sadržavati posebne znakove.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Korisničko ime ne može sadržavati razmake.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Korisničko ime ne može sadržavati točke.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Korisničko ime ne može sadržavati crtice.';

  @override
  String get invalidMimeTypeErrorText => 'Nevažeći MIME tip.';

  @override
  String get timezoneErrorText => 'Vrijednost mora biti važeća vremenska zona.';

  @override
  String get cityErrorText => 'Vrijednost mora biti važeći naziv grada.';

  @override
  String get countryErrorText => 'Vrijednost mora biti važeća država.';

  @override
  String get stateErrorText => 'Vrijednost mora biti važeća država.';

  @override
  String get streetErrorText => 'Vrijednost mora biti važeći naziv ulice.';

  @override
  String get firstNameErrorText => 'Vrijednost mora biti važeće ime.';

  @override
  String get lastNameErrorText => 'Vrijednost mora biti važeće prezime.';

  @override
  String get passportNumberErrorText =>
      'Vrijednost mora biti važeći broj putovnice.';

  @override
  String get primeNumberErrorText => 'Vrijednost mora biti prost broj.';

  @override
  String get dunsErrorText => 'Vrijednost mora biti važeći DUNS broj.';

  @override
  String get licensePlateErrorText =>
      'Vrijednost mora biti važeća registarska oznaka.';

  @override
  String get vinErrorText => 'Vrijednost mora biti važeći VIN.';

  @override
  String get languageCodeErrorText =>
      'Vrijednost mora biti važeći jezični kod.';

  @override
  String get floatErrorText =>
      'Vrijednost mora biti valjani broj s pomičnim zarezom.';

  @override
  String get hexadecimalErrorText =>
      'Vrijednost mora biti valjani heksadecimalni broj.';
}
