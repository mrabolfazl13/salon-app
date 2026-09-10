import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../data/admin_service.dart';

final adminServiceProvider = Provider<AdminService>((ref) {
  return AdminService(ref.read(apiClientProvider));
});
