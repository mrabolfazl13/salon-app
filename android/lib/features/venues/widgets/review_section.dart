import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/status.dart';
import '../../auth/domain/user.dart';
import '../../auth/providers/auth_provider.dart';
import '../../contracts/domain/contract.dart' show Review;
import '../providers/venues_providers.dart';

/// Reviews section: summary, own-review form, list with edit/delete.
class ReviewSection extends ConsumerStatefulWidget {
  const ReviewSection({super.key, required this.venueId});

  final int venueId;

  @override
  ConsumerState<ReviewSection> createState() => _ReviewSectionState();
}

class _ReviewSectionState extends ConsumerState<ReviewSection> {
  int _rating = 5;
  final _comment = TextEditingController();
  bool _editing = false;
  bool _submitting = false;

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(venueReviewsProvider(widget.venueId));
    final controller = ref.read(venueReviewsProvider(widget.venueId).notifier);
    final me = ref.watch(currentUserProvider);
    final canReview = me != null && me.role == UserRole.user;

    if (state.loading) {
      return const Padding(
        padding: EdgeInsets.all(AppSpacing.xl),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            const Icon(Icons.star_rounded, color: AppColors.warning, size: 22),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                'نظرات کاربران',
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            Text(
              (state.summary?.averageRating ?? 0) > 0
                  ? state.summary!.averageRating.toStringAsFixed(1)
                  : '—',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            Text(
              ' (${formatFaNumber(state.summary?.totalReviews ?? state.reviews.length)} نظر)',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.lg),
        if (!canReview)
          _guestCard()
        else ...[
          _form(state, controller),
          if (state.myReview != null && !_editing) ...[
            const SizedBox(height: AppSpacing.sm),
            AppGhostButton(
              label: 'ویرایش نظر قبلی',
              icon: Icons.edit_outlined,
              onPressed: () {
                setState(() {
                  _editing = true;
                  _rating = state.myReview!.rating;
                  _comment.text = state.myReview!.comment ?? '';
                });
              },
            ),
          ],
        ],
        if (state.error != null) ...[
          const SizedBox(height: AppSpacing.sm),
          Text(
            state.error!,
            style: const TextStyle(
              fontFamily: 'Vazirmatn',
              fontSize: 12,
              color: AppColors.error,
            ),
            textAlign: TextAlign.center,
          ),
        ],
        const SizedBox(height: AppSpacing.lg),
        if (state.reviews.isEmpty)
          Text(
            'هنوز نظری برای این مجموعه ثبت نشده است. اولین نفر باشید!',
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
          )
        else
          ...state.reviews.map(
            (r) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: _ReviewCard(
                review: r,
                isMine: me != null && r.userId == me.id,
                onDelete: (me != null && r.userId == me.id)
                    ? () async {
                        final ok = await showAppConfirm(
                          context,
                          title: 'حذف نظر',
                          description:
                              'آیا از حذف نظر خود اطمینان دارید؟',
                          confirmText: 'حذف',
                          destructive: true,
                        );
                        if (ok && mounted) {
                          final deleted = await controller.deleteMine();
                          if (mounted) {
                            if (deleted) {
                              AppSnack.success(this.context, 'نظر شما حذف شد');
                            } else {
                              AppSnack.error(this.context, 'خطا در حذف نظر');
                            }
                          }
                        }
                      }
                    : null,
              ),
            ),
          ),
      ],
    );
  }

  Widget _guestCard() => Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppRadius.image),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Column(
          children: [
            const Icon(Icons.star_outline_rounded,
                color: AppColors.warning, size: 28),
            const SizedBox(height: 8),
            Text(
              'برای ثبت نظر، وارد حساب کاربری شوید',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: AppSpacing.md),
            AppGradientButton(
              label: 'ورود / ثبت‌نام',
              onPressed: () {},
              height: 42,
              width: 160,
              fontSize: 13,
            ),
          ],
        ),
      );

  Widget _form(VenueReviewsState state, VenueReviewsController controller) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(AppRadius.image),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _editing ? 'ویرایش نظر شما' : 'نظر خود را ثبت کنید',
            style: Theme.of(context).textTheme.titleSmall,
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Text('امتیاز شما:', style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(width: 8),
              ...List.generate(5, (i) {
                final value = i + 1;
                return GestureDetector(
                  onTap: () => setState(() => _rating = value),
                  child: Icon(
                    value <= _rating
                        ? Icons.star_rounded
                        : Icons.star_outline_rounded,
                    color: AppColors.warning,
                    size: 26,
                  ),
                );
              }),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          TextField(
            controller: _comment,
            maxLines: 3,
            maxLength: 1000,
            style: Theme.of(context).textTheme.bodyMedium,
            decoration: const InputDecoration(
              hintText: 'تجربه خود را از این مجموعه بنویسید (اختیاری)...',
              counterText: '',
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: AppGradientButton(
                  label: _editing ? 'ذخیره تغییرات' : 'ثبت نظر',
                  loading: _submitting,
                  height: 44,
                  onPressed: () async {
                    setState(() => _submitting = true);
                    final ok = await controller.submit(
                      rating: _rating,
                      comment: _comment.text.trim(),
                    );
                    if (!mounted) return;
                    setState(() {
                      _submitting = false;
                      _editing = false;
                      _comment.clear();
                      _rating = 5;
                    });
                    if (ok) {
                      AppSnack.success(
                        context,
                        _editing
                            ? 'نظر شما با موفقیت ویرایش شد'
                            : 'نظر شما با موفقیت ثبت شد ⭐',
                      );
                    } else {
                      AppSnack.error(
                        context,
                        state.error ?? 'خطا در ثبت نظر',
                      );
                    }
                  },
                ),
              ),
              if (_editing) ...[
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: AppOutlineButton(
                    label: 'انصراف',
                    onPressed: () {
                      setState(() {
                        _editing = false;
                        _comment.clear();
                        _rating = 5;
                      });
                    },
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({required this.review, required this.isMine, this.onDelete});

  final Review review;
  final bool isMine;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(AppRadius.image),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: AppColors.primary,
                child: Text(
                  (review.userName ?? '؟').characters.first,
                  style: const TextStyle(
                    fontFamily: 'Vazirmatn',
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  review.userName ?? 'کاربر',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
              ),
              if (isMine)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'شما',
                    style: TextStyle(
                      fontFamily: 'Vazirmatn',
                      fontSize: 9.5,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              if (onDelete != null) ...[
                const SizedBox(width: 6),
                GestureDetector(
                  onTap: onDelete,
                  child: const Icon(Icons.delete_outline,
                      size: 18, color: AppColors.error),
                ),
              ],
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              RatingRow(value: review.rating, size: RatingSize.sm),
              const Spacer(),
              Text(
                formatDateTime(review.createdAt),
                style: Theme.of(context).textTheme.labelSmall,
              ),
            ],
          ),
          if (review.comment != null && review.comment!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              review.comment!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    height: 1.9,
                    fontSize: 12.5,
                    color: Theme.of(context).textTheme.bodyMedium?.color,
                  ),
            ),
          ],
        ],
      ),
    );
  }
}
