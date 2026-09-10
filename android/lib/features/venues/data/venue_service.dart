import '../../../core/network/api_client.dart';
import '../domain/venue.dart';

class VenueService {
  VenueService(this._api);

  final ApiClient _api;

  Future<List<Venue>> getAll({
    String? category,
    String? search,
    int? limit,
    double? latitude,
    double? longitude,
    double? radius,
    bool? isVerified,
  }) async {
    final query = <String, dynamic>{
      if (category != null) 'category': category,
      if (search != null && search.isNotEmpty) 'search': search,
      if (limit != null) 'limit': limit,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (radius != null) 'radius': radius,
      if (isVerified != null) 'is_verified': isVerified,
    };
    final res = await _api.get('/venues/', query: query);
    final list = res.data as List? ?? [];
    return list
        .whereType<Map<String, dynamic>>()
        .map(Venue.fromJson)
        .toList();
  }

  Future<Venue> getById(int id) async {
    final res = await _api.get('/venues/$id');
    return Venue.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<Venue>> getMyVenues() async {
    final res = await _api.get('/venues/my-venues');
    final list = res.data as List? ?? [];
    return list
        .whereType<Map<String, dynamic>>()
        .map(Venue.fromJson)
        .toList();
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
    final res = await _api.pcost('/venues/', data: {
      'name': name,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'phone': phone,
      if (description != null && description.isNotEmpty)
        'description': description,
      'amenities': amenities,
      'images': images,
    });
    return Venue.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Venue> update(
    int id, {
    String? name,
    String? address,
    String? phone,
    String? description,
    List<String>? amenities,
    List<String>? images,
  }) async {
    final res = await _api.put('/venues/$id', data: {
      if (name != null) 'name': name,
      if (address != null) 'address': address,
      if (phone != null) 'phone': phone,
      if (description != null) 'description': description,
      if (amenities != null) 'amenities': amenities,
      if (images != null) 'images': images,
    });
    return Venue.fromJson(res.data as Map<String, dynamic>);
  }
}
