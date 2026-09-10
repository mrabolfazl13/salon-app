import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../utils/formatters.dart';

/// Persian status labels/colors shared across booking/slot/contract/game
/// displays — mirrors getStatusLabel/getMuiStatusColor in the original app.
class StatusStyle {
  const StatusStyle(this.label, this.color, this.background);

  final String label;
  final Color color;
  final Color background;
}

StatusStyle statusStyle(String status, {required bool isDark}) {
  Color fg;
  String label;
  switch (status) {
    case 'confirmed':
    case 'active':
    case 'available':
    case 'acepted':
    case 'paid':
      fg = const Color(0xFF059669);
      label = const {
        'confirmed': 'تایید شده',
        'active': 'فعال',
        'available': 'آزاد',
        'acepted': 'عضو',
        'paid': 'پرداخت شده',
      }[status]!;
      break;
    case 'pending':
      fg = const Color(0xFFD97706);
      label = 'در انتظار';
      break;
    case 'cancelled':
    case 'booked':
      fg = AppColors.error;
      label = status == 'cancelled' ? 'لغو شده' : 'رزرو شده';
      break;
    case 'completed':
      fg = AppColors.info;
      label = 'انجام شده';
      break;
    case 'in_competition':
      fg = AppColors.warning;
      label = 'در حال رقابت';
      break;
    case 'blocked':
      fg = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
      label = 'مسدود';
      break;
    case 'expired':
      fg = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
      label = 'منقضی';
      break;
    case 'failed':
      fg = AppColors.error;
      label = 'ناموفق';
      break;
    case 'refunded':
      fg = AppColors.info;
      label = 'بازگشت وجه';
      break;
    default:
      fg = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
      label = status;
  }
  final bg = isDark ? fg.withValues(alpha: 0.16) : fg.withValues(alpha: 0.1);
  return StatusStyle(label, fg, bg);
}

class StatusChip extends StatelessWidget {
  const StatusChip(this.status, {super.key, this.compact = false});

  final String status;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final style = statusStyle(status, isDark: isDark);
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 10,
        vertical: compact ? 3 : 5,
      ),
      decoration: BoxDecoration(
        color: style.background,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        style.label,
        style: TextStyle(
          fontFamily: 'Vazirmatn',
          fontSize: compact ? 10.5 : 11.5,
          fontWeight: FontWeight.w700,
          color: style.color,
        ),
      ),
    );
  }
}

/// Persian price text — size sm/md/lg like the original Price component.
class PriceText extends StatelessWidget {
  const PriceText(
    this.value, {
    super.key,
    this.from = false,
    this.size = PriceSize.md,
    this.color,
    this.freeLabel = 'رایگان',
  });

  final num? value;
  final bool from;
  final PriceSize size;
  final Color? color;
  final String? freeLabel;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final mainColor = color ??
        (isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary);
    final mainSize = switch (size) {
      PriceSize.sm => 13.5,
      PriceSize.md => 15.5,
      PriceSize.lg => 20.0,
    };
    final unitSize = switch (size) {
      PriceSize.sm => 10.5,
      PriceSize.md => 11.5,
      PriceSize.lg => 12.5,
    };
    final text = value == null
        ? '—'
        : '${formatPriceOnly(value!)} تومان';
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      children: [
        if (from) ...[
          Text(
            'از: ',
            style: TextStyle(
              fontFamily: 'Vazirmatn',
              fontSize: unitSize,
              color: Theme.of(context).textTheme.bodySmall?.color,
            ),
          ),
        ],
        Text(
          text,
          style: TextStyle(
            fontFamily: 'Vazirmatn',
            fontSize: mainSize,
            fontWeight: FontWeight.w800,
            color: mainColor,
            height: 1.1,
          ),
        ),
      ],
    );
  }
}

enum PriceSize { sm, md, lg }

/// Star rating row with optional review count.
class RatingRow extends StatelessWidget {
  const RatingRow({
    super.key,
    required this.value,
    this.count = 0,
    this.size = RatingSize.sm,
  });

  final num? value;
  final int? count;
  final RatingSize size;

  @override
  Widget build(BuildContext context) {
    final starSize = size == RatingSize.sm ? 14.0 : 17.0;
    final fontSize = size == RatingSize.sm ? 11.5 : 13.5;
    final v = value ?? 0;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.star_rounded, size: starSize + 2, color: AppColors.warning),
        const SizedBox(width: 3),
        Text(
          v > 0 ? v.toStringAsFixed(1) : '—',
          style: TextStyle(
            fontFamily: 'Vazirmatn',
            fontSize: fontSize,
            fontWeight: FontWeight.w800,
          ),
        ),
        if ((count ?? 0) > 0) ...[
          const SizedBox(width: 3),
          Text(
            '(${formatFaNumber(count!)})',
            style: TextStyle(
              fontFamily: 'Vazirmatn',
              fontSize: fontSize - 1,
              color: Theme.of(context).textTheme.bodySmall?.color,
            ),
          ),
        ],
      ],
    );
  }
}

enum RatingSize { sm, md }

/// Section title row with optional «مشاهده همه» action (chevron-left in RTL).
class SectionHeader extends StatelessWidget {
  const SectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String? subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(subtitle!, style: Theme.of(context).textTheme.bodySmall),
                ],
              ],
            ),
          ),
          if (actionLabel != null && onAction != null)
            TextButton(
              onPressed: onAction,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                minimumSize: const Size(44, 34),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(actionLabel!),
                  const Icon(Icons.chevron_left, size: 18),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
