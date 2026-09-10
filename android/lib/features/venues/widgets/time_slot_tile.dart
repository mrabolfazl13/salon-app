import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../data/slot_display.dart';

/// Full-width time slot row (mirrors mobile/TimeSlot.tsx).
class TimeSlotTile extends StatelessWidget {
  const TimeSlotTile({
    super.key,
    required this.slot,
    required this.selected,
    required this.onSelect,
  });

  final DisplaySlot slot;
  final bool selected;
  final ValueChanged<DisplaySlot> onSelect;

  @override
  Widget build(BuildContext context) {
    final available = slot.available;
    return Opacity(
      opacity: available ? 1 : 0.65,
      child: GestureDetector(
        onTap: available ? () => onSelect(slot) : null,
        child: AnimatedContainer(
          duration: AppDurations.fast,
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            gradient: selected ? AppColors.gradientPrimary : null,
            color: selected
                ? null
                : (available
                    ? Theme.of(context).cardTheme.color
                    : Theme.of(context)
                        .colorScheme
                        .surfaceContainerHighest
                        .withValues(alpha: 0.4)),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected
                  ? Colors.transparent
                  : Theme.of(context).dividerColor,
              width: selected ? 1.5 : 1,
            ),
            boxShadow: selected
                ? [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.28),
                      blurRadius: 14,
                      offset: const Offset(0, 5),
                    ),
                  ]
                : null,
          ),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppRadius.tile),
                  color: selected
                      ? Colors.white.withValues(alpha: 0.18)
                      : AppColors.primary.withValues(alpha: 0.07),
                ),
                child: Icon(
                  available
                      ? Icons.access_time_rounded
                      : Icons.lock_clock_rounded,
                  size: 18,
                  color: selected
                      ? Colors.white
                      : available
                          ? AppColors.primary
                          : AppColors.lightTextMuted,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${formatTimeFa(slot.startTime)} – ${formatTimeFa(slot.endTime)}',
                      style: TextStyle(
                        fontFamily: 'Vazirmatn',
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        color: selected ? Colors.white : null,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      available
                          ? '${formatFaNumber(slot.duration)} دقیقه'
                          : 'رزرو شده',
                      style: TextStyle(
                        fontFamily: 'Vazirmatn',
                        fontSize: 10.5,
                        color: selected
                            ? Colors.white.withValues(alpha: 0.85)
                            : Theme.of(context).textTheme.bodySmall?.color,
                      ),
                    ),
                  ],
                ),
              ),
              if (available) ...[
                Text(
                  '${formatPriceOnly(slot.price)} تومان',
                  style: TextStyle(
                    fontFamily: 'Vazirmatn',
                    fontSize: 12.5,
                    fontWeight: FontWeight.w800,
                    color: selected ? Colors.white : null,
                  ),
                ),
                if (selected) ...[
                  const SizedBox(width: 8),
                  Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withValues(alpha: 0.25),
                    ),
                    child: const Icon(Icons.check, size: 14, color: Colors.white),
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}
