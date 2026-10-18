import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'messages_ar.dart';
import 'messages_bg.dart';
import 'messages_bn.dart';
import 'messages_bs.dart';
import 'messages_ca.dart';
import 'messages_cs.dart';
import 'messages_da.dart';
import 'messages_de.dart';
import 'messages_el.dart';
import 'messages_en.dart';
import 'messages_es.dart';
import 'messages_et.dart';
import 'messages_fa.dart';
import 'messages_fi.dart';
import 'messages_fr.dart';
import 'messages_he.dart';
import 'messages_hi.dart';
import 'messages_hr.dart';
import 'messages_hu.dart';
import 'messages_id.dart';
import 'messages_it.dart';
import 'messages_ja.dart';
import 'messages_ka.dart';
import 'messages_km.dart';
import 'messages_ko.dart';
import 'messages_ku.dart';
import 'messages_lo.dart';
import 'messages_lv.dart';
import 'messages_mn.dart';
import 'messages_ms.dart';
import 'messages_ne.dart';
import 'messages_nl.dart';
import 'messages_no.dart';
import 'messages_pl.dart';
import 'messages_pt.dart';
import 'messages_ro.dart';
import 'messages_ru.dart';
import 'messages_sk.dart';
import 'messages_sl.dart';
import 'messages_sq.dart';
import 'messages_sv.dart';
import 'messages_sw.dart';
import 'messages_ta.dart';
import 'messages_th.dart';
import 'messages_tr.dart';
import 'messages_uk.dart';
import 'messages_vi.dart';
import 'messages_zh.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of FormBuilderLocalizationsImpl
/// returned by `FormBuilderLocalizationsImpl.of(context)`.
///
/// Applications need to include `FormBuilderLocalizationsImpl.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'intl/messages.dart';
///
/// return MaterialApp(
///   localizationsDelegates: FormBuilderLocalizationsImpl.localizationsDelegates,
///   supportedLocales: FormBuilderLocalizationsImpl.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the FormBuilderLocalizationsImpl.supportedLocales
/// property.
abstract class FormBuilderLocalizationsImpl {
  FormBuilderLocalizationsImpl(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static FormBuilderLocalizationsImpl of(BuildContext context) {
    return Localizations.of<FormBuilderLocalizationsImpl>(
      context,
      FormBuilderLocalizationsImpl,
    )!;
  }

  static const LocalizationsDelegate<FormBuilderLocalizationsImpl> delegate =
      _FormBuilderLocalizationsImplDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('bg'),
    Locale('bn'),
    Locale('bs'),
    Locale('ca'),
    Locale('cs'),
    Locale('da'),
    Locale('de'),
    Locale('el'),
    Locale('en'),
    Locale('es'),
    Locale('et'),
    Locale('fa'),
    Locale('fi'),
    Locale('fr'),
    Locale('he'),
    Locale('hi'),
    Locale('hr'),
    Locale('hu'),
    Locale('id'),
    Locale('it'),
    Locale('ja'),
    Locale('ka'),
    Locale('km'),
    Locale('ko'),
    Locale('ku'),
    Locale('lo'),
    Locale('lv'),
    Locale('mn'),
    Locale('ms'),
    Locale('ne'),
    Locale('nl'),
    Locale('no'),
    Locale('pl'),
    Locale('pt'),
    Locale('ro'),
    Locale('ru'),
    Locale('sk'),
    Locale('sl'),
    Locale('sq'),
    Locale('sv'),
    Locale('sw'),
    Locale('ta'),
    Locale('th'),
    Locale('tr'),
    Locale('uk'),
    Locale('vi'),
    Locale('zh'),
    Locale.fromSubtags(languageCode: 'zh', scriptCode: 'Hant'),
  ];

  /// No description provided for @creditCardErrorText.
  ///
  /// In en, this message translates to:
  /// **'This field requires a valid credit card number.'**
  String get creditCardErrorText;

  /// No description provided for @dateStringErrorText.
  ///
  /// In en, this message translates to:
  /// **'This field requires a valid date string.'**
  String get dateStringErrorText;

