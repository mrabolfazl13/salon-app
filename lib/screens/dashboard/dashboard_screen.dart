import 'package:flutter/material.dart';
import '../venues/venues_screen.dart';
import '../bookings/bookings_screen.dart';
import '../games/games_list_screen.dart';
import '../teams/teams_list_screen.dart';
import '../favorites/favorites_screen.dart';
import '../search/search_screen.dart';
import '../competitions/competitions_screen.dart';
import '../quiz/quiz_screen.dart';
import '../deals/deals_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('داشبورد'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'خوش آمدید!',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'از اینجا می‌توانید به تمام بخش‌های اپلیکیشن دسترسی داشته باشید',
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Quick access grid
            Text(
              'دسترسی سریع',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),

            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.3,
              children: [
                _DashboardCard(
                  icon: Icons.sports_soccer,
                  title: 'سالن‌ها',
                  subtitle: 'مشاهده و رزرو سالن',
                  color: Colors.blue,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const VenuesScreen()),
                    );
                  },
                ),
                _DashboardCard(
                  icon: Icons.calendar_today,
                  title: 'رزروها',
                  subtitle: 'مدیریت رزروهای من',
                  color: Colors.green,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const BookingsScreen()),
                    );
                  },
                ),
                _DashboardCard(
                  icon: Icons.sports_esports,
                  title: 'بازی‌ها',
                  subtitle: 'بازی‌های گروهی',
                  color: Colors.purple,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const GamesListScreen()),
                    );
                  },
                ),
                _DashboardCard(
                  icon: Icons.groups,
                  title: 'تیم‌ها',
                  subtitle: 'مدیریت تیم',
                  color: Colors.orange,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const TeamsListScreen()),
                    );
                  },
                ),
                _DashboardCard(
                  icon: Icons.search,
                  title: 'جستجو',
                  subtitle: 'یافتن سالن',
                  color: Colors.teal,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const SearchScreen()),
                    );
                  },
                ),
                _DashboardCard(
                  icon: Icons.favorite,
                  title: 'علاقه‌مندی‌ها',
                  subtitle: 'سالن‌های ذخیره شده',
                  color: Colors.red,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const FavoritesScreen()),
                    );
                  },
                ),
                _DashboardCard(
                  icon: Icons.emoji_events,
                  title: 'مسابقات',
                  subtitle: 'شرکت در مسابقات',
                  color: Colors.amber,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const CompetitionsScreen()),
                    );
                  },
                ),
                _DashboardCard(
                  icon: Icons.quiz,
                  title: 'چالش ورزشی',
                  subtitle: 'آزمون اطلاعات',
                  color: Colors.indigo,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const QuizScreen()),
                    );
                  },
                ),
                _DashboardCard(
                  icon: Icons.local_offer,
                  title: 'تخفیف‌ها',
                  subtitle: 'پیشنهادات ویژه',
                  color: Colors.pink,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const DealsScreen()),
                    );
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DashboardCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _DashboardCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 32, color: color),
              const SizedBox(height: 8),
              Text(
                title,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 10,
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
