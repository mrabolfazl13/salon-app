// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Romanian Moldavian Moldovan (`ro`).
class FormBuilderLocalizationsImplRo extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplRo([String locale = 'ro']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Acest câmp necesită un număr valid de card de credit.';

  @override
  String get dateStringErrorText => 'Acest câmp necesită un șir de date valid.';

  @override
  String get emailErrorText => 'Acest câmp necesită o adresă de e-mail validă.';

  @override
  String equalErrorText(String value) {
    return 'Valoarea câmpului trebuie să fie egală cu $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Valoarea trebuie să aibă o lungime egală cu $length.';
  }

  @override
  String get integerErrorText => 'Acest câmp necesită un număr întreg valid.';

  @override
  String get ipErrorText => 'Acest câmp necesită un IP valid.';

  @override
  String get matchErrorText => 'Valoarea nu se potrivește cu modelul.';

  @override
  String maxErrorText(num max) {
    return 'Valoarea trebuie să fie mai mică sau egală cu $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Valoarea trebuie să aibă o lungime mai mică sau egală cu $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Valoarea trebuie să aibă un număr de cuvinte mai mic sau egal cu $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'Valoarea trebuie să fie mai mare sau egală cu $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Valoarea trebuie să aibă o lungime mai mare sau egală cu $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Valoarea trebuie să aibă un număr de cuvinte mai mare sau egal cu $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Valoarea câmpului nu trebuie să fie egală cu $value.';
  }

  @override
  String get numericErrorText => 'Valoarea trebuie să fie numerică.';

  @override
  String get requiredErrorText => 'Acest câmp nu poate fi gol.';

  @override
  String get urlErrorText => 'Acest câmp necesită o adresă URL validă.';

  @override
  String get phoneErrorText => 'Acest câmp necesită un număr de telefon valid.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Acest câmp necesită o dată de expirare a cardului de credit validă.';

  @override
  String get creditCardExpiredErrorText => 'Cardul de credit a expirat.';

  @override
  String get creditCardCVCErrorText =>
      'Acest câmp necesită un cod CVC valid al cardului de credit.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Acest câmp necesită un cod de culoare valid.';
  }

  @override
  String get uppercaseErrorText => 'Acest câmp necesită litere mari.';

  @override
  String get lowercaseErrorText => 'Acest câmp necesită litere mici.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Acest câmp necesită o extensie de fișier validă.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Acest fișier depășește dimensiunea maximă permisă.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Data trebuie să fie în intervalul permis.';
  }

  @override
  String get mustBeTrueErrorText => 'Acest câmp trebuie să fie adevărat.';

  @override
  String get mustBeFalseErrorText => 'Acest câmp trebuie să fie fals.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Acest câmp trebuie să conțină un caracter special.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Acest câmp trebuie să conțină o literă mare.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Acest câmp trebuie să conțină o literă mică.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Acest câmp trebuie să conțină un număr.';
  }

  @override
  String get alphabeticalErrorText =>
      'Acest câmp trebuie să conțină doar litere.';

  @override
  String get uuidErrorText => 'Acest câmp necesită un UUID valid.';

  @override
  String get jsonErrorText => 'Acest câmp necesită un JSON valid.';

  @override
  String get latitudeErrorText => 'Acest câmp necesită o latitudine validă.';

  @override
  String get longitudeErrorText => 'Acest câmp necesită o longitudine validă.';

  @override
  String get base64ErrorText => 'Acest câmp necesită un șir Base64 valid.';

  @override
  String get pathErrorText => 'Acest câmp necesită o cale validă.';

  @override
  String get oddNumberErrorText => 'Acest câmp necesită un număr impar.';

  @override
  String get evenNumberErrorText => 'Acest câmp necesită un număr par.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Acest câmp necesită un număr de port valid.';
  }

  @override
  String get macAddressErrorText => 'Acest câmp necesită o adresă MAC validă.';

  @override
  String startsWithErrorText(String value) {
    return 'Valoarea trebuie să înceapă cu $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Valoarea trebuie să se termine cu $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'Valoarea trebuie să conțină $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Valoarea trebuie să fie între $min și $max.';
  }

  @override
  String get containsElementErrorText =>
      'Valoarea trebuie să fie în lista valorilor permise.';

  @override
  String get ibanErrorText => 'Acest câmp necesită un IBAN valid.';

  @override
  String get uniqueErrorText => 'Valoarea trebuie să fie unică.';

  @override
  String get bicErrorText => 'Acest câmp necesită un cod BIC valid.';

  @override
  String get isbnErrorText => 'Acest câmp necesită un număr ISBN valid.';

  @override
  String get singleLineErrorText =>
      'Acest câmp trebuie să fie pe o singură linie.';

  @override
  String get timeErrorText => 'Acest câmp necesită o oră validă.';

  @override
  String get dateMustBeInTheFutureErrorText => 'Data trebuie să fie în viitor.';

  @override
  String get dateMustBeInThePastErrorText => 'Data trebuie să fie în trecut.';

  @override
  String get fileNameErrorText =>
      'Valoarea trebuie să fie un nume de fișier valid.';

  @override
  String get negativeNumberErrorText =>
      'Valoarea trebuie să fie un număr negativ.';

  @override
  String get positiveNumberErrorText =>
      'Valoarea trebuie să fie un număr pozitiv.';

  @override
  String get notZeroNumberErrorText => 'Valoarea nu trebuie să fie zero.';

  @override
  String get ssnErrorText =>
      'Valoarea trebuie să fie un Număr de Asigurare Socială valid.';

  @override
  String get zipCodeErrorText => 'Valoarea trebuie să fie un cod ZIP valid.';

  @override
  String get usernameErrorText =>
      'Valoarea trebuie să fie un nume de utilizator valid.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Numele de utilizator nu poate conţine cifre.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Numele de utilizator nu poate conţine caractere de subliniere.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Numele de utilizator nu poate conţine caractere speciale.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Numele de utilizator nu poate conţine spaţii.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Numele de utilizator nu poate conţine puncte.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Numele de utilizator nu poate conţine cratime.';

  @override
  String get invalidMimeTypeErrorText => 'Tip mime invalid.';

  @override
  String get timezoneErrorText => 'Valoarea trebuie să fie un fus orar valid.';

  @override
  String get cityErrorText => 'Valoarea trebuie să fie un nume de oraș valid.';

  @override
  String get countryErrorText => 'Valoarea trebuie să fie o țară validă.';

  @override
  String get stateErrorText => 'Valoarea trebuie să fie un stat valid.';

  @override
  String get streetErrorText =>
      'Valoarea trebuie să fie un nume de stradă valid.';

  @override
  String get firstNameErrorText => 'Valoarea trebuie să fie un prenume valid.';

  @override
  String get lastNameErrorText =>
      'Valoarea trebuie să fie un nume de familie valid.';

  @override
  String get passportNumberErrorText =>
      'Valoarea trebuie să fie un număr de pașaport valid.';

  @override
  String get primeNumberErrorText => 'Valoarea trebuie să fie un număr prim.';

  @override
  String get dunsErrorText => 'Valoarea trebuie să fie un număr DUNS valid.';

  @override
  String get licensePlateErrorText =>
      'Valoarea trebuie să fie un număr de înmatriculare valid.';

  @override
  String get vinErrorText => 'Valoarea trebuie să fie un VIN valid.';

  @override
  String get languageCodeErrorText =>
      'Valoarea trebuie să fie un cod de limbă valid.';

  @override
  String get floatErrorText =>
      'Valoarea trebuie să fie un număr zecimal valid.';

  @override
  String get hexadecimalErrorText =>
      'Valoarea trebuie să fie un număr hexadecimal valid.';
}
