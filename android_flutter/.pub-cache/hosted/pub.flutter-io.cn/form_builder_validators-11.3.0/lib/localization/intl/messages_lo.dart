// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Lao (`lo`).
class FormBuilderLocalizationsImplLo extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplLo([String locale = 'lo']) : super(locale);

  @override
  String get creditCardErrorText =>
      'ຄ່າໃນຟອມນີ້ຕ້ອງຢູ່ໃນຮູບແບບຂອງເລກບັດເຄຣດິດ.';

  @override
  String get dateStringErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງຢູ່ໃນຮູບແບບຂອງວັນທີ.';

  @override
  String get emailErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງຢູ່ໃນຮູບແບບຂອງອີເມວ.';

  @override
  String equalErrorText(String value) {
    return 'ຄ່າໃນຟອມນີ້ຕ້ອງເທົ່າກັບ $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'ມູນຄ່າຕ້ອງມີຄວາມຍາວເທົ່າກັບ $length.';
  }

  @override
  String get integerErrorText => 'ຄ່າທີ່ປ້ອນໃສ່ຕ້ອງເປັນໂຕເລກຖ້ວນເທົ່ານັ້ນ.';

  @override
  String get ipErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງຢູ່ໃນຮູບແບບຂອງເລກ IP.';

  @override
  String get matchErrorText => 'ຄ່າບໍ່ຖືກຕ້ອງຕາມຮູບແບບທີ່ກຳນົດ.';

  @override
  String maxErrorText(num max) {
    return 'ຄ່າໃນຟອມນີ້ຕ້ອງນ້ອຍກວ່າ ຫຼືເທົ່າກັບ $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'ຄ່າໃນຟອມນີ້ຕ້ອງມີຄວາມຍາວໜ້ອຍກວ່າ ຫຼືເທົ່າກັບ $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'ມູນຄ່າຕ້ອງມີຄຳສັບຫນ້ອຍກວ່າຫຼືເທົ່າກັບ $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'ຄ່າໃນຟອມນີ້ຕ້ອງໃຫຍ່ກວ່າ ຫຼືເທົ່າກັບ $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'ຄ່າໃນຟອມນີ້ຕ້ອງມີຄວາມຍາວຫຼາຍກວ່າ ຫຼືເທົ່າກັບ $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'ມູນຄ່າຕ້ອງມີຄຳສັບທີ່ໃຫຍ່ກວ່າຫຼືເທົ່າກັບ $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'ຄ່າໃນຟອມນີ້ຕ້ອງບໍ່ເທົ່າກັບ $value.';
  }

  @override
  String get numericErrorText => 'ຄ່າທີ່ປ້ອນໃສ່ຕ້ອງເປັນໂຕເລກເທົ່ານັ້ນ.';

  @override
  String get requiredErrorText => 'ແບບຟອມນີ້ບໍ່ສາມາດຫວ່າງເປົ່າໄດ້.';

  @override
  String get urlErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງຢູ່ໃນຮູບແບບຂອງ URL.';

  @override
  String get phoneErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງຢູ່ໃນຮູບແບບເລກໂທລະສັບ.';

  @override
  String get creditCardExpirationDateErrorText =>
      'ຄ່າໃນຟອມນີ້ຕ້ອງຢູ່ໃນຮູບແບບຂອງວັນໝົດອາຍຸບັດເຄຣດິດ.';

  @override
  String get creditCardExpiredErrorText => 'ບັດເຄຣດິດໝົດອາຍຸແລ້ວ.';

  @override
  String get creditCardCVCErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງແມ່ນ CVC ທີ່ຖືກຕ້ອງ.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'ຄ່າໃນຟອມນີ້ຕ້ອງແມ່ນລະຫັດສີທີ່ຖືກຕ້ອງ.';
  }

  @override
  String get uppercaseErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງແມ່ນຕົວໃຫຍ່.';

  @override
  String get lowercaseErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງແມ່ນຕົວເລັກ.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'ຄ່າໃນຟອມນີ້ຕ້ອງແມ່ນນາມສະກຸນໄຟລ໌ທີ່ຖືກຕ້ອງ.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'ໄຟລ໌ນີ້ມີຂະໜາດເກີນຂະໜາດທີ່ອະນຸຍາດໄດ້.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'ວັນທີຕ້ອງຢູ່ໃນຊ່ວງທີ່ອະນຸຍາດ.';
  }

  @override
  String get mustBeTrueErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງແມ່ນ true.';

  @override
  String get mustBeFalseErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງແມ່ນ false.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'ຄ່າໃນຟອມນີ້ຕ້ອງມີອັກສອນພິເສດ.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'ຄ່າໃນຟອມນີ້ຕ້ອງມີອັກສອນຕົວໃຫຍ່.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'ຄ່າໃນຟອມນີ້ຕ້ອງມີອັກສອນຕົວເລັກ.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'ຄ່າໃນຟອມນີ້ຕ້ອງມີຕົວເລກ.';
  }

  @override
  String get alphabeticalErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງມີແຕ່ອັກສອນເທົ່ານັ້ນ.';

  @override
  String get uuidErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງແມ່ນ UUID ທີ່ຖືກຕ້ອງ.';

  @override
  String get jsonErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງແມ່ນ JSON ທີ່ຖືກຕ້ອງ.';

  @override
  String get latitudeErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງແມ່ນລະດັບຊັ້ນທີ່ຖືກຕ້ອງ.';

  @override
  String get longitudeErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງແມ່ນລະດັບຊັ້ນທີ່ຖືກຕ້ອງ.';

  @override
  String get base64ErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງແມ່ນຂໍ້ຄວາມ Base64 ທີ່ຖືກຕ້ອງ.';

  @override
  String get pathErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງແມ່ນທາງທີ່ຖືກຕ້ອງ.';

  @override
  String get oddNumberErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງແມ່ນເລກຄີ.';

  @override
  String get evenNumberErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງແມ່ນເລກຄູ່.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'ຄ່າໃນຟອມນີ້ຕ້ອງເປັນເລກທ່າແມ່ນຖືກຕ້ອງ.';
  }

  @override
  String get macAddressErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງເປັນທີ່ຢູ່ MAC ທີ່ຖືກຕ້ອງ.';

  @override
  String startsWithErrorText(String value) {
    return 'ຄ່າຕ້ອງເລີ່ມຕົ້ນດ້ວຍ $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'ຄ່າຕ້ອງສິ້ນສຸດດ້ວຍ $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'ຄ່າຕ້ອງປະກອບດ້ວຍ $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'ຄ່າຕ້ອງຢູ່ລະຫວ່າງ $min ແລະ $max.';
  }

  @override
  String get containsElementErrorText =>
      'ຄ່າຕ້ອງຢູ່ໃນລາຍຊື່ຂອງມູນຄ່າທີ່ອະນຸຍາດ.';

  @override
  String get ibanErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງເປັນລະຫັດ IBAN ທີ່ຖືກຕ້ອງ.';

  @override
  String get uniqueErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງມີຄ່າທີ່ບໍ່ດີທີ່ສຸດ.';

  @override
  String get bicErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງເປັນລະຫັດ BIC ທີ່ຖືກຕ້ອງ.';

  @override
  String get isbnErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງເປັນ ISBN ທີ່ຖືກຕ້ອງ.';

  @override
  String get singleLineErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງຢູ່ໃນຊ່ວງທີ່ເທົ່ານັ້ນ.';

  @override
  String get timeErrorText => 'ຄ່າໃນຟອມນີ້ຕ້ອງເປັນເວລາທີ່ຖືກຕ້ອງ.';

  @override
  String get dateMustBeInTheFutureErrorText => 'ວັນທີຕ້ອງຢູ່ໃນອະນາຄົດ.';

  @override
  String get dateMustBeInThePastErrorText => 'ວັນທີຕ້ອງຢູ່ໃນອດີດ.';

  @override
  String get fileNameErrorText => 'ຄ່າຕ້ອງເປັນຊື່ໄຟລ໌ທີ່ຖືກຕ້ອງ.';

  @override
  String get negativeNumberErrorText => 'ຄ່າຕ້ອງເປັນເລກລົບ.';

  @override
  String get positiveNumberErrorText => 'ຄ່າຕ້ອງເປັນເລກບວກ.';

  @override
  String get notZeroNumberErrorText => 'ຄ່າຕ້ອງບໍ່ເປັນສູນ.';

  @override
  String get ssnErrorText => 'ຄ່າຕ້ອງເປັນເລກປະຊາຊົນທີ່ຖືກຕ້ອງ.';

  @override
  String get zipCodeErrorText => 'ຄ່າຕ້ອງເປັນລະຫັດໄປສະນີທີ່ຖືກຕ້ອງ.';

  @override
  String get usernameErrorText => 'ຄ່າຕ້ອງເປັນຊື່ຜູ້ໃຊ້ທີ່ຖືກຕ້ອງ.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'ຊື່ຜູ້ໃຊ້ບໍ່ສາມາດມີໂຕເລກ.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'ຊື່ຜູ້ໃຊ້ບໍ່ສາມາດມີຂີດໃຕ້.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'ຊື່ຜູ້ໃຊ້ບໍ່ສາມາດມີອັກສອນພິເສດ.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'ຊື່ຜູ້ໃຊ້ບໍ່ສາມາດມີຊ່ອງຫວ່າງ.';

  @override
  String get usernameCannotContainDotsErrorText => 'ຊື່ຜູ້ໃຊ້ບໍ່ສາມາດມີຈຸດ.';

  @override
  String get usernameCannotContainDashesErrorText => 'ຊື່ຜູ້ໃຊ້ບໍ່ສາມາດມີຂີດ.';

  @override
  String get invalidMimeTypeErrorText => 'ປະເພດໄຟລທີ່ບໍ່ຖືກຕ້ອງ.';

  @override
  String get timezoneErrorText => 'ຄ່າຕ້ອງເປັນເວລາເມືອງທີ່ຖືກຕ້ອງ.';

  @override
  String get cityErrorText => 'ຄ່າຕ້ອງເປັນຊື່ເມືອງທີ່ຖືກຕ້ອງ.';

  @override
  String get countryErrorText => 'ຄ່າຕ້ອງເປັນຊື່ປະເທດທີ່ຖືກຕ້ອງ.';

  @override
  String get stateErrorText => 'ຄ່າຕ້ອງເປັນຊື່ລັດທີ່ຖືກຕ້ອງ.';

  @override
  String get streetErrorText => 'ຄ່າຕ້ອງເປັນຊື່ຖນົນທີ່ຖືກຕ້ອງ.';

  @override
  String get firstNameErrorText => 'ຄ່າຕ້ອງເປັນຊື່ຫຼັກທີ່ຖືກຕ້ອງ.';

  @override
  String get lastNameErrorText => 'ຄ່າຕ້ອງເປັນນາມສະກຸນທີ່ຖືກຕ້ອງ.';

  @override
  String get passportNumberErrorText => 'ຄ່າຕ້ອງເປັນໝາຍເລກພາສະປອດທີ່ຖືກຕ້ອງ.';

  @override
  String get primeNumberErrorText => 'ຍໍ້ຄ່າຕ້ອງເປັນໝາຍເລກທີ່ຖືກຕ້ອງ.';

  @override
  String get dunsErrorText => 'ຄ່າຕ້ອງເປັນໝາຍເລກ DUNS ທີ່ຖືກຕ້ອງ.';

  @override
  String get licensePlateErrorText => 'ຄ່າຕ້ອງເປັນໝາຍເລກປ້າຍທີ່ຖືກຕ້ອງ.';

  @override
  String get vinErrorText => 'ຄ່າຕ້ອງເປັນ VIN ທີ່ຖືກຕ້ອງ.';

  @override
  String get languageCodeErrorText => 'ຄ່າຕ້ອງເປັນໄລຄໂລດພາສາທີ່ຖືກຕ້ອງ.';

  @override
  String get floatErrorText => 'ຄ່າຕ້ອງເປັນໂຕເລກ float ທີ່ຖືກຕ້ອງ.';

  @override
  String get hexadecimalErrorText => 'ຄ່າຕ້ອງເປັນໂຕເລກເຮັກຊະເດສິມທີ່ຖືກຕ້ອງ.';
}
