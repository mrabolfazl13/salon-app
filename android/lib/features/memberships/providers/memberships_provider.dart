import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../data/membership_service.dart';

final membershipsServiceProvider = Provider<MembershipService>((ref) {
  return MembershipService(ref.read(apiClientProvider));
});
