// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Georgian (`ka`).
class FormBuilderLocalizationsImplKa extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplKa([String locale = 'ka']) : super(locale);

  @override
  String get creditCardErrorText =>
      'ველის მნიშვნელობა უნდა იყოს საკრედიტო ბარათის ნომერი.';

  @override
  String get dateStringErrorText => 'ველი უნდა იყოს თარიღი.';

  @override
  String get emailErrorText => 'ველი უნდა იყოს email მისამართი.';

  @override
  String equalErrorText(String value) {
    return 'ველის მნიშვნელობა უნდა იყოს ტოლი $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'მნიშვნელობას უნდა ჰქონდეს სიგრძე, რომელიც ტოლი უნდა იყოს $length.';
  }

  @override
  String get integerErrorText => 'ველი უნდა იყოს მთელი რიცხვი.';

  @override
  String get ipErrorText => 'ველი უნდა იყოს IP მისამართი.';

  @override
  String get matchErrorText => 'მნიშვნელობა უნდა შეესაბამებოდეს ნიმუშს.';

  @override
  String maxErrorText(num max) {
    return 'მნიშვნელობა უნდა იყოს ნაკლები ან ტოლი $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'მნიშვნელობის სიგრძე უნდა იყოს ნაკლები ან ტოლი $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'მნიშვნელობას უნდა ჰქონდეს სიტყვების რაოდენობა ნაკლები ან ტოლი $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'მნიშვნელობა უნდა იყოს მეტი ან ტოლი $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'მნიშვნელობის სიგრძე უნდა იყოს მეტი ან ტოლი $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'მნიშვნელობას უნდა ჰქონდეს სიტყვების რაოდენობა მეტი ან ტოლი $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'ველის მნიშვნელობა არ უნდა იყოს ტოლი $value.';
  }

  @override
  String get numericErrorText => 'მნიშვნელობა უნდა იყოს რიცხვი.';

  @override
  String get requiredErrorText => 'ველი არ შეიძლება იყოს ცარიელი.';

  @override
  String get urlErrorText => 'ველი უნდა იყოს URL მისამართი.';

  @override
  String get phoneErrorText => 'ველი უნდა იყოს ტელეფონის ნომერი.';

  @override
  String get creditCardExpirationDateErrorText =>
      'ველი უნდა იყოს საკრედიტო ბარათის ვადის გასვლის მოქმედი თარიღი.';

  @override
  String get creditCardExpiredErrorText => 'საკრედიტო ბარათს ვადა გაუვიდა.';

  @override
  String get creditCardCVCErrorText =>
      'ველი უნდა იყოს მოქმედი საკრედიტო ბარათის CVC კოდი.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'ველი უნდა იყოს სწორი ფერის კოდი.';
  }

  @override
  String get uppercaseErrorText => 'ველი უნდა შეიცავდეს დიდი ასოებით დაწერილს.';

  @override
  String get lowercaseErrorText => 'ველი უნდა შეიცავდეს პატარა ასოებს.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'ველი უნდა იყოს ფაილის სწორი გაფართოება.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'ფაილი აღემატება მაქსიმალურ დაშვებულ ზომას.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'თარიღი უნდა იყოს ვალიდურ დიაპაზონში.';
  }

  @override
  String get mustBeTrueErrorText => 'ველი უნდა იყოს ჭეშმარიტი.';

  @override
  String get mustBeFalseErrorText => 'ველი უნდა იყოს ყალბი.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'ველი უნდა შეიცავდეს განსაკუთრებულ ხასიათს.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'ველი უნდა შეიცავდეს დიდ ასოებს.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'ველი უნდა შეიცავდეს მცირე ასოებს.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'ველი უნდა შეიცავდეს რიცხვებს.';
  }

  @override
  String get alphabeticalErrorText => 'ველი უნდა შეიცავდეს მხოლოდ ასოებს.';

  @override
  String get uuidErrorText => 'ველი უნდა იყოს მოქმედი UUID.';

  @override
  String get jsonErrorText => 'ველი უნდა იყოს მოქმედი JSON.';

  @override
  String get latitudeErrorText => 'ველი უნდა იყოს სწორი განედი.';

  @override
  String get longitudeErrorText => 'ველი უნდა იყოს სწორი გრძედი.';

  @override
  String get base64ErrorText => 'ველი უნდა იყოს მოქმედი Base64 სტრიქონი.';

  @override
  String get pathErrorText => 'ველი უნდა იყოს სწორი გზა.';

  @override
  String get oddNumberErrorText => 'ველი კენტი რიცხვი უნდა იყოს.';

  @override
  String get evenNumberErrorText => 'ველი ლუწი რიცხვი უნდა იყოს.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'ველი უნდა იყოს სწორი პორტის ნომერი.';
  }

  @override
  String get macAddressErrorText => 'ველი უნდა იყოს სწორი MAC მისამართი.';

  @override
  String startsWithErrorText(String value) {
    return 'მნიშვნელობა უნდა იწყებოდეს $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'მნიშვნელობა უნდა მთავრდებოდეს $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'მნიშვნელობა უნდა შეიცავდეს $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'მნიშვნელობა უნდა იყოს შორის $min და $max.';
  }

  @override
  String get containsElementErrorText =>
      'მნიშვნელობა უნდა იყოს ვალიდური მნიშვნელობების სიაში.';

  @override
  String get ibanErrorText => 'ველი უნდა იყოს სწორი IBAN ნომერი.';

  @override
  String get uniqueErrorText => 'ველი უნიკალური უნდა იყოს.';

  @override
  String get bicErrorText => 'ველი უნდა იყოს მოქმედი BIC კოდი.';

  @override
  String get isbnErrorText => 'ველი უნდა იყოს სწორი ISBN ნომერი.';

  @override
  String get singleLineErrorText => 'ველი უნდა შეიცავდეს მხოლოდ ერთ ხაზს.';

  @override
  String get timeErrorText => 'ველი უნდა იყოს სწორი დრო.';

  @override
  String get dateMustBeInTheFutureErrorText => 'თარიღი მომავალში უნდა იყოს.';

  @override
  String get dateMustBeInThePastErrorText => 'თარიღი წარსულში უნდა იყოს.';

  @override
  String get fileNameErrorText => 'მნიშვნელობა უნდა იყოს ფაილის სწორი სახელი.';

  @override
  String get negativeNumberErrorText =>
      'მნიშვნელობა უარყოფითი რიცხვი უნდა იყოს.';

  @override
  String get positiveNumberErrorText =>
      'მნიშვნელობა უნდა იყოს დადებითი რიცხვი.';

  @override
  String get notZeroNumberErrorText => 'მნიშვნელობა არ უნდა იყოს ნული.';

  @override
  String get ssnErrorText =>
      'მნიშვნელობა უნდა იყოს მოქმედი სოციალური დაზღვევის ნომერი.';

  @override
  String get zipCodeErrorText =>
      'მნიშვნელობა უნდა იყოს მოქმედი საფოსტო ინდექსი.';

  @override
  String get usernameErrorText =>
      'მნიშვნელობა უნდა იყოს სწორი მომხმარებლის სახელი.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'მომხმარებლის სახელი არ შეიძლება შეიცავდეს ციფრებს.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'მომხმარებლის სახელი არ შეიძლება შეიცავდეს ქვედახაზებს.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'მომხმარებლის სახელი არ შეიძლება შეიცავდეს სპეციალურ სიმბოლოებს.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'მომხმარებლის სახელი არ შეიძლება შეიცავდეს სივრცეებს.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'მომხმარებლის სახელი არ შეიძლება შეიცავდეს წერტილებს.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'მომხმარებლის სახელი არ შეიძლება შეიცავდეს დეფისებს.';

  @override
  String get invalidMimeTypeErrorText => 'არასწორი MIME-ტიპი.';

  @override
  String get timezoneErrorText => 'მნიშვნელობა უნდა იყოს სწორი დროის სარტყელი.';

  @override
  String get cityErrorText => 'მნიშვნელობა უნდა იყოს ქალაქის სწორი სახელი.';

  @override
  String get countryErrorText => 'მნიშვნელობა უნდა იყოს ქვეყნის სწორი სახელი.';

  @override
  String get stateErrorText => 'მნიშვნელობა უნდა იყოს მოქმედი შტატის სახელი.';

  @override
  String get streetErrorText => 'მნიშვნელობა უნდა იყოს სწორი ქუჩის სახელი.';

  @override
  String get firstNameErrorText => 'მნიშვნელობა უნდა იყოს სწორი სახელი.';

  @override
  String get lastNameErrorText => 'მნიშვნელობა უნდა იყოს სწორი გვარი.';

  @override
  String get passportNumberErrorText =>
      'მნიშვნელობა უნდა იყოს მოქმედი პასპორტის ნომერი.';

  @override
  String get primeNumberErrorText => 'მნიშვნელობა უნდა იყოს მარტივი რიცხვი.';

  @override
  String get dunsErrorText => 'მნიშვნელობა უნდა იყოს სწორი DUNS ნომერი.';

  @override
  String get licensePlateErrorText =>
      'მნიშვნელობა უნდა იყოს მოქმედი სანომრე ნიშნის ნომერი.';

  @override
  String get vinErrorText => 'მნიშვნელობა უნდა იყოს მოქმედი VIN.';

  @override
  String get languageCodeErrorText =>
      'მნიშვნელობა უნდა იყოს ვალიდური ენის კოდი.';

  @override
  String get floatErrorText =>
      'მნიშვნელობა უნდა იყოს სწორი მცურავი წვეთოვანი რიცხვი.';

  @override
  String get hexadecimalErrorText =>
      'მნიშვნელობა უნდა იყოს სწორი თექვსმეტობითი რიცხვი.';
}
