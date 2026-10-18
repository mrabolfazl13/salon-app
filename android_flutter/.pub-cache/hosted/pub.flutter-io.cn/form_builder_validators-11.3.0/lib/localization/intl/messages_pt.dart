// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Portuguese (`pt`).
class FormBuilderLocalizationsImplPt extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplPt([String locale = 'pt']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Este campo requer um número de cartão de crédito válido.';

  @override
  String get dateStringErrorText =>
      'Este campo requer uma string de data válida.';

  @override
  String get emailErrorText =>
      'Este campo requer um endereço de e-mail válido.';

  @override
  String equalErrorText(String value) {
    return 'Este valor de campo deve ser igual a $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'O valor deve ter um comprimento igual a $length.';
  }

  @override
  String get integerErrorText => 'Este campo requer um número inteiro válido.';

  @override
  String get ipErrorText => 'Este campo requer um IP válido.';

  @override
  String get matchErrorText => 'O valor não corresponde ao padrão.';

  @override
  String maxErrorText(num max) {
    return 'O valor deve ser menor ou igual a $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'O valor deve ter um comprimento menor ou igual a $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'O valor deve ter uma contagem de palavras menor ou igual a $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'O valor deve ser maior ou igual a $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'O valor deve ter um comprimento maior ou igual a $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'O valor deve ter uma contagem de palavras maior ou igual a $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'O valor não deve ser igual a $value.';
  }

  @override
  String get numericErrorText => 'O valor deve ser numérico.';

  @override
  String get requiredErrorText => 'Este campo não pode ficar vazio.';

  @override
  String get urlErrorText => 'Este campo requer um endereço de URL válido.';

  @override
  String get phoneErrorText =>
      'Este campo requer um número de telefone válido.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Este campo requer uma data de validade do cartão de crédito válida.';

  @override
  String get creditCardExpiredErrorText => 'O cartão de crédito está expirado.';

  @override
  String get creditCardCVCErrorText =>
      'Este campo requer um código CVC do cartão de crédito válido.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Este campo requer um código de cor válido.';
  }

  @override
  String get uppercaseErrorText => 'Este campo requer letras maiúsculas.';

  @override
  String get lowercaseErrorText => 'Este campo requer letras minúsculas.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Este campo requer uma extensão de arquivo válida.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Este arquivo excede o tamanho máximo permitido.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'A data deve estar dentro do intervalo permitido.';
  }

  @override
  String get mustBeTrueErrorText => 'Este campo deve ser verdadeiro.';

  @override
  String get mustBeFalseErrorText => 'Este campo deve ser falso.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Este campo deve conter um caractere especial.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Este campo deve conter uma letra maiúscula.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Este campo deve conter uma letra minúscula.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Este campo deve conter um número.';
  }

  @override
  String get alphabeticalErrorText => 'Este campo deve conter apenas letras.';

  @override
  String get uuidErrorText => 'Este campo requer um UUID válido.';

  @override
  String get jsonErrorText => 'Este campo requer um JSON válido.';

  @override
  String get latitudeErrorText => 'Este campo requer uma latitude válida.';

  @override
  String get longitudeErrorText => 'Este campo requer uma longitude válida.';

  @override
  String get base64ErrorText => 'Este campo requer uma string Base64 válida.';

  @override
  String get pathErrorText => 'Este campo requer um caminho válido.';

  @override
  String get oddNumberErrorText => 'Este campo requer um número ímpar.';

  @override
  String get evenNumberErrorText => 'Este campo requer um número par.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Este campo requer um número de porta válido.';
  }

  @override
  String get macAddressErrorText => 'Este campo requer um endereço MAC válido.';

  @override
  String startsWithErrorText(String value) {
    return 'O valor deve começar com $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'O valor deve terminar com $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'O valor deve conter $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'O valor deve estar entre $min e $max.';
  }

  @override
  String get containsElementErrorText =>
      'O valor deve estar na lista de valores permitidos.';

  @override
  String get ibanErrorText => 'Este campo requer um IBAN válido.';

  @override
  String get uniqueErrorText => 'Este campo requer um valor único.';

  @override
  String get bicErrorText => 'Este campo requer um código BIC válido.';

  @override
  String get isbnErrorText => 'Este campo requer um ISBN válido.';

  @override
  String get singleLineErrorText => 'Este campo deve conter apenas uma linha.';

  @override
  String get timeErrorText => 'Este campo requer uma hora válida.';

  @override
  String get dateMustBeInTheFutureErrorText => 'Data deve estar no futuro.';

  @override
  String get dateMustBeInThePastErrorText => 'Data deve estar no passado.';

  @override
  String get fileNameErrorText => 'O valor deve ser um nome de arquivo válido.';

  @override
  String get negativeNumberErrorText => 'O valor deve ser um número negativo.';

  @override
  String get positiveNumberErrorText => 'O valor deve ser um número positivo.';

  @override
  String get notZeroNumberErrorText => 'O valor não pode ser zero.';

  @override
  String get ssnErrorText =>
      'O valor deve ser um Número de Seguro Social válido.';

  @override
  String get zipCodeErrorText => 'O valor deve ser um código postal válido.';

  @override
  String get usernameErrorText => 'O valor deve ser um nome de usuário válido.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'O nome de usuário não pode conter números.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'O nome de usuário não pode conter sublinhados.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'O nome de usuário não pode conter caracteres especiais.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'O nome de usuário não pode conter espaços.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'O nome de usuário não pode conter pontos.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'O nome de usuário não pode conter traços.';

  @override
  String get invalidMimeTypeErrorText => 'Tipo MIME inválido.';

  @override
  String get timezoneErrorText => 'O valor deve ser um fuso horário válido.';

  @override
  String get cityErrorText => 'O valor deve ser um nome de cidade válido.';

  @override
  String get countryErrorText => 'O valor deve ser um país válido.';

  @override
  String get stateErrorText => 'O valor deve ser um estado válido.';

  @override
  String get streetErrorText => 'O valor deve ser um nome de rua válido.';

  @override
  String get firstNameErrorText => 'O valor deve ser um primeiro nome válido.';

  @override
  String get lastNameErrorText => 'O valor deve ser um sobrenome válido.';

  @override
  String get passportNumberErrorText =>
      'O valor deve ser um número de passaporte válido.';

  @override
  String get primeNumberErrorText => 'O valor deve ser um número primo.';

  @override
  String get dunsErrorText => 'O valor deve ser um número DUNS válido.';

  @override
  String get licensePlateErrorText =>
      'O valor deve ser uma placa de licença válida.';

  @override
  String get vinErrorText => 'O valor deve ser um VIN válido.';

  @override
  String get languageCodeErrorText =>
      'O valor deve ser um código de idioma válido.';

  @override
  String get floatErrorText =>
      'O valor deve ser um número de ponto flutuante válido.';

  @override
  String get hexadecimalErrorText =>
      'O valor deve ser um número hexadecimal válido.';
}
