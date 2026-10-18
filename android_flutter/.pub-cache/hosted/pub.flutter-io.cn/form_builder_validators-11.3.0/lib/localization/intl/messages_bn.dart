// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Bengali Bangla (`bn`).
class FormBuilderLocalizationsImplBn extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplBn([String locale = 'bn']) : super(locale);

  @override
  String get creditCardErrorText => 'বৈধ ক্রেডিট কার্ড নম্বর প্রয়োজন।';

  @override
  String get dateStringErrorText => 'একটি বৈধ তারিখ প্রয়োজন।';

  @override
  String get emailErrorText => 'একটি বৈধ ইমেল আইডি প্রয়োজন।';

  @override
  String equalErrorText(String value) {
    return 'মান $value সমান হতে হবে।';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'মানটির দৈর্ঘ্য $length সমান হতে হবে।';
  }

  @override
  String get integerErrorText => 'মান অবশ্যই একটি পূর্ণসংখ্যা হতে হবে।';

  @override
  String get ipErrorText => 'একটি বৈধ আইপি এড্রেস প্রয়োজন।';

  @override
  String get matchErrorText => 'মান প্যাটার্নের সাথে মেলে না।';

  @override
  String maxErrorText(num max) {
    return 'মান অবশ্যই $max এর কম বা সমান হতে হবে।';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'মান অবশ্যই $maxLength এর থেকে কম বা সমান সংখ্যা হতে হবে।';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'মান অবশ্যই একটি শব্দের গণনা থাকতে হবে $maxWordsCount এর চেয়ে কম বা সমান।';
  }

  @override
  String minErrorText(num min) {
    return 'মান অবশ্যই $min এর থেকে বেশি বা সমান হতে হবে।';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'মান অবশ্যই $minLength এর চেয়ে বেশি বা সমান সংখ্যা হতে হবে।';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'মান অবশ্যই একটি শব্দের গণনা থাকতে হবে $minWordsCount এর চেয়ে বেশি বা সমান।';
  }

  @override
  String notEqualErrorText(String value) {
    return 'মান $value এর সমান হওয়া উচিত নয়।';
  }

  @override
  String get numericErrorText => 'মান অবশ্যই সংখ্যায় হতে হবে।';

  @override
  String get requiredErrorText => 'খালি রাখা যাবে না।';

  @override
  String get urlErrorText => 'একটি বৈধ ওয়েব এড্রেস প্রয়োজন।';

  @override
  String get phoneErrorText => 'একটি বৈধ ফোন নম্বর প্রয়োজন।';

  @override
  String get creditCardExpirationDateErrorText =>
      'একটি বৈধ ক্রেডিট কার্ডের মেয়াদ শেষের তারিখ প্রয়োজন।';

  @override
  String get creditCardExpiredErrorText =>
      'ক্রেডিট কার্ডের মেয়াদ শেষ হয়ে গেছে।';

  @override
  String get creditCardCVCErrorText =>
      'একটি বৈধ ক্রেডিট কার্ড CVC কোড প্রয়োজন।';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'একটি বৈধ রঙের কোড প্রয়োজন।';
  }

  @override
  String get uppercaseErrorText => 'এই ফিল্ডে বড় হাতের অক্ষর প্রয়োজন।';

  @override
  String get lowercaseErrorText => 'এই ফিল্ডে ছোট হাতের অক্ষর প্রয়োজন।';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'একটি বৈধ ফাইল এক্সটেনশন প্রয়োজন।';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'এই ফাইলটি সর্বাধিক অনুমোদিত আকার ছাড়িয়ে গেছে।';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'তারিখটি অনুমোদিত সীমার মধ্যে হতে হবে।';
  }

  @override
  String get mustBeTrueErrorText => 'এই ফিল্ডটি সত্য হতে হবে।';

  @override
  String get mustBeFalseErrorText => 'এই ফিল্ডটি মিথ্যা হতে হবে।';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'এই ফিল্ডে একটি বিশেষ অক্ষর থাকতে হবে।';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'এই ফিল্ডে একটি বড় হাতের অক্ষর থাকতে হবে।';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'এই ফিল্ডে একটি ছোট হাতের অক্ষর থাকতে হবে।';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'এই ফিল্ডে একটি সংখ্যা থাকতে হবে।';
  }

  @override
  String get alphabeticalErrorText => 'এই ফিল্ডে কেবল বর্ণমালা থাকা উচিত।';

  @override
  String get uuidErrorText => 'একটি বৈধ UUID প্রয়োজন।';

  @override
  String get jsonErrorText => 'একটি বৈধ JSON প্রয়োজন।';

  @override
  String get latitudeErrorText => 'একটি বৈধ অক্ষাংশ প্রয়োজন।';

  @override
  String get longitudeErrorText => 'একটি বৈধ দ্রাঘিমাংশ প্রয়োজন।';

  @override
  String get base64ErrorText => 'একটি বৈধ Base64 স্ট্রিং প্রয়োজন।';

  @override
  String get pathErrorText => 'একটি বৈধ পাথ প্রয়োজন।';

  @override
  String get oddNumberErrorText => 'এই ফিল্ডে একটি বিজোড় সংখ্যা থাকতে হবে।';

  @override
  String get evenNumberErrorText => 'এই ফিল্ডে একটি জোড় সংখ্যা থাকতে হবে।';

  @override
  String portNumberErrorText(int min, int max) {
    return 'একটি বৈধ পোর্ট নম্বর প্রয়োজন।';
  }

  @override
  String get macAddressErrorText => 'একটি বৈধ MAC ঠিকানা প্রয়োজন।';

  @override
  String startsWithErrorText(String value) {
    return 'মানটি $value দিয়ে শুরু হতে হবে।';
  }

  @override
  String endsWithErrorText(String value) {
    return 'মানটি $value দিয়ে শেষ হতে হবে।';
  }

  @override
  String containsErrorText(String value) {
    return 'মানটি $value ধারণ করতে হবে।';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'মানটি $min এবং $max এর মধ্যে হতে হবে।';
  }

  @override
  String get containsElementErrorText =>
      'মানটি অনুমোদিত তালিকার মধ্যে থাকতে হবে।';

  @override
  String get ibanErrorText => 'একটি বৈধ IBAN প্রয়োজন।';

  @override
  String get uniqueErrorText =>
      'মানটি অবশ্যই অনন্য মানগুলির মধ্যে অদ্বিতীয় হতে হবে।';

  @override
  String get bicErrorText => 'একটি বৈধ BIC প্রয়োজন।';

  @override
  String get isbnErrorText => 'একটি বৈধ ISBN প্রয়োজন।';

  @override
  String get singleLineErrorText => 'এই ফিল্ডে একটি একক লাইন থাকতে হবে।';

  @override
  String get timeErrorText => 'একটি বৈধ সময় প্রয়োজন।';

  @override
  String get dateMustBeInTheFutureErrorText => 'তারিখ ভবিষ্যতে থাকতে হবে।';

  @override
  String get dateMustBeInThePastErrorText => 'তারিখ অতীতে থাকতে হবে।';

  @override
  String get fileNameErrorText => 'মানটি একটি বৈধ ফাইল নাম হতে হবে।';

  @override
  String get negativeNumberErrorText => 'মানটি একটি নেতিবাচক সংখ্যা হতে হবে।';

  @override
  String get positiveNumberErrorText => 'মানটি একটি ধনাত্মক সংখ্যা হতে হবে।';

  @override
  String get notZeroNumberErrorText => 'মানটি শূন্য না হতে হবে।';

  @override
  String get ssnErrorText => 'মানটি একটি বৈধ সোশ্যাল সিকিউরিটি নম্বর হতে হবে।';

  @override
  String get zipCodeErrorText => 'মানটি একটি বৈধ জিপ কোড হতে হবে।';

  @override
  String get usernameErrorText => 'মানটি একটি বৈধ ব্যবহারকারীর নাম হতে হবে।';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'ব্যবহারকারীর নামের মধ্যে সংখ্যা থাকতে পারবে না।';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'ব্যবহারকারীর নামের মধ্যে আন্ডারস্কোর থাকতে পারবে না।';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'ব্যবহারকারীর নামের মধ্যে বিশেষ অক্ষর থাকতে পারবে না।';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'ব্যবহারকারীর নামের মধ্যে স্পেস থাকতে পারবে না।';

  @override
  String get usernameCannotContainDotsErrorText =>
      'ব্যবহারকারীর নামের মধ্যে বিন্দু থাকতে পারবে না।';

  @override
  String get usernameCannotContainDashesErrorText =>
      'ব্যবহারকারীর নামের মধ্যে ড্যাশ থাকতে পারবে না।';

  @override
  String get invalidMimeTypeErrorText => 'অবৈধ মাইম টাইপ।';

  @override
  String get timezoneErrorText => 'মানটি একটি বৈধ সময় অঞ্চল হতে হবে।';

  @override
  String get cityErrorText => 'মানটি একটি বৈধ শহরের নাম হতে হবে।';

  @override
  String get countryErrorText => 'মানটি একটি বৈধ দেশের হতে হবে।';

  @override
  String get stateErrorText => 'মানটি একটি বৈধ রাজ্যের হতে হবে।';

  @override
  String get streetErrorText => 'মানটি একটি বৈধ রাস্তার নাম হতে হবে।';

  @override
  String get firstNameErrorText => 'মানটি একটি বৈধ প্রথম নাম হতে হবে।';

  @override
  String get lastNameErrorText => 'মানটি একটি বৈধ শেষ নাম হতে হবে।';

  @override
  String get passportNumberErrorText =>
      'মানটি একটি বৈধ পাসপোর্ট নম্বর হতে হবে।';

  @override
  String get primeNumberErrorText => 'মানটি একটি মৌলিক সংখ্যা হতে হবে।';

  @override
  String get dunsErrorText => 'মানটি একটি বৈধ DUNS নম্বর হতে হবে।';

  @override
  String get licensePlateErrorText => 'মানটি একটি বৈধ লাইসেন্স প্লেট হতে হবে।';

  @override
  String get vinErrorText => 'মানটি একটি বৈধ VIN হতে হবে।';

  @override
  String get languageCodeErrorText => 'মানটি একটি বৈধ ভাষা কোড হতে হবে।';

  @override
  String get floatErrorText => 'মান একটি বৈধ ভাসমান বিন্দু সংখ্যা হতে হবে।';

  @override
  String get hexadecimalErrorText =>
      'মান একটি বৈধ হেক্সাডেসিমাল সংখ্যা হতে হবে।';
}
