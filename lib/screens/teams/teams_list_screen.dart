import 'package:flutter/material.dart';
import '../../core/services/team_service.dart';

class TeamsListScreen extends StatefulWidget {
  const TeamsListScreen({super.key});

  @override
  State<TeamsListScreen> createState() => _TeamsListScreenState();
}

class _TeamsListScreenState extends State<TeamsListScreen> with SingleTickerProviderStateMixin {
  final TeamService _teamService = TeamService();
  List<Map<String, dynamic>> _teams = [];
  bool _isLoading = true;
  String? _error;
  int _selectedTab = 0;

  @override
  void initState() {
    super.initState();
    _loadTeams();
  }

  Future<void> _loadTeams() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      List<Map<String, dynamic>> teams;
      
      if (_selectedTab == 0) {
        // My teams
        teams = await _teamService.getMyTeams();
      } else if (_selectedTab == 1) {
        // Discover teams
        teams = await _teamService.discoverTeams();
      } else {
        // Invitations (not implemented yet)
        teams = [];
      }
      
      setState(() {
        _teams = teams;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'خطا در بارگذاری تیم‌ها';
        _isLoading = false;
      });
    }
  }

  String _getSportEmoji(String sport) {
    switch (sport.toLowerCase()) {
      case 'فوتسال':
      case 'futsal':
        return '⚽';
      case 'والیبال':
      case 'volleyball':
        return '🏐';
      case 'بسکتبال':
      case 'basketball':
        return '🏀';
      default:
        return '🎯';
    }
  }

  String _getRoleText(String role) {
    switch (role.toLowerCase()) {
      case 'captain':
      case 'کاپیتان':
        return 'کاپیتان';
      case 'admin':
      case 'مدیر':
        return 'مدیر';
      case 'member':
      case 'عضو':
        return 'عضو';
      default:
        return role;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('تیم‌ها'),
        bottom: TabBar(
          onTap: (index) {
            setState(() {
              _selectedTab = index;
            });
            _loadTeams();
          },
          tabs: const [
            Tab(text: 'تیم‌های من'),
            Tab(text: 'کشف تیم'),
            Tab(text: 'دعوت‌نامه‌ها'),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadTeams,
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
                          onPressed: _loadTeams,
                          child: const Text('تلاش مجدد'),
                        ),
                      ],
                    ),
                  )
                : _teams.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.groups,
                              size: 64,
                              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'تیمی یافت نشد',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'اولین تیم خود را ایجاد کنید یا به تیم دیگران بپیوندید',
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
                        itemCount: _teams.length,
                        itemBuilder: (context, index) {
                          final team = _teams[index];
                          final teamId = team['id'] as int;
                          final name = team['name'] ?? 'بدون نام';
                          final sport = team['sport'] ?? 'فوتسال';
                          final memberCount = team['member_count'] ?? team['members']?.length ?? 0;
                          final maxMembers = team['max_members'] ?? 20;
                          final myRole = team['my_role'];
                          final isActive = team['is_active'] ?? true;
                          final description = team['description'];

                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: InkWell(
                              onTap: () {
                                // TODO: Navigate to team detail screen
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
                                          child: Row(
                                            children: [
                                              Text(
                                                _getSportEmoji(sport),
                                                style: const TextStyle(fontSize: 24),
                                              ),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  name,
                                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                                        fontWeight: FontWeight.bold,
                                                      ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        if (!isActive)
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 8,
                                              vertical: 4,
                                            ),
                                            decoration: BoxDecoration(
                                              color: Colors.grey.withValues(alpha: 0.2),
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                            child: Text(
                                              'غیرفعال',
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: Colors.grey[700],
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),

                                    // Description
                                    if (description != null && description.toString().isNotEmpty) ...[
                                      Text(
                                        description,
                                        style: TextStyle(
                                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 12),
                                    ],

                                    // Members count
                                    Row(
                                      children: [
                                        Icon(Icons.people, size: 16, color: Colors.grey[600]),
                                        const SizedBox(width: 8),
                                        Text(
                                          '$memberCount/$maxMembers عضو',
                                          style: TextStyle(color: Colors.grey[600]),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),

                                    // Role badge if user has a role
                                    if (myRole != null) ...[
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 6,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          _getRoleText(myRole),
                                          style: TextStyle(
                                            color: Theme.of(context).colorScheme.primary,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],

                                    // Action buttons for discover tab
                                    if (_selectedTab == 1) ...[
                                      const SizedBox(height: 12),
                                      Row(
                                        children: [
                                          Expanded(
                                            child: OutlinedButton(
                                              onPressed: () {
                                                // TODO: Show team details
                                              },
                                              child: const Text('مشاهده جزئیات'),
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: ElevatedButton(
                                              onPressed: () async {
                                                // TODO: Implement join request
                                                ScaffoldMessenger.of(context).showSnackBar(
                                                  const SnackBar(
                                                    content: Text('درخواست عضویت ارسال شد'),
                                                    backgroundColor: Colors.green,
                                                  ),
                                                );
                                              },
                                              child: const Text('درخواست عضویت'),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
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
          _showCreateTeamDialog();
        },
        icon: const Icon(Icons.add),
        label: const Text('ایجاد تیم'),
      ),
    );
  }

  Future<void> _showCreateTeamDialog() async {
    final nameController = TextEditingController();
    final descriptionController = TextEditingController();
    String selectedSport = 'فوتسال';

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('ایجاد تیم جدید'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(
                  labelText: 'نام تیم',
                  hintText: 'مثال: تیم قهرمان',
                ),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: selectedSport,
                decoration: const InputDecoration(labelText: 'ورزش'),
                items: const [
                  DropdownMenuItem(value: 'فوتسال', child: Text('فوتسال')),
                  DropdownMenuItem(value: 'والیبال', child: Text('والیبال')),
                  DropdownMenuItem(value: 'بسکتبال', child: Text('بسکتبال')),
                ],
                onChanged: (value) {
                  if (value != null) {
                    selectedSport = value;
                  }
                },
              ),
              const SizedBox(height: 16),
              TextField(
                controller: descriptionController,
                decoration: const InputDecoration(
                  labelText: 'توضیحات',
                  hintText: 'توضیحات کوتاه درباره تیم',
                ),
                maxLines: 3,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('انصراف'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (nameController.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('لطفاً نام تیم را وارد کنید')),
                );
                return;
              }

              Navigator.pop(context);

              final result = await _teamService.createTeam(
                name: nameController.text.trim(),
                sport: selectedSport,
                description: descriptionController.text.trim().isEmpty
                    ? null
                    : descriptionController.text.trim(),
              );

              if (mounted) {
                if (result['success'] == true) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('تیم با موفقیت ایجاد شد'),
                      backgroundColor: Colors.green,
                    ),
                  );
                  _loadTeams();
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(result['error'] ?? 'خطا در ایجاد تیم'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            child: const Text('ایجاد'),
          ),
        ],
      ),
    );
  }
}