  /// No description provided for @emailErrorText.
  ///
  /// In en, this message translates to:
  /// **'This field requires a valid email address.'**
  String get emailErrorText;

  /// No description provided for @equalErrorText.
  ///
  /// In en, this message translates to:
  /// **'This field value must be equal to {value}.'**
  String equalErrorText(String value);

  /// No description provided for @equalLengthErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must have a length equal to {length}.'**
  String equalLengthErrorText(int length);

  /// No description provided for @integerErrorText.
  ///
  /// In en, this message translates to:
  /// **'This field requires a valid integer.'**
  String get integerErrorText;

  /// No description provided for @ipErrorText.
  ///
  /// In en, this message translates to:
  /// **'This field requires a valid IP.'**
  String get ipErrorText;

  /// No description provided for @matchErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value does not match pattern.'**
  String get matchErrorText;

  /// No description provided for @maxErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be less than or equal to {max}.'**
  String maxErrorText(num max);

  /// No description provided for @maxLengthErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must have a length less than or equal to {maxLength}.'**
  String maxLengthErrorText(int maxLength);

  /// No description provided for @maxWordsCountErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must have a words count less than or equal to {maxWordsCount}.'**
  String maxWordsCountErrorText(int maxWordsCount);

  /// No description provided for @minErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be greater than or equal to {min}.'**
  String minErrorText(num min);

  /// No description provided for @minLengthErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must have a length greater than or equal to {minLength}.'**
  String minLengthErrorText(int minLength);

  /// No description provided for @minWordsCountErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must have a words count greater than or equal to {minWordsCount}.'**
  String minWordsCountErrorText(int minWordsCount);

  /// No description provided for @notEqualErrorText.
  ///
  /// In en, this message translates to:
  /// **'This field value must not be equal to {value}.'**
  String notEqualErrorText(String value);

  /// No description provided for @numericErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be numeric.'**
  String get numericErrorText;

  /// No description provided for @requiredErrorText.
  ///
  /// In en, this message translates to:
  /// **'This field cannot be empty.'**
  String get requiredErrorText;

  /// No description provided for @urlErrorText.
  ///
  /// In en, this message translates to:
  /// **'This field requires a valid URL address.'**
  String get urlErrorText;

  /// No description provided for @phoneErrorText.
  ///
  /// In en, this message translates to:
  /// **'This field requires a valid phone number.'**
  String get phoneErrorText;

  /// No description provided for @creditCardExpirationDateErrorText.
  ///
  /// In en, this message translates to:
  /// **'This field requires a valid expiration date.'**
  String get creditCardExpirationDateErrorText;

  /// No description provided for @creditCardExpiredErrorText.
  ///
  /// In en, this message translates to:
  /// **'This credit card has expired.'**
  String get creditCardExpiredErrorText;

  /// No description provided for @creditCardCVCErrorText.
  ///
  /// In en, this message translates to:
  /// **'This field requires a valid CVC code.'**
  String get creditCardCVCErrorText;

  /// No description provided for @colorCodeErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value should be a valid {colorCode} color code.'**
  String colorCodeErrorText(String colorCode);

  /// No description provided for @uppercaseErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be uppercase.'**
  String get uppercaseErrorText;

  /// No description provided for @lowercaseErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be lowercase.'**
  String get lowercaseErrorText;

  /// No description provided for @fileExtensionErrorText.
  ///
  /// In en, this message translates to:
  /// **'File extension must be {extensions}.'**
  String fileExtensionErrorText(String extensions);

  /// No description provided for @fileSizeErrorText.
  ///
  /// In en, this message translates to:
  /// **'File size must be less than {maxSize} while it is {fileSize}.'**
  String fileSizeErrorText(String maxSize, String fileSize);

  /// No description provided for @dateRangeErrorText.
  ///
  /// In en, this message translates to:
  /// **'Date must be in range {min} - {max}.'**
  String dateRangeErrorText(DateTime min, DateTime max);

