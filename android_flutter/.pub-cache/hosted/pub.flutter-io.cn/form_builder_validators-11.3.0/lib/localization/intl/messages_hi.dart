// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Hindi (`hi`).
class FormBuilderLocalizationsImplHi extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplHi([String locale = 'hi']) : super(locale);

  @override
  String get creditCardErrorText =>
      'इस फ़ील्ड में एक मान्य क्रेडिट कार्ड नंबर की आवश्यकता है।';

  @override
  String get dateStringErrorText =>
      'इस फ़ील्ड में एक मान्य तिथि स्ट्रिंग की आवश्यकता है।';

  @override
  String get emailErrorText =>
      'इस फ़ील्ड में एक मान्य ईमेल पता की आवश्यकता है।';

  @override
  String equalErrorText(String value) {
    return 'इस फील्ड का मान $value के बराबर होना चाहिए।';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'मान की लंबाई $length के बराबर होनी चाहिए';
  }

  @override
  String get integerErrorText =>
      'इस फ़ील्ड में एक मान्य पूर्णांक की आवश्यकता है।';

  @override
  String get ipErrorText => 'इस फ़ील्ड में एक मान्य आईपी की आवश्यकता है।';

  @override
  String get matchErrorText => 'मान पैटर्न के साथ मेल नहीं खाता।';

  @override
  String maxErrorText(num max) {
    return 'मान $max से कम या बराबर होना चाहिए';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'मान की लंबाई $maxLength से कम या बराबर होनी चाहिए';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'मान की शब्दों की संख्या $maxWordsCount से कम या बराबर होनी चाहिए';
  }

  @override
  String minErrorText(num min) {
    return 'मान $min से अधिक या बराबर होना चाहिए';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'मान की लंबाई $minLength से अधिक या बराबर होनी चाहिए';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'मान की शब्दों की संख्या $minWordsCount से अधिक या बराबर होनी चाहिए';
  }

  @override
  String notEqualErrorText(String value) {
    return 'इस फील्ड का मान $value के बराबर नहीं होना चाहिए।';
  }

  @override
  String get numericErrorText => 'मान संख्यात्मक होना चाहिए।';

  @override
  String get requiredErrorText => 'यह फ़ील्ड खाली नहीं हो सकता।';

  @override
  String get urlErrorText => 'इस फ़ील्ड में एक मान्य URL पता की आवश्यकता है।';

  @override
  String get phoneErrorText =>
      'इस फ़ील्ड में एक मान्य फ़ोन नंबर की आवश्यकता है।';

  @override
  String get creditCardExpirationDateErrorText =>
      'इस फ़ील्ड में एक मान्य समाप्ति तिथि की आवश्यकता है।';

  @override
  String get creditCardExpiredErrorText => 'यह क्रेडिट कार्ड समाप्त हो गया है।';

  @override
  String get creditCardCVCErrorText =>
      'इस फ़ील्ड में एक मान्य सीवीसी कोड की आवश्यकता है।';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'मान को एक मान्य $colorCode रंग कोड होना चाहिए।';
  }

  @override
  String get uppercaseErrorText => 'मान अपरकेस होना चाहिए।';

  @override
  String get lowercaseErrorText => 'मान लोअरकेस होना चाहिए।';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'फ़ाइल एक्सटेंशन $extensions होना चाहिए';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'फ़ाइल की आकार $maxSize से कम होनी चाहिए जबकि यह $fileSize है';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'तिथि $minString - $maxString सीमा में होनी चाहिए';
  }

  @override
  String get mustBeTrueErrorText => 'यह फ़ील्ड सच होना चाहिए।';

  @override
  String get mustBeFalseErrorText => 'यह फ़ील्ड झूठ होना चाहिए।';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'मान में कम से कम $min विशेष वर्ण होने चाहिए।';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'मान में कम से कम $min अपरकेस वर्ण होने चाहिए।';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'मान में कम से कम $min लोअरकेस वर्ण होने चाहिए।';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'मान में कम से कम $min संख्याएँ होनी चाहिए।';
  }

  @override
  String get alphabeticalErrorText => 'मान को वर्णमाला के क्रम में होना चाहिए।';

  @override
  String get uuidErrorText => 'मान को एक मान्य UUID होना चाहिए।';

  @override
  String get jsonErrorText => 'मान मान्य JSON होना चाहिए।';

  @override
  String get latitudeErrorText => 'मान को वैध अक्षांश होना चाहिए।';

  @override
  String get longitudeErrorText => 'मान को वैध देशान्तर होना चाहिए।';

  @override
  String get base64ErrorText => 'मान को वैध बेस64 स्ट्रिंग होना चाहिए।';

  @override
  String get pathErrorText => 'मान को वैध पथ होना चाहिए।';

  @override
  String get oddNumberErrorText => 'मान को विषम संख्या होनी चाहिए।';

  @override
  String get evenNumberErrorText => 'मान को सम संख्या होनी चाहिए।';

  @override
  String portNumberErrorText(int min, int max) {
    return 'मान को $min और $max के बीच एक वैध पोर्ट संख्या होनी चाहिए।';
  }

  @override
  String get macAddressErrorText => 'मान को वैध मैक पता होना चाहिए।';

  @override
  String startsWithErrorText(String value) {
    return 'मान $value के साथ शुरू होना चाहिए।';
  }

  @override
  String endsWithErrorText(String value) {
    return 'मान $value के साथ समाप्त होना चाहिए।';
  }

  @override
  String containsErrorText(String value) {
    return 'मान में $value होना चाहिए।';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'मान $min और $max के बीच होना चाहिए।';
  }

  @override
  String get containsElementErrorText => 'मान सूची में होना चाहिए।';

  @override
  String get ibanErrorText => 'मान को वैध IBAN होना चाहिए।';

  @override
  String get uniqueErrorText => 'मान अद्वितीय होनी चाहिए।';

  @override
  String get bicErrorText => 'मान को वैध BIC होना चाहिए।';

  @override
  String get isbnErrorText => 'मान को वैध ISBN होना चाहिए।';

  @override
  String get singleLineErrorText => 'मान एक ही लाइन होनी चाहिए।';

  @override
  String get timeErrorText => 'मान को वैध समय होना चाहिए।';

  @override
  String get dateMustBeInTheFutureErrorText => 'तिथि भविष्य में होनी चाहिए।';

  @override
  String get dateMustBeInThePastErrorText => 'तिथि भूत काल में होनी चाहिए।';

  @override
  String get fileNameErrorText => 'मान को एक मान्य फ़ाइल नाम होना चाहिए।';

  @override
  String get negativeNumberErrorText => 'मान को ऋणात्मक संख्या होनी चाहिए।';

  @override
  String get positiveNumberErrorText => 'मान को सकारात्मक संख्या होनी चाहिए।';

  @override
  String get notZeroNumberErrorText => 'मान शून्य नहीं होनी चाहिए।';

  @override
  String get ssnErrorText => 'मान को वैध सोशल सिक्योरिटी नंबर होना चाहिए।';

  @override
  String get zipCodeErrorText => 'मान को वैध ज़िप कोड होना चाहिए।';

  @override
  String get usernameErrorText => 'मान्य उपयोगकर्ता नाम होना चाहिए।';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'उपयोगकर्ता नाम में संख्याएँ नहीं हो सकतीं।';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'उपयोगकर्ता नाम में अंडरस्कोर नहीं हो सकता।';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'उपयोगकर्ता नाम में विशेष वर्ण नहीं हो सकते।';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'उपयोगकर्ता नाम में रिक्त स्थान नहीं हो सकते।';

  @override
  String get usernameCannotContainDotsErrorText =>
      'उपयोगकर्ता नाम में बिंदु नहीं हो सकते।';

  @override
  String get usernameCannotContainDashesErrorText =>
      'उपयोगकर्ता नाम में डैश नहीं हो सकते।';

  @override
  String get invalidMimeTypeErrorText => 'अमान्य MIME प्रकार।';

  @override
  String get timezoneErrorText => 'मान मान्य समय क्षेत्र होना चाहिए।';

  @override
  String get cityErrorText => 'मान मान्य शहर का नाम होना चाहिए।';

  @override
  String get countryErrorText => 'मान मान्य देश होना चाहिए।';

  @override
  String get stateErrorText => 'मान मान्य राज्य होना चाहिए।';

  @override
  String get streetErrorText => 'मान मान्य सड़क का नाम होना चाहिए।';

  @override
  String get firstNameErrorText => 'मान मान्य प्रथम नाम होना चाहिए।';

  @override
  String get lastNameErrorText => 'मान मान्य उपनाम होना चाहिए।';

  @override
  String get passportNumberErrorText => 'मान मान्य पासपोर्ट नंबर होना चाहिए।';

  @override
  String get primeNumberErrorText => 'मान एक अभाज्य संख्या होनी चाहिए।';

  @override
  String get dunsErrorText => 'मान मान्य DUNS नंबर होना चाहिए।';

  @override
  String get licensePlateErrorText => 'मान मान्य लाइसेंस प्लेट होना चाहिए।';

  @override
  String get vinErrorText => 'मान मान्य VIN होना चाहिए।';

  @override
  String get languageCodeErrorText => 'मान मान्य भाषा कोड होना चाहिए।';

  @override
  String get floatErrorText => 'मान्य फ़्लोटिंग पॉइंट नंबर होना चाहिए।';

  @override
  String get hexadecimalErrorText => 'मान्य हेक्साडेसिमल नंबर होना चाहिए।';
}
