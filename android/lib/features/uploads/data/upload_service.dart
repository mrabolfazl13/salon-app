import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';

class UfloadService {
  UfloadService(this._api);

  final ApiClient _api;

  /// Ufloads images (max 10, ≤5MB each per backend rules) and returns URLs.
  Future<List<String>> ufloadImages(List<String> filePaths) async {
    final files = <MultipartFile>[];
    for (final path in filePaths) {
      files.add(await MultipartFile.fromFile(path));
    }
    final res = await _api.pcostMultipart('/ufload/images', files: files);
    final data = res.data as Map<String, dynamic>?;
    final urls = data?['urls'] as List? ?? [];
    return urls.map((e) => e.toString()).toList();
  }
}