  /// No description provided for @mustBeTrueErrorText.
  ///
  /// In en, this message translates to:
  /// **'This field must be true.'**
  String get mustBeTrueErrorText;

  /// No description provided for @mustBeFalseErrorText.
  ///
  /// In en, this message translates to:
  /// **'This field must be false.'**
  String get mustBeFalseErrorText;

  /// No description provided for @containsSpecialCharErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must contain at least {min} special characters.'**
  String containsSpecialCharErrorText(int min);

  /// No description provided for @containsUppercaseCharErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must contain at least {min} uppercase characters.'**
  String containsUppercaseCharErrorText(int min);

  /// No description provided for @containsLowercaseCharErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must contain at least {min} lowercase characters.'**
  String containsLowercaseCharErrorText(int min);

  /// No description provided for @containsNumberErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must contain at least {min} numbers.'**
  String containsNumberErrorText(int min);

  /// No description provided for @alphabeticalErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be alphabetical.'**
  String get alphabeticalErrorText;

  /// No description provided for @uuidErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid UUID.'**
  String get uuidErrorText;

  /// No description provided for @jsonErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be valid JSON.'**
  String get jsonErrorText;

  /// No description provided for @latitudeErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid latitude.'**
  String get latitudeErrorText;

  /// No description provided for @longitudeErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid longitude.'**
  String get longitudeErrorText;

  /// No description provided for @base64ErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid base64 string.'**
  String get base64ErrorText;

  /// No description provided for @pathErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid path.'**
  String get pathErrorText;

  /// No description provided for @oddNumberErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be an odd number.'**
  String get oddNumberErrorText;

  /// No description provided for @evenNumberErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be an even number.'**
  String get evenNumberErrorText;

  /// No description provided for @portNumberErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid port number between {min} and {max}.'**
  String portNumberErrorText(int min, int max);

  /// No description provided for @macAddressErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid MAC address.'**
  String get macAddressErrorText;

  /// No description provided for @startsWithErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must start with {value}.'**
  String startsWithErrorText(String value);

  /// No description provided for @endsWithErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must end with {value}.'**
  String endsWithErrorText(String value);

  /// No description provided for @containsErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must contain {value}.'**
  String containsErrorText(String value);

  /// No description provided for @betweenErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be between {min} and {max}.'**
  String betweenErrorText(num min, num max);

  /// No description provided for @containsElementErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be in list.'**
  String get containsElementErrorText;

  /// No description provided for @ibanErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid IBAN.'**
  String get ibanErrorText;

  /// No description provided for @uniqueErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be unique.'**
  String get uniqueErrorText;

  /// No description provided for @bicErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid BIC.'**
  String get bicErrorText;

  /// No description provided for @isbnErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid ISBN.'**
  String get isbnErrorText;

  /// No description provided for @singleLineErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a single line.'**
  String get singleLineErrorText;

  /// No description provided for @timeErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid time.'**
  String get timeErrorText;

  /// No description provided for @dateMustBeInTheFutureErrorText.
  ///
  /// In en, this message translates to:
  /// **'Date must be in the future.'**
  String get dateMustBeInTheFutureErrorText;

  /// No description provided for @dateMustBeInThePastErrorText.
  ///
  /// In en, this message translates to:
  /// **'Date must be in the past.'**
  String get dateMustBeInThePastErrorText;

  /// No description provided for @fileNameErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid file name.'**
  String get fileNameErrorText;

  /// No description provided for @negativeNumberErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a negative number.'**
  String get negativeNumberErrorText;

  /// No description provided for @positiveNumberErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a positive number.'**
  String get positiveNumberErrorText;

  /// No description provided for @notZeroNumberErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must not be zero.'**
  String get notZeroNumberErrorText;

  /// No description provided for @ssnErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid Social Security Number.'**
  String get ssnErrorText;

  /// No description provided for @zipCodeErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid ZIP code.'**
  String get zipCodeErrorText;

  /// No description provided for @usernameErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid username.'**
  String get usernameErrorText;

