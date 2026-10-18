// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Chinese (`zh`).
class FormBuilderLocalizationsImplZh extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplZh([String locale = 'zh']) : super(locale);

  @override
  String get creditCardErrorText => '该字段必须是有效的信用卡号。';

  @override
  String get dateStringErrorText => '该字段必须是有效的时间日期。';

  @override
  String get emailErrorText => '该字段必须是有效的电子邮件地址。';

  @override
  String equalErrorText(String value) {
    return '该字段必须等于 $value。';
  }

  @override
  String equalLengthErrorText(int length) {
    return '该字段的长度必须等于 $length。';
  }

  @override
  String get integerErrorText => '该字段必须是整数。';

  @override
  String get ipErrorText => '该字段必须是有效的 IP。';

  @override
  String get matchErrorText => '该字段格式不正确。';

  @override
  String maxErrorText(num max) {
    return '该字段必须小于等于 $max。';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return '该字段的长度必须小于等于 $maxLength。';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return '值必须具有小于或等于 $maxWordsCount 的单词计数。';
  }

  @override
  String minErrorText(num min) {
    return '该字段必须大于等于 $min。';
  }

  @override
  String minLengthErrorText(int minLength) {
    return '该字段的长度必须大于等于 $minLength。';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return '值必须具有大于或等于 $minWordsCount 的单词计数。';
  }

  @override
  String notEqualErrorText(String value) {
    return '该字段不能等于 $value。';
  }

  @override
  String get numericErrorText => '该字段必须是数字。';

  @override
  String get requiredErrorText => '该字段不能为空。';

  @override
  String get urlErrorText => '该字段必须是有效的 URL 地址。';

  @override
  String get phoneErrorText => '该字段必须是有效的电话号码。';

  @override
  String get creditCardExpirationDateErrorText => '该字段必须是有效的信用卡到期日期。';

  @override
  String get creditCardExpiredErrorText => '信用卡已过期。';

  @override
  String get creditCardCVCErrorText => '该字段必须是有效的信用卡 CVC 码。';

  @override
  String colorCodeErrorText(String colorCode) {
    return '该字段必须是有效的颜色代码。';
  }

  @override
  String get uppercaseErrorText => '该字段必须包含大写字母。';

  @override
  String get lowercaseErrorText => '该字段必须包含小写字母。';

  @override
  String fileExtensionErrorText(String extensions) {
    return '该字段必须是有效的文件扩展名。';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return '该文件超出允许的最大大小。';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return '日期必须在允许的范围内。';
  }

  @override
  String get mustBeTrueErrorText => '该字段必须为真。';

  @override
  String get mustBeFalseErrorText => '该字段必须为假。';

  @override
  String containsSpecialCharErrorText(int min) {
    return '该字段必须包含特殊字符。';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return '该字段必须包含大写字母。';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return '该字段必须包含小写字母。';
  }

  @override
  String containsNumberErrorText(int min) {
    return '该字段必须包含数字。';
  }

  @override
  String get alphabeticalErrorText => '该字段只能包含字母。';

  @override
  String get uuidErrorText => '该字段必须是有效的 UUID。';

  @override
  String get jsonErrorText => '该字段必须是有效的 JSON。';

  @override
  String get latitudeErrorText => '该字段必须是有效的纬度。';

  @override
  String get longitudeErrorText => '该字段必须是有效的经度。';

  @override
  String get base64ErrorText => '该字段必须是有效的 Base64 字符串。';

  @override
  String get pathErrorText => '该字段必须是有效的路径。';

  @override
  String get oddNumberErrorText => '该字段必须是奇数。';

  @override
  String get evenNumberErrorText => '该字段必须是偶数。';

  @override
  String portNumberErrorText(int min, int max) {
    return '该字段必须是有效的端口号。';
  }

  @override
  String get macAddressErrorText => '该字段必须是有效的 MAC 地址。';

  @override
  String startsWithErrorText(String value) {
    return '值必须以 $value 开头。';
  }

  @override
  String endsWithErrorText(String value) {
    return '值必须以 $value 结尾。';
  }

  @override
  String containsErrorText(String value) {
    return '值必须包含 $value。';
  }

  @override
  String betweenErrorText(num min, num max) {
    return '值必须在 $min 和 $max 之间。';
  }

  @override
  String get containsElementErrorText => '值必须在允许的值列表中。';

  @override
  String get ibanErrorText => '该字段必须是有效的 IBAN。';

  @override
  String get uniqueErrorText => '该字段必须是唯一的。';

  @override
  String get bicErrorText => '该字段必须是有效的 BIC。';

  @override
  String get isbnErrorText => '该字段必须是有效的 ISBN。';

  @override
  String get singleLineErrorText => '该字段必须是单行文本。';

  @override
  String get timeErrorText => '该字段必须是有效的时间。';

  @override
  String get dateMustBeInTheFutureErrorText => '日期必须是将来的日期。';

  @override
  String get dateMustBeInThePastErrorText => '日期必须是过去的日期。';

  @override
  String get fileNameErrorText => '值必须是一个有效的文件名。';

  @override
  String get negativeNumberErrorText => '值必须是一个负数。';

  @override
  String get positiveNumberErrorText => '值必须是一个正数。';

  @override
  String get notZeroNumberErrorText => '值不能为零。';

  @override
  String get ssnErrorText => '值必须是一个有效的社会保险号码。';

  @override
  String get zipCodeErrorText => '值必须是一个有效的邮政编码。';

  @override
  String get usernameErrorText => '值必须是有效的用户名。';

  @override
  String get usernameCannotContainNumbersErrorText => '用户名不能包含数字。';

  @override
  String get usernameCannotContainUnderscoreErrorText => '用户名不能包含下划线。';

  @override
  String get usernameCannotContainSpecialCharErrorText => '用户名不能包含特殊字符。';

  @override
  String get usernameCannotContainSpacesErrorText => '用户名不能包含空格。';

  @override
  String get usernameCannotContainDotsErrorText => '用户名不能包含点。';

  @override
  String get usernameCannotContainDashesErrorText => '用户名不能包含破折号。';

  @override
  String get invalidMimeTypeErrorText => '无效的 MIME 类型。';

  @override
  String get timezoneErrorText => '值必须是有效的时区。';

  @override
  String get cityErrorText => '值必须是有效的城市名称。';

  @override
  String get countryErrorText => '值必须是有效的国家。';

  @override
  String get stateErrorText => '值必须是有效的州。';

  @override
  String get streetErrorText => '值必须是有效的街道名称。';

  @override
  String get firstNameErrorText => '值必须是有效的名字。';

  @override
  String get lastNameErrorText => '值必须是有效的姓氏。';

  @override
  String get passportNumberErrorText => '值必须是有效的护照号码。';

  @override
  String get primeNumberErrorText => '值必须是质数。';

  @override
  String get dunsErrorText => '值必须是有效的DUNS编号。';

  @override
  String get licensePlateErrorText => '值必须是有效的车牌号。';

  @override
  String get vinErrorText => '值必须是有效的车辆识别码（VIN）。';

  @override
  String get languageCodeErrorText => '值必须是有效的语言代码。';

  @override
  String get floatErrorText => '值必须是有效的浮点数。';

  @override
  String get hexadecimalErrorText => '值必须是有效的十六进制数。';
}

