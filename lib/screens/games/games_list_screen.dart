import 'package:flutter/material.dart';
import '../../core/services/game_service.dart';

class GamesListScreen extends StatefulWidget {
  const GamesListScreen({super.key});

  @override
  State<GamesListScreen> createState() => _GamesListScreenState();
}

class _GamesListScreenState extends State<GamesListScreen> with SingleTickerProviderStateMixin {
  final GameService _gameService = GameService();
  List<Map<String, dynamic>> _games = [];
  bool _isLoading = true;
  String? _error;
  int _selectedTab = 0;
  String? _selectedSport;

  @override
  void initState() {
    super.initState();
    _loadGames();
  }

  Future<void> _loadGames() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      List<Map<String, dynamic>> games;
      
      if (_selectedTab == 0) {
        // All games
        games = await _gameService.getGames(sport: _selectedSport);
      } else if (_selectedTab == 1) {
        // My games
        games = await _gameService.getMyGames();
      } else {
        // Invitations (not implemented yet)
        games = [];
      }
      
      setState(() {
        _games = games;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'خطا در بارگذاری بازی‌ها';
        _isLoading = false;
      });
    }
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      final months = [
        'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
        'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'
      ];
      return '${date.day} ${months[date.month - 1]} ${date.year}';
    } catch (e) {
      return dateString;
    }
  }

  String _formatTime(String timeString) {
    try {
      final parts = timeString.split(':');
      final hour = int.parse(parts[0]);
      final minute = int.parse(parts[1]);
      final period = hour >= 12 ? 'بعدازظهر' : 'قبل‌ازظهر';
      final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
      return '$displayHour:${minute.toString().padLeft(2, '0')} $period';
    } catch (e) {
      return timeString;
    }
  }

  Color _getSkillLevelColor(String level) {
    switch (level.toLowerCase()) {
      case 'beginner':
      case 'مبتدی':
        return Colors.green;
      case 'intermediate':
      case 'متوسط':
        return Colors.blue;
      case 'advanced':
      case 'پیشرفته':
        return Colors.orange;
      case 'professional':
      case 'حرفه‌ای':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getSkillLevelText(String level) {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'مبتدی';
      case 'intermediate':
        return 'متوسط';
      case 'advanced':
        return 'پیشرفته';
      case 'professional':
        return 'حرفه‌ای';
      default:
        return level;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('بازی‌های گروهی'),
        bottom: TabBar(
          onTap: (index) {
            setState(() {
              _selectedTab = index;
            });
            _loadGames();
          },
          tabs: const [
            Tab(text: 'همه بازی‌ها'),
            Tab(text: 'بازی‌های من'),
            Tab(text: 'دعوت‌نامه‌ها'),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadGames,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Theme.of(context).colorScheme.error,
                        ),
                        const SizedBox(height: 16),
                        Text(_error!),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadGames,
                          child: const Text('تلاش مجدد'),
                        ),
                      ],
                    ),
                  )
                : _games.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.sports_soccer,
                              size: 64,
                              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'بازی‌ای یافت نشد',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'اولین بازی را ایجاد کنید یا به بازی دیگران بپیوندید',
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _games.length,
                        itemBuilder: (context, index) {
                          final game = _games[index];
                          final gameId = game['id'] as int;
                          final name = game['name'] ?? 'بدون نام';
                          final sport = game['sport'] ?? 'فوتسال';
                          final venueName = game['venue_name'] ?? game['venue']?['name'] ?? 'نامشخص';
                          final dateStr = game['date'] ?? '';
                          final timeStr = game['time'] ?? game['start_time'] ?? '';
                          final skillLevel = game['skill_level'] ?? 'intermediate';
                          final currentPlayers = game['current_players'] ?? 0;
                          final maxPlayers = game['max_players'] ?? 10;
                          final price = (game['price'] ?? game['fee'] ?? 0) as num;
                          final isHost = game['is_host'] ?? false;
                          final status = game['status'] ?? 'open';

                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: InkWell(
                              onTap: () {
                                // Navigate to game detail screen
                                // TODO: Implement game detail screen
                              },
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Header: Name and Sport
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            name,
                                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                                  fontWeight: FontWeight.bold,
                                                ),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 4,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: Text(
                                            sport,
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Theme.of(context).colorScheme.primary,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),

                                    // Venue
                                    Row(
                                      children: [
                                        Icon(Icons.location_on, size: 16, color: Colors.grey[600]),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            venueName,
                                            style: TextStyle(color: Colors.grey[600]),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),

                                    // Date and Time
                                    if (dateStr.isNotEmpty || timeStr.isNotEmpty)
                                      Row(
                                        children: [
                                          Icon(Icons.calendar_today, size: 16, color: Colors.grey[600]),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              dateStr.isNotEmpty && timeStr.isNotEmpty
                                                  ? '${_formatDate(dateStr)} - ${_formatTime(timeStr)}'
                                                  : dateStr.isNotEmpty
                                                      ? _formatDate(dateStr)
                                                      : _formatTime(timeStr),
                                              style: TextStyle(color: Colors.grey[600]),
                                            ),
                                          ),
                                        ],
                                      ),
                                    const SizedBox(height: 12),

                                    // Skill Level and Players
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 10,
                                            vertical: 4,
                                          ),
                                          decoration: BoxDecoration(
                                            color: _getSkillLevelColor(skillLevel).withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: Text(
                                            _getSkillLevelText(skillLevel),
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: _getSkillLevelColor(skillLevel),
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                        const Spacer(),
                                        Icon(Icons.people, size: 16, color: Colors.grey[600]),
                                        const SizedBox(width: 4),
                                        Text(
                                          '$currentPlayers/$maxPlayers',
                                          style: TextStyle(color: Colors.grey[600]),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),

                                    // Price and Action Button
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        if (price > 0)
                                          Text(
                                            '${price.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} ریال',
                                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                                  fontWeight: FontWeight.bold,
                                                  color: Theme.of(context).colorScheme.primary,
                                                ),
                                          ),
                                        if (!isHost && status == 'open')
                                          ElevatedButton(
                                            onPressed: () async {
                                              final result = await _gameService.joinGame(gameId);
                                              if (mounted) {
                                                if (result['success'] == true) {
                                                  ScaffoldMessenger.of(context).showSnackBar(
                                                    const SnackBar(
                                                      content: Text('با موفقیت به بازی پیوستید'),
                                                      backgroundColor: Colors.green,
                                                    ),
                                                  );
                                                  _loadGames();
                                                } else {
                                                  ScaffoldMessenger.of(context).showSnackBar(
                                                    SnackBar(
                                                      content: Text(result['error'] ?? 'خطا در پیوستن به بازی'),
                                                      backgroundColor: Colors.red,
                                                    ),
                                                  );
                                                }
                                              }
                                            },
                                            child: const Text('پیوستن'),
                                          ),
                                        if (isHost)
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 12,
                                              vertical: 6,
                                            ),
                                            decoration: BoxDecoration(
                                              color: Colors.green.withValues(alpha: 0.1),
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                            child: Text(
                                              'میزبان',
                                              style: TextStyle(
                                                color: Colors.green[700],
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // TODO: Navigate to create game screen
        },
        icon: const Icon(Icons.add),
        label: const Text('ایجاد بازی'),
      ),
    );
  }
}
