// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Nepali (`ne`).
class FormBuilderLocalizationsImplNe extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplNe([String locale = 'ne']) : super(locale);

  @override
  String get creditCardErrorText =>
      'यो क्षेत्रलाई मान्य क्रेडिट कार्ड नम्बर चाहिन्छ।';

  @override
  String get dateStringErrorText =>
      'यो क्षेत्रलाई मान्य मिति स्ट्रिंग चाहिन्छ।';

  @override
  String get emailErrorText => 'यो क्षेत्रलाई मान्य इमेल ठेगाना चाहिन्छ।';

  @override
  String equalErrorText(String value) {
    return 'यो क्षेत्रको मान $value बराबर हुनुपर्छ।';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'मानको लम्बाइ $length बराबर हुनुपर्छ।';
  }

  @override
  String get integerErrorText => 'यो क्षेत्रलाई मान्य पूर्णांक चाहिन्छ।';

  @override
  String get ipErrorText => 'यो क्षेत्रलाई मान्य आईपी ठेगाना चाहिन्छ।';

  @override
  String get matchErrorText => 'मान ढाँचासँग मेल खाँदैन।';

  @override
  String maxErrorText(num max) {
    return 'मान $max भन्दा कम वा बराबर हुनुपर्छ।';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'मानको लम्बाइ $maxLength भन्दा कम वा बराबर हुनुपर्छ।';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'मानसँग शब्दहरूको संख्या $maxWordsCount भन्दा कम वा बराबर हुनुपर्छ।';
  }

  @override
  String minErrorText(num min) {
    return 'मान $min भन्दा बढी वा बराबर हुनुपर्छ।';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'मानको लम्बाइ $minLength भन्दा बढी वा बराबर हुनुपर्छ।';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'मानसँग शब्दहरूको संख्या $minWordsCount भन्दा बढी वा बराबर हुनुपर्छ।';
  }

  @override
  String notEqualErrorText(String value) {
    return 'यो क्षेत्रको मान $value बराबर हुनु हुँदैन।';
  }

  @override
  String get numericErrorText => 'मान संख्यात्मक हुनुपर्छ।';

  @override
  String get requiredErrorText => 'यो क्षेत्र खाली हुन सक्दैन।';

  @override
  String get urlErrorText => 'यो फिल्डलाई मान्य URL ठेगाना चाहिन्छ।';

  @override
  String get phoneErrorText => 'यो क्षेत्रलाई मान्य फोन नम्बर चाहिन्छ।';

  @override
  String get creditCardExpirationDateErrorText =>
      'यो क्षेत्रलाई मान्य क्रेडिट कार्ड समाप्ति मिति चाहिन्छ।';

  @override
  String get creditCardExpiredErrorText => 'क्रेडिट कार्डको म्याद सकिएको छ।';

  @override
  String get creditCardCVCErrorText =>
      'यो क्षेत्रलाई मान्य क्रेडिट कार्ड CVC कोड चाहिन्छ।';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'यो क्षेत्रलाई मान्य रङ्ग कोड चाहिन्छ।';
  }

  @override
  String get uppercaseErrorText => 'यो क्षेत्रलाई ठूला अक्षर चाहिन्छ।';

  @override
  String get lowercaseErrorText => 'यो क्षेत्रलाई साना अक्षर चाहिन्छ।';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'यो क्षेत्रलाई मान्य फाइल विस्तार चाहिन्छ।';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'यो फाइलले अनुमत अधिकतम आकार नाघेको छ।';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'मिति अनुमत दायरामा हुनुपर्छ।';
  }

  @override
  String get mustBeTrueErrorText => 'यो क्षेत्र सत्य हुनुपर्छ।';

  @override
  String get mustBeFalseErrorText => 'यो क्षेत्र असत्य हुनुपर्छ।';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'यो क्षेत्रमा विशेष वर्ण हुनुपर्छ।';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'यो क्षेत्रमा ठूला अक्षर हुनुपर्छ।';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'यो क्षेत्रमा साना अक्षर हुनुपर्छ।';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'यो क्षेत्रमा संख्या हुनुपर्छ।';
  }

  @override
  String get alphabeticalErrorText => 'यो क्षेत्रमा मात्र अक्षरहरू हुनुपर्छ।';

  @override
  String get uuidErrorText => 'यो क्षेत्रलाई मान्य UUID चाहिन्छ।';

  @override
  String get jsonErrorText => 'यो क्षेत्रलाई मान्य JSON चाहिन्छ।';

  @override
  String get latitudeErrorText => 'यो क्षेत्रलाई मान्य अक्षांश चाहिन्छ।';

  @override
  String get longitudeErrorText => 'यो क्षेत्रलाई मान्य देशान्तर चाहिन्छ।';

  @override
  String get base64ErrorText => 'यो क्षेत्रलाई मान्य Base64 स्ट्रिंग चाहिन्छ।';

  @override
  String get pathErrorText => 'यो क्षेत्रलाई मान्य पथ चाहिन्छ।';

  @override
  String get oddNumberErrorText => 'यो क्षेत्रलाई बिषम संख्या चाहिन्छ।';

  @override
  String get evenNumberErrorText => 'यो क्षेत्रलाई सम संख्या चाहिन्छ।';

  @override
  String portNumberErrorText(int min, int max) {
    return 'यो क्षेत्रलाई मान्य पोर्ट नम्बर चाहिन्छ।';
  }

  @override
  String get macAddressErrorText => 'यो क्षेत्रलाई मान्य MAC ठेगाना चाहिन्छ।';

  @override
  String startsWithErrorText(String value) {
    return 'मान $value बाट सुरु हुनुपर्छ।';
  }

  @override
  String endsWithErrorText(String value) {
    return 'मान $value मा समाप्त हुनुपर्छ।';
  }

  @override
  String containsErrorText(String value) {
    return 'मानले $value समावेश गर्नुपर्छ।';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'मान $min र $max को बीचमा हुनुपर्छ।';
  }

  @override
  String get containsElementErrorText => 'मान अनुमत मानहरूको सूचीमा हुनुपर्छ।';

  @override
  String get ibanErrorText => 'यो क्षेत्रलाई मान्य IBAN चाहिन्छ।';

  @override
  String get uniqueErrorText => 'यो क्षेत्रलाई मान्य एकमात्र डाटा चाहिन्छ।';

  @override
  String get bicErrorText => 'यो क्षेत्रलाई मान्य BIC कोड चाहिन्छ।';

  @override
  String get isbnErrorText => 'यो क्षेत्रलाई मान्य ISBN चाहिन्छ।';

  @override
  String get singleLineErrorText =>
      'यो क्षेत्रलाई मान्य एकल लाइन स्ट्रिंग चाहिन्छ।';

  @override
  String get timeErrorText => 'यो क्षेत्रलाई मान्य समय चाहिन्छ।';

  @override
  String get dateMustBeInTheFutureErrorText => 'मिति भविष्यमा हुनुपर्छ।';

  @override
  String get dateMustBeInThePastErrorText => 'मिति अतितमा हुनुपर्छ।';

  @override
  String get fileNameErrorText => 'मान्य फाइल नाम हुनुपर्छ।';

  @override
  String get negativeNumberErrorText => 'मान्य नकारात्मक संख्या हुनुपर्छ।';

  @override
  String get positiveNumberErrorText => 'मान्य सकारात्मक संख्या हुनुपर्छ।';

  @override
  String get notZeroNumberErrorText => 'मान्य शून्य हुनुपर्छ।';

  @override
  String get ssnErrorText => 'मान्य सामाजिक सुरक्षा संख्या हुनुपर्छ।';

  @override
  String get zipCodeErrorText => 'मान्य ZIP कोड हुनुपर्छ।';

  @override
  String get usernameErrorText => 'मान्य प्रयोगकर्ता नाम हुनु पर्छ।';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'प्रयोगकर्ता नाममा संख्या समावेश गर्नु हुँदैन।';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'प्रयोगकर्ता नाममा अन्डरस्कोर समावेश गर्नु हुँदैन।';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'प्रयोगकर्ता नाममा विशेष वर्णहरू समावेश गर्नु हुँदैन।';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'प्रयोगकर्ता नाममा खाली ठाउँहरू समावेश गर्नु हुँदैन।';

  @override
  String get usernameCannotContainDotsErrorText =>
      'प्रयोगकर्ता नाममा डटहरू समावेश गर्नु हुँदैन।';

  @override
  String get usernameCannotContainDashesErrorText =>
      'प्रयोगकर्ता नाममा ड्यासहरू समावेश गर्नु हुँदैन।';

  @override
  String get invalidMimeTypeErrorText => 'अवैध माइम प्रकार।';

  @override
  String get timezoneErrorText => 'मान मान्य समयक्षेत्र हुनुपर्छ।';

  @override
  String get cityErrorText => 'मान मान्य शहरको नाम हुनुपर्छ।';

  @override
  String get countryErrorText => 'मान मान्य देश हुनुपर्छ।';

  @override
  String get stateErrorText => 'मान मान्य राज्य हुनुपर्छ।';

  @override
  String get streetErrorText => 'मान मान्य सडकको नाम हुनुपर्छ।';

  @override
  String get firstNameErrorText => 'मान मान्य पहिलो नाम हुनुपर्छ।';

  @override
  String get lastNameErrorText => 'मान मान्य थर हुनुपर्छ।';

  @override
  String get passportNumberErrorText => 'मान मान्य पासपोर्ट नम्बर हुनुपर्छ।';

  @override
  String get primeNumberErrorText => 'मान अभाज्य संख्या हुनुपर्छ।';

  @override
  String get dunsErrorText => 'मान मान्य DUNS नम्बर हुनुपर्छ।';

  @override
  String get licensePlateErrorText => 'मान मान्य नम्बर प्लेट हुनुपर्छ।';

  @override
  String get vinErrorText => 'मान मान्य VIN हुनुपर्छ।';

  @override
  String get languageCodeErrorText => 'मान मान्य भाषाको कोड हुनुपर्छ।';

  @override
  String get floatErrorText => 'मान्यता प्राप्त फ्लोटिङ पोइन्ट नम्बर हुनुपर्छ।';

  @override
  String get hexadecimalErrorText =>
      'मान्यता प्राप्त हेक्साडेसिमल नम्बर हुनुपर्छ।';
}
