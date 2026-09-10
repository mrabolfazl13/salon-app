# backend/app/services/game_service.py
"""سرویس کسب‌وکار سیستم بازی گروهی (Group Booking / Open Game).

اصول:
- Game روی یک Booking تأییدشده سوار می‌شود؛ هرگز Booking را تغییر نمی‌دهد.
- شناسه کاربر هرگز از کلاینت پذیرفته نمی‌شود؛ همه‌چیز از token احراز هویت (current_user).
- ایمنی race condition: هر عملیات ظرفیت‌دار ابتدا Game را با SELECT ... FOR UPDATE قفل می‌کند.
- خطاها ساختارمند: detail = {"code": "GAME_FULL", "message": "..."}
- اعلان‌ها: متدها لیست نوتیفیکیشن برمی‌گردانند؛ روتر async آن‌ها را dispatch می‌کند.
"""
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Tuple

from fastapi import HTTPException

from app.unit_of_work import UnitOfWork
from app.models.game import (
    Game, GameParticipant, GameJoinRequest, GameInvitation,
    GameInviteLink, GameWaitlist, GamePayment,
    GameVisibility, GameStatus, JoinPolicy, ParticipantRole, ParticipantStatus,
    JoinRequestStatus, InvitationStatus, WaitlistStatus, GamePaymentStatus,
    PaymentMode,
)
from app.models.booking import Booking, BookingStatus
from app.models.slot import Slot
from app.models.venue import Venue
from app.models.user import User
from app.repositories.venue_repository import VenueRepository
from app.schemas.game import GameCreate, GameUpdate, InviteLinkCreate


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _err(status: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status, detail={"code": code, "message": message})


