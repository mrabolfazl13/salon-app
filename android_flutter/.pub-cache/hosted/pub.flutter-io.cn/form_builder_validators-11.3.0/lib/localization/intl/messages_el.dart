// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Modern Greek (`el`).
class FormBuilderLocalizationsImplEl extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplEl([String locale = 'el']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Η τιμή πρέπει να είναι έγκυρη πιστωτική κάρτα.';

  @override
  String get dateStringErrorText => 'Η τιμή πρέπει να είναι έγκυρη ημερομηνία.';

  @override
  String get emailErrorText =>
      'Το πεδίο πρέπει να έχει μία έγκυρη διεύθυνση email.';

  @override
  String equalErrorText(String value) {
    return 'Η τιμή πρέπει να είναι ίση με $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Η τιμή πρέπει να έχει μήκος ίσο με $length.';
  }

  @override
  String get integerErrorText => 'Η τιμή πρέπει να είναι ακέραιος αριθμός.';

  @override
  String get ipErrorText => 'Η τιμή πρέπει να είναι έγκυρη διεύθυνση IP.';

  @override
  String get matchErrorText => 'Η τιμή δεν ταιριάζει με το μοτίβο.';

  @override
  String maxErrorText(num max) {
    return 'Η τιμή πρέπει να είναι μικρότερη ή ίση με $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Η τιμή πρέπει να έχει μήκος μικρότερο ή ίσο με $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Η τιμή πρέπει να έχει έναν αριθμό λέξεων μικρότερο ή ίσο με $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'Η τιμή πρέπει να είναι μεγαλύτερη ή ίση με $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Η τιμή πρέπει να έχει μήκος μεγαλύτερο ή ίσο με $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Η τιμή πρέπει να έχει έναν αριθμό λέξεων μεγαλύτερο ή ίσο με $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Η τιμή δεν πρέπει να είναι ίση με $value.';
  }

  @override
  String get numericErrorText => 'Η τιμή πρέπει να είναι αριθμητική.';

  @override
  String get requiredErrorText => 'Το πεδίο δεν μπορεί να είναι κενό.';

  @override
  String get urlErrorText => 'Η τιμή πρέπει να είναι έγκυρη διεύθυνση URL.';

  @override
  String get phoneErrorText =>
      'Η τιμή πρέπει να είναι έγκυρος αριθμός τηλεφώνου.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Η τιμή πρέπει να είναι έγκυρη ημερομηνία λήξης της πιστωτικής κάρτας.';

  @override
  String get creditCardExpiredErrorText => 'Η πιστωτική κάρτα έχει λήξει.';

  @override
  String get creditCardCVCErrorText =>
      'Η τιμή πρέπει να είναι έγκυρος κωδικός CVC της πιστωτικής κάρτας.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Η τιμή πρέπει να είναι έγκυρος κωδικός χρώματος.';
  }

  @override
  String get uppercaseErrorText =>
      'Η τιμή πρέπει να είναι με κεφαλαία γράμματα.';

  @override
  String get lowercaseErrorText => 'Η τιμή πρέπει να είναι με μικρά γράμματα.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Η τιμή πρέπει να είναι έγκυρη επέκταση αρχείου.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Αυτό το αρχείο υπερβαίνει το μέγιστο επιτρεπόμενο μέγεθος.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Η ημερομηνία πρέπει να είναι εντός του επιτρεπόμενου εύρους.';
  }

  @override
  String get mustBeTrueErrorText => 'Αυτό το πεδίο πρέπει να είναι αληθές.';

  @override
  String get mustBeFalseErrorText => 'Αυτό το πεδίο πρέπει να είναι ψευδές.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Η τιμή πρέπει να περιέχει έναν ειδικό χαρακτήρα.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Η τιμή πρέπει να περιέχει ένα κεφαλαίο γράμμα.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Η τιμή πρέπει να περιέχει ένα μικρό γράμμα.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Η τιμή πρέπει να περιέχει έναν αριθμό.';
  }

  @override
  String get alphabeticalErrorText =>
      'Η τιμή πρέπει να περιέχει μόνο γράμματα.';

  @override
  String get uuidErrorText => 'Η τιμή πρέπει να είναι έγκυρο UUID.';

  @override
  String get jsonErrorText => 'Η τιμή πρέπει να είναι έγκυρο JSON.';

  @override
  String get latitudeErrorText =>
      'Η τιμή πρέπει να είναι έγκυρο γεωγραφικό πλάτος.';

  @override
  String get longitudeErrorText =>
      'Η τιμή πρέπει να είναι έγκυρο γεωγραφικό μήκος.';

  @override
  String get base64ErrorText =>
      'Η τιμή πρέπει να είναι έγκυρη ακολουθία Base64.';

  @override
  String get pathErrorText => 'Η τιμή πρέπει να είναι έγκυρη διαδρομή.';

  @override
  String get oddNumberErrorText => 'Η τιμή πρέπει να είναι περιττός αριθμός.';

  @override
  String get evenNumberErrorText => 'Η τιμή πρέπει να είναι ζυγός αριθμός.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Η τιμή πρέπει να είναι έγκυρος αριθμός θύρας.';
  }

  @override
  String get macAddressErrorText =>
      'Η τιμή πρέπει να είναι έγκυρη διεύθυνση MAC.';

  @override
  String startsWithErrorText(String value) {
    return 'Η τιμή πρέπει να ξεκινά με $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Η τιμή πρέπει να τελειώνει με $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'Η τιμή πρέπει να περιέχει $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Η τιμή πρέπει να είναι μεταξύ $min και $max.';
  }

  @override
  String get containsElementErrorText =>
      'Η τιμή πρέπει να είναι στη λίστα των επιτρεπόμενων τιμών.';

  @override
  String get ibanErrorText => 'Η τιμή πρέπει να είναι έγκυρο IBAN.';

  @override
  String get uniqueErrorText => 'Η τιμή πρέπει να είναι μοναδική.';

  @override
  String get bicErrorText => 'Η τιμή πρέπει να είναι έγκυρος BIC.';

  @override
  String get isbnErrorText => 'Η τιμή πρέπει να είναι έγκυρο ISBN.';

  @override
  String get singleLineErrorText => 'Η τιμή πρέπει να είναι μία γραμμή.';

  @override
  String get timeErrorText => 'Η τιμή πρέπει να είναι έγκυρη ώρα.';

  @override
  String get dateMustBeInTheFutureErrorText =>
      'Η ημερομηνία πρέπει να είναι στο μέλλον.';

  @override
  String get dateMustBeInThePastErrorText =>
      'Η ημερομηνία πρέπει να είναι στο παρελθόν.';

  @override
  String get fileNameErrorText =>
      'Η τιμή πρέπει να είναι έγκυρο όνομα αρχείου.';

  @override
  String get negativeNumberErrorText =>
      'Η τιμή πρέπει να είναι αρνητικός αριθμός.';

  @override
  String get positiveNumberErrorText =>
      'Η τιμή πρέπει να είναι θετικός αριθμός.';

  @override
  String get notZeroNumberErrorText => 'Η τιμή δεν πρέπει να είναι μηδέν.';

  @override
  String get ssnErrorText =>
      'Η τιμή πρέπει να είναι έγκυρος Αριθμός Κοινωνικής Ασφάλισης.';

  @override
  String get zipCodeErrorText =>
      'Η τιμή πρέπει να είναι έγκυρος ταχυδρομικός κωδικός.';

  @override
  String get usernameErrorText =>
      'Η τιμή πρέπει να είναι ένα έγκυρο όνομα χρήστη.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Το όνομα χρήστη δεν μπορεί να περιέχει αριθμούς.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Το όνομα χρήστη δεν μπορεί να περιέχει κάτω παύλα.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Το όνομα χρήστη δεν μπορεί να περιέχει ειδικούς χαρακτήρες.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Το όνομα χρήστη δεν μπορεί να περιέχει κενά.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Το όνομα χρήστη δεν μπορεί να περιέχει τελείες.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Το όνομα χρήστη δεν μπορεί να περιέχει παύλες.';

  @override
  String get invalidMimeTypeErrorText => 'Μη έγκυρος τύπος MIME.';

  @override
  String get timezoneErrorText =>
      'Η τιμή πρέπει να είναι μια έγκυρη ζώνη ώρας.';

  @override
  String get cityErrorText => 'Η τιμή πρέπει να είναι ένα έγκυρο όνομα πόλης.';

  @override
  String get countryErrorText => 'Η τιμή πρέπει να είναι μια έγκυρη χώρα.';

  @override
  String get stateErrorText => 'Η τιμή πρέπει να είναι μια έγκυρη πολιτεία.';

  @override
  String get streetErrorText => 'Η τιμή πρέπει να είναι ένα έγκυρο όνομα οδού.';

  @override
  String get firstNameErrorText => 'Η τιμή πρέπει να είναι ένα έγκυρο όνομα.';

  @override
  String get lastNameErrorText => 'Η τιμή πρέπει να είναι ένα έγκυρο επώνυμο.';

  @override
  String get passportNumberErrorText =>
      'Η τιμή πρέπει να είναι ένας έγκυρος αριθμός διαβατηρίου.';

  @override
  String get primeNumberErrorText =>
      'Η τιμή πρέπει να είναι ένας πρώτος αριθμός.';

  @override
  String get dunsErrorText =>
      'Η τιμή πρέπει να είναι ένας έγκυρος αριθμός DUNS.';

  @override
  String get licensePlateErrorText =>
      'Η τιμή πρέπει να είναι μια έγκυρη πινακίδα κυκλοφορίας.';

  @override
  String get vinErrorText => 'Η τιμή πρέπει να είναι ένας έγκυρος αριθμός VIN.';

  @override
  String get languageCodeErrorText =>
      'Η τιμή πρέπει να είναι ένας έγκυρος κωδικός γλώσσας.';

  @override
  String get floatErrorText =>
      'Η τιμή πρέπει να είναι έγκυρος δεκαδικός αριθμός κινητής υποδιαστολής.';

  @override
  String get hexadecimalErrorText =>
      'Η τιμή πρέπει να είναι έγκυρος δεκαεξαδικός αριθμός.';
}
