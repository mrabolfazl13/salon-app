// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Korean (`ko`).
class FormBuilderLocalizationsImplKo extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplKo([String locale = 'ko']) : super(locale);

  @override
  String get creditCardErrorText => '유효한 카드 번호를 입력해 주세요.';

  @override
  String get dateStringErrorText => '날짜 형식이 올바르지 않습니다.';

  @override
  String get emailErrorText => '이메일 주소 형식이 올바르지 않습니다.';

  @override
  String equalErrorText(String value) {
    return '이 필드의 값은 반드시 $value와 같아야 합니다.';
  }

  @override
  String equalLengthErrorText(int length) {
    return '값은 $length와 같은 길이를 가져야 합니다.';
  }

  @override
  String get integerErrorText => '정수만 입력 가능합니다.';

  @override
  String get ipErrorText => '유효한 IP를 입력해 주세요.';

  @override
  String get matchErrorText => '필드의 값이 패턴과 맞지 않습니다.';

  @override
  String maxErrorText(num max) {
    return '이 필드의 값은 반드시 $max 이하이어야 합니다.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return '이 필드는 반드시 $maxLength자 이하이어야 합니다.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return '값은 $maxWordsCount보다 작거나 같은 단어를 가져야 합니다.';
  }

  @override
  String minErrorText(num min) {
    return '이 필드의 값은 반드시 $min 이상이어야 합니다.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return '이 필드는 반드시 $minLength자 이상이어야 합니다.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return '값은 $minWordsCount보다 큰 단어 수를 가져야 합니다.';
  }

  @override
  String notEqualErrorText(String value) {
    return '이 필드의 값은 반드시 $value와 달라야 합니다.';
  }

  @override
  String get numericErrorText => '숫자만 입력 가능합니다.';

  @override
  String get requiredErrorText => '이 필드는 반드시 입력해야 합니다.';

  @override
  String get urlErrorText => 'URL 형식이 올바르지 않습니다.';

  @override
  String get phoneErrorText => '유효한 전화번호를 입력해 주세요.';

  @override
  String get creditCardExpirationDateErrorText => '유효한 신용카드 만료일을 입력해 주세요.';

  @override
  String get creditCardExpiredErrorText => '신용카드의 유효기간이 만료되었습니다.';

  @override
  String get creditCardCVCErrorText => '유효한 신용카드 CVC 코드를 입력해 주세요.';

  @override
  String colorCodeErrorText(String colorCode) {
    return '유효한 색상 코드를 입력해 주세요.';
  }

  @override
  String get uppercaseErrorText => '이 필드는 대문자를 포함해야 합니다.';

  @override
  String get lowercaseErrorText => '이 필드는 소문자를 포함해야 합니다.';

  @override
  String fileExtensionErrorText(String extensions) {
    return '유효한 파일 확장자를 입력해 주세요.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return '파일 크기가 최대 허용 크기를 초과했습니다.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return '날짜는 허용된 범위 내에 있어야 합니다.';
  }

  @override
  String get mustBeTrueErrorText => '이 필드는 true여야 합니다.';

  @override
  String get mustBeFalseErrorText => '이 필드는 false여야 합니다.';

  @override
  String containsSpecialCharErrorText(int min) {
    return '이 필드는 특수 문자를 포함해야 합니다.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return '이 필드는 대문자를 포함해야 합니다.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return '이 필드는 소문자를 포함해야 합니다.';
  }

  @override
  String containsNumberErrorText(int min) {
    return '이 필드는 숫자를 포함해야 합니다.';
  }

  @override
  String get alphabeticalErrorText => '이 필드는 문자만 포함해야 합니다.';

  @override
  String get uuidErrorText => '유효한 UUID를 입력해 주세요.';

  @override
  String get jsonErrorText => '유효한 JSON을 입력해 주세요.';

  @override
  String get latitudeErrorText => '유효한 위도를 입력해 주세요.';

  @override
  String get longitudeErrorText => '유효한 경도를 입력해 주세요.';

  @override
  String get base64ErrorText => '유효한 Base64 문자열을 입력해 주세요.';

  @override
  String get pathErrorText => '유효한 경로를 입력해 주세요.';

  @override
  String get oddNumberErrorText => '이 필드는 홀수여야 합니다.';

  @override
  String get evenNumberErrorText => '이 필드는 짝수여야 합니다.';

  @override
  String portNumberErrorText(int min, int max) {
    return '유효한 포트 번호를 입력해 주세요.';
  }

  @override
  String get macAddressErrorText => '유효한 MAC 주소를 입력해 주세요.';

  @override
  String startsWithErrorText(String value) {
    return '값은 $value로 시작해야 합니다.';
  }

  @override
  String endsWithErrorText(String value) {
    return '값은 $value로 끝나야 합니다.';
  }

  @override
  String containsErrorText(String value) {
    return '값은 $value를 포함해야 합니다.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return '값은 $min와 $max 사이여야 합니다.';
  }

  @override
  String get containsElementErrorText => '값은 허용된 값 목록에 있어야 합니다.';

  @override
  String get ibanErrorText => '유효한 IBAN을 입력해 주세요.';

  @override
  String get uniqueErrorText => '고유해야 합니다.';

  @override
  String get bicErrorText => '유효한 BIC를 입력해 주세요.';

  @override
  String get isbnErrorText => '유효한 ISBN을 입력해 주세요.';

  @override
  String get singleLineErrorText => '한 줄로 입력해 주세요.';

  @override
  String get timeErrorText => '유효한 시간을 입력해 주세요.';

  @override
  String get dateMustBeInTheFutureErrorText => '날짜는 미래여야 합니다.';

  @override
  String get dateMustBeInThePastErrorText => '날짜는 과거여야 합니다.';

  @override
  String get fileNameErrorText => '값은 유효한 파일 이름이어야 합니다.';

  @override
  String get negativeNumberErrorText => '값은 음수여야 합니다.';

  @override
  String get positiveNumberErrorText => '값은 양수여야 합니다.';

  @override
  String get notZeroNumberErrorText => '값은 0이 아니어야 합니다.';

  @override
  String get ssnErrorText => '값은 유효한 주민등록번호여야 합니다.';

  @override
  String get zipCodeErrorText => '값은 유효한 우편번호여야 합니다.';

  @override
  String get usernameErrorText => '값이 유효한 사용자 이름이어야 합니다.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      '사용자 이름에는 숫자가 포함될 수 없습니다.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      '사용자 이름에는 밑줄이 포함될 수 없습니다.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      '사용자 이름에는 특수 문자가 포함될 수 없습니다.';

  @override
  String get usernameCannotContainSpacesErrorText => '사용자 이름에는 공백이 포함될 수 없습니다.';

  @override
  String get usernameCannotContainDotsErrorText => '사용자 이름에는 점이 포함될 수 없습니다.';

  @override
  String get usernameCannotContainDashesErrorText => '사용자 이름에는 대시가 포함될 수 없습니다.';

  @override
  String get invalidMimeTypeErrorText => '잘못된 MIME 유형입니다.';

  @override
  String get timezoneErrorText => '값은 유효한 시간대이어야 합니다.';

  @override
  String get cityErrorText => '값은 유효한 도시 이름이어야 합니다.';

  @override
  String get countryErrorText => '값은 유효한 국가이어야 합니다.';

  @override
  String get stateErrorText => '값은 유효한 주이어야 합니다.';

  @override
  String get streetErrorText => '값은 유효한 거리 이름이어야 합니다.';

  @override
  String get firstNameErrorText => '값은 유효한 이름이어야 합니다.';

  @override
  String get lastNameErrorText => '값은 유효한 성이어야 합니다.';

  @override
  String get passportNumberErrorText => '값은 유효한 여권 번호이어야 합니다.';

  @override
  String get primeNumberErrorText => '값은 소수이어야 합니다.';

  @override
  String get dunsErrorText => '값은 유효한 DUNS 번호이어야 합니다.';

  @override
  String get licensePlateErrorText => '값은 유효한 번호판이어야 합니다.';

  @override
  String get vinErrorText => '값은 유효한 VIN이어야 합니다.';

  @override
  String get languageCodeErrorText => '값은 유효한 언어 코드이어야 합니다.';

  @override
  String get floatErrorText => '값은 유효한 부동 소수점 수여야 합니다.';

  @override
  String get hexadecimalErrorText => '값은 유효한 16진수여야 합니다.';
}
