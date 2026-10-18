// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Hebrew (`he`).
class FormBuilderLocalizationsImplHe extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplHe([String locale = 'he']) : super(locale);

  @override
  String get creditCardErrorText => 'שדה זה דורש מספר כרטיס אשראי תקין.';

  @override
  String get dateStringErrorText => 'שדה זה דורש מחרוזת תאריך תקינה.';

  @override
  String get emailErrorText => 'שדה זה דורש כתובת דוא\"ל תקינה.';

  @override
  String equalErrorText(String value) {
    return 'ערך זה חייב להיות שווה ל $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'ערך זה חייב להיות באורך שווה ל $length.';
  }

  @override
  String get integerErrorText => 'שדה זה דורש מספר שלם תקין.';

  @override
  String get ipErrorText => 'שדה זה דורש כתובת IP תקינה.';

  @override
  String get matchErrorText => 'ערך זה אינו תואם לתבנית.';

  @override
  String maxErrorText(num max) {
    return 'ערך זה חייב להיות קטן או שווה ל $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'ערך זה חייב להיות באורך קטן או שווה ל $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'ערך זה חייב להיות באורך מילים קטן או שווה ל $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'ערך זה חייב להיות גדול או שווה ל $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'ערך זה חייב להיות באורך גדול או שווה ל $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'ערך זה חייב להיות באורך מילים גדול או שווה ל $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'ערך זה חייב להיות שונה מ $value.';
  }

  @override
  String get numericErrorText => 'ערך זה חייב להיות מספרי.';

  @override
  String get requiredErrorText => 'שדה זה אינו יכול להיות ריק.';

  @override
  String get urlErrorText => 'שדה זה דורש כתובת URL תקינה.';

  @override
  String get phoneErrorText => 'שדה זה דורש מספר טלפון תקין.';

  @override
  String get creditCardExpirationDateErrorText =>
      'שדה זה דורש תאריך תפוגה תקין לכרטיס האשראי.';

  @override
  String get creditCardExpiredErrorText => 'כרטיס האשראי פג תוקף.';

  @override
  String get creditCardCVCErrorText =>
      'שדה זה דורש קוד CVC תקין לכרטיס האשראי.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'שדה זה דורש קוד צבע תקין.';
  }

  @override
  String get uppercaseErrorText => 'שדה זה דורש אותיות רישיות.';

  @override
  String get lowercaseErrorText => 'שדה זה דורש אותיות קטנות.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'שדה זה דורש סיומת קובץ תקינה.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'קובץ זה חורג מהגודל המותר.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'התאריך חייב להיות בטווח המותר.';
  }

  @override
  String get mustBeTrueErrorText => 'שדה זה חייב להיות נכון.';

  @override
  String get mustBeFalseErrorText => 'שדה זה חייב להיות שגוי.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'שדה זה חייב להכיל תו מיוחד.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'שדה זה חייב להכיל אות רישית.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'שדה זה חייב להכיל אות קטנה.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'שדה זה חייב להכיל מספר.';
  }

  @override
  String get alphabeticalErrorText => 'שדה זה חייב להכיל אותיות בלבד.';

  @override
  String get uuidErrorText => 'שדה זה דורש UUID תקין.';

  @override
  String get jsonErrorText => 'שדה זה דורש JSON תקין.';

  @override
  String get latitudeErrorText => 'שדה זה דורש קו רוחב תקין.';

  @override
  String get longitudeErrorText => 'שדה זה דורש קו אורך תקין.';

  @override
  String get base64ErrorText => 'שדה זה דורש מחרוזת Base64 תקינה.';

  @override
  String get pathErrorText => 'שדה זה דורש נתיב תקין.';

  @override
  String get oddNumberErrorText => 'שדה זה דורש מספר אי זוגי.';

  @override
  String get evenNumberErrorText => 'שדה זה דורש מספר זוגי.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'שדה זה דורש מספר פורט תקין.';
  }

  @override
  String get macAddressErrorText => 'שדה זה דורש כתובת MAC תקינה.';

  @override
  String startsWithErrorText(String value) {
    return 'הערך חייב להתחיל עם $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'הערך חייב להסתיים עם $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'הערך חייב להכיל את $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'הערך חייב להיות בין $min לבין $max.';
  }

  @override
  String get containsElementErrorText =>
      'הערך חייב להיות ברשימת הערכים המותרים.';

  @override
  String get ibanErrorText => 'שדה זה דורש מספר IBAN תקין.';

  @override
  String get uniqueErrorText => 'שדה זה דורש ערך ייחודי.';

  @override
  String get bicErrorText => 'שדה זה דורש מזהה BIC תקין.';

  @override
  String get isbnErrorText => 'שדה זה דורש מספר ISBN תקין.';

  @override
  String get singleLineErrorText => 'שדה זה דורש שורה יחידה.';

  @override
  String get timeErrorText => 'שדה זה דורש שעה תקינה.';

  @override
  String get dateMustBeInTheFutureErrorText => 'התאריך חייב להיות בעתיד.';

  @override
  String get dateMustBeInThePastErrorText => 'התאריך חייב להיות בעבר.';

  @override
  String get fileNameErrorText => 'הערך חייב להיות שם קובץ תקין.';

  @override
  String get negativeNumberErrorText => 'הערך חייב להיות מספר שלילי.';

  @override
  String get positiveNumberErrorText => 'הערך חייב להיות מספר חיובי.';

  @override
  String get notZeroNumberErrorText => 'הערך לא יכול להיות אפס.';

  @override
  String get ssnErrorText => 'הערך חייב להיות מספר סודי חברתי תקין.';

  @override
  String get zipCodeErrorText => 'הערך חייב להיות מיקוד תקין.';

  @override
  String get usernameErrorText => 'הערך חייב להיות שם משתמש תקין.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'שם המשתמש לא יכול להכיל מספרים.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'שם המשתמש לא יכול להכיל קו תחתון.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'שם המשתמש לא יכול להכיל תווים מיוחדים.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'שם המשתמש לא יכול להכיל רווחים.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'שם המשתמש לא יכול להכיל נקודות.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'שם המשתמש לא יכול להכיל מקפים.';

  @override
  String get invalidMimeTypeErrorText => 'סוג MIME לא חוקי.';

  @override
  String get timezoneErrorText => 'הערך חייב להיות אזור זמן חוקי.';

  @override
  String get cityErrorText => 'הערך חייב להיות שם עיר חוקי.';

  @override
  String get countryErrorText => 'הערך חייב להיות מדינה חוקית.';

  @override
  String get stateErrorText => 'הערך חייב להיות מדינה חוקית.';

  @override
  String get streetErrorText => 'הערך חייב להיות שם רחוב חוקי.';

  @override
  String get firstNameErrorText => 'הערך חייב להיות שם פרטי חוקי.';

  @override
  String get lastNameErrorText => 'הערך חייב להיות שם משפחה חוקי.';

  @override
  String get passportNumberErrorText => 'הערך חייב להיות מספר דרכון חוקי.';

  @override
  String get primeNumberErrorText => 'הערך חייב להיות מספר ראשוני.';

  @override
  String get dunsErrorText => 'הערך חייב להיות מספר DUNS חוקי.';

  @override
  String get licensePlateErrorText => 'הערך חייב להיות מספר רכב חוקי.';

  @override
  String get vinErrorText => 'הערך חייב להיות מספר VIN חוקי.';

  @override
  String get languageCodeErrorText => 'הערך חייב להיות קוד שפה חוקי.';

  @override
  String get floatErrorText => 'הערך חייב להיות מספר נקודה צפה חוקי.';

  @override
  String get hexadecimalErrorText => 'הערך חייב להיות מספר הקסדצימלי חוקי.';
}
