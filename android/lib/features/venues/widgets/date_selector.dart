import 'package:flutter/material.dart';
import 'package:shamsi_date/shamsi_date.dart' as shamsi;

import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';

class DateOption {
  const DateOption({
    required this.iso,
    required this.weekday,
    required this.day,
    required this.month,
    required this.isToday,
  });

  final String iso;
  final String weekday;
  final String day;
  final String month;
  final bool isToday;
}

/// Generates 14 days (including today) — Jalali labels like the original
/// buildDateOptions.
List<DateOption> buildDateOptions([int days = 14, DateTime? start]) {
  final base = start ?? DateTime.now();
  return List.generate(days, (i) {
    final date = base.add(Duration(days: i));
    final j = shamsi.Jalali.fromDateTime(date);
    // Jalali weekday: Saturday == 6 in shamsi_date (weekDay 1..7)
    final weekdayIndex =
        (j.weekDay + 1) % 7; // 0=شنبه … 6=جمعه (Appconstants order)
    return DateOption(
      iso: isoDate(date),
      weekday: Appconstants.daysOfWeek[weekdayIndex],
      day: toPersianDigits(j.day.toString()),
      month: Appconstants.jalaliMonths[j.month - 1],
      isToday: i == 0,
    );
  });
}

/// Horizontal date strip with prev/next arrows.
class DateSelector extends StatefulWidget {
  const DateSelector({
    super.key,
    required this.dates,
    required this.value,
    required this.onChange,
  });

  final List<DateOption> dates;
  final String value;
  final ValueChanged<String> onChange;

  @override
  State<DateSelector> createState() => _DateSelectorState();
}

class _DateSelectorState extends State<DateSelector> {
  final _controller = ScrollController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  int get _currentIndex =>
      widget.dates.indexWhere((d) => d.iso == widget.value).clamp(0, widget.dates.length - 1);

  void _scrollTo(int index) {
    if (!_controller.hasClients) return;
    const itemWidth = 78.0;
    final target = (index * itemWidth) -
        (_controller.position.viewportDimension - itemWidth) / 2;
    _controller.animateTo(
      target.clamp(0, _controller.position.maxScrollExtent),
      duration: AppDurations.normal,
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _arrow(
          Icons.chevron_right,
          enabled: _currentIndex > 0,
          onTap: () {
            final next = _currentIndex - 1;
            widget.onChange(widget.dates[next].iso);
            _scrollTo(next);
          },
        ),
        Expanded(
          child: SizedBox(
            height: 78,
            child: ListView.separated(
              controller: _controller,
              scrollDirection: Axis.horizontal,
              itemCount: widget.dates.length,
              separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.sm),
              itemBuilder: (context, index) {
                final d = widget.dates[index];
                final active = d.iso == widget.value;
                return GestureDetector(
                  onTap: () {
                    widget.onChange(d.iso);
                    _scrollTo(index);
                  },
                  child: AnimatedContainer(
                    duration: AppDurations.fast,
                    width: 70,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      gradient: active ? AppColors.gradientPrimary : null,
                      color: active ? null : Theme.of(context).cardTheme.color,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: active
                            ? Colors.transparent
                            : Theme.of(context).dividerColor,
                      ),
                      boxShadow: active
                          ? [
                              BoxShadow(
                                color: AppColors.primary.withValues(alpha: 0.28),
                                blurRadius: 14,
                                offset: const Offset(0, 5),
                              ),
                            ]
                          : null,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          d.isToday ? 'امروز' : d.weekday,
                          style: TextStyle(
                            fontFamily: 'Vazirmatn',
                            fontSize: 10.5,
                            fontWeight: FontWeight.w600,
                            color: active ? Colors.white : null,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          d.day,
                          style: TextStyle(
                            fontFamily: 'Vazirmatn',
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: active ? Colors.white : null,
                          ),
                        ),
                        Text(
                          d.month,
                          style: TextStyle(
                            fontFamily: 'Vazirmatn',
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                            color: active
                                ? Colors.white.withValues(alpha: 0.9)
                                : Theme.of(context).textTheme.bodySmall?.color,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
        _arrow(
          Icons.chevron_left,
          enabled: _currentIndex < widget.dates.length - 1,
          onTap: () {
            final next = _currentIndex + 1;
            widget.onChange(widget.dates[next].iso);
            _scrollTo(next);
          },
        ),
      ],
    );
  }

  Widget _arrow(IconData icon, {required bool enabled, required VoidCallback onTap}) {
    return IconButton(
      onPressed: enabled ? onTap : null,
      icon: Icon(icon, size: 22),
      visualDensity: VisualDensity.compact,
    );
  }
}
