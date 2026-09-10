import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/key_value_store.dart';

/// Client-side favorites (no backend endpoint in the original either).
class FavoriteVenue {
  const FavoriteVenue({required this.id, required this.name, required this.savedAt});

  final int id;
  final String name;
  final int savedAt;

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'savedAt': savedAt};

  factory FavoriteVenue.fromJson(Map<String, dynamic> json) => FavoriteVenue(
        id: (json['id'] as num).toInt(),
        name: (json['name'] ?? '') as String,
        savedAt: (json['savedAt'] as num?)?.toInt() ?? 0,
      );
}

class FavoritesController extends Notifier<List<FavoriteVenue>> {
  static const _key = 'futsal-favorites';

  KeyValueStore get _store => ref.read(keyValueStoreProvider);

  @override
  List<FavoriteVenue> build() {
    final raw = _store.getString(_key);
    if (raw == null || raw.isEmpty) return const [];
    try {
      final list = (jsonDecode(raw) as List? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(FavoriteVenue.fromJson)
          .toList();
      return list;
    } catch (_) {
      return const [];
    }
  }

  Future<void> _persist() async {
    await _store.setString(
      _key,
      jsonEncode(state.map((f) => f.toJson()).toList()),
    );
  }

  bool isFavorite(int id) => state.any((f) => f.id == id);

  /// Toggles and returns true when the venue was added.
  bool toggle(int id, String name) {
    final exists = state.any((f) => f.id == id);
    if (exists) {
      state = state.where((f) => f.id != id).toList();
    } else {
      state = [
        FavoriteVenue(id: id, name: name, savedAt: DateTime.now().millisecondsSinceEpoch),
        ...state,
      ];
    }
    _persist();
    return !exists;
  }

  Future<void> clear() async {
    state = const [];
    await _persist();
  }
}

final favoritesProvider =
    NotifierProvider<FavoritesController, List<FavoriteVenue>>(
  FavoritesController.new,
);

/// Recent searches — max 8 entries.
class SearchHistoryController extends Notifier<List<String>> {
  static const _key = 'futsal-search-history';
  static const _max = 8;

  KeyValueStore get _store => ref.read(keyValueStoreProvider);

  @override
  List<String> build() {
    return _store.getStringList(_key) ?? const [];
  }

  Future<void> _persist() => _store.setStringList(_key, state);

  Future<void> add(String query) async {
    final q = query.trim();
    if (q.isEmpty) return;
    state = [q, ...state.where((x) => x != q)].take(_max).toList();
    await _persist();
  }

  Future<void> remove(String query) async {
    state = state.where((x) => x != query).toList();
    await _persist();
  }

  Future<void> clear() async {
    state = const [];
    await _persist();
  }
}

final searchHistoryProvider =
    NotifierProvider<SearchHistoryController, List<String>>(
  SearchHistoryController.new,
);

/// Recently viewed venues — max 12 entries.
class ViewedVenue {
  const ViewedVenue({required this.id, required this.name, required this.viewedAt});

  final int id;
  final String name;
  final int viewedAt;

  Map<String, dynamic> toJson() =>
      {'id': id, 'name': name, 'viewedAt': viewedAt};

  factory ViewedVenue.fromJson(Map<String, dynamic> json) => ViewedVenue(
        id: (json['id'] as num).toInt(),
        name: (json['name'] ?? '') as String,
        viewedAt: (json['viewedAt'] as num?)?.toInt() ?? 0,
      );
}

class RecentlyViewedController extends Notifier<List<ViewedVenue>> {
  static const _key = 'futsal-recently-viewed';
  static const _max = 12;

  KeyValueStore get _store => ref.read(keyValueStoreProvider);

  @override
  List<ViewedVenue> build() {
    final raw = _store.getString(_key);
    if (raw == null || raw.isEmpty) return const [];
    try {
      return (jsonDecode(raw) as List? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(ViewedVenue.fromJson)
          .toList();
    } catch (_) {
      return const [];
    }
  }

  Future<void> _persist() async {
    await _store.setString(
      _key,
      jsonEncode(state.map((v) => v.toJson()).toList()),
    );
  }

  void track(int id, String name) {
    state = [
      ViewedVenue(id: id, name: name, viewedAt: DateTime.now().millisecondsSinceEpoch),
      ...state.where((v) => v.id != id),
    ].take(_max).toList();
    _persist();
  }

  Future<void> clear() async {
    state = const [];
    await _persist();
  }
}

final recentlyViewedProvider =
    NotifierProvider<RecentlyViewedController, List<ViewedVenue>>(
  RecentlyViewedController.new,
);
