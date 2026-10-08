import '../services/api_service.dart';

class VenueService {
  static final VenueService _instance = VenueService._internal();
  factory VenueService() => _instance;

  final ApiService _api = ApiService();

  VenueService._internal();

  /// Get all venues with filters
  Future<List<Map<String, dynamic>>> getVenues({
    String? sport,
    double? lat,
    double? lng,
    int limit = 50,
    int offset = 0,
  }) async {
    try {
      final response = await _api.get('/venues/', queryParameters: {
        if (sport != null) 'sport': sport,
        if (lat != null) 'lat': lat,
        if (lng != null) 'lng': lng,
        'limit': limit,
        'offset': offset,
      });

      return List<Map<String, dynamic>>.from(response.data['items'] ?? []);
    } catch (e) {
      print('Error fetching venues: $e');
      return [];
    }
  }

  /// Get venue by ID
  Future<Map<String, dynamic>?> getVenueById(int id) async {
    try {
      final response = await _api.get('/venues/$id');
      return response.data;
    } catch (e) {
      print('Error fetching venue: $e');
      return null;
    }
  }

  /// Get venue slots for a date
  Future<List<Map<String, dynamic>>> getVenueSlots(int venueId, String date) async {
    try {
      final response = await _api.get('/venues/$venueId/slots', queryParameters: {
        'date': date,
      });

      return List<Map<String, dynamic>>.from(response.data ?? []);
    } catch (e) {
      print('Error fetching slots: $e');
      return [];
    }
  }

  /// Search venues
  Future<List<Map<String, dynamic>>> searchVenues(String query) async {
    try {
      final response = await _api.get('/venues/search', queryParameters: {
        'q': query,
      });

      return List<Map<String, dynamic>>.from(response.data ?? []);
    } catch (e) {
      print('Error searching venues: $e');
      return [];
    }
  }

  /// Get venue reviews
  Future<List<Map<String, dynamic>>> getVenueReviews(int venueId, {int limit = 20}) async {
    try {
      final response = await _api.get('/venues/$venueId/reviews', queryParameters: {
        'limit': limit,
      });

      return List<Map<String, dynamic>>.from(response.data ?? []);
    } catch (e) {
      print('Error fetching reviews: $e');
      return [];
    }
  }
}
