// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Tamil (`ta`).
class FormBuilderLocalizationsImplTa extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplTa([String locale = 'ta']) : super(locale);

  @override
  String get creditCardErrorText =>
      'இந்த உள்ளீட்டுக்கு சரியான கிரெடிட் கார்டு எண் தேவை.';

  @override
  String get dateStringErrorText => 'இந்த உள்ளீட்டுக்கு சரியான தேதி தேவை.';

  @override
  String get emailErrorText =>
      'இந்த உள்ளீட்டுக்கு சரியான மின்னஞ்சல் முகவரி தேவை.';

  @override
  String equalErrorText(String value) {
    return 'இந்த உள்ளீடு மதிப்பு $valueக்கு சமமாக இருக்க வேண்டும்.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'மதிப்பு $lengthக்கு சமமான நீளத்தைக் கொண்டிருக்க வேண்டும்.';
  }

  @override
  String get integerErrorText => 'இந்த உள்ளீட்டுக்கு சரியான முழு எண் தேவை.';

  @override
  String get ipErrorText => 'இந்த உள்ளீட்டுக்கு சரியான ஐபி தேவை.';

  @override
  String get matchErrorText => 'மதிப்பு முறையுடன் பொருந்தவில்லை.';

  @override
  String maxErrorText(num max) {
    return 'மதிப்பு $max ஐ விட குறைவாகவோ அல்லது சமமாகவோ இருக்க வேண்டும்.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'மதிப்பின் நீளம் $maxLength ஐ விட குறைவாகவோ அல்லது சமமாகவோ இருக்க வேண்டும்.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'மதிப்பை விட குறைவாகவோ அல்லது சமமாகவோ மதிப்பிடப்பட வேண்டும் $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'மதிப்பு $min ஐ விட அதிகமாகவோ அல்லது சமமாகவோ இருக்க வேண்டும்.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'மதிப்பு $minLength ஐ விட அதிகமாக அல்லது அதற்கு சமமான நீளத்தைக் கொண்டிருக்க வேண்டும்.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'மதிப்பை விட அதிகமாகவோ அல்லது சமமாகவோ மதிப்பிடப்பட வேண்டும் $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'இந்த உள்ளீடு மதிப்பு $valueக்கு சமமாக இருக்கக்கூடாது.';
  }

  @override
  String get numericErrorText => 'மதிப்பு எண்களாக இருக்க வேண்டும்.';

  @override
  String get requiredErrorText => 'இந்த உள்ளீடு காலியாக இருக்கக்கூடாது.';

  @override
  String get urlErrorText => 'இந்த உள்ளீட்டுக்கு சரியான URL முகவரி தேவை.';

  @override
  String get phoneErrorText => 'இந்த உள்ளீட்டுக்கு சரியான தொலைபேசி எண் தேவை.';

  @override
  String get creditCardExpirationDateErrorText =>
      'இந்த உள்ளீட்டுக்கு சரியான கிரெடிட் கார்டு காலாவதி தேதியை தேவை.';

  @override
  String get creditCardExpiredErrorText =>
      'கிரெடிட் கார்டு காலாவதி செய்யப்பட்டுள்ளது.';

  @override
  String get creditCardCVCErrorText =>
      'இந்த உள்ளீட்டுக்கு சரியான கிரெடிட் கார்டு CVC குறியீடு தேவை.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'இந்த உள்ளீட்டுக்கு சரியான நிறக் குறியீடு தேவை.';
  }

  @override
  String get uppercaseErrorText =>
      'இந்த உள்ளீடு பெரிய எழுத்துகளை கொண்டிருக்க வேண்டும்.';

  @override
  String get lowercaseErrorText =>
      'இந்த உள்ளீடு சிறிய எழுத்துகளை கொண்டிருக்க வேண்டும்.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'இந்த உள்ளீட்டுக்கு சரியான கோப்பு நீட்டிப்பு தேவை.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'இந்த கோப்பு அதிகபட்ச அனுமதிக்கப்பட்ட அளவை மீறுகிறது.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'தேதி அனுமதிக்கப்பட்ட வரம்பில் இருக்க வேண்டும்.';
  }

  @override
  String get mustBeTrueErrorText => 'இந்த உள்ளீடு உண்மையானதாக இருக்க வேண்டும்.';

  @override
  String get mustBeFalseErrorText => 'இந்த உள்ளீடு பொய்யாக இருக்க வேண்டும்.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'இந்த உள்ளீடு சிறப்பு எழுத்துக்களை கொண்டிருக்க வேண்டும்.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'இந்த உள்ளீடு பெரிய எழுத்துக்களை கொண்டிருக்க வேண்டும்.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'இந்த உள்ளீடு சிறிய எழுத்துக்களை கொண்டிருக்க வேண்டும்.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'இந்த உள்ளீடு எண்களை கொண்டிருக்க வேண்டும்.';
  }

  @override
  String get alphabeticalErrorText =>
      'இந்த உள்ளீடு எழுத்துக்களை மட்டுமே கொண்டிருக்க வேண்டும்.';

  @override
  String get uuidErrorText => 'இந்த உள்ளீட்டுக்கு சரியான UUID தேவை.';

  @override
  String get jsonErrorText => 'இந்த உள்ளீட்டுக்கு சரியான JSON தேவை.';

  @override
  String get latitudeErrorText => 'இந்த உள்ளீட்டுக்கு சரியான அகலாங்கு தேவை.';

  @override
  String get longitudeErrorText => 'இந்த உள்ளீட்டுக்கு சரியான நீளாங்கு தேவை.';

  @override
  String get base64ErrorText => 'இந்த உள்ளீட்டுக்கு சரியான Base64 வரிசை தேவை.';

  @override
  String get pathErrorText => 'இந்த உள்ளீட்டுக்கு சரியான பாதை தேவை.';

  @override
  String get oddNumberErrorText => 'இந்த உள்ளீட்டுக்கு ஒற்றையன் எண் தேவை.';

  @override
  String get evenNumberErrorText => 'இந்த உள்ளீட்டுக்கு சீரான எண் தேவை.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'இந்த உள்ளீட்டுக்கு சரியான போர்ட் எண் தேவை.';
  }

  @override
  String get macAddressErrorText =>
      'இந்த உள்ளீட்டுக்கு சரியான MAC முகவரி தேவை.';

  @override
  String startsWithErrorText(String value) {
    return 'மதிப்பு $value மூலம் தொடங்க வேண்டும்.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'மதிப்பு $valueல் முடிவடைய வேண்டும்.';
  }

  @override
  String containsErrorText(String value) {
    return 'மதிப்பு $value ஐ கொண்டிருக்க வேண்டும்.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'மதிப்பு $min மற்றும் $max இடையில் இருக்க வேண்டும்.';
  }

  @override
  String get containsElementErrorText =>
      'மதிப்பு அனுமதிக்கப்பட்ட மதிப்புகளின் பட்டியலில் இருக்க வேண்டும்.';

  @override
  String get ibanErrorText => 'இந்த உள்ளீட்டுக்கு சரியான ஐபான் தேவை.';

  @override
  String get uniqueErrorText =>
      'இந்த உள்ளீடு அதிகமான மதிப்புகளை கொண்டிருக்க வேண்டும்.';

  @override
  String get bicErrorText => 'இந்த உள்ளீட்டுக்கு சரியான BIC குறியீடு தேவை.';

  @override
  String get isbnErrorText => 'இந்த உள்ளீட்டுக்கு சரியான ISBN எண் தேவை.';

  @override
  String get singleLineErrorText =>
      'இந்த உள்ளீட்டு ஒரு வரிசையாக இருக்க வேண்டும்.';

  @override
  String get timeErrorText => 'இந்த உள்ளீட்டுக்கு சரியான நேரம் தேவை.';

  @override
  String get dateMustBeInTheFutureErrorText =>
      'தேதி எதிர்காலத்தில் இருக்க வேண்டும்.';

  @override
  String get dateMustBeInThePastErrorText =>
      'தேதி கடந்த காலத்தில் இருக்க வேண்டும்.';

  @override
  String get fileNameErrorText =>
      'மதிப்பை சரியான கோப்பு பெயராக இருக்க வேண்டும்.';

  @override
  String get negativeNumberErrorText => 'மதிப்பு எதிர்காலமாக இருக்க வேண்டும்.';

  @override
  String get positiveNumberErrorText => 'மதிப்பு ஒரு இருக்க வேண்டும்.';

  @override
  String get notZeroNumberErrorText => 'மதிப்பு பூஜ்யமாக இருக்க வேண்டில்லை.';

  @override
  String get ssnErrorText => 'மதிப்பு சமூக காப்பொலி எண் இருக்க வேண்டும்.';

  @override
  String get zipCodeErrorText =>
      'மதிப்பு சரியான ஜிப் குறியீடு இருக்க வேண்டும்.';

  @override
  String get usernameErrorText => 'விலைமை சரியான பயனர் பெயராக இருக்க வேண்டும்.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'பயனர் பெயரில் எண்கள் இருக்கக் கூடாது.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'பயனர் பெயரில் அடிக்கோடு இருக்கக் கூடாது.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'பயனர் பெயரில் சிறப்பு எழுத்துக்கள் இருக்கக் கூடாது.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'பயனர் பெயரில் இடைவெளிகள் இருக்கக் கூடாது.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'பயனர் பெயரில் புள்ளிகள் இருக்கக் கூடாது.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'பயனர் பெயரில் கோடுகள் இருக்கக் கூடாது.';

  @override
  String get invalidMimeTypeErrorText => 'செல்லுபடியாகாத மைம் வகை.';

  @override
  String get timezoneErrorText =>
      'மதிப்பு ஒரு செல்லுபடியான நேரம் மண்டலம் ஆக வேண்டும்.';

  @override
  String get cityErrorText =>
      'மதிப்பு ஒரு செல்லுபடியான நகரத்தின் பெயராக இருக்க வேண்டும்.';

  @override
  String get countryErrorText =>
      'மதிப்பு ஒரு செல்லுபடியான நாட்டாக இருக்க வேண்டும்.';

  @override
  String get stateErrorText =>
      'மதிப்பு ஒரு செல்லுபடியான மாநிலமாக இருக்க வேண்டும்.';

  @override
  String get streetErrorText =>
      'மதிப்பு ஒரு செல்லுபடியான தெருப்பெயராக இருக்க வேண்டும்.';

  @override
  String get firstNameErrorText =>
      'மதிப்பு ஒரு செல்லுபடியான முதல் பெயராக இருக்க வேண்டும்.';

  @override
  String get lastNameErrorText =>
      'மதிப்பு ஒரு செல்லுபடியான இறுதி பெயராக இருக்க வேண்டும்.';

  @override
  String get passportNumberErrorText =>
      'மதிப்பு ஒரு செல்லுபடியான பாஸ்போர்ட் எணாக இருக்க வேண்டும்.';

  @override
  String get primeNumberErrorText => 'மதிப்பு ஒரு பகോ எணாக இருக்க வேண்டும்.';

  @override
  String get dunsErrorText =>
      'மதிப்பு ஒரு செல்லுபடியான DUNS எணாக இருக்க வேண்டும்.';

  @override
  String get licensePlateErrorText =>
      'மதிப்பு ஒரு செல்லுபடியான பதிவு தகடு (license plate) எணாக இருக்க வேண்டும்.';

  @override
  String get vinErrorText =>
      'மதிப்பு ஒரு செல்லுபடியான வாகன அடையாள எணாக (VIN) இருக்க வேண்டும்.';

  @override
  String get languageCodeErrorText =>
      'மதிப்பு ஒரு செல்லுபடியான மொழி குறியீடாக இருக்க வேண்டும்.';

  @override
  String get floatErrorText =>
      'மதிப்பு சரியான மிதக்கும் புள்ளி எண் ஆக இருக்க வேண்டும்.';

  @override
  String get hexadecimalErrorText =>
      'மதிப்பு சரியான ஹெக்சாடெசிமல் எண் ஆக இருக்க வேண்டும்.';
}
