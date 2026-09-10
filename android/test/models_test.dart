import 'package:flutter_test/flutter_test.dart';

import 'package:salon_app/features/bookings/domain/booking.dart';
import 'package:salon_app/features/games/domain/game.dart';
import 'package:salon_app/features/memberships/domain/membership.dart';
import 'package:salon_app/features/venues/domain/venue.dart';

void main() {
  group('Venue', () {
    test('parses snake_case JSON and string-encoded lists', () {
      final venue = Venue.fromJson({
        'id': 3,
        'name': 'سالن انقلاب',
        'category': 'futsal',
        'address': 'قوم',
        'latitude': 34.6,
        'longitude': 50.8,
        'phone': '0251234567',
        'price': 380000,
        'is_verified': true,
        'manager_id': 5,
        'amenities': '["پارکینگ","کافه"]',
        'images': '["a.jpg","b.jpg"]',
        'average_rating': 4.5,
        'total_reviews': 12,
      });
      expect(venue.id, 3);
      expect(venue.amenities, ['پارکینگ', 'کافه']);
      expect(venue.images, ['a.jpg', 'b.jpg']);
      expect(venue.isVerified, isTrue);
      expect(venue.averageRating, 4.5);
    });
  });

  group('Booking', () {
    test('parses pending booking shape', () {
      final booking = Booking.fromJson({
        'id': '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        'slot_id': 10,
        'user_id': 2,
        'status': 'pending',
        'payment_amount': 380000,
        'venue_name': 'سالن انقلاب',
        'slot_date': '2026-09-10',
        'start_time': '18:00:00',
        'duration': 90,
      }).withPendingFlag();
      expect(booking.isPendingRedis, isTrue);
      expect(booking.venueName, 'سالن انقلاب');
      expect(booking.paymentAmount, 380000);
    });
  });

  group('Game', () {
    test('parses enums and computed fields', () {
      final game = Game.fromJson({
        'id': 1,
        'booking_id': 4,
        'organizer_id': 2,
        'name': 'فوتسال پنجشنبه',
        'sport': 'futsal',
        'visibility': 'public',
        'join_policy': 'direct',
        'max_players': 10,
        'skill_level': 'intermediate',
        'payment_mode': 'split_payment',
        'status': 'open',
        'current_players': 3,
        'price_per_player': 45000,
      });
      expect(game.visibility, GameVisibility.public);
      expect(game.skillLevel, SkillLevel.intermediate);
      expect(game.paymentMode, PaymentMode.splitPayment);
      expect(game.remaining, 7);
      expect(game.isFreeOrUnknown, isFalse);
      expect(gameStatusLabel('open'), 'باز');
    });
  });

  group('MembershipPlan', () {
    test('parses plan types', () {
      final plan = MembershipPlan.fromJson({
        'id': 1,
        'venue_id': 3,
        'title': 'اشتراک ماهانه',
        'plan_type': 'monthly',
        'price': 900000,
        'duration_days': 30,
      });
      expect(plan.typeLabelFa, 'ماهانه');
      expect(plan.durationDays, 30);
    });
  });
}
