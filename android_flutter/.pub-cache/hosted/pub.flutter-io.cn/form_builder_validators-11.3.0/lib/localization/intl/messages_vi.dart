// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Vietnamese (`vi`).
class FormBuilderLocalizationsImplVi extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplVi([String locale = 'vi']) : super(locale);

  @override
  String get creditCardErrorText => 'Yêu cầu nhập đúng số thẻ tín dụng.';

  @override
  String get dateStringErrorText => 'Yêu cầu nhập đúng định dạng ngày.';

  @override
  String get emailErrorText => 'Nhập đúng email.';

  @override
  String equalErrorText(String value) {
    return 'Bắt buộc bằng $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Độ dài phải bằng $length.';
  }

  @override
  String get integerErrorText => 'Yêu cầu nhập một số nguyên.';

  @override
  String get ipErrorText => 'Yêu cầu nhập đúng địa chỉ IP.';

  @override
  String get matchErrorText => 'Giá trị không khớp.';

  @override
  String maxErrorText(num max) {
    return 'Giá trị phải nhỏ hơn hoặc bằng $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Độ dài phải nhỏ hơn hoặc bằng $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Giá trị phải có số từ nhỏ hơn hoặc bằng $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'Giá trị phải lớn hơn hoặc bằng $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Độ dài phải lớn hơn hoặc bằng $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Giá trị phải có số từ lớn hơn hoặc bằng $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Bắt buộc khác $value.';
  }

  @override
  String get numericErrorText => 'Yêu cầu nhập một số.';

  @override
  String get requiredErrorText => 'Không được bỏ trống.';

  @override
  String get urlErrorText => 'Nhập đúng địa chỉ URL.';

  @override
  String get phoneErrorText => 'Yêu cầu nhập số điện thoại hợp lệ.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Yêu cầu nhập đúng ngày hết hạn của thẻ tín dụng.';

  @override
  String get creditCardExpiredErrorText => 'Thẻ tín dụng đã hết hạn.';

  @override
  String get creditCardCVCErrorText =>
      'Yêu cầu nhập đúng mã CVC của thẻ tín dụng.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Yêu cầu nhập mã màu hợp lệ.';
  }

  @override
  String get uppercaseErrorText => 'Yêu cầu nhập chữ hoa.';

  @override
  String get lowercaseErrorText => 'Yêu cầu nhập chữ thường.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Yêu cầu nhập đúng đuôi file.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'File vượt quá kích thước tối đa cho phép.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Ngày phải nằm trong khoảng cho phép.';
  }

  @override
  String get mustBeTrueErrorText => 'Yêu cầu phải đúng.';

  @override
  String get mustBeFalseErrorText => 'Yêu cầu phải sai.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Yêu cầu chứa ký tự đặc biệt.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Yêu cầu chứa chữ hoa.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Yêu cầu chứa chữ thường.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Yêu cầu chứa số.';
  }

  @override
  String get alphabeticalErrorText => 'Yêu cầu chỉ chứa chữ cái.';

  @override
  String get uuidErrorText => 'Yêu cầu nhập đúng UUID.';

  @override
  String get jsonErrorText => 'Yêu cầu nhập đúng định dạng JSON.';

  @override
  String get latitudeErrorText => 'Yêu cầu nhập đúng vĩ độ.';

  @override
  String get longitudeErrorText => 'Yêu cầu nhập đúng kinh độ.';

  @override
  String get base64ErrorText => 'Yêu cầu nhập đúng chuỗi Base64.';

  @override
  String get pathErrorText => 'Yêu cầu nhập đúng đường dẫn.';

  @override
  String get oddNumberErrorText => 'Yêu cầu nhập số lẻ.';

  @override
  String get evenNumberErrorText => 'Yêu cầu nhập số chẵn.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Yêu cầu nhập đúng số cổng.';
  }

  @override
  String get macAddressErrorText => 'Yêu cầu nhập đúng địa chỉ MAC.';

  @override
  String startsWithErrorText(String value) {
    return 'Giá trị phải bắt đầu bằng $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Giá trị phải kết thúc bằng $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'Giá trị phải chứa $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Giá trị phải nằm trong khoảng từ $min đến $max.';
  }

  @override
  String get containsElementErrorText =>
      'Giá trị phải nằm trong danh sách các giá trị hợp lệ.';

  @override
  String get ibanErrorText => 'Yêu cầu nhập đúng số IBAN.';

  @override
  String get uniqueErrorText => 'Yêu cầu giá trị duy nhất.';

  @override
  String get bicErrorText => 'Yêu cầu nhập đúng mã BIC.';

  @override
  String get isbnErrorText => 'Yêu cầu nhập đúng số ISBN.';

  @override
  String get singleLineErrorText => 'Yêu cầu nhập trên một dòng.';

  @override
  String get timeErrorText => 'Yêu cầu nhập đúng định dạng thời gian.';

  @override
  String get dateMustBeInTheFutureErrorText => 'Ngày phải ở trong tương lai.';

  @override
  String get dateMustBeInThePastErrorText => 'Ngày phải ở trong quá khứ.';

  @override
  String get fileNameErrorText => 'Giá trị phải là tên tệp hợp lệ.';

  @override
  String get negativeNumberErrorText => 'Giá trị phải là số âm.';

  @override
  String get positiveNumberErrorText => 'Giá trị phải là số dương.';

  @override
  String get notZeroNumberErrorText => 'Giá trị không được là số không.';

  @override
  String get ssnErrorText => 'Giá trị phải là số An Sinh Xã Hội hợp lệ.';

  @override
  String get zipCodeErrorText => 'Giá trị phải là mã ZIP hợp lệ.';

  @override
  String get usernameErrorText => 'Giá trị phải là tên người dùng hợp lệ.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Tên người dùng không được chứa số.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Tên người dùng không được chứa dấu gạch dưới.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Tên người dùng không được chứa ký tự đặc biệt.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Tên người dùng không được chứa khoảng trắng.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Tên người dùng không được chứa dấu chấm.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Tên người dùng không được chứa dấu gạch ngang.';

  @override
  String get invalidMimeTypeErrorText => 'Loại mime không hợp lệ.';

  @override
  String get timezoneErrorText => 'Giá trị phải là một múi giờ hợp lệ.';

  @override
  String get cityErrorText => 'Giá trị phải là tên thành phố hợp lệ.';

  @override
  String get countryErrorText => 'Giá trị phải là quốc gia hợp lệ.';

  @override
  String get stateErrorText => 'Giá trị phải là bang hợp lệ.';

  @override
  String get streetErrorText => 'Giá trị phải là tên đường hợp lệ.';

  @override
  String get firstNameErrorText => 'Giá trị phải là tên hợp lệ.';

  @override
  String get lastNameErrorText => 'Giá trị phải là họ hợp lệ.';

  @override
  String get passportNumberErrorText => 'Giá trị phải là số hộ chiếu hợp lệ.';

  @override
  String get primeNumberErrorText => 'Giá trị phải là số nguyên tố.';

  @override
  String get dunsErrorText => 'Giá trị phải là số DUNS hợp lệ.';

  @override
  String get licensePlateErrorText => 'Giá trị phải là biển số xe hợp lệ.';

  @override
  String get vinErrorText => 'Giá trị phải là số VIN hợp lệ.';

  @override
  String get languageCodeErrorText => 'Giá trị phải là mã ngôn ngữ hợp lệ.';

  @override
  String get floatErrorText => 'Giá trị phải là một số dấu phẩy động hợp lệ.';

  @override
  String get hexadecimalErrorText =>
      'Giá trị phải là một số thập lục phân hợp lệ.';
}
