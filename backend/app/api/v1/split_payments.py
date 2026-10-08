# backend/app/api/v1/split_payments.py
"""API endpoints for team split payment management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_session
from app.models.split_payment import (
    TeamSplitPayment, SplitPaymentShare, SplitPaymentAuditEvent,
    SplitMethod, SplitPaymentStatus, ShareStatus,
)
from app.models.game import Game
from app.models.user import User
from app.utils.auth import get_current_user
from pydantic import BaseModel, Field


router = APIRouter(prefix="/split-payments", tags=["split-payments"])


# ─────────────────────────── Schemas ───────────────────────────

class SplitPaymentCreate(BaseModel):
    """Request body for creating a split payment."""
    game_id: int
    total_amount: int = Field(gt=0, description="Total amount in rials")
    split_method: SplitMethod = SplitMethod.EQUAL
    deadline: datetime
    notes: Optional[str] = Field(None, max_length=1000)
    
    # For CUSTOM or PERCENTAGE methods
    shares: Optional[List[dict]] = Field(
        None, 
        description="List of {user_id, amount} or {user_id, percentage}"
    )


class SplitPaymentShareResponse(BaseModel):
    """Individual share information."""
    id: int
    user_id: int
    user_name: Optional[str] = None
    amount: int
    status: ShareStatus
    is_paid: bool
    paid_at: Optional[datetime] = None


class SplitPaymentResponse(BaseModel):
    """Split payment details with shares."""
    id: int
    game_id: int
    organizer_id: int
    team_id: Optional[int] = None
    total_amount: int
    split_method: SplitMethod
    status: SplitPaymentStatus
    paid_amount: int
    remaining_amount: int
    progress_percentage: float
    deadline: datetime
    notes: Optional[str] = None
    created_at: datetime
    shares: List[SplitPaymentShareResponse] = []


# ─────────────────────────── Helpers ───────────────────────────

def _calculate_shares(
    split_method: SplitMethod,
    total_amount: int,
    participants: List[dict],
    custom_shares: Optional[List[dict]] = None,
) -> List[dict]:
    """Calculate individual shares based on split method."""
    
    if split_method == SplitMethod.EQUAL:
        # Divide equally among all participants
        count = len(participants)
        base_amount = total_amount // count
        remainder = total_amount % count
        
        shares = []
        for i, participant in enumerate(participants):
            # Add remainder to first share(s) if not evenly divisible
            amount = base_amount + (1 if i < remainder else 0)
            shares.append({
                "user_id": participant["user_id"],
                "amount": amount,
            })
        
        return shares
    
    elif split_method == SplitMethod.CUSTOM:
        if not custom_shares:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Custom shares must be provided for CUSTOM split method"
            )
        
        # Validate total matches
        custom_total = sum(s["amount"] for s in custom_shares)
        if custom_total != total_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Custom shares total ({custom_total}) does not match total amount ({total_amount})"
            )
        
        return custom_shares
    
    elif split_method == SplitMethod.PERCENTAGE:
        if not custom_shares:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Percentage shares must be provided for PERCENTAGE split method"
            )
        
        # Convert percentages to amounts
        shares = []
        for share in custom_shares:
            percentage = share.get("percentage", 0)
            amount = int(total_amount * percentage / 100)
            shares.append({
                "user_id": share["user_id"],
                "amount": amount,
            })
        
        return shares
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid split method: {split_method}"
        )


# ─────────────────────────── Endpoints ───────────────────────────

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_split_payment(
    data: SplitPaymentCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Create a new split payment for a game.
    
    The organizer can split costs among game participants using:
    - EQUAL: Divide equally among all participants
    - CUSTOM: Specify exact amount per person
    - PERCENTAGE: Specify percentage per person
    """
    
    # Verify game exists and user is organizer
    game = session.get(Game, data.game_id)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    if game.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only game organizer can create split payments"
        )
    
    # Check deadline is in the future
    if data.deadline <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deadline must be in the future"
        )
    
    # Get game participants
    from app.models.game import GameParticipant, ParticipantStatus
    participants_stmt = select(GameParticipant).where(
        GameParticipant.game_id == data.game_id,
        GameParticipant.status == ParticipantStatus.CONFIRMED
    )
    participants = session.exec(participants_stmt).all()
    
    if not participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No confirmed participants in this game"
        )
    
    participant_list = [{"user_id": p.user_id} for p in participants]
    
    # Calculate shares
    try:
        shares = _calculate_shares(
            data.split_method,
            data.total_amount,
            participant_list,
            data.shares,
        )
    except HTTPException:
        raise
    
    # Create split payment
    split_payment = TeamSplitPayment(
        game_id=data.game_id,
        organizer_id=current_user.id,
        team_id=game.team_id,  # Link to team if game is for a team
        total_amount=data.total_amount,
        split_method=data.split_method,
        deadline=data.deadline,
        notes=data.notes,
    )
    session.add(split_payment)
    session.flush()  # Get ID
    
    # Create shares
    for share_data in shares:
        share = SplitPaymentShare(
            split_payment_id=split_payment.id,
            user_id=share_data["user_id"],
            amount=share_data["amount"],
            status=ShareStatus.PENDING,
        )
        session.add(share)
    
    # Audit log
    audit = SplitPaymentAuditEvent(
        split_payment_id=split_payment.id,
        user_id=current_user.id,
        action="created",
        data=f'{{"method": "{data.split_method}", "total": {data.total_amount}}}',
    )
    session.add(audit)
    
    session.commit()
    session.refresh(split_payment)
    
    return {
        "id": split_payment.id,
        "message": "Split payment created successfully",
        "shares_count": len(shares),
    }


