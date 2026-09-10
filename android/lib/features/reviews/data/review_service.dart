import '../../../core/network/api_client.dart';
import '../../contracts/domain/contract.dart';

class ReviewService {
  ReviewService(this._api);

  final ApiClient _api;

  Future<List<Review>> getByVenue(int venueId, {int limit = 50}) async {
    final res = await _api.get(
      '/reviews/venue/$venueId',
      query: {'limit': limit, 'offset': 0},
    );
    final list = res.data as List? ?? [];
    return list
        .whereType<Map<String, dynamic>>()
        .map(Review.fromJson)
        .toList();
  }

  Future<VenueRatingSummary> getVenueSummary(int venueId) async {
    final res = await _api.get('/reviews/venue/$venueId/summary');
    return VenueRatingSummary.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<Review>> getMyReviews({int limit = 50}) async {
    final res = await _api.get('/reviews/my', query: {'limit': limit});
    final list = res.data as List? ?? [];
    return list
        .whereType<Map<String, dynamic>>()
        .map(Review.fromJson)
        .toList();
  }

  Future<Review> create({
    required int venueId,
    required int rating,
    String? comment,
  }) async {
    final res = await _api.pcost('/reviews/', data: {
      'venue_id': venueId,
      'rating': rating,
      'comment': (comment?.trim().isEmpty ?? true) ? null : comment!.trim(),
    });
    return Review.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Review> update(
    int reviewId, {
    required int venueId,
    required int rating,
    String? comment,
  }) async {
    final res = await _api.put('/reviews/$reviewId', data: {
      'venue_id': venueId,
      'rating': rating,
      'comment': (comment?.trim().isEmpty ?? true) ? null : comment!.trim(),
    });
    return Review.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> delete(int reviewId) async {
    await _api.delete('/reviews/$reviewId');
  }
}