/// The translations for Chinese, using the Han script (`zh_Hant`).
class FormBuilderLocalizationsImplZhHant
    extends FormBuilderLocalizationsImplZh {
  FormBuilderLocalizationsImplZhHant() : super('zh_Hant');

  @override
  String get creditCardErrorText => '此欄位需要有效的信用卡號碼。';

  @override
  String get dateStringErrorText => '此欄位需要有效的日期字符串。';

  @override
  String get emailErrorText => '此欄位需要有效的電子郵件地址。';

  @override
  String equalErrorText(String value) {
    return '此欄位必須與 $value 相符';
  }

  @override
  String equalLengthErrorText(int length) {
    return '值必須具有等於 $length 的長度';
  }

  @override
  String get integerErrorText => '此欄位需要有效的整數。';

  @override
  String get ipErrorText => '此欄位需要有效的 IP。';

  @override
  String get matchErrorText => '此欄位與格式不匹配。';

  @override
  String maxErrorText(num max) {
    return '此欄位必須小於或等於 $max';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return '此欄位的長度必須小於或等於 $maxLength';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return '值必須具有小於或等於 $maxWordsCount 的單詞計數';
  }

  @override
  String minErrorText(num min) {
    return '此欄位必須大於或等於 $min';
  }

  @override
  String minLengthErrorText(int minLength) {
    return '此欄位的長度必須大於或等於 $minLength';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return '值必須具有大於或等於 $minWordsCount 的單詞計數';
  }

  @override
  String notEqualErrorText(String value) {
    return '此欄位不得等於 $value';
  }

  @override
  String get numericErrorText => '此欄位必須是數字。';

  @override
  String get requiredErrorText => '此欄位不能為空。';

  @override
  String get urlErrorText => '此欄位需要有效的 URL 地址。';

  @override
  String get phoneErrorText => '此欄位需要有效的電話號碼。';

  @override
  String get creditCardExpirationDateErrorText => '此欄位需要有效的信用卡到期日期。';

  @override
  String get creditCardExpiredErrorText => '信用卡已過期。';

  @override
  String get creditCardCVCErrorText => '此欄位需要有效的信用卡 CVC 碼。';

  @override
  String colorCodeErrorText(String colorCode) {
    return '此欄位需要有效的顏色代碼。';
  }

  @override
  String get uppercaseErrorText => '此欄位需要包含大寫字母。';

  @override
  String get lowercaseErrorText => '此欄位需要包含小寫字母。';

  @override
  String fileExtensionErrorText(String extensions) {
    return '此欄位需要有效的文件擴展名。';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return '此文件超過允許的最大大小。';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return '日期必須在允許的範圍內。';
  }

  @override
  String get mustBeTrueErrorText => '此欄位必須為真。';

  @override
  String get mustBeFalseErrorText => '此欄位必須為假。';

  @override
  String containsSpecialCharErrorText(int min) {
    return '此欄位需要包含特殊字符。';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return '此欄位需要包含大寫字母。';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return '此欄位需要包含小寫字母。';
  }

  @override
  String containsNumberErrorText(int min) {
    return '此欄位需要包含數字。';
  }

  @override
  String get alphabeticalErrorText => '此欄位只能包含字母。';

  @override
  String get uuidErrorText => '此欄位需要有效的 UUID。';

  @override
  String get jsonErrorText => '此欄位需要有效的 JSON。';

  @override
  String get latitudeErrorText => '此欄位需要有效的緯度。';

  @override
  String get longitudeErrorText => '此欄位需要有效的經度。';

  @override
  String get base64ErrorText => '此欄位需要有效的 Base64 字符串。';

  @override
  String get pathErrorText => '此欄位需要有效的路徑。';

  @override
  String get oddNumberErrorText => '此欄位需要奇數。';

  @override
  String get evenNumberErrorText => '此欄位需要偶數。';

  @override
  String portNumberErrorText(int min, int max) {
    return '此欄位需要有效的端口號。';
  }

  @override
  String get macAddressErrorText => '此欄位需要有效的 MAC 地址。';

  @override
  String startsWithErrorText(String value) {
    return '值必須以 $value 開頭。';
  }

  @override
  String endsWithErrorText(String value) {
    return '值必須以 $value 結尾。';
  }

  @override
  String containsErrorText(String value) {
    return '值必須包含 $value。';
  }

  @override
  String betweenErrorText(num min, num max) {
    return '值必須在 $min 和 $max 之間。';
  }

  @override
  String get containsElementErrorText => '值必須在允許的值列表中。';

  @override
  String get ibanErrorText => '此欄位需要有效的 IBAN。';

  @override
  String get uniqueErrorText => '此欄位需要唯一的值。';

  @override
  String get bicErrorText => '此欄位需要有效的 BIC 編碼。';

  @override
  String get isbnErrorText => '此欄位需要有效的 ISBN 編碼。';

  @override
  String get singleLineErrorText => '此欄位必須只包含單行文本。';

  @override
  String get timeErrorText => '此欄位需要有效的時間。';

  @override
  String get dateMustBeInTheFutureErrorText => '日期必須在未來。';

  @override
  String get dateMustBeInThePastErrorText => '日期必須在過去。';

  @override
  String get fileNameErrorText => '值必須是有效的檔案名稱。';

  @override
  String get negativeNumberErrorText => '值必須是負數。';

  @override
  String get positiveNumberErrorText => '值必須是正數。';

  @override
  String get notZeroNumberErrorText => '值不能為零。';

  @override
  String get ssnErrorText => '值必須是有效的社會安全號碼。';

  @override
  String get zipCodeErrorText => '值必須是有效的郵政編碼。';

  @override
  String get usernameErrorText => '值必須是有效的用戶名。';

  @override
  String get usernameCannotContainNumbersErrorText => '用戶名不能包含數字。';

  @override
  String get usernameCannotContainUnderscoreErrorText => '用戶名不能包含底線。';

  @override
  String get usernameCannotContainSpecialCharErrorText => '用戶名不能包含特殊字符。';

  @override
  String get usernameCannotContainSpacesErrorText => '用戶名不能包含空格。';

  @override
  String get usernameCannotContainDotsErrorText => '用戶名不能包含點。';

  @override
  String get usernameCannotContainDashesErrorText => '用戶名不能包含破折號。';

  @override
  String get invalidMimeTypeErrorText => '無效的 MIME 類型。';

  @override
  String get timezoneErrorText => '值必須是一個有效的時區。';

  @override
  String get cityErrorText => '值必須是一個有效的城市名稱。';

  @override
  String get countryErrorText => '值必須是一個有效的國家。';

  @override
  String get stateErrorText => '值必須是一個有效的州/省。';

  @override
  String get streetErrorText => '值必須是一個有效的街道名稱。';

  @override
  String get firstNameErrorText => '值必須是一個有效的名字。';

  @override
  String get lastNameErrorText => '值必須是一個有效的姓氏。';

  @override
  String get passportNumberErrorText => '值必須是一個有效的護照號碼。';

  @override
  String get primeNumberErrorText => '值必須是一個質數。';

  @override
  String get dunsErrorText => '值必須是一個有效的DUNS號碼。';

  @override
  String get licensePlateErrorText => '值必須是一個有效的車牌號碼。';

  @override
  String get vinErrorText => '值必須是一個有效的車輛識別號。';

  @override
  String get languageCodeErrorText => '值必須是一個有效的語言代碼。';

  @override
  String get floatErrorText => '數值必須為有效的浮點數。';

  @override
  String get hexadecimalErrorText => '數值必須為有效的十六進位數字。';
}
