import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_radius.dart';
import '../../../core/network/venue_service.dart';
import '../../../core/utils/fa_format.dart';
import '../../../core/widgets/bottom_nav_bar.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> _topVenues = [];

  @override
  void initState() {
    super.initState();
    VenueService.getVenues(limit: 6).then((venues) {
      if (mounted) setState(() => _topVenues = venues);
    }).catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('سالن فوتسال'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero Section
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.xl),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.navy, AppColors.pitch, AppColors.blueDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'رزرو آسان سالن ورزشی',
                    style: AppTypography.h4.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'بهترین سالن‌های فوتسال و ورزشی را پیدا کنید و رزرو نمایید',
                    style: AppTypography.bodyMedium.copyWith(
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => context.push('/venues'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.amber,
                            foregroundColor: AppColors.amberInk,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: AppRadius.buttonBorderRadius,
                            ),
                          ),
                          child: const Text(
                            'مشاهده سالن‌ها',
                            style: TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Quick Actions
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'دسترسی سریع',
                    style: AppTypography.h5.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    mainAxisSpacing: AppSpacing.md,
                    crossAxisSpacing: AppSpacing.md,
                    childAspectRatio: 1.3,
                    children: [
                      _QuickActionCard(
                        icon: Icons.sports_soccer,
                        title: 'سالن‌ها',
                        color: AppColors.blue,
                        onTap: () => context.push('/venues'),
                      ),
                      _QuickActionCard(
                        icon: Icons.emoji_events,
                        title: 'مسابقات',
                        color: AppColors.amber,
                        onTap: () => context.push('/competitions'),
                      ),
                      _QuickActionCard(
                        icon: Icons.people,
                        title: 'تیم‌ها',
                        color: AppColors.success,
                        onTap: () => context.push('/teams'),
                      ),
                      _QuickActionCard(
                        icon: Icons.local_offer,
                        title: 'تخفیف‌ها',
                        color: AppColors.error,
                        onTap: () => context.push('/deals'),
                      ),
                      _QuickActionCard(
                        icon: Icons.quiz,
                        title: 'کوییز',
                        color: const Color(0xFF8B5CF6),
                        onTap: () => context.push('/quiz'),
                      ),
                      _QuickActionCard(
                        icon: Icons.sports_basketball,
                        title: 'بازی‌ها',
                        color: const Color(0xFF10B981),
                        onTap: () => context.push('/games'),
                      ),
                    ],
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  // Top venues (real API)
                  if (_topVenues.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'سالن‌های برتر',
                          style: AppTypography.h5.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.push('/venues'),
                          child: const Text('مشاهده همه'),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                    SizedBox(
                      height: 210,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _topVenues.length,
                        separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.md),
                        itemBuilder: (context, index) {
                          final venue = _topVenues[index] as Map<String, dynamic>;
                          final rating = (venue['average_rating'] as num?) ?? 0.0;
                          final price = (venue['price'] as num?) ?? 0;
                          return SizedBox(
                            width: 200,
                            child: Card(
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: AppRadius.cardBorderRadius,
                                side: BorderSide(color: Theme.of(context).dividerColor),
                              ),
                              child: InkWell(
                                onTap: () => context.push('/venues/${venue['id']}'),
                                borderRadius: AppRadius.cardBorderRadius,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      height: 100,
                                      width: double.infinity,
                                      decoration: BoxDecoration(
                                        gradient: const LinearGradient(
                                          colors: [AppColors.navy, AppColors.blue],
                                        ),
                                        borderRadius: const BorderRadius.vertical(
                                          top: Radius.circular(AppRadius.card),
                                        ),
                                      ),
                                      child: const Icon(
                                        Icons.sports_soccer,
                                        size: 40,
                                        color: Colors.white24,
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.all(AppSpacing.sm),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            (venue['name'] ?? '').toString(),
                                            style: AppTypography.bodyMedium
                                                .copyWith(fontWeight: FontWeight.w600),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          const SizedBox(height: 4),
                                          Row(
                                            children: [
                                              const Icon(Icons.star,
                                                  size: 14, color: AppColors.amber),
                                              const SizedBox(width: 2),
                                              Text(
                                                rating.toStringAsFixed(1),
                                                style: AppTypography.caption,
                                              ),
                                              const Spacer(),
                                              Text(
                                                FaFormat.toman(price),
                                                style: AppTypography.caption.copyWith(
                                                  color: AppColors.success,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                  ],

                  // Features
                  Text(
                    'ویژگی‌ها',
                    style: AppTypography.h5.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  _FeatureCard(
                    icon: Icons.calendar_today,
                    title: 'رزرو آنلاین',
                    description: 'رزرو آسان و سریع در هر ساعت از شبانه‌روز',
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  _FeatureCard(
                    icon: Icons.payments,
                    title: 'پرداخت امن',
                    description: 'پرداخت آنلاین با درگاه‌های معتبر بانکی',
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  _FeatureCard(
                    icon: Icons.notifications_active,
                    title: 'اعلان‌ها',
                    description: 'دریافت اعلان برای رزروها و تخفیف‌ها',
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const AppBottomNavBar(),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.title,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadius.cardBorderRadius,
        side: BorderSide(
          color: Theme.of(context).dividerColor,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: AppRadius.cardBorderRadius,
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 26),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                title,
                style: AppTypography.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _FeatureCard({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadius.cardBorderRadius,
        side: BorderSide(
          color: Theme.of(context).dividerColor,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: AppColors.blue, size: 22),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTypography.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    description,
                    style: AppTypography.bodyMedium.copyWith(
                      fontSize: 12,
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withOpacity(0.6),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
