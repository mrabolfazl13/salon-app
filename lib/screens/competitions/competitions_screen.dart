import 'package:flutter/material.dart';

class CompetitionsScreen extends StatefulWidget {
  const CompetitionsScreen({super.key});

  @override
  State<CompetitionsScreen> createState() => _CompetitionsScreenState();
}

class _CompetitionsScreenState extends State<CompetitionsScreen> {
  List<Map<String, dynamic>> _competitions = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCompetitions();
  }

  Future<void> _loadCompetitions() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // TODO: Implement competition service and API call
      // For now, show empty state
      await Future.delayed(const Duration(milliseconds: 500));
      
      setState(() {
        _competitions = [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'خطا در بارگذاری مسابقات';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('مسابقات'),
      ),
      body: RefreshIndicator(
        onRefresh: _loadCompetitions,
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
                          onPressed: _loadCompetitions,
                          child: const Text('تلاش مجدد'),
                        ),
                      ],
                    ),
                  )
                : _competitions.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.emoji_events,
                              size: 64,
                              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'مسابقه‌ای یافت نشد',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'در حال حاضر مسابقه فعالی وجود ندارد',
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
                        itemCount: _competitions.length,
                        itemBuilder: (context, index) {
                          final competition = _competitions[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: ListTile(
                              title: Text(competition['name'] ?? ''),
                              subtitle: Text(competition['description'] ?? ''),
                            ),
                          );
                        },
                      ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // TODO: Create competition dialog
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('این قابلیت به زودی اضافه می‌شود')),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('ایجاد مسابقه'),
      ),
    );
  }
}
