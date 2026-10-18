// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Indonesian (`id`).
class FormBuilderLocalizationsImplId extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplId([String locale = 'id']) : super(locale);

  @override
  String get creditCardErrorText => 'Nomor kartu kredit tidak valid.';

  @override
  String get dateStringErrorText => 'Tanggal tidak valid.';

  @override
  String get emailErrorText => 'Alamat email tidak valid.';

  @override
  String equalErrorText(String value) {
    return 'Nilai bidang ini harus sama dengan $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Nilai harus memiliki panjang yang sama dengan $length.';
  }

  @override
  String get integerErrorText => 'Nilai harus berupa bilangan bulat.';

  @override
  String get ipErrorText => 'Alamat IP tidak valid.';

  @override
  String get matchErrorText => 'Nilai tidak cocok dengan pola.';

  @override
  String maxErrorText(num max) {
    return 'Nilai harus kurang dari atau sama dengan $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Panjang karakter harus kurang dari atau sama dengan $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Nilai harus memiliki jumlah kata kurang dari atau sama dengan $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'Nilai harus lebih besar dari atau sama dengan $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Panjang karakter harus lebih besar dari atau sama dengan $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Nilai harus memiliki kata yang diperhitungkan lebih besar dari atau sama dengan $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Nilai bidang ini tidak boleh sama dengan $value.';
  }

  @override
  String get numericErrorText => 'Nilai harus berupa angka.';

  @override
  String get requiredErrorText => 'Bidang ini tidak boleh kosong.';

  @override
  String get urlErrorText => 'URL tidak valid.';

  @override
  String get phoneErrorText => 'Nomor telepon tidak valid.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Tanggal kedaluwarsa kartu kredit tidak valid.';

  @override
  String get creditCardExpiredErrorText => 'Kartu kredit telah kedaluwarsa.';

  @override
  String get creditCardCVCErrorText => 'Kode CVC kartu kredit tidak valid.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Kode warna tidak valid.';
  }

  @override
  String get uppercaseErrorText => 'Bidang ini memerlukan huruf besar.';

  @override
  String get lowercaseErrorText => 'Bidang ini memerlukan huruf kecil.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Ekstensi file tidak valid.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Ukuran file melebihi batas maksimum yang diizinkan.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Tanggal harus berada dalam rentang yang diizinkan.';
  }

  @override
  String get mustBeTrueErrorText => 'Bidang ini harus benar.';

  @override
  String get mustBeFalseErrorText => 'Bidang ini harus salah.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Bidang ini harus mengandung karakter khusus.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Bidang ini harus mengandung huruf besar.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Bidang ini harus mengandung huruf kecil.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Bidang ini harus mengandung angka.';
  }

  @override
  String get alphabeticalErrorText =>
      'Bidang ini harus hanya mengandung huruf.';

  @override
  String get uuidErrorText => 'UUID tidak valid.';

  @override
  String get jsonErrorText => 'JSON tidak valid.';

  @override
  String get latitudeErrorText => 'Garis lintang tidak valid.';

  @override
  String get longitudeErrorText => 'Garis bujur tidak valid.';

  @override
  String get base64ErrorText => 'String Base64 tidak valid.';

  @override
  String get pathErrorText => 'Path tidak valid.';

  @override
  String get oddNumberErrorText => 'Bidang ini memerlukan angka ganjil.';

  @override
  String get evenNumberErrorText => 'Bidang ini memerlukan angka genap.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Nomor port tidak valid.';
  }

  @override
  String get macAddressErrorText => 'Alamat MAC tidak valid.';

  @override
  String startsWithErrorText(String value) {
    return 'Nilai harus dimulai dengan $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Nilai harus diakhiri dengan $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'Nilai harus mengandung $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Nilai harus antara $min dan $max.';
  }

  @override
  String get containsElementErrorText =>
      'Nilai harus ada dalam daftar nilai yang diizinkan.';

  @override
  String get ibanErrorText => 'IBAN tidak valid.';

  @override
  String get uniqueErrorText => 'Nilai harus unik.';

  @override
  String get bicErrorText => 'BIC tidak valid.';

  @override
  String get isbnErrorText => 'ISBN tidak valid.';

  @override
  String get singleLineErrorText => 'Nilai harus dalam satu baris.';

  @override
  String get timeErrorText => 'Waktu tidak valid.';

  @override
  String get dateMustBeInTheFutureErrorText => 'Tanggal harus di masa depan.';

  @override
  String get dateMustBeInThePastErrorText => 'Tanggal harus di masa lalu.';

  @override
  String get fileNameErrorText => 'Nilai harus merupakan nama file yang valid.';

  @override
  String get negativeNumberErrorText => 'Nilai harus merupakan angka negatif.';

  @override
  String get positiveNumberErrorText => 'Nilai harus merupakan angka positif.';

  @override
  String get notZeroNumberErrorText => 'Nilai tidak boleh nol.';

  @override
  String get ssnErrorText =>
      'Nilai harus merupakan Nomor Asuransi Sosial yang valid.';

  @override
  String get zipCodeErrorText => 'Nilai harus merupakan kode ZIP yang valid.';

  @override
  String get usernameErrorText =>
      'Nilai harus berupa nama pengguna yang valid.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Nama pengguna tidak boleh mengandung angka.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Nama pengguna tidak boleh mengandung garis bawah.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Nama pengguna tidak boleh mengandung karakter khusus.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Nama pengguna tidak boleh mengandung spasi.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Nama pengguna tidak boleh mengandung titik.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Nama pengguna tidak boleh mengandung tanda hubung.';

  @override
  String get invalidMimeTypeErrorText => 'Tipe mime tidak valid.';

  @override
  String get timezoneErrorText => 'Nilai harus berupa zona waktu yang valid.';

  @override
  String get cityErrorText => 'Nilai harus berupa nama kota yang valid.';

  @override
  String get countryErrorText => 'Nilai harus berupa negara yang valid.';

  @override
  String get stateErrorText => 'Nilai harus berupa provinsi yang valid.';

  @override
  String get streetErrorText => 'Nilai harus berupa nama jalan yang valid.';

  @override
  String get firstNameErrorText => 'Nilai harus berupa nama depan yang valid.';

  @override
  String get lastNameErrorText =>
      'Nilai harus berupa nama belakang yang valid.';

  @override
  String get passportNumberErrorText =>
      'Nilai harus berupa nomor paspor yang valid.';

  @override
  String get primeNumberErrorText => 'Nilai harus berupa bilangan prima.';

  @override
  String get dunsErrorText => 'Nilai harus berupa nomor DUNS yang valid.';

  @override
  String get licensePlateErrorText =>
      'Nilai harus berupa pelat nomor yang valid.';

  @override
  String get vinErrorText => 'Nilai harus berupa VIN yang valid.';

  @override
  String get languageCodeErrorText =>
      'Nilai harus berupa kode bahasa yang valid.';

  @override
  String get floatErrorText =>
      'Nilai harus berupa angka floating point yang valid.';

  @override
  String get hexadecimalErrorText =>
      'Nilai harus berupa angka heksadesimal yang valid.';
}