@router.get("/{payment_id}", response_model=SplitPaymentResponse)
async def get_split_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get split payment details with all shares."""
    
    split_payment = session.get(TeamSplitPayment, payment_id)
    if not split_payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Split payment not found"
        )
    
    # Get shares with user info
    from app.models.user import User as UserModel
    shares_stmt = (
        select(SplitPaymentShare, UserModel.full_name)
        .join(UserModel, SplitPaymentShare.user_id == UserModel.id)
        .where(SplitPaymentShare.split_payment_id == payment_id)
    )
    share_rows = session.exec(shares_stmt).all()
    
    shares_response = []
    for share, user_name in share_rows:
        shares_response.append(SplitPaymentShareResponse(
            id=share.id,
            user_id=share.user_id,
            user_name=user_name,
            amount=share.amount,
            status=share.status,
            is_paid=share.is_paid,
            paid_at=share.paid_at,
        ))
    
    return SplitPaymentResponse(
        id=split_payment.id,
        game_id=split_payment.game_id,
        organizer_id=split_payment.organizer_id,
        team_id=split_payment.team_id,
        total_amount=split_payment.total_amount,
        split_method=split_payment.split_method,
        status=split_payment.status,
        paid_amount=split_payment.paid_amount,
        remaining_amount=split_payment.remaining_amount,
        progress_percentage=split_payment.progress_percentage,
        deadline=split_payment.deadline,
        notes=split_payment.notes,
        created_at=split_payment.created_at,
        shares=shares_response,
    )


@router.post("/{payment_id}/shares/{share_id}/pay")
async def pay_share(
    payment_id: int,
    share_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Mark a share as paid.
    
    In production, this would integrate with payment gateway.
    For now, it marks the share as paid directly.
    """
    
    share = session.get(SplitPaymentShare, share_id)
    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found"
        )
    
    if share.split_payment_id != payment_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Share does not belong to this split payment"
        )
    
    if share.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only pay your own shares"
        )
    
    if share.is_paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Share already paid"
        )
    
    # Mark as paid
    share.status = ShareStatus.PAID
    share.paid_at = datetime.now(timezone.utc)
    
    # Update parent split payment
    split_payment = session.get(TeamSplitPayment, payment_id)
    split_payment.paid_amount += share.amount
    split_payment.updated_at = datetime.now(timezone.utc)
    
    # Check if all shares are paid
    all_shares_stmt = select(SplitPaymentShare).where(
        SplitPaymentShare.split_payment_id == payment_id
    )
    all_shares = session.exec(all_shares_stmt).all()
    
    if all(s.is_paid for s in all_shares):
        split_payment.status = SplitPaymentStatus.COMPLETED
    
    # Audit log
    audit = SplitPaymentAuditEvent(
        split_payment_id=payment_id,
        user_id=current_user.id,
        action="share_paid",
        data=f'{{"share_id": {share_id}, "amount": {share.amount}}}',
    )
    session.add(audit)
    
    session.commit()
    
    return {
        "message": "Share paid successfully",
        "remaining": split_payment.remaining_amount,
        "progress": split_payment.progress_percentage,
    }


@router.get("/team/{team_id}")
async def list_team_split_payments(
    team_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """List all split payments for a team."""
    
    # Verify user is team member
    from app.models.team import TeamMember
    membership = session.exec(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == current_user.id,
        )
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a team member to view split payments"
        )
    
    # Get split payments
    stmt = (
        select(TeamSplitPayment)
        .where(TeamSplitPayment.team_id == team_id)
        .order_by(TeamSplitPayment.created_at.desc())
    )
    payments = session.exec(stmt).all()
    
    return [
        {
            "id": p.id,
            "game_id": p.game_id,
            "total_amount": p.total_amount,
            "paid_amount": p.paid_amount,
            "remaining_amount": p.remaining_amount,
            "status": p.status,
            "progress_percentage": p.progress_percentage,
            "deadline": p.deadline,
            "created_at": p.created_at,
        }
        for p in payments
    ]
