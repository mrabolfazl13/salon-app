class Appconstants {
  Appconstants._();

  static const String appName = 'فوتسال';
  static const List<String> daysOfWeek = [
    'شنبه',
    'یکشنبه',
    'دوشنبه',
    'سه‌شنبه',
    'چهارشنبه',
    'پنجشنبه',
    'جمعه',
  ];

  /// Python weekday convention: 0 = Monday … 6 = Sunday (matches backend).
  static const List<String> pyDayNames = [
    'دوشنبه',
    'سه‌شنبه',
    'چهارشنبه',
    'پنجشنبه',
    'جمعه',
    'شنبه',
    'یکشنبه',
  ];

  static const List<String> jalaliMonths = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند',
  ];

  static const List<String> amenities = [
    'پارکینگ',
    'کافه',
    'دوش',
    'سالن انتظار',
    'تلویزیون',
    'سیستم صوتی',
    'اینترنت',
    'تهویه',
    'کفپوش استاندارد',
    'نورپردازی',
  ];

  static const String defaultVenueLat = '34.6482';
  static const String defaultVenueLng = '50.8799';
}
