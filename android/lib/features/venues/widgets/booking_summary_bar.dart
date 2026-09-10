import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_button.dart';

/// Sticky bottom CTA bar (price + subtitle + gradient button).
class BookingSummaryBar extends StatelessWidget {
  const BookingSummaryBar({
    super.key,
    required this.price,
    required this.subtitle,
    required this.ctaLabel,
    required this.onAction,
    this.disabled = false,
    this.loading = false,
    this.freeLabel,
  });

  final int? price;
  final String subtitle;
  final String ctaLabel;
  final VoidCallback onAction;
  final bool disabled;
  final bool loading;
  final String? freeLabel;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: (Theme.of(context).brightness == Brightness.dark
                ? AppColors.darkSurface
                : AppColors.lightSurface)
            .withValues(alpha: 0.97),
        border: Border(
          top: BorderSide(color: Theme.of(context).dividerColor),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xl,
            vertical: AppSpacing.md,
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (price != null)
                      Text(
                        '${formatPriceOnly(price!)} تومان',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontSize: 19, height: 1.1),
                      )
                    else if (freeLabel != null)
                      Text(
                        freeLabel!,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontSize: 17,
                              color: AppColors.successDark,
                            ),
                      )
                    else
                      const Text(
                        'سانسی انتخاب نشده',
                        style: TextStyle(
                          fontFamily: 'Vazirmatn',
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.lightTextMuted,
                        ),
                      ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: 'Vazirmatn',
                        fontSize: 10.5,
                        color: Theme.of(context).textTheme.bodySmall?.color,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.lg),
              SizedBox(
                width: 160,
                child: AppGradientButton(
                  label: ctaLabel,
                  onPressed: disabled ? null : onAction,
                  loading: loading,
                  height: 48,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
