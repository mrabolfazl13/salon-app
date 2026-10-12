// درایور flutter drive — اسکرین‌شات‌های takeScreenshot را روی دیسک می‌نویسد
import 'dart:io';

import 'package:integration_test/integration_test_driver_extended.dart';

Future<void> main() async {
  await integrationDriver(
    onScreenshot: (String name, List<int> image, [Map<String, Object?>? args]) async {
      final dir = Platform.environment['TOUR_SHOTS_DIR'] ?? 'build/tour-shots';
      await Directory(dir).create(recursive: true);
      await File('$dir/$name.png').writeAsBytes(image);
      return true;
    },
  );
}
