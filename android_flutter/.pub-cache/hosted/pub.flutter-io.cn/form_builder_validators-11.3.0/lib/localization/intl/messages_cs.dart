// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Czech (`cs`).
class FormBuilderLocalizationsImplCs extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplCs([String locale = 'cs']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Pole vyžaduje platné číslo kreditní karty.';

  @override
  String get dateStringErrorText => 'Pole vyžaduje platný zápis data.';

  @override
  String get emailErrorText => 'Pole vyžaduje platnou e-mailovou adresu.';

  @override
  String equalErrorText(String value) {
    return 'Hodnota se musí rovnat $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Hodnota musí mít délku rovnu $length.';
  }

  @override
  String get integerErrorText => 'Hodnota musí být celé číslo.';

  @override
  String get ipErrorText => 'Pole vyžaduje platnou IP adresu.';

  @override
  String get matchErrorText => 'Hodnota neodpovídá vzoru.';

  @override
  String maxErrorText(num max) {
    return 'Hodnota musí být menší než nebo rovna $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Hodnota musí mít délku menší než nebo rovnu $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Hodnota musí mít počet slov menší nebo rovná $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'Hodnota musí být větší než nebo rovna $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Hodnota musí mít délku větší než nebo rovnu $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Hodnota musí mít počet slov větší nebo rovná $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Hodnota se nesmí rovnat $value.';
  }

  @override
  String get numericErrorText => 'Hodnota musí být číslo.';

  @override
  String get requiredErrorText => 'Pole nemůže být prázdné.';

  @override
  String get urlErrorText => 'Pole vyžaduje platnou adresu URL.';

  @override
  String get phoneErrorText => 'Pole vyžaduje platné telefonní číslo.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Pole vyžaduje platné datum vypršení platnosti kreditní karty.';

  @override
  String get creditCardExpiredErrorText => 'Platnost kreditní karty vypršela.';

  @override
  String get creditCardCVCErrorText =>
      'Pole vyžaduje platný CVC kód kreditní karty.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Pole vyžaduje platný barevný kód.';
  }

  @override
  String get uppercaseErrorText => 'Pole vyžaduje velká písmena.';

  @override
  String get lowercaseErrorText => 'Pole vyžaduje malá písmena.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Pole vyžaduje platnou příponu souboru.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Tento soubor překračuje maximální povolenou velikost.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Datum musí být v povoleném rozsahu.';
  }

  @override
  String get mustBeTrueErrorText => 'Toto pole musí být pravdivé.';

  @override
  String get mustBeFalseErrorText => 'Toto pole musí být nepravdivé.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Pole musí obsahovat speciální znak.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Pole musí obsahovat velké písmeno.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Pole musí obsahovat malé písmeno.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Pole musí obsahovat číslo.';
  }

  @override
  String get alphabeticalErrorText => 'Pole musí obsahovat pouze písmena.';

  @override
  String get uuidErrorText => 'Pole vyžaduje platný UUID.';

  @override
  String get jsonErrorText => 'Pole vyžaduje platný JSON.';

  @override
  String get latitudeErrorText => 'Pole vyžaduje platnou zeměpisnou šířku.';

  @override
  String get longitudeErrorText => 'Pole vyžaduje platnou zeměpisnou délku.';

  @override
  String get base64ErrorText => 'Pole vyžaduje platný řetězec Base64.';

  @override
  String get pathErrorText => 'Pole vyžaduje platnou cestu.';

  @override
  String get oddNumberErrorText => 'Pole vyžaduje liché číslo.';

  @override
  String get evenNumberErrorText => 'Pole vyžaduje sudé číslo.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Pole vyžaduje platné číslo portu.';
  }

  @override
  String get macAddressErrorText => 'Pole vyžaduje platnou MAC adresu.';

  @override
  String startsWithErrorText(String value) {
    return 'Hodnota musí začínat na $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Hodnota musí končit na $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'Hodnota musí obsahovat $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Hodnota musí být mezi $min a $max.';
  }

  @override
  String get containsElementErrorText =>
      'Hodnota musí být v seznamu povolených hodnot.';

  @override
  String get ibanErrorText => 'Pole vyžaduje platné IBAN.';

  @override
  String get uniqueErrorText => 'Hodnota musí být jedinečná.';

  @override
  String get bicErrorText => 'Pole vyžaduje platný BIC kód.';

  @override
  String get isbnErrorText => 'Pole vyžaduje platné ISBN.';

  @override
  String get singleLineErrorText => 'Pole musí obsahovat pouze jednu řádku.';

  @override
  String get timeErrorText => 'Pole vyžaduje platný čas.';

  @override
  String get dateMustBeInTheFutureErrorText => 'Datum musí být v budoucnosti.';

  @override
  String get dateMustBeInThePastErrorText => 'Datum musí být v minulosti.';

  @override
  String get fileNameErrorText => 'Hodnota musí být platným názvem souboru.';

  @override
  String get negativeNumberErrorText => 'Hodnota musí být záporné číslo.';

  @override
  String get positiveNumberErrorText => 'Hodnota musí být kladné číslo.';

  @override
  String get notZeroNumberErrorText => 'Hodnota nesmí být nula.';

  @override
  String get ssnErrorText =>
      'Hodnota musí být platné číslo sociálního zabezpečení.';

  @override
  String get zipCodeErrorText => 'Hodnota musí být platné PSČ.';

  @override
  String get usernameErrorText =>
      'Hodnota musí být platným uživatelským jménem.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Uživatelské jméno nesmí obsahovat čísla.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Uživatelské jméno nesmí obsahovat podtržítko.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Uživatelské jméno nesmí obsahovat speciální znaky.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Uživatelské jméno nesmí obsahovat mezery.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Uživatelské jméno nesmí obsahovat tečky.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Uživatelské jméno nesmí obsahovat pomlčky.';

  @override
  String get invalidMimeTypeErrorText => 'Neplatný typ MIME.';

  @override
  String get timezoneErrorText => 'Hodnota musí být platné časové pásmo.';

  @override
  String get cityErrorText => 'Hodnota musí být platný název města.';

  @override
  String get countryErrorText => 'Hodnota musí být platná země.';

  @override
  String get stateErrorText => 'Hodnota musí být platný název státu.';

  @override
  String get streetErrorText => 'Hodnota musí být platný název ulice.';

  @override
  String get firstNameErrorText => 'Hodnota musí být platné jméno.';

  @override
  String get lastNameErrorText => 'Hodnota musí být platné příjmení.';

  @override
  String get passportNumberErrorText => 'Hodnota musí být platné číslo pasu.';

  @override
  String get primeNumberErrorText => 'Hodnota musí být prvočíslo.';

  @override
  String get dunsErrorText => 'Hodnota musí být platné číslo DUNS.';

  @override
  String get licensePlateErrorText =>
      'Hodnota musí být platná poznávací značka.';

  @override
  String get vinErrorText => 'Hodnota musí být platný VIN.';

  @override
  String get languageCodeErrorText => 'Hodnota musí být platný kód jazyka.';

  @override
  String get floatErrorText => 'Hodnota musí být platné desetinné číslo.';

  @override
  String get hexadecimalErrorText =>
      'Hodnota musí být platné šestnáctkové číslo.';
}
