import 'package:flutter/material.dart';
import '../../core/services/venue_service.dart';
import 'venue_detail_screen.dart';

class VenuesScreen extends StatefulWidget {
  const VenuesScreen({super.key});

  @override
  State<VenuesScreen> createState() => _VenuesScreenState();
}

class _VenuesScreenState extends State<VenuesScreen> {
  final VenueService _venueService = VenueService();
  List<Map<String, dynamic>> _venues = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadVenues();
  }

  Future<void> _loadVenues() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final venues = await _venueService.getVenues(sport: 'futsal');
      setState(() {
        _venues = venues;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'خطا در بارگذاری سالن‌ها';
        _isLoading = false;
      });
    }
  }

  String _formatPrice(dynamic price) {
    if (price is int) {
      return '${price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} ریال';
    }
    return '$price ریال';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('سالن‌های فوتسال'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadVenues,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 64, color: Colors.red[400]),
                      const SizedBox(height: 16),
                      Text(_error!, style: const TextStyle(fontSize: 16)),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _loadVenues, child: const Text('تلاش مجدد')),
                    ],
                  ),
                )
              : _venues.isEmpty
                  ? const Center(child: Text('هیچ سالنی یافت نشد'))
                  : RefreshIndicator(
                      onRefresh: _loadVenues,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _venues.length,
                        itemBuilder: (context, index) {
                          final venue = _venues[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 16),
                            elevation: 2,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            child: InkWell(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => VenueDetailScreen(venueId: venue['id']),
                                  ),
                                );
                              },
                              borderRadius: BorderRadius.circular(12),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            venue['name'] ?? 'نامشخص',
                                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                        if (venue['is_verified'] == true)
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: Colors.green[50],
                                              borderRadius: BorderRadius.circular(12),
                                              border: Border.all(color: Colors.green[300]!),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(Icons.verified, size: 14, color: Colors.green[700]),
                                                const SizedBox(width: 4),
                                                Text('تأییدشده', style: TextStyle(fontSize: 12, color: Colors.green[700])),
                                              ],
                                            ),
                                          ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        Icon(Icons.location_on_outlined, size: 16, color: Colors.grey[600]),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            venue['address'] ?? 'آدرس موجود نیست',
                                            style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    if (venue['amenities'] != null && (venue['amenities'] as List).isNotEmpty)
                                      Wrap(
                                        spacing: 8,
                                        runSpacing: 8,
                                        children: (venue['amenities'] as List)
                                            .take(3)
                                            .map((amenity) => Chip(
                                                  label: Text(amenity.toString(), style: const TextStyle(fontSize: 12)),
                                                  padding: EdgeInsets.zero,
                                                  visualDensity: VisualDensity.compact,
                                                ))
                                            .toList(),
                                      ),
                                    const SizedBox(height: 12),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text('قیمت هر سانس', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                                            Text(
                                              _formatPrice(venue['base_price'] ?? venue['price'] ?? 0),
                                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.blue),
                                            ),
                                          ],
                                        ),
                                        ElevatedButton(
                                          onPressed: () {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (_) => VenueDetailScreen(venueId: venue['id']),
                                              ),
                                            );
                                          },
                                          child: const Text('مشاهده'),
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
    );
  }
}
