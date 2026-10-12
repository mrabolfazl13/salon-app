#!/bin/bash
set -e

cd android_flutter

echo "=== Running flutter pub get ==="
flutter pub get

echo "=== Running booking flow test ==="
flutter test integration_test/booking_flow_test.dart
BOOKING_EXIT=$?
echo "booking test exit: $BOOKING_EXIT"

echo "=== Running screens tour ==="
TOUR_SHOTS_DIR="$GITHUB_WORKSPACE/tour-shots" flutter drive \
  --driver=test_driver/integration_test.dart \
  --target=integration_test/screens_tour_test.dart
TOUR_EXIT=$?
echo "tour exit: $TOUR_EXIT"

echo "=== Capturing logcat ==="
adb logcat -d -t 4000 > "$GITHUB_WORKSPACE/logcat.txt" 2>&1 || true

if [ "$BOOKING_EXIT" != "0" ] || [ "$TOUR_EXIT" != "0" ]; then
  echo "::error::Tests failed (booking=$BOOKING_EXIT, tour=$TOUR_EXIT)"
  exit 1
fi

echo "All tests passed!"
