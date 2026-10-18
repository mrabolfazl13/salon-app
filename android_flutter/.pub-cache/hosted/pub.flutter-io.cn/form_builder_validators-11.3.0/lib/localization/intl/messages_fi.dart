// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Finnish (`fi`).
class FormBuilderLocalizationsImplFi extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplFi([String locale = 'fi']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Luottokortin numero on oltava oikeassa muodossa.';

  @override
  String get dateStringErrorText => 'Päivämäärä ei ole oikeassa muodossa.';

  @override
  String get emailErrorText => 'Sähköpostiosoitteen muoto ei ole oikea.';

  @override
  String equalErrorText(String value) {
    return 'Kentän on vastattava arvoa $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Merkkijonon pituus on oltava $length.';
  }

  @override
  String get integerErrorText => 'Tarvitaan voimassa oleva kokonaisluku.';

  @override
  String get ipErrorText => 'IP-osoitteen muoto on annettava oikein.';

  @override
  String get matchErrorText => 'Arvo ei vastaa muotovaatimuksia.';

  @override
  String maxErrorText(num max) {
    return 'Arvon tulee olla pienempi tai yhtä suuri kuin $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Merkkijonon pituuden tulee olla pienempi tai yhtä suuri kuin $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Sanamäärän tulee olla pienempi tai yhtä suuri kuin $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'Kentän arvon tulee olla suurempi tai yhtä suuri kuin $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Merkkijonon pituuden tulee olla suurempi tai yhtä suuri kuin $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Sanamäärän tulee olla suurempi tai yhtä suuri kuin $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Tämän kentän arvo ei saa olla sama kuin $value.';
  }

  @override
  String get numericErrorText => 'Arvon tulee olla numeerinen.';

  @override
  String get requiredErrorText => 'Kenttä ei voi olla tyhjä.';

  @override
  String get urlErrorText => 'Vaaditaan oikean muotoinen URL-osoite.';

  @override
  String get phoneErrorText => 'Vaaditaan oikean muotoinen puhelinnumero.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Vaaditaan voimassa oleva luottokortin voimassaoloaika.';

  @override
  String get creditCardExpiredErrorText => 'Luottokortti on vanhentunut.';

  @override
  String get creditCardCVCErrorText =>
      'Vaaditaan oikean muotoinen luottokortin CVC-koodi.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Vaaditaan oikean muotoinen värikoodi.';
  }

  @override
  String get uppercaseErrorText => 'Kenttä vaatii isoja kirjaimia.';

  @override
  String get lowercaseErrorText => 'Kenttä vaatii pieniä kirjaimia.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Vaaditaan oikean muotoinen tiedostopääte.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Tiedosto ylittää sallitun enimmäiskoon.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Päivämäärän on oltava sallitussa aikavälissä.';
  }

  @override
  String get mustBeTrueErrorText => 'Kentän on oltava tosi.';

  @override
  String get mustBeFalseErrorText => 'Kentän on oltava epätosi.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Kentän on sisällettävä erikoismerkki.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Kentän on sisällettävä iso kirjain.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Kentän on sisällettävä pieni kirjain.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Kentän on sisällettävä numero.';
  }

  @override
  String get alphabeticalErrorText => 'Kentän on sisällettävä vain kirjaimia.';

  @override
  String get uuidErrorText => 'Vaaditaan oikean muotoinen UUID.';

  @override
  String get jsonErrorText => 'Vaaditaan oikean muotoinen JSON.';

  @override
  String get latitudeErrorText => 'Vaaditaan oikean muotoinen leveysaste.';

  @override
  String get longitudeErrorText => 'Vaaditaan oikean muotoinen pituusaste.';

  @override
  String get base64ErrorText => 'Vaaditaan oikean muotoinen Base64-merkkijono.';

  @override
  String get pathErrorText => 'Vaaditaan oikean muotoinen polku.';

  @override
  String get oddNumberErrorText => 'Kenttä vaatii parittoman luvun.';

  @override
  String get evenNumberErrorText => 'Kenttä vaatii parillisen luvun.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Vaaditaan oikean muotoinen porttinumero.';
  }

  @override
  String get macAddressErrorText => 'Vaaditaan oikean muotoinen MAC-osoite.';

  @override
  String startsWithErrorText(String value) {
    return 'Arvon on alettava merkillä $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Arvon on loputtava merkkiin $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'Arvon on sisällettävä $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Arvon on oltava välillä $min ja $max.';
  }

  @override
  String get containsElementErrorText =>
      'Arvon on oltava sallittujen arvojen luettelossa.';

  @override
  String get ibanErrorText => 'Vaaditaan oikean muotoinen IBAN-tilinumero.';

  @override
  String get uniqueErrorText => 'Kentän arvon tulee olla uniikki.';

  @override
  String get bicErrorText => 'Vaaditaan oikean muotoinen BIC-koodi.';

  @override
  String get isbnErrorText => 'Vaaditaan oikean muotoinen ISBN-koodi.';

  @override
  String get singleLineErrorText => 'Kentän arvon tulee olla yksirivinen.';

  @override
  String get timeErrorText => 'Vaaditaan oikean muotoinen kellonaika.';

  @override
  String get dateMustBeInTheFutureErrorText =>
      'Päivämäärän tulee olla tulevaisuudessa.';

  @override
  String get dateMustBeInThePastErrorText =>
      'Päivämäärän tulee olla menneisyydessä.';

  @override
  String get fileNameErrorText => 'Arvon tulee olla kelvollinen tiedostonimi.';

  @override
  String get negativeNumberErrorText => 'Arvon tulee olla negatiivinen luku.';

  @override
  String get positiveNumberErrorText => 'Arvon tulee olla positiivinen luku.';

  @override
  String get notZeroNumberErrorText => 'Arvon ei tule olla nolla.';

  @override
  String get ssnErrorText => 'Arvon tulee olla kelvollinen henkilötunnus.';

  @override
  String get zipCodeErrorText => 'Arvon tulee olla kelvollinen postinumero.';

  @override
  String get usernameErrorText => 'Arvon täytyy olla kelvollinen käyttäjänimi.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Käyttäjänimi ei saa sisältää numeroita.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Käyttäjänimi ei saa sisältää alaviivaa.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Käyttäjänimi ei saa sisältää erikoismerkkejä.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Käyttäjänimi ei saa sisältää välilyöntejä.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Käyttäjänimi ei saa sisältää pisteitä.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Käyttäjänimi ei saa sisältää viivoja.';

  @override
  String get invalidMimeTypeErrorText => 'Virheellinen MIME-tyyppi.';

  @override
  String get timezoneErrorText => 'Arvon on oltava kelvollinen aikavyöhyke.';

  @override
  String get cityErrorText => 'Arvon on oltava kelvollinen kaupungin nimi.';

  @override
  String get countryErrorText => 'Arvon on oltava kelvollinen maa.';

  @override
  String get stateErrorText => 'Arvon on oltava kelvollinen osavaltio.';

  @override
  String get streetErrorText => 'Arvon on oltava kelvollinen kadunnimi.';

  @override
  String get firstNameErrorText => 'Arvon on oltava kelvollinen etunimi.';

  @override
  String get lastNameErrorText => 'Arvon on oltava kelvollinen sukunimi.';

  @override
  String get passportNumberErrorText =>
      'Arvon on oltava kelvollinen passinumero.';

  @override
  String get primeNumberErrorText => 'Arvon on oltava alkuluku.';

  @override
  String get dunsErrorText => 'Arvon on oltava kelvollinen DUNS-numero.';

  @override
  String get licensePlateErrorText =>
      'Arvon on oltava kelvollinen rekisterinumero.';

  @override
  String get vinErrorText => 'Arvon on oltava kelvollinen VIN.';

  @override
  String get languageCodeErrorText => 'Arvon on oltava kelvollinen kielikoodi.';

  @override
  String get floatErrorText => 'Arvon on oltava kelvollinen liukuluku.';

  @override
  String get hexadecimalErrorText =>
      'Arvon on oltava kelvollinen heksadesimaaliluku.';
}
