from sqlmodel import Session
from contextlib import contextmanager
from typing import Optional
from app.database import engine
from app.repositories.user_repository import UserRepository
from app.repositories.venue_repository import VenueRepository, ClubRepository
from app.repositories.slot_repository import SlotRepository
from app.repositories.booking_repository import BookingRepository
from app.repositories.competition_repository import CompetitionRepository
from app.repositories.contract_repository import (
    ContractRepository, ContractSlotRepository, ContractPaymentRepository,
    ContractAuditEventRepository,
)
from app.repositories.review_repository import ReviewRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.payment_repository import BookingPaymentRepository
from app.repositories.transaction_repository import TransactionRepository, ExpenseCategoryRepository
from app.repositories.game_repository import (
    GameRepository, GameParticipantRepository, GameJoinRequestRepository,
    GameInvitationRepository, GameInviteLinkRepository,
    GameWaitlistRepository, GamePaymentRepository,
)
from app.repositories.holiday_repository import HolidayRepository
from app.repositories.pricing_rule_repository import PricingRuleRepository
from app.repositories.coupon_repository import CouponRepository, CouponRedemptionRepository
from app.repositories.loyalty_repository import LoyaltyRepository
from app.repositories.favorite_repository import FavoriteVenueRepository
from app.repositories.staff_repository import (StaffAssignmentRepository,
                                                 SecurityAuditEventRepository)
from app.repositories.customer_repository import (VenueCustomerRepository,
                                                  CrmCampaignRepository)
from app.repositories.team_repository import (
    TeamRepository, TeamMemberRepository, TeamInvitationRepository,
    TeamJoinRequestRepository, TeamBookingRepository, TeamDuesRepository,
    TeamAuditEventRepository, TeamMessageRepository,
)
from app.repositories.quiz_repository import QuizQuestionRepository, QuizAttemptRepository

