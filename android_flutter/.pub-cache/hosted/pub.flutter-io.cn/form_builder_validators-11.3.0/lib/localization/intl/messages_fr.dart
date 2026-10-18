// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class FormBuilderLocalizationsImplFr extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplFr([String locale = 'fr']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Ce champ nécessite un numéro de carte de crédit valide.';

  @override
  String get dateStringErrorText =>
      'Ce champ nécessite une chaîne de date valide.';

  @override
  String get emailErrorText => 'Ce champ nécessite une adresse e-mail valide.';

  @override
  String equalErrorText(String value) {
    return 'Cette valeur de champ doit être égale à $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'La valeur doit avoir une longueur égale à $length.';
  }

  @override
  String get integerErrorText => 'Ce champ nécessite un entier valide.';

  @override
  String get ipErrorText => 'Ce champ nécessite une adresse IP valide.';

  @override
  String get matchErrorText => 'La valeur ne correspond pas au modèle.';

  @override
  String maxErrorText(num max) {
    return 'La valeur doit être inférieure ou égale à $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'La valeur doit avoir une longueur inférieure ou égale à $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'La valeur doit avoir un nombre de mots inférieur ou égal à $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'La valeur doit être supérieure ou égale à $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'La valeur doit avoir une longueur supérieure ou égale à $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'La valeur doit avoir un nombre de mots supérieur ou égal à $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Cette valeur de champ ne doit pas être égale à $value.';
  }

  @override
  String get numericErrorText => 'La valeur doit être numérique.';

  @override
  String get requiredErrorText => 'Ce champ ne peut pas être vide.';

  @override
  String get urlErrorText => 'Ce champ nécessite une adresse URL valide.';

  @override
  String get phoneErrorText =>
      'Ce champ nécessite un numéro de téléphone valide.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Ce champ nécessite une date d\'expiration valide pour la carte de crédit.';

  @override
  String get creditCardExpiredErrorText => 'La carte de crédit a expiré.';

  @override
  String get creditCardCVCErrorText =>
      'Ce champ nécessite un code CVC valide pour la carte de crédit.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Ce champ nécessite un code couleur valide.';
  }

  @override
  String get uppercaseErrorText => 'Ce champ nécessite des lettres majuscules.';

  @override
  String get lowercaseErrorText => 'Ce champ nécessite des lettres minuscules.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Ce champ nécessite une extension de fichier valide.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Ce fichier dépasse la taille maximale autorisée.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'La date doit être dans l\'intervalle autorisé.';
  }

  @override
  String get mustBeTrueErrorText => 'Ce champ doit être vrai.';

  @override
  String get mustBeFalseErrorText => 'Ce champ doit être faux.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Ce champ doit contenir un caractère spécial.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Ce champ doit contenir une lettre majuscule.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Ce champ doit contenir une lettre minuscule.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Ce champ doit contenir un chiffre.';
  }

  @override
  String get alphabeticalErrorText =>
      'Ce champ doit contenir uniquement des lettres.';

  @override
  String get uuidErrorText => 'Ce champ nécessite un UUID valide.';

  @override
  String get jsonErrorText => 'Ce champ nécessite un JSON valide.';

  @override
  String get latitudeErrorText => 'Ce champ nécessite une latitude valide.';

  @override
  String get longitudeErrorText => 'Ce champ nécessite une longitude valide.';

  @override
  String get base64ErrorText => 'Ce champ nécessite une chaîne Base64 valide.';

  @override
  String get pathErrorText => 'Ce champ nécessite un chemin valide.';

  @override
  String get oddNumberErrorText => 'Ce champ nécessite un nombre impair.';

  @override
  String get evenNumberErrorText => 'Ce champ nécessite un nombre pair.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Ce champ nécessite un numéro de port valide.';
  }

  @override
  String get macAddressErrorText =>
      'Ce champ nécessite une adresse MAC valide.';

  @override
  String startsWithErrorText(String value) {
    return 'La valeur doit commencer par $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'La valeur doit se terminer par $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'La valeur doit contenir $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'La valeur doit être comprise entre $min et $max.';
  }

  @override
  String get containsElementErrorText =>
      'La valeur doit être dans la liste des valeurs autorisées.';

  @override
  String get ibanErrorText => 'Ce champ nécessite un IBAN valide.';

  @override
  String get uniqueErrorText => 'Ce champ doit être unique.';

  @override
  String get bicErrorText => 'Ce champ nécessite un code BIC valide.';

  @override
  String get isbnErrorText => 'Ce champ nécessite un ISBN valide.';

  @override
  String get singleLineErrorText => 'Ce champ doit être une seule ligne.';

  @override
  String get timeErrorText => 'Ce champ nécessite une heure valide.';

  @override
  String get dateMustBeInTheFutureErrorText =>
      'La date doit être dans le futur.';

  @override
  String get dateMustBeInThePastErrorText => 'La date doit être dans le passé.';

  @override
  String get fileNameErrorText =>
      'La valeur doit être un nom de fichier valide.';

  @override
  String get negativeNumberErrorText =>
      'La valeur doit être un nombre négatif.';

  @override
  String get positiveNumberErrorText =>
      'La valeur doit être un nombre positif.';

  @override
  String get notZeroNumberErrorText => 'La valeur ne doit pas être zéro.';

  @override
  String get ssnErrorText =>
      'La valeur doit être un numéro de sécurité sociale valide.';

  @override
  String get zipCodeErrorText => 'La valeur doit être un code postal valide.';

  @override
  String get usernameErrorText =>
      'La valeur doit être un nom d\'utilisateur valide.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Le nom d\'utilisateur ne peut pas contenir de chiffres.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Le nom d\'utilisateur ne peut pas contenir de tiret bas.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Le nom d\'utilisateur ne peut pas contenir de caractères spéciaux.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Le nom d\'utilisateur ne peut pas contenir d\'espaces.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Le nom d\'utilisateur ne peut pas contenir de points.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Le nom d\'utilisateur ne peut pas contenir de tirets.';

  @override
  String get invalidMimeTypeErrorText => 'Type MIME invalide.';

  @override
  String get timezoneErrorText =>
      'La valeur doit être un fuseau horaire valide.';

  @override
  String get cityErrorText => 'La valeur doit être un nom de ville valide.';

  @override
  String get countryErrorText => 'La valeur doit être un pays valide.';

  @override
  String get stateErrorText => 'La valeur doit être un état valide.';

  @override
  String get streetErrorText => 'La valeur doit être un nom de rue valide.';

  @override
  String get firstNameErrorText => 'La valeur doit être un prénom valide.';

  @override
  String get lastNameErrorText =>
      'La valeur doit être un nom de famille valide.';

  @override
  String get passportNumberErrorText =>
      'La valeur doit être un numéro de passeport valide.';

  @override
  String get primeNumberErrorText => 'La valeur doit être un nombre premier.';

  @override
  String get dunsErrorText => 'La valeur doit être un numéro DUNS valide.';

  @override
  String get licensePlateErrorText =>
      'La valeur doit être une plaque d\'immatriculation valide.';

  @override
  String get vinErrorText => 'La valeur doit être un numéro VIN valide.';

  @override
  String get languageCodeErrorText =>
      'La valeur doit être un code de langue valide.';

  @override
  String get floatErrorText =>
      'La valeur doit être un nombre à virgule flottante valide.';

  @override
  String get hexadecimalErrorText =>
      'La valeur doit être un nombre hexadécimal valide.';
}
