// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Albanian (`sq`).
class FormBuilderLocalizationsImplSq extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplSq([String locale = 'sq']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Kjo fushë kërkon një numër të vlefshëm për kartën e kreditit.';

  @override
  String get dateStringErrorText => 'Kjo fushë kërkon një datë të vlefshme.';

  @override
  String get emailErrorText =>
      'Kjo fushë kërkon një adresë e E-mail-i të vlefshme.';

  @override
  String equalErrorText(String value) {
    return 'Kjo vlerë duhet të jetë e barabartë me $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Vlera duhet të ketë një gjatësi të barabartë me $length';
  }

  @override
  String get integerErrorText =>
      'Kjo fushë kërkon një numër të plotë të vlefshëm.';

  @override
  String get ipErrorText => 'Kjo fushë kërkon një IP të vlefshme.';

  @override
  String get matchErrorText => 'Vlera nuk përputhet me shabllonin.';

  @override
  String maxErrorText(num max) {
    return 'Vlera duhet të jetë më e vogël ose e barabartë me $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Vlera duhet të ketë një gjatësi më të vogël ose të barabartë me $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Vlera duhet të ketë një numër fjalësh më të vogël ose të barabartë me $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'Vlera duhet të jetë më e madhe ose e barabartë me $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Vlera duhet të ketë një gjatësi më të madhe ose të barabartë me $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Vlera duhet të ketë një numër fjalësh më të madh ose të barabartë me $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Kjo vlerë nuk duhet të jetë e barabartë me $value.';
  }

  @override
  String get numericErrorText => 'Vlera duhet të jetë numerike.';

  @override
  String get requiredErrorText => 'Kjo fushë nuk mund të jetë bosh.';

  @override
  String get urlErrorText => 'Kjo fushë kërkon një adresë URL të vlefshme.';

  @override
  String get phoneErrorText =>
      'Kjo fushë kërkon një numër telefoni të vlefshëm.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Kjo fushë kërkon një datë skadence të vlefshme për kartën e kreditit.';

  @override
  String get creditCardExpiredErrorText => 'Karta e kreditit ka skaduar.';

  @override
  String get creditCardCVCErrorText =>
      'Kjo fushë kërkon një kod CVC të vlefshëm për kartën e kreditit.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Kjo fushë kërkon një kod ngjyre të vlefshëm.';
  }

  @override
  String get uppercaseErrorText => 'Kjo fushë kërkon shkronja të mëdha.';

  @override
  String get lowercaseErrorText => 'Kjo fushë kërkon shkronja të vogla.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Kjo fushë kërkon një zgjatje skedari të vlefshme.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Ky skedar tejkalon madhësinë maksimale të lejuar.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Data duhet të jetë brenda intervalit të lejuar.';
  }

  @override
  String get mustBeTrueErrorText => 'Kjo fushë duhet të jetë e vërtetë.';

  @override
  String get mustBeFalseErrorText => 'Kjo fushë duhet të jetë e gabuar.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Kjo fushë duhet të përmbajë një karakter të veçantë.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Kjo fushë duhet të përmbajë një shkronjë të madhe.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Kjo fushë duhet të përmbajë një shkronjë të vogël.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Kjo fushë duhet të përmbajë një numër.';
  }

  @override
  String get alphabeticalErrorText =>
      'Kjo fushë duhet të përmbajë vetëm shkronja alfabetike.';

  @override
  String get uuidErrorText => 'Kjo fushë kërkon një UUID të vlefshëm.';

  @override
  String get jsonErrorText => 'Kjo fushë kërkon një JSON të vlefshëm.';

  @override
  String get latitudeErrorText =>
      'Kjo fushë kërkon një gjerësi gjeografike të vlefshme.';

  @override
  String get longitudeErrorText =>
      'Kjo fushë kërkon një gjatësi gjeografike të vlefshme.';

  @override
  String get base64ErrorText =>
      'Kjo fushë kërkon një string Base64 të vlefshëm.';

  @override
  String get pathErrorText => 'Kjo fushë kërkon një rrugë të vlefshme.';

  @override
  String get oddNumberErrorText => 'Kjo fushë kërkon një numër tek.';

  @override
  String get evenNumberErrorText => 'Kjo fushë kërkon një numër çift.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Kjo fushë kërkon një numër porti të vlefshëm.';
  }

  @override
  String get macAddressErrorText =>
      'Kjo fushë kërkon një adresë MAC të vlefshme.';

  @override
  String startsWithErrorText(String value) {
    return 'Vlera duhet të fillojë me $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Vlera duhet të përfundojë me $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'Vlera duhet të përmbajë $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Vlera duhet të jetë ndërmjet $min dhe $max.';
  }

  @override
  String get containsElementErrorText =>
      'Vlera duhet të jetë në listën e vlefshme.';

  @override
  String get ibanErrorText => 'Kjo fushë kërkon një IBAN të vlefshëm.';

  @override
  String get uniqueErrorText => 'Kjo vlerë duhet të jetë unike.';

  @override
  String get bicErrorText => 'Kjo fushë kërkon një kod BIC të vlefshëm.';

  @override
  String get isbnErrorText => 'Kjo fushë kërkon një ISBN të vlefshëm.';

  @override
  String get singleLineErrorText => 'Kjo fushë kërkon një tekst me një rresht.';

  @override
  String get timeErrorText => 'Kjo fushë kërkon një kohë të vlefshme.';

  @override
  String get dateMustBeInTheFutureErrorText =>
      'Data duhet të jetë në të ardhmen.';

  @override
  String get dateMustBeInThePastErrorText =>
      'Data duhet të jetë në të kaluarën.';

  @override
  String get fileNameErrorText =>
      'Vlera duhet të jetë një emër skedari i vlefshëm.';

  @override
  String get negativeNumberErrorText =>
      'Vlera duhet të jetë një numër negativ.';

  @override
  String get positiveNumberErrorText =>
      'Vlera duhet të jetë një numër pozitiv.';

  @override
  String get notZeroNumberErrorText => 'Vlera nuk duhet të jetë zero.';

  @override
  String get ssnErrorText =>
      'Vlera duhet të jetë një numër Social Security i vlefshëm.';

  @override
  String get zipCodeErrorText => 'Vlera duhet të jetë një kod ZIP i vlefshëm.';

  @override
  String get usernameErrorText =>
      'Vlera duhet të jetë një emër përdoruesi i vlefshëm.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Emri i përdoruesit nuk mund të përmbajë numra.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Emri i përdoruesit nuk mund të përmbajë vijë të poshtme.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Emri i përdoruesit nuk mund të përmbajë karaktere speciale.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Emri i përdoruesit nuk mund të përmbajë hapësira.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Emri i përdoruesit nuk mund të përmbajë pika.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Emri i përdoruesit nuk mund të përmbajë vija.';

  @override
  String get invalidMimeTypeErrorText => 'Lloji mime i pavlefshëm.';

  @override
  String get timezoneErrorText =>
      'Vlera duhet të jetë një zonë kohore e vlefshme.';

  @override
  String get cityErrorText => 'Vlera duhet të jetë një emër qyteti i vlefshëm.';

  @override
  String get countryErrorText => 'Vlera duhet të jetë një shtet i vlefshëm.';

  @override
  String get stateErrorText => 'Vlera duhet të jetë një shtet i vlefshëm.';

  @override
  String get streetErrorText =>
      'Vlera duhet të jetë një emër rrugë e vlefshme.';

  @override
  String get firstNameErrorText =>
      'Vlera duhet të jetë një emër i parë i vlefshëm.';

  @override
  String get lastNameErrorText => 'Vlera duhet të jetë një mbiemër i vlefshëm.';

  @override
  String get passportNumberErrorText =>
      'Vlera duhet të jetë një numër pasaporte i vlefshëm.';

  @override
  String get primeNumberErrorText =>
      'Vlera duhet të jetë një numër kryesor i vlefshëm.';

  @override
  String get dunsErrorText => 'Vlera duhet të jetë një numër DUNS i vlefshëm.';

  @override
  String get licensePlateErrorText =>
      'Vlera duhet të jetë një targë makine e vlefshme.';

  @override
  String get vinErrorText => 'Vlera duhet të jetë një VIN i vlefshëm.';

  @override
  String get languageCodeErrorText =>
      'Vlera duhet të jetë një kod gjuhe i vlefshëm.';

  @override
  String get floatErrorText =>
      'Vlera duhet të jetë një numër i vlefshëm me pikë lundruese.';

  @override
  String get hexadecimalErrorText =>
      'Vlera duhet të jetë një numër i vlefshëm heksadecimal.';
}
