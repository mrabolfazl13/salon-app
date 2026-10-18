// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'messages.dart';

// ignore_for_file: type=lint

/// The translations for Swahili (`sw`).
class FormBuilderLocalizationsImplSw extends FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImplSw([String locale = 'sw']) : super(locale);

  @override
  String get creditCardErrorText =>
      'Sehemu hii inahitaji nambari halali ya kadi ya mkopo.';

  @override
  String get dateStringErrorText =>
      'Sehemu hii inahitaji mfuatano halali wa tarehe.';

  @override
  String get emailErrorText => 'Sehemu hii inahitaji barua pepe halali.';

  @override
  String equalErrorText(String value) {
    return 'Thamani ya sehemu hii lazima iwe sawa na $value.';
  }

  @override
  String equalLengthErrorText(int length) {
    return 'Thamani lazima iwe na urefu sawa na $length.';
  }

  @override
  String get integerErrorText => 'Sehemu hii inahitaji nambari kamili halali.';

  @override
  String get ipErrorText => 'Sehemu hii inahitaji IP halali.';

  @override
  String get matchErrorText => 'Thamani hailingani na muundo.';

  @override
  String maxErrorText(num max) {
    return 'Thamani lazima iwe chini ya au sawa na $max.';
  }

  @override
  String maxLengthErrorText(int maxLength) {
    return 'Thamani lazima iwe na urefu chini ya au sawa na $maxLength.';
  }

  @override
  String maxWordsCountErrorText(int maxWordsCount) {
    return 'Thamani lazima iwe na hesabu ya maneno chini ya au sawa na $maxWordsCount.';
  }

  @override
  String minErrorText(num min) {
    return 'Thamani lazima iwe kubwa kuliko au sawa na $min.';
  }

  @override
  String minLengthErrorText(int minLength) {
    return 'Thamani lazima iwe na urefu mkubwa kuliko au sawa na $minLength.';
  }

  @override
  String minWordsCountErrorText(int minWordsCount) {
    return 'Thamani lazima iwe na maneno kuhesabu kubwa kuliko au sawa na $minWordsCount.';
  }

  @override
  String notEqualErrorText(String value) {
    return 'Thamani hii ya sehemu haifai kuwa sawa na $value.';
  }

  @override
  String get numericErrorText => 'Thamani lazima iwe nambari.';

  @override
  String get requiredErrorText => 'Sehemu hii haiwezi kuwa tupu.';

  @override
  String get urlErrorText => 'Sehemu hii inahitaji anwani sahihi ya tovuti.';

  @override
  String get phoneErrorText => 'Sehemu hii inahitaji nambari halali ya simu.';

  @override
  String get creditCardExpirationDateErrorText =>
      'Sehemu hii inahitaji tarehe halali ya kumalizika kwa kadi ya mkopo.';

  @override
  String get creditCardExpiredErrorText => 'Kadi ya mkopo imeisha muda wake.';

  @override
  String get creditCardCVCErrorText =>
      'Sehemu hii inahitaji msimbo halali wa CVC wa kadi ya mkopo.';

  @override
  String colorCodeErrorText(String colorCode) {
    return 'Sehemu hii inahitaji msimbo halali wa rangi.';
  }

  @override
  String get uppercaseErrorText => 'Sehemu hii inahitaji herufi kubwa.';

  @override
  String get lowercaseErrorText => 'Sehemu hii inahitaji herufi ndogo.';

  @override
  String fileExtensionErrorText(String extensions) {
    return 'Sehemu hii inahitaji kiendelezi halali cha faili.';
  }

  @override
  String fileSizeErrorText(String maxSize, String fileSize) {
    return 'Faili hili linazidi ukubwa wa juu ulioruhusiwa.';
  }

  @override
  String dateRangeErrorText(DateTime min, DateTime max) {
    final intl.DateFormat minDateFormat = intl.DateFormat.yMd(localeName);
    final String minString = minDateFormat.format(min);
    final intl.DateFormat maxDateFormat = intl.DateFormat.yMd(localeName);
    final String maxString = maxDateFormat.format(max);

    return 'Tarehe lazima iwe ndani ya kikomo kilichoruhusiwa.';
  }

  @override
  String get mustBeTrueErrorText => 'Sehemu hii lazima iwe kweli.';

  @override
  String get mustBeFalseErrorText => 'Sehemu hii lazima iwe uongo.';

  @override
  String containsSpecialCharErrorText(int min) {
    return 'Sehemu hii lazima iwe na herufi maalum.';
  }

  @override
  String containsUppercaseCharErrorText(int min) {
    return 'Sehemu hii lazima iwe na herufi kubwa.';
  }

  @override
  String containsLowercaseCharErrorText(int min) {
    return 'Sehemu hii lazima iwe na herufi ndogo.';
  }

  @override
  String containsNumberErrorText(int min) {
    return 'Sehemu hii lazima iwe na nambari.';
  }

  @override
  String get alphabeticalErrorText => 'Sehemu hii lazima iwe na herufi pekee.';

  @override
  String get uuidErrorText => 'Sehemu hii inahitaji UUID halali.';

  @override
  String get jsonErrorText => 'Sehemu hii inahitaji JSON halali.';

  @override
  String get latitudeErrorText => 'Sehemu hii inahitaji latitudo halali.';

  @override
  String get longitudeErrorText => 'Sehemu hii inahitaji longitudo halali.';

  @override
  String get base64ErrorText =>
      'Sehemu hii inahitaji mfuatano halali wa Base64.';

  @override
  String get pathErrorText => 'Sehemu hii inahitaji njia halali.';

  @override
  String get oddNumberErrorText =>
      'Sehemu hii inahitaji nambari isiyo ya kawaida.';

  @override
  String get evenNumberErrorText => 'Sehemu hii inahitaji nambari ya kawaida.';

  @override
  String portNumberErrorText(int min, int max) {
    return 'Sehemu hii inahitaji nambari halali ya bandari.';
  }

  @override
  String get macAddressErrorText =>
      'Sehemu hii inahitaji anwani halali ya MAC.';

  @override
  String startsWithErrorText(String value) {
    return 'Thamani lazima ianze na $value.';
  }

  @override
  String endsWithErrorText(String value) {
    return 'Thamani lazima imalizike na $value.';
  }

  @override
  String containsErrorText(String value) {
    return 'Thamani lazima iwe na $value.';
  }

  @override
  String betweenErrorText(num min, num max) {
    return 'Thamani lazima iwe kati ya $min na $max.';
  }

  @override
  String get containsElementErrorText =>
      'Thamani lazima iwe kwenye orodha ya thamani zinazokubalika.';

  @override
  String get ibanErrorText => 'Sehemu hii inahitaji IBAN halali.';

  @override
  String get uniqueErrorText => 'Thamani lazima iwe ya kipekee.';

  @override
  String get bicErrorText => 'Sehemu hii inahitaji BIC halali.';

  @override
  String get isbnErrorText => 'Sehemu hii inahitaji ISBN halali.';

  @override
  String get singleLineErrorText => 'Sehemu hii inahitaji mstari mmoja tu.';

  @override
  String get timeErrorText => 'Sehemu hii inahitaji wakati halali.';

  @override
  String get dateMustBeInTheFutureErrorText => 'Date ilo fure.';

  @override
  String get dateMustBeInThePastErrorText => 'Date du laaynaa.';

  @override
  String get fileNameErrorText => 'Teel  xool mu araal file.';

  @override
  String get negativeNumberErrorText => 'Deffee bu xam xam.';

  @override
  String get positiveNumberErrorText => 'Deffee bu xam xam.';

  @override
  String get notZeroNumberErrorText => 'Deffee waa 0 loo xanbaareeyo.';

  @override
  String get ssnErrorText =>
      'Deffee waa nambarka xidhiidhka bulshada ee saxda ah.';

  @override
  String get zipCodeErrorText => 'Deffee waa lambarka Zip ee saxda ah.';

  @override
  String get usernameErrorText => 'Thamani lazima iwe jina la mtumiaji halali.';

  @override
  String get usernameCannotContainNumbersErrorText =>
      'Jina la mtumiaji haliwezi kuwa na nambari.';

  @override
  String get usernameCannotContainUnderscoreErrorText =>
      'Jina la mtumiaji haliwezi kuwa na alama ya underscore.';

  @override
  String get usernameCannotContainSpecialCharErrorText =>
      'Jina la mtumiaji haliwezi kuwa na herufi maalum.';

  @override
  String get usernameCannotContainSpacesErrorText =>
      'Jina la mtumiaji haliwezi kuwa na nafasi.';

  @override
  String get usernameCannotContainDotsErrorText =>
      'Jina la mtumiaji haliwezi kuwa na nukta.';

  @override
  String get usernameCannotContainDashesErrorText =>
      'Jina la mtumiaji haliwezi kuwa na mistari ya usawa.';

  @override
  String get invalidMimeTypeErrorText => 'Aina batili ya mime.';

  @override
  String get timezoneErrorText => 'Thamani lazima iwe sauti halali ya muda.';

  @override
  String get cityErrorText => 'Thamani lazima iwe jina halali la jiji.';

  @override
  String get countryErrorText => 'Thamani lazima iwe nchi halali.';

  @override
  String get stateErrorText => 'Thamani lazima iwe jimbo halali.';

  @override
  String get streetErrorText => 'Thamani lazima iwe jina halali la barabara.';

  @override
  String get firstNameErrorText => 'Thamani lazima iwe jina halali la kwanza.';

  @override
  String get lastNameErrorText => 'Thamani lazima iwe jina halali la mwisho.';

  @override
  String get passportNumberErrorText =>
      'Thamani lazima iwe nambari halali ya pasi.';

  @override
  String get primeNumberErrorText => 'Thamani lazima iwe nambari tambuzi.';

  @override
  String get dunsErrorText => 'Thamani lazima iwe nambari halali ya DUNS.';

  @override
  String get licensePlateErrorText =>
      'Thamani lazima iwe nambari sahihi ya leseni.';

  @override
  String get vinErrorText => 'Thamani lazima iwe VIN halali.';

  @override
  String get languageCodeErrorText =>
      'Thamani lazima iwe msimbo halali wa lugha.';

  @override
  String get floatErrorText =>
      'Thamani lazima iwe nambari sahihi ya nukta mvutano.';

  @override
  String get hexadecimalErrorText =>
      'Thamani lazima iwe nambari sahihi ya hekshadesimali.';
}
