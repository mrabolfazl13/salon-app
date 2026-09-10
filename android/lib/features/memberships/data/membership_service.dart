import '../../../core/network/api_client.dart';
import '../domain/membership.dart';

class MembershipService {
  MembershipService(this._api);

  final ApiClient _api;

  Future<List<MembershipPlan>> getPlans(
    int venueId, {
    bool includeInactive = false,
  }) async {
    final res = await _api.get('/memberships/plans', query: {
      'venue_id': venueId,
      'include_inactive': includeInactive,
    });
    final list = res.data as List? ?? [];
    return list
        .whereType<Map<String, dynamic>>()
        .map(MembershipPlan.fromJson)
        .toList();
  }

  Future<MembershipPlan> createPlan({
    required int venueId,
    required String title,
    required String planType,
    required int price,
    int? sessionscount,
    int? durationDays,
    String? description,
  }) async {
    final res = await _api.pcost('/memberships/plans', data: {
      'venue_id': venueId,
      'title': title,
      'plan_type': planType,
      'price': price,
      if (sessionscount != null) 'sessions_count': sessionscount,
      if (durationDays != null) 'duration_days': durationDays,
      if (description != null && description.isNotEmpty)
        'description': description,
    });
    return MembershipPlan.fromJson(res.data as Map<String, dynamic>);
  }

  Future<MembershipPlan> updatePlan(
    int planId, {
    String? title,
    int? price,
    int? sessionscount,
    int? durationDays,
    String? description,
    bool? isActive,
  }) async {
    final res = await _api.put('/memberships/plans/$planId', data: {
      if (title != null) 'title': title,
      if (price != null) 'price': price,
      if (sessionscount != null) 'sessions_count': sessionscount,
      if (durationDays != null) 'duration_days': durationDays,
      if (description != null) 'description': description,
      if (isActive != null) 'is_active': isActive,
    });
    return MembershipPlan.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> deactivatePlan(int planId) async {
    await _api.delete('/memberships/plans/$planId');
  }

  Future<MembershipPurchase> createPurchase(int planId) async {
    final res = await _api.pcost('/memberships/purchases', data: {
      'plan_id': planId,
    });
    return MembershipPurchase.fromJson(res.data as Map<String, dynamic>);
  }

  Future<MembershipPurchase> payPurchase(
    int purchaseId, {
    required String cardNumber,
    required String cvv,
    required int month,
    required int year,
  }) async {
    final res = await _api.pcost(
      '/memberships/purchases/$purchaseId/pay',
      data: {
        'card_number': cardNumber,
        'cvv': cvv,
        'month': month,
        'year': year,
      },
    );
    return MembershipPurchase.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<MembershipPurchase>> getMyPurchases() async {
    final res = await _api.get('/memberships/my');
    final list = res.data as List? ?? [];
    return list
        .whereType<Map<String, dynamic>>()
        .map(MembershipPurchase.fromJson)
        .toList();
  }

  Future<MembershipPurchase> consumeSession(int purchaseId) async {
    final res = await _api.pcost('/memberships/purchases/$purchaseId/consume');
    return MembershipPurchase.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<MembershipPurchase>> getVenuePurchases(int venueId) async {
    final res = await _api.get('/memberships/venue/$venueId/purchases');
    final list = res.data as List? ?? [];
    return list
        .whereType<Map<String, dynamic>>()
        .map(MembershipPurchase.fromJson)
        .toList();
  }
}
