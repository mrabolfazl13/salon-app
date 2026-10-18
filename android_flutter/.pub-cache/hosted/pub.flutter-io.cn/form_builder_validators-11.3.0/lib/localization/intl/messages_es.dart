// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Spanish Castilian (`es`).
class FormBuilderLocalizationsImplEs extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplEs([String locale = 'es']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Este campo requiere un número de tarjeta de crédito válido.';

  @override
  String get dateStringErrorText =>
      'Este campo requiere una cadena de fecha válida.';

  @override
  String get emailErrorText =>
      'Este campo requiere una dirección de correo electrónico válida.';

  @override
  String equalErrorText(String value) {
    return 'Este campo debe ser igual a $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'El valor debe tener una longitud igual a $length.';
  }

  @override
  String get integerErrorText => 'Este campo requiere un entero válido.';

  @override
  String get ipErrorText => 'Este campo requiere una IP válida.';

  @override
  String get matchErrorText => 'El valor no coincide con el patrón requerido.';

  @override
  String maxErrorText(num max) {
    return 'El valor debe ser menor o igual que $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'El valor debe tener una longitud menor o igual a $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'El valor debe tener un recuento de palabras menor o igual a $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'El valor debe ser mayor o igual que $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'El valor debe tener una longitud mayor o igual a $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'El valor debe tener un recuento de palabras mayor o igual a $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Este campo no debe ser igual a $value.';
  }

  @override
  String get numericErrorText => 'El valor debe ser numérico.';

  @override
  String get requiredErrorText => 'Este campo no puede estar vacío.';

  @override
  String get urlErrorText => 'Este campo requiere una dirección URL válida.';

  @override
  String get phoneErrorText =>
      'Este campo requiere un número de teléfono válido.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Este campo requiere una fecha de vencimiento válida para la tarjeta de crédito.';

  @override
  String get creditCardExpiredErrorText => 'La tarjeta de crédito ha expirado.';

  @override
  String get creditCardCVCErrorText =>
      'Este campo requiere un código CVC válido para la tarjeta de crédito.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Este campo requiere un código de color válido.';
  }

  @override
  String get uppercaseErrorText => 'Este campo requiere letras mayúsculas.';

  @override
  String get lowercaseErrorText => 'Este campo requiere letras minúsculas.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Este campo requiere una extensión de archivo válida.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Este archivo supera el tamaño máximo permitido.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'La fecha debe estar dentro del rango permitido.';
  }

  @override
  String get mustBeTrueErrorText => 'Este campo debe ser verdadero.';

  @override
  String get mustBeFalseErrorText => 'Este campo debe ser falso.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Este campo debe contener un carácter especial.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Este campo debe contener una letra mayúscula.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Este campo debe contener una letra minúscula.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Este campo debe contener un número.';
  }

  @override
  String get alphabeticalErrorText => 'Este campo debe contener solo letras.';

  @override
  String get uuidErrorText => 'Este campo requiere un UUID válido.';

  @override
  String get jsonErrorText => 'Este campo requiere un JSON válido.';

  @override
  String get latitudeErrorText => 'Este campo requiere una latitud válida.';

  @override
  String get longitudeErrorText => 'Este campo requiere una longitud válida.';

  @override
  String get base64ErrorText => 'Este campo requiere una cadena Base64 válida.';

  @override
  String get pathErrorText => 'Este campo requiere una ruta válida.';

  @override
  String get oddNumberErrorText => 'Este campo requiere un número impar.';

  @override
  String get evenNumberErrorText => 'Este campo requiere un número par.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Este campo requiere un número de puerto válido.';
  }

  @override
  String get macAddressErrorText =>
      'Este campo requiere una dirección MAC válida.';

  @override
  String startsWithErrorText(String value) {
    return 'El valor debe comenzar con $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'El valor debe terminar con $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'El valor debe contener $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'El valor debe estar entre $min y $max.';
  }

  @override
  String get containsElementErrorText =>
      'El valor debe estar en la lista de valores permitidos.';

  @override
  String get ibanErrorText => 'Este campo requiere un IBAN válido.';

  @override
  String get uniqueErrorText => 'Este campo requiere un valor único.';

  @override
  String get bicErrorText => 'Este campo requiere un código BIC válido.';

  @override
  String get isbnErrorText => 'Este campo requiere un ISBN válido.';

  @override
  String get singleLineErrorText =>
      'Este campo debe contener una sola línea de texto.';

  @override
  String get timeErrorText => 'Este campo requiere una hora válida.';

  @override
  String get dateMustBeInTheFutureErrorText =>
      'La fecha debe estar en el futuro.';

  @override
  String get dateMustBeInThePastErrorText =>
      'La fecha debe estar en el pasado.';

  @override
  String get fileNameErrorText =>
      'El valor debe ser un nombre de archivo válido.';

  @override
  String get negativeNumberErrorText => 'El valor debe ser un número negativo.';

  @override
  String get positiveNumberErrorText => 'El valor debe ser un número positivo.';

  @override
  String get notZeroNumberErrorText => 'El valor no debe ser cero.';

  @override
  String get ssnErrorText =>
      'El valor debe ser un número de Seguro Social válido.';

  @override
  String get zipCodeErrorText => 'El valor debe ser un código ZIP válido.';

  @override
  String get usernameErrorText =>
      'El valor debe ser un nombre de usuario válido.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'El nombre de usuario no puede contener números.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'El nombre de usuario no puede contener guiones bajos.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'El nombre de usuario no puede contener caracteres especiales.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'El nombre de usuario no puede contener espacios.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'El nombre de usuario no puede contener puntos.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'El nombre de usuario no puede contener guiones.';

  @override
  String get invalidMimeTypeErrorText => 'Tipo MIME inválido.';

  @override
  String get timezoneErrorText => 'El valor debe ser una zona horaria válida.';

  @override
  String get cityErrorText => 'El valor debe ser un nombre de ciudad válido.';

  @override
  String get countryErrorText => 'El valor debe ser un país válido.';

  @override
  String get stateErrorText => 'El valor debe ser un estado válido.';

  @override
  String get streetErrorText => 'El valor debe ser un nombre de calle válido.';

  @override
  String get firstNameErrorText => 'El valor debe ser un nombre válido.';

  @override
  String get lastNameErrorText => 'El valor debe ser un apellido válido.';

  @override
  String get passportNumberErrorText =>
      'El valor debe ser un número de pasaporte válido.';

  @override
  String get primeNumberErrorText => 'El valor debe ser un número primo.';

  @override
  String get dunsErrorText => 'El valor debe ser un número DUNS válido.';

  @override
  String get licensePlateErrorText =>
      'El valor debe ser una placa de matrícula válida.';

  @override
  String get vinErrorText => 'El valor debe ser un VIN válido.';

  @override
  String get languageCodeErrorText =>
      'El valor debe ser un código de idioma válido.';

  @override
  String get floatErrorText =>
      'El valor debe ser un número de punto flotante válido.';

  @override
  String get hexadecimalErrorText =>
      'El valor debe ser un número hexadecimal válido.';
}
