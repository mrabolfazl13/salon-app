// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Slovak (`sk`).
class FormBuilderLocalizationsImplSk extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplSk([String locale = 'sk']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Toto pole vyžaduje platné číslo platobnej karty.';

  @override
  String get dateStringErrorText => 'Toto pole vyžaduje platný dátum.';

  @override
  String get emailErrorText => 'Toto pole vyžaduje platnú emailovú adresu.';

  @override
  String equalErrorText(String value) {
    return 'Hodnota tohto poľa musí byť $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Hodnota musí mať dĺžku rovnú $length.';
  }

  @override
  String get integerErrorText => 'Hodnota musí byť celé číslo.';

  @override
  String get ipErrorText => 'Toto pole vyžaduje platnú IP adresu.';

  @override
  String get matchErrorText => 'Hodnota nevyhovuje očakávanému tvaru.';

  @override
  String maxErrorText(num max) {
    return 'Hodnota musí byť menšia alebo rovná ako $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Hodnota musí mať dĺžku najviac $maxLength znakov.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Hodnota musí mať počet slov menší alebo rovný $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'Hodnota musí byť väčšia alebo rovná ako $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Hodnota musí mať dĺžku aspoň $minLength znakov.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Hodnota musí mať počet slov väčší alebo rovný $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Hodnota tohto poľa nesmie byť $value.';
  }

  @override
  String get numericErrorText => 'Hodnota musí byť číslo.';

  @override
  String get requiredErrorText => 'Toto pole nesmie byť prázdne.';

  @override
  String get urlErrorText => 'Toto pole vyžaduje platnú URL adresu.';

  @override
  String get phoneErrorText => 'Toto pole vyžaduje platné telefónne číslo.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Toto pole vyžaduje platný dátum exspirácie kreditnej karty.';

  @override
  String get creditCardExpiredErrorText => 'Platnosť kreditnej karty vypršala.';

  @override
  String get creditCardCVCErrorText =>
      'Toto pole vyžaduje platný CVC kód kreditnej karty.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Toto pole vyžaduje platný farebný kód.';
  }

  @override
  String get uppercaseErrorText => 'Toto pole vyžaduje veľké písmená.';

  @override
  String get lowercaseErrorText => 'Toto pole vyžaduje malé písmená.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Toto pole vyžaduje platnú príponu súboru.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Tento súbor prekračuje maximálnu povolenú veľkosť.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Dátum musí byť v povolenom rozsahu.';
  }

  @override
  String get mustBeTrueErrorText => 'Toto pole musí byť pravdivé.';

  @override
  String get mustBeFalseErrorText => 'Toto pole musí byť nepravdivé.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Toto pole musí obsahovať špeciálny znak.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Toto pole musí obsahovať veľké písmená.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Toto pole musí obsahovať malé písmená.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Toto pole musí obsahovať číslo.';
  }

  @override
  String get alphabeticalErrorText => 'Toto pole musí obsahovať iba písmená.';

  @override
  String get uuidErrorText => 'Toto pole vyžaduje platné UUID.';

  @override
  String get jsonErrorText => 'Toto pole vyžaduje platný JSON.';

  @override
  String get latitudeErrorText => 'Toto pole vyžaduje platnú zemepisnú šírku.';

  @override
  String get longitudeErrorText => 'Toto pole vyžaduje platnú zemepisnú dĺžku.';

  @override
  String get base64ErrorText => 'Toto pole vyžaduje platný Base64 reťazec.';

  @override
  String get pathErrorText => 'Toto pole vyžaduje platnú cestu.';

  @override
  String get oddNumberErrorText => 'Toto pole vyžaduje nepárne číslo.';

  @override
  String get evenNumberErrorText => 'Toto pole vyžaduje párne číslo.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Toto pole vyžaduje platné číslo portu.';
  }

  @override
  String get macAddressErrorText => 'Toto pole vyžaduje platnú MAC adresu.';

  @override
  String startsWithErrorText(String value) {
    return 'Hodnota musí začínať na $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Hodnota musí končiť na $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'Hodnota musí obsahovať $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Hodnota musí byť medzi $min a $max.';
  }

  @override
  String get containsElementErrorText =>
      'Hodnota musí byť v zozname povolených hodnôt.';

  @override
  String get ibanErrorText => 'Toto pole vyžaduje platné IBAN číslo.';

  @override
  String get uniqueErrorText => 'Toto pole vyžaduje unikátnu hodnotu.';

  @override
  String get bicErrorText => 'Toto pole vyžaduje platný BIC kód.';

  @override
  String get isbnErrorText => 'Toto pole vyžaduje platné ISBN číslo.';

  @override
  String get singleLineErrorText => 'Toto pole vyžaduje jedno riadkový text.';

  @override
  String get timeErrorText => 'Toto pole vyžaduje platný čas.';

  @override
  String get dateMustBeInTheFutureErrorText => 'Dátum musí byť v budúcnosti.';

  @override
  String get dateMustBeInThePastErrorText => 'Dátum musí byť v minulosti.';

  @override
  String get fileNameErrorText => 'Hodnota musí byť platným názvom súboru.';

  @override
  String get negativeNumberErrorText => 'Hodnota musí byť záporné číslo.';

  @override
  String get positiveNumberErrorText => 'Hodnota musí byť kladné číslo.';

  @override
  String get notZeroNumberErrorText => 'Hodnota nemôže byť nula.';

  @override
  String get ssnErrorText =>
      'Hodnota musí byť platné číslo sociálneho zabezpečenia.';

  @override
  String get zipCodeErrorText => 'Hodnota musí byť platným PSČ.';

  @override
  String get usernameErrorText => 'Hodnota musí byť platné používateľské meno.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Používateľské meno nemôže obsahovať čísla.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Používateľské meno nemôže obsahovať podtržník.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Používateľské meno nemôže obsahovať špeciálne znaky.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Používateľské meno nemôže obsahovať medzery.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Používateľské meno nemôže obsahovať bodky.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Používateľské meno nemôže obsahovať pomlčky.';

  @override
  String get invalidMimeTypeErrorText => 'Neplatný typ MIME.';

  @override
  String get timezoneErrorText => 'Hodnota musí byť platné časové pásmo.';

  @override
  String get cityErrorText => 'Hodnota musí byť platný názov mesta.';

  @override
  String get countryErrorText => 'Hodnota musí byť platná krajina.';

  @override
  String get stateErrorText => 'Hodnota musí byť platný názov štátu.';

  @override
  String get streetErrorText => 'Hodnota musí byť platný názov ulice.';

  @override
  String get firstNameErrorText => 'Hodnota musí byť platné krstné meno.';

  @override
  String get lastNameErrorText => 'Hodnota musí byť platné priezvisko.';

  @override
  String get passportNumberErrorText => 'Hodnota musí byť platné číslo pasu.';

  @override
  String get primeNumberErrorText => 'Hodnota musí byť prvočíslo.';

  @override
  String get dunsErrorText => 'Hodnota musí byť platné číslo DUNS.';

  @override
  String get licensePlateErrorText =>
      'Hodnota musí byť platné číslo evidenčnej značky vozidla.';

  @override
  String get vinErrorText => 'Hodnota musí byť platné číslo VIN.';

  @override
  String get languageCodeErrorText => 'Hodnota musí byť platný kód jazyka.';

  @override
  String get floatErrorText => 'Hodnota musí byť platné desatinné číslo.';

  @override
  String get hexadecimalErrorText =>
      'Hodnota musí byť platné hexadecimálne číslo.';
}