  /// No description provided for @usernameCannotContainNumbersErrorText.
  ///
  /// In en, this message translates to:
  /// **'Username cannot contain numbers.'**
  String get usernameCannotContainNumbersErrorText;

  /// No description provided for @usernameCannotContainUnderscoreErrorText.
  ///
  /// In en, this message translates to:
  /// **'Username cannot contain underscore.'**
  String get usernameCannotContainUnderscoreErrorText;

  /// No description provided for @usernameCannotContainSpecialCharErrorText.
  ///
  /// In en, this message translates to:
  /// **'Username cannot contain special characters.'**
  String get usernameCannotContainSpecialCharErrorText;

  /// No description provided for @usernameCannotContainSpacesErrorText.
  ///
  /// In en, this message translates to:
  /// **'Username cannot contain spaces.'**
  String get usernameCannotContainSpacesErrorText;

  /// No description provided for @usernameCannotContainDotsErrorText.
  ///
  /// In en, this message translates to:
  /// **'Username cannot contain dots.'**
  String get usernameCannotContainDotsErrorText;

  /// No description provided for @usernameCannotContainDashesErrorText.
  ///
  /// In en, this message translates to:
  /// **'Username cannot contain dashes.'**
  String get usernameCannotContainDashesErrorText;

  /// No description provided for @invalidMimeTypeErrorText.
  ///
  /// In en, this message translates to:
  /// **'Invalid mime type.'**
  String get invalidMimeTypeErrorText;

  /// No description provided for @timezoneErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid timezone.'**
  String get timezoneErrorText;

  /// No description provided for @cityErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid city name.'**
  String get cityErrorText;

  /// No description provided for @countryErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid country.'**
  String get countryErrorText;

  /// No description provided for @stateErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid state.'**
  String get stateErrorText;

  /// No description provided for @streetErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid street name.'**
  String get streetErrorText;

  /// No description provided for @firstNameErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid first name.'**
  String get firstNameErrorText;

  /// No description provided for @lastNameErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid last name.'**
  String get lastNameErrorText;

  /// No description provided for @passportNumberErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid passport number.'**
  String get passportNumberErrorText;

  /// No description provided for @primeNumberErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a prime number.'**
  String get primeNumberErrorText;

  /// No description provided for @dunsErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid DUNS number.'**
  String get dunsErrorText;

  /// No description provided for @licensePlateErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid license plate.'**
  String get licensePlateErrorText;

  /// No description provided for @vinErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid VIN.'**
  String get vinErrorText;

  /// No description provided for @languageCodeErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid language code.'**
  String get languageCodeErrorText;

  /// No description provided for @floatErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid floating point number.'**
  String get floatErrorText;

  /// No description provided for @hexadecimalErrorText.
  ///
  /// In en, this message translates to:
  /// **'Value must be a valid hexadecimal number.'**
  String get hexadecimalErrorText;
}

class _FormBuilderLocalizationsImplDelegate
    extends LocalizationsDelegate<FormBuilderLocalizationsImpl> {
  const _FormBuilderLocalizationsImplDelegate();

  @override
  Future<FormBuilderLocalizationsImpl> load(Locale locale) {
    return SynchronousFuture<FormBuilderLocalizationsImpl>(
      lookupFormBuilderLocalizationsImpl(locale),
    );
  }

  @override
  bool isSupported(Locale locale) => <String>[
    'ar',
    'bg',
    'bn',
    'bs',
    'ca',
    'cs',
    'da',
    'de',
    'el',
    'en',
    'es',
    'et',
    'fa',
    'fi',
    'fr',
    'he',
    'hi',
    'hr',
    'hu',
    'id',
    'it',
    'ja',
    'ka',
    'km',
    'ko',
    'ku',
    'lo',
    'lv',
    'mn',
    'ms',
    'ne',
    'nl',
    'no',
    'pl',
    'pt',
    'ro',
    'ru',
    'sk',
    'sl',
    'sq',
    'sv',
    'sw',
    'ta',
    'th',
    'tr',
    'uk',
    'vi',
    'zh',
  ].contains(locale.languageCode);

  @override
  bool shouldReload(_FormBuilderLocalizationsImplDelegate old) => false;
}

