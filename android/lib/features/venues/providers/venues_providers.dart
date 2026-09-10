import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../auth/providers/auth_provider.dart';
import '../../bookings/domain/booking.dart';
import '../../contracts/domain/contract.dart' show Review, VenueRatingSummary;
import '../../reviews/data/review_service.dart';
import '../../slots/domain/slot.dart';
import '../domain/venue.dart';

final venuesServiceProvider = Provider<VenuesService>((ref) {
  return VenuesService(ref.read(apiClientProvider));
});

class VenuesService {
  VenuesService(this._api);

  final ApiClient _api;

  Future<List<Venue>> getAll({
    String? category,
    String? search,
    int? limit,
    double? latitude,
    double? longitude,
    double? radius,
  }) async {
    try {
      final res = await _api.get('/venues/', query: {
        if (category != null && category.isNotEmpty) 'category': category,
        if (search != null && search.isNotEmpty) 'search': search,
        if (limit != null) 'limit': limit,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        if (radius != null) 'radius': radius,
      });
      final list = res.data as List? ?? [];
      return list
          .whereType<Map<String, dynamic>>()
          .map(Venue.fromJson)
          .toList();
    } catch (e) {
      throw ApiException.map(e);
    }
  }

  Future<Venue> getById(int id) async {
    try {
      final res = await _api.get('/venues/$id');
      return Venue.fromJson(res.data as Map<String, dynamic>);
    } catch (e) {
      throw ApiException.map(e);
    }
  }

  Future<List<Venue>> getMyVenues() async {
    try {
      final res = await _api.get('/venues/my-venues');
      final list = res.data as List? ?? [];
      return list
          .whereType<Map<String, dynamic>>()
          .map(Venue.fromJson)
          .toList();
    } catch (e) {
      throw ApiException.map(e);
    }
  }

  Future<Venue> create({
    required String name,
    required String address,
    required double latitude,
    required double longitude,
    required String phone,
    String? description,
    List<String> amenities = const [],
    List<String> images = const [],
  }) async {
    try {
      final res = await _api.pcost('/venues/', data: {
        'name': name,
        'address': address,
        'latitude': latitude,
        'longitude': longitude,
        'phone': phone,
        if (description != null && description.trim().isNotEmpty)
          'description': description.trim(),
        'amenities': amenities,
        'images': images,
      });
      return Venue.fromJson(res.data as Map<String, dynamic>);
    } catch (e) {
      throw ApiException.map(e);
    }
  }
}

/// Slot fetching + generation for a venue.
class VenueSlotsService {
  VenueSlotsService(this._api);

  final ApiClient _api;

  Future<List<Slot>> getByVenueAndDate(int venueId, String date) async {
    try {
      final res = await _api.get(
        '/slots/venue/$venueId',
        query: {'slot_date': date},
      );
      final list = res.data as List? ?? [];
      return list
          .whereType<Map<String, dynamic>>()
          .map(Slot.fromJson)
          .toList();
    } catch (e) {
      throw ApiException.map(e);
    }
  }

  Future<List<Slot>> getRange(int venueId, String start, String end) async {
    try {
      final res = await _api.get(
        '/slots/venue/$venueId/range',
        query: {'start_date': start, 'end_date': end},
      );
      final list = res.data as List? ?? [];
      return list
          .whereType<Map<String, dynamic>>()
          .map(Slot.fromJson)
          .toList();
    } catch (e) {
      throw ApiException.map(e);
    }
  }

  Future<void> generateForDate(int venueId, String date) async {
    try {
      await _api.pcost(
        '/slots/venue/$venueId/generate',
        query: {'slot_date': date},
      );
    } catch (e) {
      throw ApiException.map(e);
    }
  }
}

final venueSlotsServiceProvider = Provider<VenueSlotsService>((ref) {
  return VenueSlotsService(ref.read(apiClientProvider));
});

/// Booking creation from the venue detail page.
class BookingCreator {
  BookingCreator(this._api);

