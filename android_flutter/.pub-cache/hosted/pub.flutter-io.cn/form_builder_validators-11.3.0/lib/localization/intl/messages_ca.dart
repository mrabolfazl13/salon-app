// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Catalan Valencian (`ca`).
class FormBuilderLocalizationsImplCa extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplCa([String locale = 'ca']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Aquest camp requereix un número de targeta de crèdit vàlid.';

  @override
  String get dateStringErrorText =>
      'Aquest camp requereix una cadena de data vàlida.';

  @override
  String get emailErrorText =>
      'Aquest camp requereix una adreça de correu electrònic vàlida.';

  @override
  String equalErrorText(String value) {
    return 'Aquest valor de camp ha de ser igual a $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'El valor ha de tenir una longitud igual a $length.';
  }

  @override
  String get integerErrorText => 'Aquest camp requereix un nombre enter vàlid.';

  @override
  String get ipErrorText => 'Aquest camp requereix una IP vàlida.';

  @override
  String get matchErrorText => 'El valor no coincideix amb el patró.';

  @override
  String maxErrorText(num max) {
    return 'El valor ha de ser inferior o igual a $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'El valor ha de tenir una longitud inferior o igual a $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'El valor ha de tenir un compte de paraules inferior o igual a $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'El valor ha de ser superior o igual a $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'El valor ha de tenir una longitud superior o igual a $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'El valor ha de tenir un compte de paraules superior o igual a $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Aquest valor de camp no ha de ser igual a $value.';
  }

  @override
  String get numericErrorText => 'El valor ha de ser numèric.';

  @override
  String get requiredErrorText => 'Aquest camp no pot estar buit.';

  @override
  String get urlErrorText => 'Aquest camp requereix una adreça URL vàlida.';

  @override
  String get phoneErrorText =>
      'Aquest camp requereix un número de telèfon vàlid.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Aquest camp requereix una data de caducitat de la targeta de crèdit vàlida.';

  @override
  String get creditCardExpiredErrorText => 'La targeta de crèdit ha caducat.';

  @override
  String get creditCardCVCErrorText =>
      'Aquest camp requereix un codi CVC vàlid de la targeta de crèdit.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Aquest camp requereix un codi de color vàlid.';
  }

  @override
  String get uppercaseErrorText => 'Aquest camp requereix majúscules.';

  @override
  String get lowercaseErrorText => 'Aquest camp requereix minúscules.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Aquest camp requereix una extensió de fitxer vàlida.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Aquest fitxer supera la mida màxima permesa.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'La data ha d\'estar dins del rang permès.';
  }

  @override
  String get mustBeTrueErrorText => 'Aquest camp ha de ser cert.';

  @override
  String get mustBeFalseErrorText => 'Aquest camp ha de ser fals.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Aquest camp ha de contenir un caràcter especial.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Aquest camp ha de contenir una majúscula.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Aquest camp ha de contenir una minúscula.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Aquest camp ha de contenir un número.';
  }

  @override
  String get alphabeticalErrorText =>
      'Aquest camp només ha de contenir lletres.';

  @override
  String get uuidErrorText => 'Aquest camp requereix un UUID vàlid.';

  @override
  String get jsonErrorText => 'Aquest camp requereix un JSON vàlid.';

  @override
  String get latitudeErrorText => 'Aquest camp requereix una latitud vàlida.';

  @override
  String get longitudeErrorText => 'Aquest camp requereix una longitud vàlida.';

  @override
  String get base64ErrorText =>
      'Aquest camp requereix una cadena Base64 vàlida.';

  @override
  String get pathErrorText => 'Aquest camp requereix un camí vàlid.';

  @override
  String get oddNumberErrorText => 'Aquest camp requereix un número senar.';

  @override
  String get evenNumberErrorText => 'Aquest camp requereix un número parell.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Aquest camp requereix un número de port vàlid.';
  }

  @override
  String get macAddressErrorText =>
      'Aquest camp requereix una adreça MAC vàlida.';

  @override
  String startsWithErrorText(String value) {
    return 'El valor ha de començar amb $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'El valor ha d\'acabar amb $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'El valor ha de contenir $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'El valor ha d\'estar entre $min i $max.';
  }

  @override
  String get containsElementErrorText =>
      'El valor ha d\'estar en la llista de valors permesos.';

  @override
  String get ibanErrorText => 'Aquest camp requereix un IBAN vàlid.';

  @override
  String get uniqueErrorText => 'Aquest camp requereix un valor únic.';

  @override
  String get bicErrorText => 'Aquest camp requereix un codi BIC vàlid.';

  @override
  String get isbnErrorText => 'Aquest camp requereix un ISBN vàlid.';

  @override
  String get singleLineErrorText => 'Aquest camp ha de ser una línia única.';

  @override
  String get timeErrorText => 'Aquest camp requereix una hora vàlida.';

  @override
  String get dateMustBeInTheFutureErrorText => 'La data ha de ser al futur.';

  @override
  String get dateMustBeInThePastErrorText => 'La data ha de ser al passat.';

  @override
  String get fileNameErrorText => 'El valor ha de ser un nom de fitxer vàlid.';

  @override
  String get negativeNumberErrorText => 'El valor ha de ser un nombre negatiu.';

  @override
  String get positiveNumberErrorText => 'El valor ha de ser un nombre positiu.';

  @override
  String get notZeroNumberErrorText => 'El valor no pot ser zero.';

  @override
  String get ssnErrorText =>
      'El valor ha de ser un Número de Seguretat Social vàlid.';

  @override
  String get zipCodeErrorText => 'El valor ha de ser un codi postal vàlid.';

  @override
  String get usernameErrorText => 'El valor ha de ser un nom d\'usuari vàlid.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'El nom d\'usuari no pot contenir números.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'El nom d\'usuari no pot contenir subratllats.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'El nom d\'usuari no pot contenir caràcters especials.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'El nom d\'usuari no pot contenir espais.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'El nom d\'usuari no pot contenir punts.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'El nom d\'usuari no pot contenir guions.';

  @override
  String get invalidMimeTypeErrorText => 'Tipus MIME no vàlid.';

  @override
  String get timezoneErrorText => 'El valor ha de ser una zona horària vàlida.';

  @override
  String get cityErrorText => 'El valor ha de ser un nom de ciutat vàlid.';

  @override
  String get countryErrorText => 'El valor ha de ser un país vàlid.';

  @override
  String get stateErrorText => 'El valor ha de ser un estat vàlid.';

  @override
  String get streetErrorText => 'El valor ha de ser un nom de carrer vàlid.';

  @override
  String get firstNameErrorText => 'El valor ha de ser un nom de pila vàlid.';

  @override
  String get lastNameErrorText => 'El valor ha de ser un cognom vàlid.';

  @override
  String get passportNumberErrorText =>
      'El valor ha de ser un número de passaport vàlid.';

  @override
  String get primeNumberErrorText => 'El valor ha de ser un nombre primer.';

  @override
  String get dunsErrorText => 'El valor ha de ser un número DUNS vàlid.';

  @override
  String get licensePlateErrorText =>
      'El valor ha de ser una matrícula vàlida.';

  @override
  String get vinErrorText => 'El valor ha de ser un VIN vàlid.';

  @override
  String get languageCodeErrorText =>
      'El valor ha de ser un codi de llengua vàlid.';

  @override
  String get floatErrorText =>
      'El valor ha de ser un nombre de coma flotant vàlid.';

  @override
  String get hexadecimalErrorText =>
      'El valor ha de ser un nombre hexadecimal vàlid.';
}
