// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Mongolian (`mn`).
class FormBuilderLocalizationsImplMn extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplMn([String locale = 'mn']) : super(locale);

  @override
  String get creditCardErrorText => 'Картын дугаар алдаатай байна.';

  @override
  String get dateStringErrorText => 'Огнооны загварт таарахгүй байна.';

  @override
  String get emailErrorText => 'И-мэйл хаяг алдаатай байна.';

  @override
  String equalErrorText(String value) {
    return '$value-тэй тэнцүү утга оруулна уу.';
  }

  @override
  String equalLengthErrorText(int length) {
    return '$length-тэй тэнцүү урттай утга оруулна уу.';
  }

  @override
  String get integerErrorText => 'Бүхэл тоон утга оруулна уу.';

  @override
  String get ipErrorText => 'IP хаяг алдаатай байна.';

  @override
  String get matchErrorText => 'Утга загварт таарахгүй байна.';

  @override
  String maxErrorText(num max) {
    return '$max-аас бага утга оруулна уу.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return '$maxLength-аас богино утга оруулна уу.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Утга нь түүнээс бага буюу тэнцүү тоолох үгстэй байх ёстой $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return '$min-аас их утга оруулна уу.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return '$minLength-аас урт утга оруулна уу.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Утга нь түүнээс их буюу тэнцүү тооны үгтэй байх ёстой $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return '$value-тэй тэнцүү биш утга оруулна уу.';
  }

  @override
  String get numericErrorText => 'Тоон утга оруулна уу.';

  @override
  String get requiredErrorText => 'Заавал бөглөнө үү.';

  @override
  String get urlErrorText => 'URL хаяг алдаатай байна.';

  @override
  String get phoneErrorText => 'Утасны дугаар алдаатай байна.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Кредит картын хүчинтэй хугацааг оруулна уу.';

  @override
  String get creditCardExpiredErrorText =>
      'Кредит картын хүчинтэй хугацаа дууссан байна.';

  @override
  String get creditCardCVCErrorText => 'Кредит картын CVC код алдаатай байна.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Өнгөний код алдаатай байна.';
  }

  @override
  String get uppercaseErrorText => 'Үсгийг томоор оруулна уу.';

  @override
  String get lowercaseErrorText => 'Үсгийг жижгээр оруулна уу.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Файлын өргөтгөл алдаатай байна.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Файлын хэмжээ хэтэрсэн байна.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Огноо зөвшөөрөгдсөн хязгаарт байх ёстой.';
  }

  @override
  String get mustBeTrueErrorText => 'Энэ талбар нь үнэн байх ёстой.';

  @override
  String get mustBeFalseErrorText => 'Энэ талбар нь худал байх ёстой.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Тусгай тэмдэгт агуулсан байх ёстой.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Том үсэг агуулсан байх ёстой.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Жижиг үсэг агуулсан байх ёстой.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Тоон утга агуулсан байх ёстой.';
  }

  @override
  String get alphabeticalErrorText => 'Зөвхөн үсэг агуулсан байх ёстой.';

  @override
  String get uuidErrorText => 'UUID алдаатай байна.';

  @override
  String get jsonErrorText => 'JSON алдаатай байна.';

  @override
  String get latitudeErrorText => 'Өргөрөг алдаатай байна.';

  @override
  String get longitudeErrorText => 'Уртраг алдаатай байна.';

  @override
  String get base64ErrorText => 'Base64 мөр алдаатай байна.';

  @override
  String get pathErrorText => 'Зам алдаатай байна.';

  @override
  String get oddNumberErrorText => 'Сондгой тоо оруулна уу.';

  @override
  String get evenNumberErrorText => 'Тэгш тоо оруулна уу.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Портын дугаар алдаатай байна.';
  }

  @override
  String get macAddressErrorText => 'MAC хаяг алдаатай байна.';

  @override
  String startsWithErrorText(String value) {
    return 'Утга нь $value-ээр эхлэх ёстой.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Утга нь $value-ээр төгсөх ёстой.';
  }

  @override
  String containsErrorText(String value) {
    return 'Утга нь $value-г агуулсан байх ёстой.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Утга нь $min ба $max хооронд байх ёстой.';
  }

  @override
  String get containsElementErrorText =>
      'Утга нь зөвшөөрөгдсөн утгуудын жагсаалтад байх ёстой.';

  @override
  String get ibanErrorText => 'IBAN алдаатай байна.';

  @override
  String get uniqueErrorText => 'Утга давхардаж байна.';

  @override
  String get bicErrorText => 'BIC код алдаатай байна.';

  @override
  String get isbnErrorText => 'ISBN код алдаатай байна.';

  @override
  String get singleLineErrorText => 'Зөвхөн нэг мөрт байх ёстой.';

  @override
  String get timeErrorText => 'Цаг алдаатай байна.';

  @override
  String get dateMustBeInTheFutureErrorText => 'Огноо нь ирэх өмнө байх ёстой.';

  @override
  String get dateMustBeInThePastErrorText => 'Огноо нь өмнө байх ёстой.';

  @override
  String get fileNameErrorText => 'Утга нь баталгаажсан файлын нэр байх ёстой.';

  @override
  String get negativeNumberErrorText => 'Утга нь сөрөг тоо байх ёстой.';

  @override
  String get positiveNumberErrorText => 'Утга нь эерэг тоо байх ёстой.';

  @override
  String get notZeroNumberErrorText => 'Утга нь нэг биш байх ёстой.';

  @override
  String get ssnErrorText => 'Утга нь баталгаажсан нийгмийн дугаар байх ёстой.';

  @override
  String get zipCodeErrorText => 'Утга нь баталгаажсан ZIP код байх ёстой.';

  @override
  String get usernameErrorText =>
      'Утга нь хүчин төгөлдөр хэрэглэгчийн нэр байх ёстой.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Хэрэглэгчийн нэр тоо агуулж болохгүй.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Хэрэглэгчийн нэр доогуур зураас агуулж болохгүй.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Хэрэглэгчийн нэр тусгай тэмдэгт агуулж болохгүй.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Хэрэглэгчийн нэр хоосон зай агуулж болохгүй.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Хэрэглэгчийн нэр цэг агуулж болохгүй.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Хэрэглэгчийн нэр зураас агуулж болохгүй.';

  @override
  String get invalidMimeTypeErrorText => 'Буруу mime төрөл.';

  @override
  String get timezoneErrorText =>
      'Утга нь хүчин төгөлдөр цагийн бүс байх ёстой.';

  @override
  String get cityErrorText => 'Утга нь хүчин төгөлдөр хотын нэр байх ёстой.';

  @override
  String get countryErrorText => 'Утга нь хүчин төгөлдөр улс байх ёстой.';

  @override
  String get stateErrorText => 'Утга нь хүчин төгөлдөр муж байх ёстой.';

  @override
  String get streetErrorText =>
      'Утга нь хүчин төгөлдөр гудамжны нэр байх ёстой.';

  @override
  String get firstNameErrorText =>
      'Утга нь хүчин төгөлдөр анхны нэр байх ёстой.';

  @override
  String get lastNameErrorText => 'Утга нь хүчин төгөлдөр овог байх ёстой.';

  @override
  String get passportNumberErrorText =>
      'Утга нь хүчин төгөлдөр паспортын дугаар байх ёстой.';

  @override
  String get primeNumberErrorText => 'Утга нь анхны тоо байх ёстой.';

  @override
  String get dunsErrorText => 'Утга нь хүчин төгөлдөр DUNS дугаар байх ёстой.';

  @override
  String get licensePlateErrorText =>
      'Утга нь хүчин төгөлдөр тээврийн хэрэгслийн дугаар байх ёстой.';

  @override
  String get vinErrorText => 'Утга нь хүчин төгөлдөр VIN байх ёстой.';

  @override
  String get languageCodeErrorText =>
      'Утга нь хүчин төгөлдөр хэлний код байх ёстой.';

  @override
  String get floatErrorText =>
      'Утга нь буцаж ирдэг зөв хөвөгч цэгийн тоо байх ёстой.';

  @override
  String get hexadecimalErrorText =>
      'Утга нь буцаж ирдэг зөв арван зургаатын тоо байх ёстой.';
}
