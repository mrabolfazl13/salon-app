"""Celery tasks for booking reminders and waitlist notifications."""
import asyncio
from datetime import datetime, timedelta, timezone
from app.tasks.worker import celery_app
from app.config import settings
from app.database import engine
from app.models.booking import Booking, BookingStatus
from app.models.slot import Slot
from app.models.waitlist import WaitlistEntry
from app.services.notification_service import NotificationService
from sqlmodel import Session
import logging

logger = logging.getLogger(__name__)


def _send_reminder_sync(user_id: int, title: str, message: str, data: dict):
    """Synchronous wrapper for async NotificationService.send_to_user."""
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(
            NotificationService().send_to_user(
                user_id=user_id,
                title=title,
                message=message,
                data=data,
                notif_type="booking_reminder",
            )
        )
    finally:
        loop.close()


def _send_waitlist_notification_sync(user_id: int, title: str, message: str, data: dict):
    """Synchronous wrapper for waitlist notification."""
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(
            NotificationService().send_to_user(
                user_id=user_id,
                title=title,
                message=message,
                data=data,
                notif_type="waitlist_available",
            )
        )
    finally:
        loop.close()


@celery_app.task(bind=True)
def send_booking_reminders(self):
    """Send reminders for bookings starting in 2 hours.
    
    Runs every hour. Finds CONFIRMED bookings where slot starts in ~2 hours
    and sends WebSocket + DB notification to the user.
    """
    db = Session(engine)
    try:
        now = datetime.now()
        reminder_window_start = now + timedelta(hours=1, minutes=45)
        reminder_window_end = now + timedelta(hours=2, minutes=15)
        
        # Find confirmed bookings in the reminder window
        bookings = (
            db.query(Booking)
            .join(Slot, Booking.slot_id == Slot.id)
            .filter(
                Booking.status == BookingStatus.CONFIRMED,
                Slot.slot_date >= reminder_window_start.date(),
                Slot.slot_date <= reminder_window_end.date(),
                Slot.start_time >= reminder_window_start.time(),
                Slot.start_time <= reminder_window_end.time(),
            )
            .all()
        )
        
        sent_count = 0
        for booking in bookings:
            # Check if we already sent a reminder for this booking recently
            from app.models.notification import Notification
            existing_reminder = (
                db.query(Notification)
                .filter(
                    Notification.user_id == booking.user_id,
                    Notification.type == "booking_reminder",
                    Notification.created_at >= now - timedelta(hours=3),
                )
                .first()
            )
            
            if existing_reminder:
                continue  # Already reminded
            
            slot = booking.slot
            venue_name = slot.venue.name if slot.venue else "سالن"
            time_str = f"{slot.start_time.hour:02d}:{slot.start_time.minute:02d}"
            date_str = slot.slot_date.strftime("%Y-%m-%d")
            
            title = "یادآوری بازی"
            message = (
                f"بازی شما در {venue_name} ساعت {time_str} ({date_str}) "
                f"شروع می‌شود. لطفاً به موقع حاضر شوید."
            )
            
            # Send notification via service (DB + WebSocket)
            _send_reminder_sync(
                user_id=booking.user_id,
                title=title,
                message=message,
                data={
                    "booking_id": booking.id,
                    "slot_id": slot.id,
                    "venue_id": slot.venue_id,
                    "start_time": f"{date_str}T{time_str}",
                },
            )
            
            sent_count += 1
        
        if sent_count > 0:
            logger.info(f"Sent {sent_count} booking reminders")
        
        return {"sent": sent_count}
    
    except Exception as e:
        logger.error(f"Error sending booking reminders: {e}")
        raise
    finally:
        db.close()


@celery_app.task(bind=True)
def notify_waitlist_on_cancellation(self, slot_id: int):
    """Notify first person in waitlist when a booking is cancelled.
    
    Triggered manually when a booking is cancelled.
    """
    db = Session(engine)
    try:
        # Get first pending/notified entry for this slot
        entry = (
            db.query(WaitlistEntry)
            .filter(
                WaitlistEntry.slot_id == slot_id,
                WaitlistEntry.status.in_(["pending", "notified"]),
            )
            .order_by(WaitlistEntry.position)
            .first()
        )
        
        if not entry:
            return {"notified": False, "reason": "no_waitlist"}
        
        slot = db.query(Slot).filter(Slot.id == slot_id).first()
        if not slot:
            return {"notified": False, "reason": "slot_not_found"}
        
        venue_name = slot.venue.name if slot.venue else "سالن"
        time_str = f"{slot.start_time.hour:02d}:{slot.start_time.minute:02d}"
        date_str = slot.slot_date.strftime("%Y-%m-%d")
        
        # Set expiry time (user has 2 hours to book)
        expires_at = datetime.utcnow() + timedelta(hours=2)
        
        title = "سانس آزاد شد!"
        message = (
            f"یک سانس در {venue_name} ساعت {time_str} ({date_str}) آزاد شده. "
            f"شما ۲ ساعت فرصت دارید رزرو کنید."
        )
        
        _send_waitlist_notification_sync(
            user_id=entry.user_id,
            title=title,
            message=message,
            data={
                "slot_id": slot_id,
                "venue_id": slot.venue_id,
                "waitlist_entry_id": entry.id,
                "expires_at": expires_at.isoformat(),
            },
        )
        
        # Update entry status
        entry.status = "notified"
        entry.notified_at = datetime.utcnow()
        entry.expires_at = expires_at
        entry.updated_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"Notified user {entry.user_id} for slot {slot_id}")
        return {"notified": True, "user_id": entry.user_id}
    
    except Exception as e:
        logger.error(f"Error notifying waitlist: {e}")
        db.rollback()
        raise
    finally:
        db.close()