class GameService:

    # ─────────────────────────── کمکی‌های داخلی ───────────────────────────

    @staticmethod
    def _get_game_or_404(uow: UnitOfWork, game_id: int) -> Game:
        game = uow.games.get_by_id(game_id)
        if not game:
            raise _err(404, "GAME_NOT_FOUND", "بازی مورد نظر یافت نشد.")
        return game

    @staticmethod
    def _chain(uow: UnitOfWork, game: Game) -> Tuple[Booking, Slot, Venue]:
        """Booking → Slot → Venue برای غنی‌سازی پاسخ."""
        booking = uow.bookings.get_by_id(game.booking_id)
        if not booking:
            raise _err(404, "BOOKING_NOT_FOUND", "رزرو مرتبط با بازی یافت نشد.")
        slot = uow.slots.get_by_id(booking.slot_id)
        venue = uow.venues.get_by_id(slot.venue_id) if slot else None
        return booking, slot, venue

    @staticmethod
    def _require_manage_permission(game: Game, participant: Optional[GameParticipant]):
        """فقط ارگانایزر یا ادمین می‌تواند مدیریت کند."""
        if not participant or participant.status != ParticipantStatus.ACCEPTED:
            raise _err(403, "NOT_AUTHORIZED", "شما عضو این بازی نیستید.")
        if participant.role not in (ParticipantRole.ORGANIZER, ParticipantRole.ADMIN):
            raise _err(403, "NOT_AUTHORIZED", "فقط برگزارکننده یا مدیر بازی این اجازه را دارد.")

    @staticmethod
    def _require_open_for_join(game: Game):
        if game.status == GameStatus.CANCELLED:
            raise _err(409, "GAME_CANCELLED", "این بازی لغو شده است.")
        if game.status == GameStatus.STARTED:
            raise _err(409, "GAME_STARTED", "بازی آغاز شده و امکان پیوستن وجود ندارد.")
        if game.status == GameStatus.COMPLETED:
            raise _err(409, "GAME_COMPLETED", "بازی به پایان رسیده است.")
        if game.status == GameStatus.DRAFT:
            raise _err(409, "GAME_NOT_OPEN", "بازی هنوز منتشر نشده است.")

    @staticmethod
    def _share_amount(booking: Booking, game: Game) -> int:
        """سهم هر بازیکن در حالت پرداخت سهمی (تقسیم integer)."""
        return booking.payment_amount // game.max_players if game.max_players else 0

    @staticmethod
    def _ensure_payment(uow: UnitOfWork, game: Game, booking: Booking,
                        participant: GameParticipant) -> Optional[GamePayment]:
        """در حالت split برای هر شرکت‌کننده قطعی یک سهم پرداخت ایجاد می‌شود."""
        if game.payment_mode != PaymentMode.SPLIT_PAYMENT:
            return None
        existing = uow.game_payments.get_by_participant(participant.id)
        if existing:
            return existing
        amount = GameService._share_amount(booking, game)
        if amount <= 0:
            return None
        payment = GamePayment(
            game_id=game.id, participant_id=participant.id,
            user_id=participant.user_id, amount=amount,
            status=GamePaymentStatus.PENDING,
        )
        uow.game_payments.create(payment)
        return payment

    @staticmethod
    def _refresh_status(uow: UnitOfWork, game: Game) -> Game:
        """وضعیت FULL/OPEN را بر اساس شمارش واقعی شرکت‌کننده‌ها همگام می‌کند."""
        if game.status not in (GameStatus.OPEN, GameStatus.FULL):
            return game
        count = uow.games.count_accepted_players(game.id)
        new_status = GameStatus.FULL if count >= game.max_players else GameStatus.OPEN
        if new_status != game.status:
            game.status = new_status
            game.updated_at = _utcnow()
            uow.session.add(game)
            uow.session.flush()
        return game

    @staticmethod
    def _promote_from_waitlist(uow: UnitOfWork, game: Game, booking: Booking) -> List[dict]:
        """با خالی شدن جا، نفر اول لیست انتظار ارتقا می‌یابد. نوتیف‌ها را برمی‌گرداند."""
        notifications: List[dict] = []
        while True:
            count = uow.games.count_accepted_players(game.id)
            if count >= game.max_players:
                break
            entry = uow.game_waitlist.pop_first(game.id)
            if not entry:
                break
            entry.status = WaitlistStatus.PROMOTED
            uow.session.add(entry)
            participant = uow.game_participants.get_by_game_and_user(game.id, entry.user_id)
            if participant and participant.status in (ParticipantStatus.LEFT, ParticipantStatus.REMOVED):
                participant.status = ParticipantStatus.ACCEPTED
                participant.joined_at = _utcnow()
                participant.left_at = None
            elif not participant:
                participant = GameParticipant(
                    game_id=game.id, user_id=entry.user_id,
                    role=ParticipantRole.MEMBER, status=ParticipantStatus.ACCEPTED,
                )
                uow.game_participants.create(participant)
            GameService._ensure_payment(uow, game, booking, participant)
            user = uow.users.get_by_id(entry.user_id)
            notifications.append({
                "user_id": entry.user_id,
                "title": "🎉 جای شما در بازی آزاد شد!",
                "message": f"شما از لیست انتظار بازی «{game.name}» به جمع بازیکنان پیوستید.",
                "data": {"game_id": game.id, "game_name": game.name,
                         "user_name": user.full_name if user else None},
                "notif_type": "game_waitlist_promoted",
            })
            uow.session.flush()
        uow.game_waitlist.reorder(game.id)
        return notifications

    # ─────────────────────────── ساخت / خواندن ───────────────────────────

    @staticmethod
    def create_game(uow: UnitOfWork, data: GameCreate, user_id: int) -> Tuple[Game, List[dict]]:
        """بازی روی رزرو تأییدشده‌ی خودِ کاربر ساخته می‌شود. ارگانایزر اولین شرکت‌کننده است."""
        booking = uow.bookings.get_by_id(data.booking_id)
        if not booking:
            raise _err(404, "BOOKING_NOT_FOUND", "رزرو مورد نظر یافت نشد.")
        if booking.user_id != user_id:
            raise _err(403, "NOT_AUTHORIZED", "فقط صاحب رزرو می‌تواند روی آن بازی بسازد.")
        if booking.status != BookingStatus.CONFIRMED:
            raise _err(409, "BOOKING_NOT_CONFIRMED", "بازی فقط روی رزرو تأییدشده ساخته می‌شود.")
        if uow.games.get_by_booking_id(data.booking_id):
            raise _err(409, "GAME_ALREADY_EXISTS", "روی این رزرو از قبل یک بازی ساخته شده است.")

        join_policy = JoinPolicy.APPROVAL if data.visibility == GameVisibility.PUBLIC_APPROVAL else JoinPolicy.OPEN
        game = Game(
            booking_id=data.booking_id, organizer_id=user_id,
            name=data.name, description=data.description, sport=data.sport,
            visibility=data.visibility, join_policy=join_policy,
            max_players=data.max_players, skill_level=data.skill_level,
            payment_mode=data.payment_mode, status=GameStatus.OPEN,
        )
        uow.games.create(game)

        organizer_participant = GameParticipant(
            game_id=game.id, user_id=user_id,
            role=ParticipantRole.ORGANIZER, status=ParticipantStatus.ACCEPTED,
        )
        uow.game_participants.create(organizer_participant)
        GameService._ensure_payment(uow, game, booking, organizer_participant)

        notifications = [{
            "user_id": user_id,
            "title": "🎮 بازی شما ساخته شد",
            "message": f"بازی «{game.name}» با ظرفیت {game.max_players} نفر ایجاد شد. حالا می‌توانید دوستان را دعوت کنید.",
            "data": {"game_id": game.id, "game_name": game.name},
            "notif_type": "game_created",
        }]
        return game, notifications

    @staticmethod
    def to_response(uow: UnitOfWork, game: Game, current_user: Optional[User],
                    chain: Optional[Tuple[Booking, Slot, Venue]] = None,
                    player_count: Optional[int] = None,
                    distance_km: Optional[float] = None) -> dict:
        """ساخت dict پاسخ کامل + enrich (برای GameResponse)."""
        booking, slot, venue = chain if chain else GameService._chain(uow, game)
        count = player_count if player_count is not None else uow.games.count_accepted_players(game.id)

        price_per_player = None
        if game.payment_mode == PaymentMode.SPLIT_PAYMENT:
            price_per_player = GameService._share_amount(booking, game)

        resp = {
            "id": game.id, "booking_id": game.booking_id, "organizer_id": game.organizer_id,
            "name": game.name, "description": game.description, "sport": game.sport,
            "visibility": game.visibility, "join_policy": game.join_policy.value if hasattr(game.join_policy, "value") else str(game.join_policy),
            "max_players": game.max_players, "skill_level": game.skill_level,
            "payment_mode": game.payment_mode, "status": game.status,
            "created_at": game.created_at, "updated_at": game.updated_at,
            "organizer_name": None,
            "current_players": count,
            "venue_id": venue.id if venue else None,
            "venue_name": venue.name if venue else None,
            "venue_address": venue.address if venue else None,
            "latitude": venue.latitude if venue else None,
            "longitude": venue.longitude if venue else None,
            "slot_date": slot.slot_date if slot else None,
            "start_time": slot.start_time if slot else None,
            "duration": slot.duration if slot else None,
            "total_price": booking.payment_amount,
            "price_per_player": price_per_player,
            "distance_km": distance_km,
            "my_participant_status": None, "my_role": None,
            "my_waitlist_position": None,
            "has_pending_join_request": False, "has_pending_invitation": False,
        }
        organizer = uow.users.get_by_id(game.organizer_id)
        if organizer:
            resp["organizer_name"] = organizer.full_name

        if current_user:
            p = uow.game_participants.get_by_game_and_user(game.id, current_user.id)
            if p:
                resp["my_participant_status"] = p.status.value
                resp["my_role"] = p.role.value
            wl = uow.game_waitlist.get_by_game_and_user(game.id, current_user.id)
            if wl:
                resp["my_waitlist_position"] = wl.position
            resp["has_pending_join_request"] = uow.game_join_requests.has_pending_for_user(game.id, current_user.id)
            inv = uow.game_invitations.get_by_game_and_user(game.id, current_user.id)
            if inv and inv.status == InvitationStatus.PENDING:
                resp["has_pending_invitation"] = True
        return resp

    @staticmethod
    def _can_view(uow: UnitOfWork, game: Game, user: Optional[User]) -> bool:
        if game.visibility != GameVisibility.PRIVATE:
            return True
        if not user:
            return False
        if game.organizer_id == user.id:
            return True
        p = uow.game_participants.get_by_game_and_user(game.id, user.id)
        if p and p.status in (ParticipantStatus.ACCEPTED, ParticipantStatus.INVITED, ParticipantStatus.PENDING):
            return True
        inv = uow.game_invitations.get_by_game_and_user(game.id, user.id)
        return bool(inv and inv.status == InvitationStatus.PENDING)

    @staticmethod
    def get_game(uow: UnitOfWork, game_id: int, current_user: Optional[User]) -> dict:
        game = GameService._get_game_or_404(uow, game_id)
        if not GameService._can_view(uow, game, current_user):
            raise _err(403, "PRIVATE_GAME", "این بازی خصوصی است و فقط با دعوت‌نامه قابل مشاهده است.")
        return GameService.to_response(uow, game, current_user)

    @staticmethod
    def list_explore(uow: UnitOfWork, current_user: Optional[User],
                     sport: Optional[str] = None, skill_level: Optional[str] = None,
                     venue_id: Optional[int] = None, date_from=None, date_to=None,
                     time_from=None, time_to=None, max_price_per_player: Optional[int] = None,
                     availability_only: bool = False,
                     lat: Optional[float] = None, lng: Optional[float] = None,
                     sort: str = "soonest", limit: int = 20, offset: int = 0) -> dict:
        rows, total = uow.games.list_explore(
            sport=sport, skill_level=skill_level, venue_id=venue_id,
            date_from=date_from, date_to=date_to, time_from=time_from, time_to=time_to,
            max_price_per_player=max_price_per_player, availability_only=availability_only,
            limit=500 if sort != "soonest" else limit,
            offset=0 if sort != "soonest" else offset,
        )
        game_ids = [g.id for g, *_ in rows]
        counts = uow.games.accepted_counts_by_game(game_ids)

        items = []
        for game, booking, slot, venue in rows:
            distance = None
            if lat is not None and lng is not None and venue.latitude is not None:
                distance = round(VenueRepository._calculate_distance(
                    lat, lng, venue.latitude, venue.longitude), 2)
            count = counts.get(game.id, 0)
            items.append(GameService.to_response(
                uow, game, current_user, chain=(booking, slot, venue),
                player_count=count, distance_km=distance))

        if sort == "nearest" and lat is not None:
            items.sort(key=lambda x: (x["distance_km"] is None, x["distance_km"] or 0))
        elif sort == "cheapest":
            items.sort(key=lambda x: (x["price_per_player"] is None, x["price_per_player"] or 0))
        elif sort == "most_available":
            items.sort(key=lambda x: x["max_players"] - x["current_players"], reverse=True)
        elif sort == "popular":
            items.sort(key=lambda x: x["current_players"], reverse=True)

        if sort != "soonest":
            items = items[offset:offset + limit]
        return {"items": items, "total": total, "limit": limit, "offset": offset}

    @staticmethod
    def list_my_games(uow: UnitOfWork, user_id: int) -> List[dict]:
        organized = uow.games.list_by_organizer(user_id)
        joined = uow.games.list_by_participant(user_id)
        seen = set()
        result = []
        for game in organized + joined:
            if game.id in seen:
                continue
            seen.add(game.id)
            result.append(GameService.to_response(uow, game, None))
        return result

    # ─────────────────────────── Join / Leave ───────────────────────────

    @staticmethod
    def join_game(uow: UnitOfWork, game_id: int, user_id: int,
                  via_token: Optional[GameInviteLink] = None,
                  invited_join: bool = False) -> Tuple[dict, List[dict]]:
        """پیوستن با قفل ردیف Game — ۱۱/۱۰ هرگز رخ نمی‌دهد.

        invited_join=True: پذیرش دعوت مستقیم → عبور از چک visibility/approval.
        """
        game = uow.games.get_by_id_with_lock(game_id)  # SELECT FOR UPDATE
        if not game:
            raise _err(404, "GAME_NOT_FOUND", "بازی مورد نظر یافت نشد.")
        booking, slot, venue = GameService._chain(uow, game)

        if game.visibility == GameVisibility.PRIVATE and not via_token and not invited_join:
            raise _err(403, "PRIVATE_GAME", "این بازی خصوصی است؛ به لینک دعوت نیاز دارید.")

        existing = uow.game_participants.get_by_game_and_user(game.id, user_id)
        if existing and existing.status == ParticipantStatus.ACCEPTED:
            raise _err(409, "ALREADY_JOINED", "شما از قبل در این بازی هستید.")
        if existing and existing.status == ParticipantStatus.INVITED:
            # دعوت‌شده مستقیم join می‌کند → قطعی
            pass

        # سیاست تأیید (مگر از طریق لینک دعوت یا پذیرش دعوت مستقیم)
        if game.join_policy == JoinPolicy.APPROVAL and not via_token and not invited_join:
            if existing and existing.status == ParticipantStatus.PENDING:
                raise _err(409, "ALREADY_REQUESTED", "درخواست شما در انتظار تأیید است.")
            if uow.game_join_requests.has_pending_for_user(game.id, user_id):
                raise _err(409, "ALREADY_REQUESTED", "درخواست شما در انتظار تأیید است.")
            GameService._require_open_for_join(game)
            uow.game_join_requests.create(GameJoinRequest(
                game_id=game.id, user_id=user_id, status=JoinRequestStatus.PENDING))
            organizer = uow.users.get_by_id(game.organizer_id)
            user = uow.users.get_by_id(user_id)
            notifications = [{
                "user_id": game.organizer_id,
                "title": "🙋 درخواست پیوستن به بازی",
                "message": f"{user.full_name if user else 'کاربری'} می‌خواهد به بازی «{game.name}» بپیوندد.",
                "data": {"game_id": game.id, "game_name": game.name, "user_id": user_id},
                "notif_type": "game_join_request",
            }] if organizer else []
            return {"joined": False, "waitlisted": False, "request_pending": True,
                    "game": GameService.to_response(uow, game, None, chain=(booking, slot, venue))}, notifications

        GameService._require_open_for_join(game)

        count = uow.games.count_accepted_players(game.id)
        waitlisted = False
        if count >= game.max_players:
            # ظرفیت پر → لیست انتظار
            if uow.game_waitlist.get_by_game_and_user(game.id, user_id):
                raise _err(409, "ALREADY_WAITLISTED", "شما از قبل در لیست انتظار هستید.")
            pos = uow.game_waitlist.next_position(game.id)
            uow.game_waitlist.create(GameWaitlist(
                game_id=game.id, user_id=user_id, position=pos))
            waitlisted = True
        else:
            if existing:
                existing.status = ParticipantStatus.ACCEPTED
                existing.joined_at = _utcnow()
                existing.left_at = None
                uow.session.add(existing)
                participant = existing
            else:
                participant = GameParticipant(
                    game_id=game.id, user_id=user_id,
                    role=ParticipantRole.MEMBER, status=ParticipantStatus.ACCEPTED)
                uow.game_participants.create(participant)
            GameService._ensure_payment(uow, game, booking, participant)
            if via_token:
                via_token.uses_count += 1
                via_token.updated_at = _utcnow()
                uow.session.add(via_token)

        game = GameService._refresh_status(uow, game)
        user = uow.users.get_by_id(user_id)
        notifications: List[dict] = []
        if not waitlisted:
            notifications.append({
                "user_id": game.organizer_id,
                "title": "🎮 بازیکن جدید به بازی پیوست",
                "message": f"{user.full_name if user else 'کاربری'} به بازی «{game.name}» پیوست. ({uow.games.count_accepted_players(game.id)}/{game.max_players})",
                "data": {"game_id": game.id, "game_name": game.name, "user_id": user_id},
                "notif_type": "game_joined",
            })
        return {
            "joined": not waitlisted, "waitlisted": waitlisted, "request_pending": False,
            "game": GameService.to_response(uow, game, None, chain=(booking, slot, venue)),
        }, notifications

    @staticmethod
    def leave_game(uow: UnitOfWork, game_id: int, user_id: int) -> Tuple[dict, List[dict]]:
        game = uow.games.get_by_id_with_lock(game_id)
        if not game:
            raise _err(404, "GAME_NOT_FOUND", "بازی مورد نظر یافت نشد.")
        if game.status in (GameStatus.STARTED, GameStatus.COMPLETED):
            raise _err(409, "GAME_STARTED", "بازی آغاز/به‌پایان رسیده و امکان خروج نیست.")
        if game.status == GameStatus.CANCELLED:
            raise _err(409, "GAME_CANCELLED", "بازی لغو شده است.")
        if game.organizer_id == user_id:
            raise _err(409, "ORGANIZER_CANNOT_LEAVE",
                       "برگزارکننده نمی‌تواند خارج شود؛ بازی را لغو یا مدیریت را منتقل کنید.")

        participant = uow.game_participants.get_by_game_and_user(game.id, user_id)
        if not participant or participant.status not in (ParticipantStatus.ACCEPTED, ParticipantStatus.PENDING):
            raise _err(409, "NOT_A_PARTICIPANT", "شما عضو این بازی نیستید.")

        booking, slot, venue = GameService._chain(uow, game)
        GameService._deactivate_participant(uow, game, booking, participant)
        promoted = GameService._promote_from_waitlist(uow, game, booking)
        game = GameService._refresh_status(uow, game)

        user = uow.users.get_by_id(user_id)
        notifications = [{
            "user_id": game.organizer_id,
            "title": "👋 بازیکنی از بازی خارج شد",
            "message": f"{user.full_name if user else 'کاربری'} از بازی «{game.name}» خارج شد.",
            "data": {"game_id": game.id, "game_name": game.name, "user_id": user_id},
            "notif_type": "game_left",
        }] + promoted
        return {"game": GameService.to_response(uow, game, None, chain=(booking, slot, venue))}, notifications

    @staticmethod
    def _deactivate_participant(uow: UnitOfWork, game: Game, booking: Booking,
                                participant: GameParticipant):
        participant.status = ParticipantStatus.LEFT
        participant.left_at = _utcnow()
        uow.session.add(participant)
        payment = uow.game_payments.get_by_participant(participant.id)
        if payment and payment.status == GamePaymentStatus.PAID:
            payment.status = GamePaymentStatus.REFUNDED
            payment.updated_at = _utcnow()
            uow.session.add(payment)
        elif payment and payment.status == GamePaymentStatus.PENDING:
            uow.session.delete(payment)
        uow.session.flush()

    @staticmethod
    def remove_participant(uow: UnitOfWork, game_id: int, actor_id: int,
                           target_user_id: int) -> Tuple[dict, List[dict]]:
        game = uow.games.get_by_id_with_lock(game_id)
        if not game:
            raise _err(404, "GAME_NOT_FOUND", "بازی مورد نظر یافت نشد.")
        actor = uow.game_participants.get_by_game_and_user(game.id, actor_id)
        GameService._require_manage_permission(game, actor)
        if target_user_id == game.organizer_id:
            raise _err(409, "CANNOT_REMOVE_ORGANIZER", "برگزارکننده قابل حذف نیست.")

        target = uow.game_participants.get_by_game_and_user(game.id, target_user_id)
        if not target or target.status not in (ParticipantStatus.ACCEPTED, ParticipantStatus.PENDING, ParticipantStatus.INVITED):
            raise _err(409, "NOT_A_PARTICIPANT", "این کاربر در بازی حضور ندارد.")

        booking, slot, venue = GameService._chain(uow, game)
        target.status = ParticipantStatus.REMOVED
        target.left_at = _utcnow()
        uow.session.add(target)
        payment = uow.game_payments.get_by_participant(target.id)
        if payment and payment.status == GamePaymentStatus.PAID:
            payment.status = GamePaymentStatus.REFUNDED
            uow.session.add(payment)
        elif payment and payment.status == GamePaymentStatus.PENDING:
            uow.session.delete(payment)
        uow.session.flush()

        promoted = GameService._promote_from_waitlist(uow, game, booking)
        game = GameService._refresh_status(uow, game)
        notifications = [{
            "user_id": target_user_id,
            "title": "⛔ از بازی حذف شدید",
            "message": f"توسط مدیر، از بازی «{game.name}» حذف شدید.",
            "data": {"game_id": game.id, "game_name": game.name},
            "notif_type": "game_removed",
        }] + promoted
        return {"game": GameService.to_response(uow, game, None, chain=(booking, slot, venue))}, notifications

    # ─────────────────────────── Join Requests ───────────────────────────

    @staticmethod
    def list_join_requests(uow: UnitOfWork, game_id: int, actor_id: int) -> List[dict]:
        game = GameService._get_game_or_404(uow, game_id)
        actor = uow.game_participants.get_by_game_and_user(game.id, actor_id)
        GameService._require_manage_permission(game, actor)
        return [
            {"id": r.id, "game_id": r.game_id, "user_id": r.user_id, "full_name": name,
             "status": r.status.value, "message": r.message,
             "created_at": r.created_at, "reviewed_at": r.reviewed_at}
            for r, name in uow.game_join_requests.get_pending_for_game(game.id)
        ]

    @staticmethod
    def decide_join_request(uow: UnitOfWork, game_id: int, request_id: int,
                            actor_id: int, approve: bool) -> Tuple[dict, List[dict]]:
        game = uow.games.get_by_id_with_lock(game_id)
        if not game:
            raise _err(404, "GAME_NOT_FOUND", "بازی مورد نظر یافت نشد.")
        actor = uow.game_participants.get_by_game_and_user(game.id, actor_id)
        GameService._require_manage_permission(game, actor)

        request = uow.game_join_requests.get_by_id(request_id)
        if not request or request.game_id != game.id or request.status != JoinRequestStatus.PENDING:
            raise _err(404, "REQUEST_NOT_FOUND", "درخواست یافت نشد یا بررسی شده است.")

        booking, slot, venue = GameService._chain(uow, game)
        request.status = JoinRequestStatus.APPROVED if approve else JoinRequestStatus.REJECTED
        request.reviewed_by = actor_id
        request.reviewed_at = _utcnow()
        uow.session.add(request)
        uow.session.flush()

        notifications: List[dict] = []
        user = uow.users.get_by_id(request.user_id)
        name = user.full_name if user else "کاربر"

        if approve:
            count = uow.games.count_accepted_players(game.id)
            if count >= game.max_players:
                raise _err(409, "GAME_FULL", "ظرفیت بازی پر است؛ ابتدا جایی آزاد کنید.")
            existing = uow.game_participants.get_by_game_and_user(game.id, request.user_id)
            if existing and existing.status == ParticipantStatus.ACCEPTED:
                raise _err(409, "ALREADY_JOINED", "این کاربر از قبل عضو است.")
            if existing:
                existing.status = ParticipantStatus.ACCEPTED
                existing.joined_at = _utcnow()
                uow.session.add(existing)
                participant = existing
            else:
                participant = GameParticipant(
                    game_id=game.id, user_id=request.user_id,
                    role=ParticipantRole.MEMBER, status=ParticipantStatus.ACCEPTED)
                uow.game_participants.create(participant)
            GameService._ensure_payment(uow, game, booking, participant)
            game = GameService._refresh_status(uow, game)
            notifications.append({
                "user_id": request.user_id,
                "title": "✅ درخواست شما تأیید شد",
                "message": f"ورود شما به بازی «{game.name}» تأیید شد.",
                "data": {"game_id": game.id, "game_name": game.name},
                "notif_type": "game_request_approved",
            })
        else:
            notifications.append({
                "user_id": request.user_id,
                "title": "❌ درخواست شما تأیید نشد",
                "message": f"درخواست ورود شما به بازی «{game.name}» رد شد.",
                "data": {"game_id": game.id, "game_name": game.name},
                "notif_type": "game_request_rejected",
            })
        return {"game": GameService.to_response(uow, game, None, chain=(booking, slot, venue))}, notifications

    # ─────────────────────────── Invitations ───────────────────────────

    @staticmethod
    def invite_user(uow: UnitOfWork, game_id: int, actor_id: int,
                    target_user_id: int, expires_in_days: Optional[int] = None) -> Tuple[dict, List[dict]]:
        game = GameService._get_game_or_404(uow, game_id)
        actor = uow.game_participants.get_by_game_and_user(game.id, actor_id)
        GameService._require_manage_permission(game, actor)
        if game.status in (GameStatus.CANCELLED, GameStatus.STARTED, GameStatus.COMPLETED):
            raise _err(409, "GAME_CANCELLED", "امکان دعوت در این وضعیت وجود ندارد.")
        target = uow.users.get_by_id(target_user_id)
        if not target:
            raise _err(404, "USER_NOT_FOUND", "کاربر مورد نظر یافت نشد.")
        existing_p = uow.game_participants.get_by_game_and_user(game.id, target_user_id)
        if existing_p and existing_p.status == ParticipantStatus.ACCEPTED:
            raise _err(409, "ALREADY_JOINED", "این کاربر از قبل عضو بازی است.")

        inv = uow.game_invitations.get_by_game_and_user(game.id, target_user_id)
        if inv and inv.status == InvitationStatus.PENDING:
            raise _err(409, "ALREADY_INVITED", "دعوت‌نامه‌ی بازی برای این کاربر ارسال شده است.")
        expires_at = _utcnow() + timedelta(days=expires_in_days) if expires_in_days else None
        if inv:
            inv.status = InvitationStatus.PENDING
            inv.expires_at = expires_at
            inv.invited_by = actor_id
            uow.session.add(inv)
        else:
            inv = GameInvitation(game_id=game.id, invited_user_id=target_user_id,
                                 invited_by=actor_id, expires_at=expires_at)
            uow.game_invitations.create(inv)
            if not existing_p:
                uow.game_participants.create(GameParticipant(
                    game_id=game.id, user_id=target_user_id,
                    role=ParticipantRole.MEMBER, status=ParticipantStatus.INVITED))

        actor_user = uow.users.get_by_id(actor_id)
        notifications = [{
            "user_id": target_user_id,
            "title": "✉️ دعوت به بازی",
            "message": f"{actor_user.full_name if actor_user else 'برگزارکننده'} شما را به بازی «{game.name}» دعوت کرد.",
            "data": {"game_id": game.id, "game_name": game.name, "invitation_id": inv.id},
            "notif_type": "game_invitation",
        }]
        return {"id": inv.id, "game_id": game.id, "invited_user_id": target_user_id,
                "invited_user_name": target.full_name, "invited_by": actor_id,
                "status": inv.status.value, "expires_at": inv.expires_at,
                "created_at": inv.created_at, "game_name": game.name}, notifications

    @staticmethod
    def list_my_invitations(uow: UnitOfWork, user_id: int) -> List[dict]:
        return [
            {"id": inv.id, "game_id": inv.game_id, "invited_user_id": inv.invited_user_id,
             "invited_user_name": None, "invited_by": inv.invited_by,
             "status": inv.status.value, "expires_at": inv.expires_at,
             "created_at": inv.created_at, "game_name": game_name}
            for inv, game_name in uow.game_invitations.list_pending_for_user(user_id)
        ]

    @staticmethod
    def decide_invitation(uow: UnitOfWork, invitation_id: int, user_id: int,
                          accept: bool) -> Tuple[dict, List[dict]]:
        inv = uow.game_invitations.get_by_id(invitation_id)
        if not inv or inv.invited_user_id != user_id:
            raise _err(404, "INVITATION_NOT_FOUND", "دعوت‌نامه یافت نشد.")
        if inv.status != InvitationStatus.PENDING:
            raise _err(409, "INVITATION_ALREADY_ANSWERED", "این دعوت‌نامه پاسخ داده شده است.")
        if inv.expires_at and inv.expires_at.replace(tzinfo=timezone.utc) < _utcnow():
            raise _err(410, "INVITE_EXPIRED", "دعوت‌نامه منقضی شده است.")

        inv.status = InvitationStatus.ACCEPTED if accept else InvitationStatus.DECLINED
        uow.session.add(inv)
        uow.session.flush()

        game = uow.games.get_by_id(inv.game_id)
        if not accept:
            p = uow.game_participants.get_by_game_and_user(game.id, user_id)
            if p and p.status == ParticipantStatus.INVITED:
                p.status = ParticipantStatus.REJECTED
                uow.session.add(p)
            return {"message": "دعوت رد شد"}, []

        # پذیرش دعوت → join قطعی (بدون محدودیت سیاست تأیید)
        result, notifications = GameService.join_game(uow, game.id, user_id,
                                                      via_token=None, invited_join=True)
        organizer = uow.users.get_by_id(game.organizer_id)
        user = uow.users.get_by_id(user_id)
        notifications.append({
            "user_id": game.organizer_id,
            "title": "✅ دعوت پذیرفته شد",
            "message": f"{user.full_name if user else 'کاربری'} دعوت بازی «{game.name}» را پذیرفت.",
            "data": {"game_id": game.id, "game_name": game.name, "user_id": user_id},
            "notif_type": "game_invitation_accepted",
        }) if organizer else None
        return result, [n for n in notifications if n]

    # ─────────────────────────── Invite Links ───────────────────────────

    @staticmethod
    def create_invite_link(uow: UnitOfWork, game_id: int, actor_id: int,
                           data: InviteLinkCreate) -> dict:
        game = GameService._get_game_or_404(uow, game_id)
        actor = uow.game_participants.get_by_game_and_user(game.id, actor_id)
        GameService._require_manage_permission(game, actor)
        token = secrets.token_urlsafe(8)  # ~11 کاراکتر — غیرقابل حدس
        link = GameInviteLink(
            game_id=game.id, token=token, created_by=actor_id,
            expires_at=_utcnow() + timedelta(days=data.expires_in_days) if data.expires_in_days else None,
            max_uses=data.max_uses,
        )
        uow.game_invite_links.create(link)
        return GameService._link_to_dict(link)

    @staticmethod
    def _link_to_dict(link: GameInviteLink) -> dict:
        return {
            "id": link.id, "game_id": link.game_id, "token": link.token,
            "join_path": f"/join/g/{link.token}",
            "expires_at": link.expires_at, "max_uses": link.max_uses,
            "uses_count": link.uses_count, "is_active": link.is_active,
            "created_at": link.created_at,
        }

    @staticmethod
    def list_invite_links(uow: UnitOfWork, game_id: int, actor_id: int) -> List[dict]:
        game = GameService._get_game_or_404(uow, game_id)
        actor = uow.game_participants.get_by_game_and_user(game.id, actor_id)
        GameService._require_manage_permission(game, actor)
        return [GameService._link_to_dict(l) for l in uow.game_invite_links.list_active_by_game(game.id)]

    @staticmethod
    def disable_invite_link(uow: UnitOfWork, game_id: int, link_id: int, actor_id: int) -> dict:
        game = GameService._get_game_or_404(uow, game_id)
        actor = uow.game_participants.get_by_game_and_user(game.id, actor_id)
        GameService._require_manage_permission(game, actor)
        link = uow.game_invite_links.get_by_id(link_id)
        if not link or link.game_id != game.id:
            raise _err(404, "LINK_NOT_FOUND", "لینک دعوت یافت نشد.")
        link.is_active = False
        link.updated_at = _utcnow()
        uow.session.add(link)
        return GameService._link_to_dict(link)

    @staticmethod
    def regenerate_invite_link(uow: UnitOfWork, game_id: int, link_id: int, actor_id: int) -> dict:
        game = GameService._get_game_or_404(uow, game_id)
        actor = uow.game_participants.get_by_game_and_user(game.id, actor_id)
        GameService._require_manage_permission(game, actor)
        link = uow.game_invite_links.get_by_id(link_id)
        if not link or link.game_id != game.id:
            raise _err(404, "LINK_NOT_FOUND", "لینک دعوت یافت نشد.")
        link.is_active = False
        link.updated_at = _utcnow()
        uow.session.add(link)
        new_link = GameInviteLink(
            game_id=game.id, token=secrets.token_urlsafe(8), created_by=actor_id,
            expires_at=link.expires_at, max_uses=link.max_uses,
        )
        uow.game_invite_links.create(new_link)
        return GameService._link_to_dict(new_link)

    @staticmethod
    def preview_token(uow: UnitOfWork, token: str, current_user: Optional[User]) -> dict:
        link = uow.game_invite_links.get_by_token(token)
        if not link or not link.is_active:
            return {"valid": False, "game": None, "reason": "INVITE_INVALID"}
        if link.expires_at and link.expires_at.replace(tzinfo=timezone.utc) < _utcnow():
            return {"valid": False, "game": None, "reason": "INVITE_EXPIRED"}
        if link.max_uses is not None and link.uses_count >= link.max_uses:
            return {"valid": False, "game": None, "reason": "INVITE_INVALID"}
        game = uow.games.get_by_id(link.game_id)
        if not game:
            return {"valid": False, "game": None, "reason": "INVITE_INVALID"}
        if game.status == GameStatus.CANCELLED:
            return {"valid": False, "game": None, "reason": "GAME_CANCELLED"}
        return {"valid": True, "game": GameService.to_response(uow, game, current_user), "reason": None}

    @staticmethod
    def join_by_token(uow: UnitOfWork, token: str, user_id: int) -> Tuple[dict, List[dict]]:
        link = uow.game_invite_links.get_by_token(token, with_lock=True)
        if not link or not link.is_active:
            raise _err(410, "INVITE_INVALID", "لینک دعوت نامعتبر یا غیرفعال است.")
        if link.expires_at and link.expires_at.replace(tzinfo=timezone.utc) < _utcnow():
            raise _err(410, "INVITE_EXPIRED", "لینک دعوت منقضی شده است.")
        if link.max_uses is not None and link.uses_count >= link.max_uses:
            raise _err(410, "INVITE_INVALID", "ظرفیت استفاده از لینک دعوت تمام شده است.")
        result, notifications = GameService.join_game(uow, link.game_id, user_id, via_token=link)
        return result, notifications

    # ─────────────────────────── Waitlist ───────────────────────────

    @staticmethod
    def join_waitlist(uow: UnitOfWork, game_id: int, user_id: int) -> Tuple[dict, List[dict]]:
        game = uow.games.get_by_id_with_lock(game_id)
        if not game:
            raise _err(404, "GAME_NOT_FOUND", "بازی مورد نظر یافت نشد.")
        GameService._require_open_for_join(game)
        existing = uow.game_participants.get_by_game_and_user(game.id, user_id)
        if existing and existing.status == ParticipantStatus.ACCEPTED:
            raise _err(409, "ALREADY_JOINED", "شما از قبل در بازی هستید.")
        if uow.game_waitlist.get_by_game_and_user(game.id, user_id):
            raise _err(409, "ALREADY_WAITLISTED", "شما از قبل در لیست انتظار هستید.")
        pos = uow.game_waitlist.next_position(game.id)
        entry = GameWaitlist(game_id=game.id, user_id=user_id, position=pos)
        uow.game_waitlist.create(entry)
        return {"id": entry.id, "game_id": game.id, "user_id": user_id,
                "position": entry.position, "status": entry.status.value,
                "created_at": entry.created_at}, []

    @staticmethod
    def leave_waitlist(uow: UnitOfWork, game_id: int, user_id: int) -> dict:
        entry = uow.game_waitlist.get_by_game_and_user(game_id, user_id)
        if not entry:
            raise _err(404, "WAITLIST_NOT_FOUND", "شما در لیست انتظار نیستید.")
        entry.status = WaitlistStatus.LEFT
        uow.session.add(entry)
        uow.game_waitlist.reorder(game_id)
        return {"message": "از لیست انتظار خارج شدید."}

    @staticmethod
    def list_waitlist(uow: UnitOfWork, game_id: int, actor_id: int) -> List[dict]:
        game = GameService._get_game_or_404(uow, game_id)
        actor = uow.game_participants.get_by_game_and_user(game.id, actor_id)
        GameService._require_manage_permission(game, actor)
        return [
            {"id": e.id, "game_id": e.game_id, "user_id": e.user_id, "position": e.position,
             "status": e.status.value, "created_at": e.created_at, "full_name": name}
            for e, name in uow.game_waitlist.list_by_game(game.id)
        ]

    # ─────────────────────────── مدیریت بازی ───────────────────────────

    @staticmethod
    def update_game(uow: UnitOfWork, game_id: int, actor_id: int,
                    data: GameUpdate) -> Tuple[dict, List[dict]]:
        game = uow.games.get_by_id_with_lock(game_id)
        if not game:
            raise _err(404, "GAME_NOT_FOUND", "بازی مورد نظر یافت نشد.")
        actor = uow.game_participants.get_by_game_and_user(game.id, actor_id)
        GameService._require_manage_permission(game, actor)

        booking, slot, venue = GameService._chain(uow, game)
        notifications: List[dict] = []
        changes = data.model_dump(exclude_unset=True)

        if "max_players" in changes and changes["max_players"] is not None:
            new_max = changes["max_players"]
            count = uow.games.count_accepted_players(game.id)
            if new_max < count:
                raise _err(409, "CAPACITY_BELOW_PLAYERS",
                           f"ظرفیت جدید ({new_max}) از تعداد بازیکنان فعلی ({count}) کمتر است.")
            game.max_players = new_max
            if count < new_max and game.status == GameStatus.FULL:
                game.status = GameStatus.OPEN
                promoted = GameService._promote_from_waitlist(uow, game, booking)
                notifications.extend(promoted)
            notifications.append({
                "user_id": None,  # broadcast به بازیکنان — در روتر گسترش می‌یابد
                "title": "🔧 تغییر ظرفیت بازی",
                "message": f"ظرفیت بازی «{game.name}» به {new_max} نفر تغییر کرد.",
                "data": {"game_id": game.id, "game_name": game.name},
                "notif_type": "game_capacity_changed",
                "broadcast_participants": game.id,
            })
        for field in ("name", "description", "skill_level", "visibility"):
            if field in changes and changes[field] is not None:
                setattr(game, field, changes[field])
        if "visibility" in changes and changes["visibility"] is not None:
            game.join_policy = JoinPolicy.APPROVAL if changes["visibility"] == GameVisibility.PUBLIC_APPROVAL else JoinPolicy.OPEN

        game.updated_at = _utcnow()
        uow.session.add(game)
        uow.session.flush()
        return GameService.to_response(uow, game, None, chain=(booking, slot, venue)), notifications

    @staticmethod
    def transition_status(uow: UnitOfWork, game_id: int, actor_id: int,
                          new_status: GameStatus) -> Tuple[dict, List[dict]]:
        game = uow.games.get_by_id_with_lock(game_id)
        if not game:
            raise _err(404, "GAME_NOT_FOUND", "بازی مورد نظر یافت نشد.")
        actor = uow.game_participants.get_by_game_and_user(game.id, actor_id)
        GameService._require_manage_permission(game, actor)

        allowed = {
            GameStatus.STARTED: (GameStatus.OPEN, GameStatus.FULL),
            GameStatus.COMPLETED: (GameStatus.STARTED,),
        }
        if new_status not in allowed or game.status not in allowed[new_status]:
            raise _err(409, "INVALID_STATUS_TRANSITION",
                       f"انتقال از «{game.status.value}» به «{new_status.value}» مجاز نیست.")
        game.status = new_status
        game.updated_at = _utcnow()
        uow.session.add(game)
        title = "🟢 بازی آغاز شد" if new_status == GameStatus.STARTED else "🏁 بازی به پایان رسید"
        message = f"بازی «{game.name}» {'آغاز شد' if new_status == GameStatus.STARTED else 'به پایان رسید'}."
        notifications = [{
            "user_id": None, "title": title, "message": message,
            "data": {"game_id": game.id, "game_name": game.name},
            "notif_type": f"game_{new_status.value}",
            "broadcast_participants": game.id,
        }]
        booking, slot, venue = GameService._chain(uow, game)
        return GameService.to_response(uow, game, None, chain=(booking, slot, venue)), notifications

    @staticmethod
    def cancel_game(uow: UnitOfWork, game_id: int, actor_id: int) -> Tuple[dict, List[dict]]:
        """لغو بازی: قفل، لغو لینک‌ها، استرداد سهم‌ها، اعلان به همه. Booking دست‌نخورده می‌ماند (قانون کسب‌وکار)."""
        game = uow.games.get_by_id_with_lock(game_id)
        if not game:
            raise _err(404, "GAME_NOT_FOUND", "بازی مورد نظر یافت نشد.")
        if game.organizer_id != actor_id:
            raise _err(403, "NOT_ORGANIZER", "فقط برگزارکننده می‌تواند بازی را لغو کند.")
        if game.status in (GameStatus.STARTED, GameStatus.COMPLETED):
            raise _err(409, "GAME_STARTED", "بازی آغاز/به‌پایان رسیده و قابل لغو نیست.")
        if game.status == GameStatus.CANCELLED:
            raise _err(409, "GAME_CANCELLED", "بازی از قبل لغو شده است.")

        game.status = GameStatus.CANCELLED
        game.updated_at = _utcnow()
        uow.session.add(game)
        uow.game_invite_links.deactivate_all(game.id)

        # استرداد سهم‌های پرداختی
        for payment in uow.game_payments.list_by_game(game.id):
            if payment.status == GamePaymentStatus.PAID:
                payment.status = GamePaymentStatus.REFUNDED
                payment.updated_at = _utcnow()
                uow.session.add(payment)

        # رد درخواست‌های باز + انصراف دعوت‌نامه‌ها
        for req, _ in uow.game_join_requests.get_pending_for_game(game.id):
            req.status = JoinRequestStatus.REJECTED
            req.reviewed_at = _utcnow()
            uow.session.add(req)
        for inv, _ in uow.game_invitations.list_by_game(game.id):
            if inv.status == InvitationStatus.PENDING:
                inv.status = InvitationStatus.REVOKED
                uow.session.add(inv)
        uow.session.flush()

        recipients = {p.user_id for p in uow.game_participants.list_accepted(game.id)}
        recipients.discard(actor_id)
        notifications = [{
            "user_id": None, "title": "❌ بازی لغو شد",
            "message": f"بازی «{game.name}» توسط برگزارکننده لغو شد و سهم‌های پرداختی مسترد می‌گردد.",
            "data": {"game_id": game.id, "game_name": game.name},
            "notif_type": "game_cancelled",
            "broadcast_participants": game.id,
        }]
        booking, slot, venue = GameService._chain(uow, game)
        return GameService.to_response(uow, game, None, chain=(booking, slot, venue)), notifications

    # ─────────────────────────── Participants ───────────────────────────

    @staticmethod
    def list_participants(uow: UnitOfWork, game_id: int, current_user: Optional[User]) -> List[dict]:
        game = GameService._get_game_or_404(uow, game_id)
        if game.visibility == GameVisibility.PRIVATE:
            if not current_user or not GameService._can_view(uow, game, current_user):
                raise _err(403, "PRIVATE_GAME", "این بازی خصوصی است.")
        result = []
        for p, name in uow.game_participants.list_by_game(game_id):
            payment = uow.game_payments.get_by_participant(p.id)
            result.append({
                "id": p.id, "game_id": p.game_id, "user_id": p.user_id, "full_name": name,
                "role": p.role.value, "status": p.status.value,
                "joined_at": p.joined_at, "left_at": p.left_at,
                "payment_status": payment.status.value if payment else None,
            })
        return result

    @staticmethod
    def set_participant_role(uow: UnitOfWork, game_id: int, actor_id: int,
                             target_user_id: int, role: ParticipantRole) -> dict:
        game = uow.games.get_by_id_with_lock(game_id)
        if not game:
            raise _err(404, "GAME_NOT_FOUND", "بازی مورد نظر یافت نشد.")
        actor = uow.game_participants.get_by_game_and_user(game.id, actor_id)
        if not actor or actor.role != ParticipantRole.ORGANIZER:
            raise _err(403, "NOT_ORGANIZER", "فقط برگزارکننده می‌تواند نقش‌ها را تغییر دهد.")
        if target_user_id == game.organizer_id:
            raise _err(409, "CANNOT_CHANGE_ORGANIZER_ROLE", "نقش برگزارکننده قابل تغییر نیست.")
        target = uow.game_participants.get_by_game_and_user(game.id, target_user_id)
        if not target or target.status != ParticipantStatus.ACCEPTED:
            raise _err(409, "NOT_A_PARTICIPANT", "این کاربر بازیکن قطعی نیست.")
        if role not in (ParticipantRole.ADMIN, ParticipantRole.MEMBER):
            raise _err(400, "INVALID_ROLE", "نقش قابل‌انتخاب فقط admin یا member است.")
        target.role = role
        uow.session.add(target)
        uow.session.flush()
        user = uow.users.get_by_id(target_user_id)
        return {"id": target.id, "game_id": game.id, "user_id": target.user_id,
                "full_name": user.full_name if user else None,
                "role": target.role.value, "status": target.status.value,
                "joined_at": target.joined_at, "left_at": target.left_at,
                "payment_status": None}

    # ─────────────────────────── پرداخت سهم ───────────────────────────

    @staticmethod
    def get_payment_summary(uow: UnitOfWork, game_id: int) -> dict:
        game = GameService._get_game_or_404(uow, game_id)
        booking, _, _ = GameService._chain(uow, game)
        payments = uow.game_payments.list_by_game(game.id)
        counts = uow.game_payments.count_by_status(game.id)
        return {
            "payment_mode": game.payment_mode,
            "total_price": booking.payment_amount,
            "price_per_player": GameService._share_amount(booking, game) if game.payment_mode == PaymentMode.SPLIT_PAYMENT else None,
            "paid_count": counts.get("paid", 0),
            "pending_count": counts.get("pending", 0),
            "payments": [
                {"id": p.id, "game_id": p.game_id, "participant_id": p.participant_id,
                 "user_id": p.user_id, "amount": p.amount, "status": p.status.value,
                 "gateway": p.gateway, "payment_reference": p.payment_reference,
                 "created_at": p.created_at, "paid_at": p.paid_at}
                for p in payments
            ],
        }

    @staticmethod
    def pay_share(uow: UnitOfWork, game_id: int, participant_id: int,
                  user_id: int) -> dict:
        """پرداخت mock سهم — الگو از payments.py (gateway=mock)."""
        game = GameService._get_game_or_404(uow, game_id)
        if game.payment_mode != PaymentMode.SPLIT_PAYMENT:
            raise _err(400, "PAYMENT_NOT_REQUIRED", "این بازی پرداخت سهمی ندارد.")
        participant = uow.game_participants.get_by_id(participant_id)
        if not participant or participant.game_id != game.id:
            raise _err(404, "PARTICIPANT_NOT_FOUND", "شرکت‌کننده یافت نشد.")
        if participant.user_id != user_id:
            raise _err(403, "NOT_AUTHORIZED", "فقط خودِ بازیکن می‌تواند سهمش را بپردازد.")
        booking, _, _ = GameService._chain(uow, game)

        payment = uow.game_payments.get_by_participant(participant_id)
        if not payment:
            amount = GameService._share_amount(booking, game)
            if amount <= 0:
                raise _err(400, "PAYMENT_NOT_REQUIRED", "سهم پرداختی تعریف نشده است.")
            payment = GamePayment(game_id=game.id, participant_id=participant_id,
                                  user_id=user_id, amount=amount)
            uow.game_payments.create(payment)
        if payment.status == GamePaymentStatus.PAID:
            raise _err(409, "PAYMENT_ALREADY_PAID", "این سهم از قبل پرداخت شده است.")

        payment.status = GamePaymentStatus.PAID
        payment.payment_reference = f"MOCK-{uuid.uuid4().hex[:12].upper()}"
        payment.paid_at = _utcnow()
        payment.updated_at = _utcnow()
        uow.session.add(payment)
        uow.session.flush()

        user = uow.users.get_by_id(user_id)
        notifications = [{
            "user_id": game.organizer_id,
            "title": "💰 سهم پرداخت شد",
            "message": f"{user.full_name if user else 'بازیکنی'} سهم خود در بازی «{game.name}» را پرداخت کرد.",
            "data": {"game_id": game.id, "game_name": game.name, "user_id": user_id,
                     "amount": payment.amount},
            "notif_type": "game_payment_paid",
        }]
        return {"payment": {"id": payment.id, "game_id": payment.game_id,
                            "participant_id": payment.participant_id, "user_id": payment.user_id,
                            "amount": payment.amount, "status": payment.status.value,
                            "gateway": payment.gateway, "payment_reference": payment.payment_reference,
                            "created_at": payment.created_at, "paid_at": payment.paid_at},
                "notifications": notifications}

    # ─────────────────────────── dispatch اعلان‌ها ───────────────────────────

    @staticmethod
    async def dispatch_notifications(uow: UnitOfWork, notifications: List[dict]):
        """اعلان‌های جمع‌شده توسط سرویس را ارسال می‌کند.

        - user_id مشخص → ارسال یکتا
        - broadcast_participants → ارسال به همه بازیکنان قطعی بازی
        """
        from app.services.notification_service import notification_service
        for n in notifications:
            broadcast_game_id = n.get("broadcast_participants")
            if broadcast_game_id:
                targets = {p.user_id for p in uow.game_participants.list_accepted(broadcast_game_id)}
            elif n.get("user_id"):
                targets = {n["user_id"]}
            else:
                continue
            for uid in targets:
                try:
                    await notification_service.send_to_user(
                        uid, n["title"], n["message"], n.get("data"), n.get("notif_type", "game"))
                except Exception as e:  # اعلان نباید جریان اصلی را بشکند
                    print(f"[GameService] notification failed: {e}")