class UnitOfWork:
    
    def __init__(self):
        self._session: Optional[Session] = None
        self._repositories = {}
    
    def __enter__(self):
        self._session = Session(engine)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rollback()
        else:
            self.commit()
        self._session.close()
        self._session = None
    
    def commit(self):
        if self._session:
            self._session.commit()
    
    def rollback(self):
        if self._session:
            self._session.rollback()
    
    @property
    def session(self) -> Session:
        if not self._session:
            raise RuntimeError("Unit of work not started. Use 'with' statement.")
        return self._session
    
    @property
    def users(self) -> UserRepository:
        if "users" not in self._repositories:
            self._repositories["users"] = UserRepository(self.session)
        return self._repositories["users"]
    
    @property
    def venues(self) -> VenueRepository:
        if "venues" not in self._repositories:
            self._repositories["venues"] = VenueRepository(self.session)
        return self._repositories["venues"]
    
    @property
    def clubs(self) -> ClubRepository:
        if "clubs" not in self._repositories:
            self._repositories["clubs"] = ClubRepository(self.session)
        return self._repositories["clubs"]
    
    @property
    def slots(self) -> SlotRepository:
        if "slots" not in self._repositories:
            self._repositories["slots"] = SlotRepository(self.session)
        return self._repositories["slots"]
    
    @property
    def bookings(self) -> BookingRepository:
        if "bookings" not in self._repositories:
            self._repositories["bookings"] = BookingRepository(self.session)
        return self._repositories["bookings"]
    
    @property
    def competitions(self) -> CompetitionRepository:
        if "competitions" not in self._repositories:
            self._repositories["competitions"] = CompetitionRepository(self.session)
        return self._repositories["competitions"]
    
    @property
    def contracts(self) -> ContractRepository:
        if "contracts" not in self._repositories:
            self._repositories["contracts"] = ContractRepository(self.session)
        return self._repositories["contracts"]
    
    @property
    def contract_slots(self) -> ContractSlotRepository:
        if "contract_slots" not in self._repositories:
            self._repositories["contract_slots"] = ContractSlotRepository(self.session)
        return self._repositories["contract_slots"]
    
    @property
    def contract_payments(self) -> ContractPaymentRepository:
        if "contract_payments" not in self._repositories:
            self._repositories["contract_payments"] = ContractPaymentRepository(self.session)
        return self._repositories["contract_payments"]

    @property
    def contract_audits(self) -> ContractAuditEventRepository:
        if "contract_audits" not in self._repositories:
            self._repositories["contract_audits"] = ContractAuditEventRepository(self.session)
        return self._repositories["contract_audits"]

    @property
    def reviews(self) -> ReviewRepository:
        if "reviews" not in self._repositories:
            self._repositories["reviews"] = ReviewRepository(self.session)
        return self._repositories["reviews"]

    @property
    def notifications(self) -> NotificationRepository:
        if "notifications" not in self._repositories:
            self._repositories["notifications"] = NotificationRepository(self.session)
        return self._repositories["notifications"]

    @property
    def payments(self) -> BookingPaymentRepository:
        if "payments" not in self._repositories:
            self._repositories["payments"] = BookingPaymentRepository(self.session)
        return self._repositories["payments"]

    @property
    def transactions(self) -> TransactionRepository:
        if "transactions" not in self._repositories:
            self._repositories["transactions"] = TransactionRepository(self.session)
        return self._repositories["transactions"]

    @property
    def expense_categories(self) -> ExpenseCategoryRepository:
        if "expense_categories" not in self._repositories:
            self._repositories["expense_categories"] = ExpenseCategoryRepository(self.session)
        return self._repositories["expense_categories"]

    @property
    def games(self) -> GameRepository:
        if "games" not in self._repositories:
            self._repositories["games"] = GameRepository(self.session)
        return self._repositories["games"]

    @property
    def game_participants(self) -> GameParticipantRepository:
        if "game_participants" not in self._repositories:
            self._repositories["game_participants"] = GameParticipantRepository(self.session)
        return self._repositories["game_participants"]

    @property
    def game_join_requests(self) -> GameJoinRequestRepository:
        if "game_join_requests" not in self._repositories:
            self._repositories["game_join_requests"] = GameJoinRequestRepository(self.session)
        return self._repositories["game_join_requests"]

    @property
    def game_invitations(self) -> GameInvitationRepository:
        if "game_invitations" not in self._repositories:
            self._repositories["game_invitations"] = GameInvitationRepository(self.session)
        return self._repositories["game_invitations"]

    @property
    def game_invite_links(self) -> GameInviteLinkRepository:
        if "game_invite_links" not in self._repositories:
            self._repositories["game_invite_links"] = GameInviteLinkRepository(self.session)
        return self._repositories["game_invite_links"]

    @property
    def game_waitlist(self) -> GameWaitlistRepository:
        if "game_waitlist" not in self._repositories:
            self._repositories["game_waitlist"] = GameWaitlistRepository(self.session)
        return self._repositories["game_waitlist"]

    @property
    def game_payments(self) -> GamePaymentRepository:
        if "game_payments" not in self._repositories:
            self._repositories["game_payments"] = GamePaymentRepository(self.session)
        return self._repositories["game_payments"]

    @property
    def holidays(self) -> HolidayRepository:
        if "holidays" not in self._repositories:
            self._repositories["holidays"] = HolidayRepository(self.session)
        return self._repositories["holidays"]

    @property
    def pricing_rules(self) -> PricingRuleRepository:
        if "pricing_rules" not in self._repositories:
            self._repositories["pricing_rules"] = PricingRuleRepository(self.session)
        return self._repositories["pricing_rules"]

    @property
    def coupons(self) -> CouponRepository:
        if "coupons" not in self._repositories:
            self._repositories["coupons"] = CouponRepository(self.session)
        return self._repositories["coupons"]

    @property
    def coupon_redemptions(self) -> CouponRedemptionRepository:
        if "coupon_redemptions" not in self._repositories:
            self._repositories["coupon_redemptions"] = CouponRedemptionRepository(self.session)
        return self._repositories["coupon_redemptions"]

    @property
    def loyalty(self) -> LoyaltyRepository:
        if "loyalty" not in self._repositories:
            self._repositories["loyalty"] = LoyaltyRepository(self.session)
        return self._repositories["loyalty"]

    @property
    def teams(self) -> TeamRepository:
        if "teams" not in self._repositories:
            self._repositories["teams"] = TeamRepository(self.session)
        return self._repositories["teams"]

    @property
    def team_members(self) -> TeamMemberRepository:
        if "team_members" not in self._repositories:
            self._repositories["team_members"] = TeamMemberRepository(self.session)
        return self._repositories["team_members"]

    @property
    def team_invitations(self) -> TeamInvitationRepository:
        if "team_invitations" not in self._repositories:
            self._repositories["team_invitations"] = TeamInvitationRepository(self.session)
        return self._repositories["team_invitations"]

    @property
    def team_join_requests(self) -> TeamJoinRequestRepository:
        if "team_join_requests" not in self._repositories:
            self._repositories["team_join_requests"] = TeamJoinRequestRepository(self.session)
        return self._repositories["team_join_requests"]

    @property
    def team_bookings(self) -> TeamBookingRepository:
        if "team_bookings" not in self._repositories:
            self._repositories["team_bookings"] = TeamBookingRepository(self.session)
        return self._repositories["team_bookings"]

    @property
    def team_dues(self) -> TeamDuesRepository:
        if "team_dues" not in self._repositories:
            self._repositories["team_dues"] = TeamDuesRepository(self.session)
        return self._repositories["team_dues"]

    @property
    def team_messages(self) -> TeamMessageRepository:
        if "team_messages" not in self._repositories:
            self._repositories["team_messages"] = TeamMessageRepository(self.session)
        return self._repositories["team_messages"]

    @property
    def team_audits(self) -> TeamAuditEventRepository:
        if "team_audits" not in self._repositories:
            self._repositories["team_audits"] = TeamAuditEventRepository(self.session)
        return self._repositories["team_audits"]

    @property
    def staff(self) -> StaffAssignmentRepository:
        if "staff" not in self._repositories:
            self._repositories["staff"] = StaffAssignmentRepository(self.session)
        return self._repositories["staff"]

    @property
    def security_audits(self) -> SecurityAuditEventRepository:
        if "security_audits" not in self._repositories:
            self._repositories["security_audits"] = SecurityAuditEventRepository(self.session)
        return self._repositories["security_audits"]

    @property
    def customers(self) -> VenueCustomerRepository:
        if "customers" not in self._repositories:
            self._repositories["customers"] = VenueCustomerRepository(self.session)
        return self._repositories["customers"]

    @property
    def crm_campaigns(self) -> CrmCampaignRepository:
        if "crm_campaigns" not in self._repositories:
            self._repositories["crm_campaigns"] = CrmCampaignRepository(self.session)
        return self._repositories["crm_campaigns"]

    @property
    def favorites(self) -> FavoriteVenueRepository:
        if "favorites" not in self._repositories:
            self._repositories["favorites"] = FavoriteVenueRepository(self.session)
        return self._repositories["favorites"]

    @property
    def quiz_questions(self) -> QuizQuestionRepository:
        if "quiz_questions" not in self._repositories:
            self._repositories["quiz_questions"] = QuizQuestionRepository(self.session)
        return self._repositories["quiz_questions"]

    @property
    def quiz_attempts(self) -> QuizAttemptRepository:
        if "quiz_attempts" not in self._repositories:
            self._repositories["quiz_attempts"] = QuizAttemptRepository(self.session)
        return self._repositories["quiz_attempts"]

def get_unit_of_work():
    uow = UnitOfWork()
    uow._session = Session(engine)
    try:
        yield uow
        uow.commit()
    except Exception:
        uow.rollback()
        raise
    finally:
        uow._session.close()
        uow._session = None
