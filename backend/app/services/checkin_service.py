"""QR Check-in service for booking attendance tracking."""
import hashlib
import secrets
from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select
from app.models.booking import Booking, BookingStatus
from app.models.user import User, UserRole
from app.services.loyalty_service import LoyaltyService
from app.services.notification_service import NotificationService


class CheckInService:
    """Generate QR codes and verify check-ins for bookings."""
    
    @staticmethod
    def generate_check_in_code(booking_id: int) -> str:
        """Generate a unique check-in code for a booking.
        
        Format: first 8 chars of SHA256(booking_id + secret + timestamp)
        This is deterministic per booking but unpredictable.
        """
        # Use a simple hash-based approach (no external dependencies)
        raw = f"checkin:{booking_id}:{secrets.token_hex(8)}"
        return hashlib.sha256(raw.encode()).hexdigest()[:12].upper()
    
    @staticmethod
    def ensure_check_in_code(session: Session, booking_id: int) -> str:
        """Ensure booking has a check-in code, generate if missing."""
        booking = session.get(Booking, booking_id)
        if not booking:
            raise ValueError(f"Booking {booking_id} not found")
        
        if not booking.check_in_code:
            booking.check_in_code = CheckInService.generate_check_in_code(booking_id)
            session.add(booking)
            session.commit()
            session.refresh(booking)
        
        return booking.check_in_code
    
    @staticmethod
    async def verify_and_check_in(
        session: Session,
        check_in_code: str,
        manager_user_id: int,
    ) -> Tuple[bool, str, Optional[Booking]]:
        """Verify check-in code and mark booking as checked in.
        
        Returns: (success, message, booking_or_none)
        """
        # Find booking by check-in code
        stmt = select(Booking).where(Booking.check_in_code == check_in_code.upper())
        booking = session.exec(stmt).first()
        
        if not booking:
            return False, "کد نامعتبر است", None
        
        # Validate booking status
        if booking.status != BookingStatus.CONFIRMED:
            return False, f"رزرو در وضعیت {booking.status.value} است و قابل چک‌این نیست", booking
        
        # Check if already checked in
        if booking.checked_in_at:
            return False, "این رزرو قبلاً چک‌این شده است", booking
        
        # Verify manager has access to this venue
        from app.models.slot import Slot
        from app.models.venue import Venue
        
        slot = session.get(Slot, booking.slot_id)
        if not slot:
            return False, "سانس یافت نشد", booking
        
        venue = session.get(Venue, slot.venue_id)
        if not venue:
            return False, "سالن یافت نشد", booking
        
        manager = session.get(User, manager_user_id)
        if not manager:
            return False, "کاربر مدیر یافت نشد", None
        
        # Check if user is manager or super_admin
        if manager.role not in [UserRole.SUPER_ADMIN, UserRole.CLUB_ADMIN]:
            if venue.manager_id != manager_user_id:
                return False, "شما دسترسی به این سالن ندارید", booking
        
        # Perform check-in — جایزهٔ وفاداری در همان تراکنش ثبت می‌شود
        # (idempotent با منبع رزرو؛ تسک روزانهٔ complete_past_bookings همان
        # ردیف را دوباره نمی‌سازد).
        venue_name = venue.name or "سالن"
        booking.checked_in_at = datetime.now(timezone.utc)
        booking.checked_in_by = manager_user_id
        session.add(booking)
        try:
            award = LoyaltyService.award_for_booking(session, booking)
            session.commit()
        except IntegrityError:
            # دو چک‌این هم‌زمان روی یک رزرو: ردیف امتیاز از قبل آمده،
            # ولی حضور باید ثبت شود — نوشتنِ دوباره بدون جایزه.
            session.rollback()
            booking.checked_in_at = datetime.now(timezone.utc)
            booking.checked_in_by = manager_user_id
            session.add(booking)
            session.commit()
            award = None
        session.refresh(booking)
        awarded_points = int(award.points) if award else 0
        
        # Notify user about successful check-in
        if awarded_points > 0:
            user_message = (f"حضور شما در {venue_name} ثبت شد و "
                            f"{awarded_points} امتیاز وفاداری به حساب شما اضافه گردید.")
        else:
            user_message = f"حضور شما در {venue_name} با موفقیت ثبت شد."
        await NotificationService().send_to_user(
            user_id=booking.user_id,
            title="✅ حضور شما ثبت شد",
            message=user_message,
            data={"booking_id": booking.id,
                  "checked_in_at": booking.checked_in_at.isoformat(),
                  "loyalty_points": awarded_points},
            notif_type="check_in_confirmed",
        )
        
        if awarded_points > 0:
            message = f"چک‌این انجام شد — {awarded_points} امتیاز وفاداری داده شد."
        else:
            message = "چک‌این با موفقیت انجام شد"
        return True, message, booking
