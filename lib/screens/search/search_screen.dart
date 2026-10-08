import 'package:flutter/material.dart';
import '../../core/services/venue_service.dart';
import '../venues/venue_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final VenueService _venueService = VenueService();
  final TextEditingController _searchController = TextEditingController();
  
  List<Map<String, dynamic>> _results = [];
  List<String> _recentSearches = [];
  bool _isLoading = false;
  String? _error;
  String? _selectedSport;

  final List<String> _popularSearches = [
    'فوتسال',
    'والیبال',
    'بسکتبال',
    'چمن مصنوعی',
    'سرپوشیده',
  ];

  final Map<String, String> _sportQueries = {
    'فوتسال': 'futsal',
    'والیبال': 'volleyball',
    'بسکتبال': 'basketball',
  };

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _performSearch(String query) async {
    if (query.trim().isEmpty) {
      setState(() {
        _results = [];
        _error = null;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Add to recent searches
      if (!_recentSearches.contains(query)) {
        setState(() {
          _recentSearches.insert(0, query);
          if (_recentSearches.length > 10) {
            _recentSearches.removeLast();
          }
        });
      }

      final venues = await _venueService.searchVenues(query);
      
      setState(() {
        _results = venues;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'خطا در جستجو';
        _isLoading = false;
      });
    }
  }

  String _formatPrice(num price) {
    return '${price.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} ریال';
  }

  @override
  Widget build(BuildContext context) {
    final isSearching = _searchController.text.trim().isNotEmpty;

    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          decoration: InputDecoration(
            hintText: 'جستجوی سالن...',
            border: InputBorder.none,
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      _searchController.clear();
                      _performSearch('');
                    },
                  )
                : null,
          ),
          onChanged: (value) {
            setState(() {});
            // Debounce search
            Future.delayed(const Duration(milliseconds: 350), () {
              if (_searchController.text == value) {
                _performSearch(value);
              }
            });
          },
        ),
      ),
      body: _isLoading
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
                        onPressed: () => _performSearch(_searchController.text),
                        child: const Text('تلاش مجدد'),
                      ),
                    ],
                  ),
                )
              : !isSearching
                  ? SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Recent Searches
                          if (_recentSearches.isNotEmpty) ...[
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'جستجوهای اخیر',
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                ),
                                TextButton(
                                  onPressed: () {
                                    setState(() {
                                      _recentSearches.clear();
                                    });
                                  },
                                  child: const Text('پاک کردن'),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: _recentSearches.map((query) {
                                return InkWell(
                                  onTap: () {
                                    _searchController.text = query;
                                    _performSearch(query);
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(query),
                                  ),
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 24),
                          ],

                          // Popular Searches
                          Text(
                            'جستجوهای محبوب',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _popularSearches.map((query) {
                              return InkWell(
                                onTap: () {
                                  _searchController.text = query;
                                  _performSearch(query);
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(query),
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 24),

                          // Sport Categories
                          Text(
                            'دسته‌بندی ورزشی',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _sportQueries.entries.map((entry) {
                              return InkWell(
                                onTap: () {
                                  _searchController.text = entry.key;
                                  _selectedSport = entry.value;
                                  _performSearch(entry.key);
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 10,
                                  ),
                                  decoration: BoxDecoration(
                                    color: _selectedSport == entry.value
                                        ? Theme.of(context).colorScheme.primary
                                        : Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    entry.key,
                                    style: TextStyle(
                                      color: _selectedSport == entry.value
                                          ? Colors.white
                                          : Theme.of(context).colorScheme.primary,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    )
                  : _results.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.search_off,
                                size: 64,
                                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'نتیجه‌ای یافت نشد',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'عبارت دیگری را جستجو کنید',
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _results.length,
                          itemBuilder: (context, index) {
                            final venue = _results[index];
                            final venueId = venue['id'] as int;
                            final name = venue['name'] ?? 'نامشخص';
                            final address = venue['address'] ?? '';
                            final price = (venue['price'] ?? venue['base_price'] ?? 0) as num;
                            final isVerified = venue['is_verified'] ?? venue['verified'] ?? false;

                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: InkWell(
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => VenueDetailScreen(venue: venue),
                                    ),
                                  );
                                },
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Header
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              name,
                                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                            ),
                                          ),
                                          if (isVerified)
                                            Icon(
                                              Icons.verified,
                                              size: 18,
                                              color: Colors.green[700],
                                            ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),

                                      // Address
                                      if (address.isNotEmpty)
                                        Row(
                                          children: [
                                            Icon(
                                              Icons.location_on_outlined,
                                              size: 16,
                                              color: Colors.grey[600],
                                            ),
                                            const SizedBox(width: 4),
                                            Expanded(
                                              child: Text(
                                                address,
                                                style: TextStyle(color: Colors.grey[600]),
                                              ),
                                            ),
                                          ],
                                        ),
                                      const SizedBox(height: 12),

                                      // Price
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            'قیمت هر سانس',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey[600],
                                            ),
                                          ),
                                          Text(
                                            _formatPrice(price),
                                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                                  fontWeight: FontWeight.bold,
                                                  color: Theme.of(context).colorScheme.primary,
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
    );
  }
}
