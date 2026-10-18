// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Japanese (`ja`).
class FormBuilderLocalizationsImplJa extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplJa([String locale = 'ja']) : super(locale);

  @override
  String get creditCardErrorText => '有効なクレジットカード番号を入力してください。';

  @override
  String get dateStringErrorText => '正しい日付を入力してください。';

  @override
  String get emailErrorText => '有効なメールアドレスを入力してください。';

  @override
  String equalErrorText(String value) {
    return '$valueに一致していません。';
  }

  @override
  String equalLengthErrorText(int length) {
    return '値の長さは$lengthと等しい必要があります。';
  }

  @override
  String get integerErrorText => '整数で入力してください。';

  @override
  String get ipErrorText => '有効なIPアドレスを入力してください。';

  @override
  String get matchErrorText => '値が正規表現と一致しません。';

  @override
  String maxErrorText(num max) {
    return '値は$max以下にしてください。';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return '値は$maxLength文字以下で入力してください。';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return '値の単語数は$maxWordsCount以下にしてください。';
  }

  @override
  String minErrorText(num min) {
    return '値は$min以上にしてください。';
  }

  @override
  String minLengthErrorText(int minLength) {
    return '値は$minLength文字以上で入力してください。';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return '値の単語数は$minWordsCount以上にしてください。';
  }

  @override
  String notEqualErrorText(String value) {
    return '値は$valueと異なる必要があります。';
  }

  @override
  String get numericErrorText => '値は数字で入力してください。';

  @override
  String get requiredErrorText => 'このフィールドは必須です。';

  @override
  String get urlErrorText => '有効なURLを入力してください。';

  @override
  String get phoneErrorText => '有効な電話番号を入力してください。';

  @override
  String get creditCardExpirationDateErrorText => '有効なクレジットカードの有効期限を入力してください。';

  @override
  String get creditCardExpiredErrorText => 'クレジットカードの有効期限が切れています。';

  @override
  String get creditCardCVCErrorText => '有効なクレジットカードのCVCコードを入力してください。';

  @override
  String colorCodeErrorText(String colorCode) {
    return '有効なカラーコードを入力してください。';
  }

  @override
  String get uppercaseErrorText => '値は大文字で入力してください。';

  @override
  String get lowercaseErrorText => '値は小文字で入力してください。';

  @override
  String fileExtensionErrorText(String extensions) {
    return '有効なファイル拡張子を入力してください。';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'ファイルサイズが最大許容サイズを超えています。';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return '日付は許可された範囲内である必要があります。';
  }

  @override
  String get mustBeTrueErrorText => 'このフィールドはtrueでなければなりません。';

  @override
  String get mustBeFalseErrorText => 'このフィールドはfalseでなければなりません。';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'このフィールドには特殊文字を含める必要があります。';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'このフィールドには大文字を含める必要があります。';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'このフィールドには小文字を含める必要があります。';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'このフィールドには数字を含める必要があります。';
  }

  @override
  String get alphabeticalErrorText => 'このフィールドはアルファベットのみを含める必要があります。';

  @override
  String get uuidErrorText => '有効なUUIDを入力してください。';

  @override
  String get jsonErrorText => '有効なJSONを入力してください。';

  @override
  String get latitudeErrorText => '有効な緯度を入力してください。';

  @override
  String get longitudeErrorText => '有効な経度を入力してください。';

  @override
  String get base64ErrorText => '有効なBase64文字列を入力してください。';

  @override
  String get pathErrorText => '有効なパスを入力してください。';

  @override
  String get oddNumberErrorText => '値は奇数でなければなりません。';

  @override
  String get evenNumberErrorText => '値は偶数でなければなりません。';

  @override
  String portNumberErrorText(int min, int max) {
    return '有効なポート番号を入力してください。';
  }

  @override
  String get macAddressErrorText => '有効なMACアドレスを入力してください。';

  @override
  String startsWithErrorText(String value) {
    return '値は$valueで始まる必要があります。';
  }

  @override
  String endsWithErrorText(String value) {
    return '値は$valueで終わる必要があります。';
  }

  @override
  String containsErrorText(String value) {
    return '値は$valueを含む必要があります。';
  }

  @override
  String betweenErrorText(num min, num max) {
    return '値は$minから$maxの間である必要があります。';
  }

  @override
  String get containsElementErrorText => '値は許可された値のリストに含まれている必要があります。';

  @override
  String get ibanErrorText => '有効なIBANを入力してください。';

  @override
  String get uniqueErrorText => '値は一意である必要があります。';

  @override
  String get bicErrorText => '有効なBICを入力してください。';

  @override
  String get isbnErrorText => '有効なISBNを入力してください。';

  @override
  String get singleLineErrorText => '値は単一行である必要があります。';

  @override
  String get timeErrorText => '有効な時間を入力してください。';

  @override
  String get dateMustBeInTheFutureErrorText => '日付は未来である必要があります。';

  @override
  String get dateMustBeInThePastErrorText => '日付は過去である必要があります。';

  @override
  String get fileNameErrorText => '値は有効なファイル名である必要があります。';

  @override
  String get negativeNumberErrorText => '値は負の数である必要があります。';

  @override
  String get positiveNumberErrorText => '値は正の数である必要があります。';

  @override
  String get notZeroNumberErrorText => '値はゼロであってはいけません。';

  @override
  String get ssnErrorText => '値は有効な社会保障番号である必要があります。';

  @override
  String get zipCodeErrorText => '値は有効な郵便番号である必要があります。';

  @override
  String get usernameErrorText => '値は有効なユーザー名でなければなりません。';

  @override
  String get usernameCannotContainNumbersErrorText => 'ユーザー名に数字を含めることはできません。';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'ユーザー名にアンダースコアを含めることはできません。';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'ユーザー名に特殊文字を含めることはできません。';

  @override
  String get usernameCannotContainSpacesErrorText => 'ユーザー名にスペースを含めることはできません。';

  @override
  String get usernameCannotContainDotsErrorText => 'ユーザー名にドットを含めることはできません。';

  @override
  String get usernameCannotContainDashesErrorText => 'ユーザー名にダッシュを含めることはできません。';

  @override
  String get invalidMimeTypeErrorText => '無効な MIME タイプです。';

  @override
  String get timezoneErrorText => '値は有効なタイムゾーンでなければなりません。';

  @override
  String get cityErrorText => '値は有効な市の名前でなければなりません。';

  @override
  String get countryErrorText => '値は有効な国でなければなりません。';

  @override
  String get stateErrorText => '値は有効な州でなければなりません。';

  @override
  String get streetErrorText => '値は有効な通り名でなければなりません。';

  @override
  String get firstNameErrorText => '値は有効な名でなければなりません。';

  @override
  String get lastNameErrorText => '値は有効な姓でなければなりません。';

  @override
  String get passportNumberErrorText => '値は有効なパスポート番号でなければなりません。';

  @override
  String get primeNumberErrorText => '値は素数でなければなりません。';

  @override
  String get dunsErrorText => '値は有効なDUNS番号でなければなりません。';

  @override
  String get licensePlateErrorText => '値は有効なナンバープレートでなければなりません。';

  @override
  String get vinErrorText => '値は有効なVINでなければなりません。';

  @override
  String get languageCodeErrorText => '値は有効な言語コードでなければなりません。';

  @override
  String get floatErrorText => '値は有効な浮動小数点数でなければなりません。';

  @override
  String get hexadecimalErrorText => '値は有効な16進数でなければなりません。';
}
