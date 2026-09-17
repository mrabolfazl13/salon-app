# backend/app/utils/weekdays.py
"""نام‌های مشترک روزهای هفته — تک‌منبع (fixup §8c).

دو مفهوم با هم قاطی می‌شدند:
- `date.weekday()` پایتون: ۰=دوشنبه … ۶=یکشنبه — مبنای `Contract.day_of_week`
  و `PricingRule.day_of_week` (Python-based).
- کلید سری مالی (`strftime('%w')` / `extract('dow')`): ۰=یکشنبه … ۶=شنبه.

ثابت‌ها و مبدل‌ها همین‌جا; سری مالی «همان کلیدها» را نگه می‌دارد (۰=یکشنبه) و
برچسب را از نگاشت Sunday-first می‌خواند — یعنی بدون تغییر در قرارداد API،
برچسب‌ها از یک منبع واحد می‌آیند و با `py_weekday()` سازگار می‌شوند.
"""
# اندیس = date.weekday() پایتون (۰=دوشنبه)
WEEKDAY_NAMES_PY = (
    "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه", "یکشنبه",
)

# اندیس = کلید سری دفتر کل (۰=یکشنبه — SQLite %w / PG dow)
WEEKDAY_NAMES_SUNDAY_FIRST = (
    "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه",
)


def to_python_weekday(sunday_first_key: int) -> int:
    """کلید ۰=یکشنبه سری → weekday پایتون (۰=دوشنبه). سازگار با date.weekday()."""
    return (int(sunday_first_key) + 6) % 7


def ledger_key_from_python(py_weekday: int) -> int:
    """weekday پایتون → کلید سری ۰=یکشنبه."""
    return (int(py_weekday) + 1) % 7


def series_label(sunday_first_key: int) -> str:
    return WEEKDAY_NAMES_SUNDAY_FIRST[int(sunday_first_key) % 7]


def python_label(py_weekday: int) -> str:
    return WEEKDAY_NAMES_PY[int(py_weekday) % 7]