import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../data/game_service.dart';

final gamesServiceProvider = Provider<GameService>((ref) {
  return GameService(ref.read(apiClientProvider));
});