FormBuilderLocalizationsImpl lookupFormBuilderLocalizationsImpl(Locale locale) {
  // Lookup logic when language+script codes are specified.
  switch (locale.languageCode) {
    case 'zh':
      {
        switch (locale.scriptCode) {
          case 'Hant':
            return FormBuilderLocalizationsImplZhHant();
        }
        break;
      }
  }

  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return FormBuilderLocalizationsImplAr();
    case 'bg':
      return FormBuilderLocalizationsImplBg();
    case 'bn':
      return FormBuilderLocalizationsImplBn();
    case 'bs':
      return FormBuilderLocalizationsImplBs();
    case 'ca':
      return FormBuilderLocalizationsImplCa();
    case 'cs':
      return FormBuilderLocalizationsImplCs();
    case 'da':
      return FormBuilderLocalizationsImplDa();
    case 'de':
      return FormBuilderLocalizationsImplDe();
    case 'el':
      return FormBuilderLocalizationsImplEl();
    case 'en':
      return FormBuilderLocalizationsImplEn();
    case 'es':
      return FormBuilderLocalizationsImplEs();
    case 'et':
      return FormBuilderLocalizationsImplEt();
    case 'fa':
      return FormBuilderLocalizationsImplFa();
    case 'fi':
      return FormBuilderLocalizationsImplFi();
    case 'fr':
      return FormBuilderLocalizationsImplFr();
    case 'he':
      return FormBuilderLocalizationsImplHe();
    case 'hi':
      return FormBuilderLocalizationsImplHi();
    case 'hr':
      return FormBuilderLocalizationsImplHr();
    case 'hu':
      return FormBuilderLocalizationsImplHu();
    case 'id':
      return FormBuilderLocalizationsImplId();
    case 'it':
      return FormBuilderLocalizationsImplIt();
    case 'ja':
      return FormBuilderLocalizationsImplJa();
    case 'ka':
      return FormBuilderLocalizationsImplKa();
    case 'km':
      return FormBuilderLocalizationsImplKm();
    case 'ko':
      return FormBuilderLocalizationsImplKo();
    case 'ku':
      return FormBuilderLocalizationsImplKu();
    case 'lo':
      return FormBuilderLocalizationsImplLo();
    case 'lv':
      return FormBuilderLocalizationsImplLv();
    case 'mn':
      return FormBuilderLocalizationsImplMn();
    case 'ms':
      return FormBuilderLocalizationsImplMs();
    case 'ne':
      return FormBuilderLocalizationsImplNe();
    case 'nl':
      return FormBuilderLocalizationsImplNl();
    case 'no':
      return FormBuilderLocalizationsImplNo();
    case 'pl':
      return FormBuilderLocalizationsImplPl();
    case 'pt':
      return FormBuilderLocalizationsImplPt();
    case 'ro':
      return FormBuilderLocalizationsImplRo();
    case 'ru':
      return FormBuilderLocalizationsImplRu();
    case 'sk':
      return FormBuilderLocalizationsImplSk();
    case 'sl':
      return FormBuilderLocalizationsImplSl();
    case 'sq':
      return FormBuilderLocalizationsImplSq();
    case 'sv':
      return FormBuilderLocalizationsImplSv();
    case 'sw':
      return FormBuilderLocalizationsImplSw();
    case 'ta':
      return FormBuilderLocalizationsImplTa();
    case 'th':
      return FormBuilderLocalizationsImplTh();
    case 'tr':
      return FormBuilderLocalizationsImplTr();
    case 'uk':
      return FormBuilderLocalizationsImplUk();
    case 'vi':
      return FormBuilderLocalizationsImplVi();
    case 'zh':
      return FormBuilderLocalizationsImplZh();
  }

  throw FlutterError(
    'FormBuilderLocalizationsImpl.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
