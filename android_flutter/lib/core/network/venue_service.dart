import 'api_client.dart';
import 'api_endpoints.dart';

/// تصاویر سالن: filename → {origin}/static/venues/{filename}
/// (همان منطق web/src/utils/venueMedia.ts)
class VenueMedia {
  static final RegExp _originRe = RegExp(r'^(https?://[^/]+)');

  static String origin() {
    final base = ApiClient.instance.options.baseUrl;
    return _originRe.firstMatch(base)?.group(1) ?? '';
  }

  /// بک‌اند ممکن است images را string یا array بفرستد
  static List<String> parseList(dynamic v) {
    if (v is List) return v.whereType<String>().toList();
    if (v is String && v.isNotEmpty) {
      try {
        final parsed = v.replaceAll("'", '"');
        if (parsed.startsWith('[')) {
          final list = parsed.substring(1, parsed.length - 1);
          return list
              .split(',')
              .map((e) => e.trim().replaceAll('"', '').replaceAll("'", ''))
              .where((e) => e.isNotEmpty)
              .toList();
        }
      } catch (_) {}
    }
    return const [];
  }

  static String fullUrl(String filename) {
    if (filename.isEmpty) return '';
    if (filename.startsWith(RegExp('https?://', caseSensitive: false))) {
      return filename;
    }
    return '${origin()}/static/venues/${filename.replaceAll(RegExp(r'^/+'), '')}';
  }

  /// اولین تصویر یا خالی
  static String firstUrl(dynamic images) {
    final list = parseList(images);
    return list.isEmpty ? '' : fullUrl(list.first);
  }
}

class VenueService {
  static final _client = ApiClient.instance;

  /// GET /venues/ — پارامترهای واقعی بک‌اند: search/category/limit/offset
  static Future<List<dynamic>> getVenues({
    String? search,
    String? category,
    int limit = 50,
    int offset = 0,
  }) async {
    try {
      final resp = await _client.get(
        ApiEndpoints.venues,
        queryParameters: {
          if (search != null && search.isNotEmpty) 'search': search,
          if (category != null && category.isNotEmpty) 'category': category,
          'limit': limit,
          'offset': offset,
        },
      );
      final data = resp.data;
      return data is List ? data : const [];
    } catch (e) {
      throw Exception('خطا در دریافت لیست سالن‌ها: ${e.toString()}');
    }
  }

  /// GET /venues/{id}
  static Future<Map<String, dynamic>> getVenue(String id) async {
    try {
      final response = await _client.get(ApiEndpoints.venue(id));
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('خطا در دریافت اطلاعات سالن: ${e.toString()}');
    }
  }

  /// GET /slots/venue/{id}?slot_date=YYYY-MM-DD
  static Future<List<dynamic>> getVenueSlots(
    String id, {
    required String slotDate,
  }) async {
    try {
      final response = await _client.get(
        ApiEndpoints.venueSlots(id),
        queryParameters: {'slot_date': slotDate},
      );
      return response.data is List ? response.data : const [];
    } catch (e) {
      throw Exception('خطا در دریافت زمان‌های خالی: ${e.toString()}');
    }
  }

  /// GET /slots/venue/{id}/range?start_date=&end_date=
  static Future<List<dynamic>> getVenueSlotsRange(
    String id, {
    required String startDate,
    required String endDate,
  }) async {
    try {
      final response = await _client.get(
        ApiEndpoints.venueSlotsRange(id),
        queryParameters: {'start_date': startDate, 'end_date': endDate},
      );
      return response.data is List ? response.data : const [];
    } catch (e) {
      throw Exception('خطا در دریافت تقویم اسلات‌ها: ${e.toString()}');
    }
  }

  /// GET /memberships/plans?venue_id=
  static Future<List<dynamic>> getMembershipPlans(String venueId) async {
    try {
      final response = await _client.get(
        ApiEndpoints.membershipPlans,
        queryParameters: {'venue_id': venueId},
      );
      return response.data is List ? response.data : const [];
    } catch (e) {
      throw Exception('خطا در دریافت پلن‌های عضویت: ${e.toString()}');
    }
  }

  /// GET /favorites — لیست سالن‌های نشان‌شده
  static Future<List<dynamic>> getFavorites() async {
    try {
      final response = await _client.get(ApiEndpoints.favorites);
      return response.data is List ? response.data : const [];
    } catch (e) {
      throw Exception('خطا در دریافت علاقه‌مندی‌ها: ${e.toString()}');
    }
  }

  /// آیا این سالن در علاقه‌مندی‌هاست؟
  static Future<bool> isFavorite(String venueId) async {
    final favorites = await getFavorites();
    return favorites.any((v) {
      final id = v is Map ? v['id'] : null;
      return id?.toString() == venueId;
    });
  }

  /// POST /favorites/{venue_id}
  static Future<void> addToFavorites(String venueId) async {
    try {
      await _client.post(ApiEndpoints.favoriteVenue(venueId));
    } catch (e) {
      throw Exception('خطا در افزودن به علاقه‌مندی‌ها: ${e.toString()}');
    }
  }

  /// DELETE /favorites/{venue_id}
  static Future<void> removeFromFavorites(String venueId) async {
    try {
      await _client.delete(ApiEndpoints.favoriteVenue(venueId));
    } catch (e) {
      throw Exception('خطا در حذف از علاقه‌مندی‌ها: ${e.toString()}');
    }
  }
}