  final ApiClient _api;

  Future<Booking> create({required int slotId}) async {
    try {
      final res = await _api.pcost('/bookings/', data: {'slot_id': slotId});
      return Booking.fromJson(res.data as Map<String, dynamic>)
          .withPendingFlag();
    } catch (e) {
      throw ApiException.map(e);
    }
  }
}

final bookingCreatorProvider = Provider<BookingCreator>((ref) {
  return BookingCreator(ref.read(apiClientProvider));
});

final reviewServiceProvider = Provider<ReviewService>((ref) {
  return ReviewService(ref.read(apiClientProvider));
});

class VenueReviewsState {
  const VenueReviewsState({
    this.reviews = const [],
    this.summary,
    this.loading = true,
    this.error,
    this.myReview,
  });

  final List<Review> reviews;
  final VenueRatingSummary? summary;
  final bool loading;
  final String? error;
  final Review? myReview;

  VenueReviewsState copyWith({
    List<Review>? reviews,
    VenueRatingSummary? summary,
    bool? loading,
    String? error,
    Review? myReview,
  }) =>
      VenueReviewsState(
        reviews: reviews ?? this.reviews,
        summary: summary,
        loading: loading ?? this.loading,
        error: error,
        myReview: myReview,
      );
}

/// Reviews controller per venue (family).
class VenueReviewsController
    extends FamilyNotifier<VenueReviewsState, int> {
  @override
  VenueReviewsState build(int arg) {
    Future<void>.microtask(fetch);
    return const VenueReviewsState();
  }

  Future<void> fetch() async {
    state = state.copyWith(loading: true);
    try {
      final service = ref.read(reviewServiceProvider);
      final reviews = await service.getByVenue(arg);
      final me = ref.read(currentUserProvider);
      state = state.copyWith(
        reviews: reviews,
        loading: false,
        error: null,
        myReview: me == null
            ? null
            : reviews.where((r) => r.userId == me.id).firstOrNull,
      );
    } on ApiException catch (e) {
      state = state.copyWith(loading: false, error: e.message);
    } catch (_) {
      state = state.copyWith(loading: false, error: 'خطا در دریافت نظرات');
    }
  }

  Future<bool> submit({required int rating, String? comment}) async {
    try {
      final service = ref.read(reviewServiceProvider);
      final existing = state.myReview;
      if (existing != null) {
        await service.update(
          existing.id,
          venueId: arg,
          rating: rating,
          comment: comment,
        );
      } else {
        await service.create(
          venueId: arg,
          rating: rating,
          comment: comment,
        );
      }
      await _refreshSummary();
      return true;
    } on ApiException catch (e) {
      state = state.copyWith(error: e.message);
      return false;
    } catch (_) {
      state = state.copyWith(error: 'خطا در ثبت نظر');
      return false;
    }
  }

  Future<bool> deleteMine() async {
    final existing = state.myReview;
    if (existing == null) return false;
    try {
      await ref.read(reviewServiceProvider).delete(existing.id);
      await _refreshSummary();
      return true;
    } on ApiException catch (e) {
      state = state.copyWith(error: e.message);
      return false;
    } catch (_) {
      state = state.copyWith(error: 'خطا در حذف نظر');
      return false;
    }
  }

  Future<void> _refreshSummary() async {
    try {
      final service = ref.read(reviewServiceProvider);
      final summary = await service.getVenueSummary(arg);
      final reviews = await service.getByVenue(arg);
      final me = ref.read(currentUserProvider);
      state = state.copyWith(
        summary: summary,
        reviews: reviews,
        myReview: me == null
            ? null
            : reviews.where((r) => r.userId == me.id).firstOrNull,
        error: null,
      );
    } catch (_) {
      // summary is best-effort
    }
  }
}

final venueReviewsProvider =
    NotifierProvider.family<VenueReviewsController, VenueReviewsState, int>(
  VenueReviewsController.new,
);
