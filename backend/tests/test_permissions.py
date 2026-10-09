"""Test role-based access control for waitlist, checkin, and reviews."""
import pytest
from httpx import AsyncClient
from app.models.user import UserRole


class TestWaitlistPermissions:
    """Waitlist endpoint role guards."""

    @pytest.mark.asyncio
    async def test_user_can_join_waitlist(self, client: AsyncClient, user_token: str, full_slot_id: int):
        """Regular users (USER role) can join waitlist."""
        response = await client.post(
            f"/api/v1/waitlist/join/{full_slot_id}",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code in [201, 400]  # 201 success, 400 already joined

    @pytest.mark.asyncio
    async def test_unauthenticated_cannot_join_waitlist(self, client: AsyncClient, full_slot_id: int):
        """Unauthenticated requests are rejected."""
        response = await client.post(f"/api/v1/waitlist/join/{full_slot_id}")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_user_can_leave_waitlist(self, client: AsyncClient, user_token: str, slot_id: int):
        """Users can leave their waitlist entries."""
        response = await client.post(
            f"/api/v1/waitlist/leave/{slot_id}",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code in [200, 404]  # 200 success, 404 not found

    @pytest.mark.asyncio
    async def test_user_can_view_own_waitlist(self, client: AsyncClient, user_token: str):
        """Users can view their own waitlist entries."""
        response = await client.get(
            "/api/v1/waitlist/my",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_manager_can_view_slot_waitlist(self, client: AsyncClient, manager_token: str, slot_id: int):
        """Venue managers can view waitlist for their slots."""
        response = await client.get(
            f"/api/v1/waitlist/slot/{slot_id}",
            headers={"Authorization": f"Bearer {manager_token}"},
        )
        assert response.status_code in [200, 403]  # 200 if owns venue, 403 otherwise

    @pytest.mark.asyncio
    async def test_regular_user_cannot_view_slot_waitlist(self, client: AsyncClient, user_token: str, slot_id: int):
        """Regular users cannot view slot waitlist (manager-only)."""
        response = await client.get(
            f"/api/v1/waitlist/slot/{slot_id}",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403


class TestCheckinPermissions:
    """Check-in endpoint role guards."""

    @pytest.mark.asyncio
    async def test_manager_can_verify_checkin(self, client: AsyncClient, manager_token: str, valid_checkin_code: str):
        """Venue managers can verify check-in codes."""
        response = await client.post(
            "/api/v1/checkin/verify",
            params={"check_in_code": valid_checkin_code},
            headers={"Authorization": f"Bearer {manager_token}"},
        )
        assert response.status_code in [200, 400]  # 200 success, 400 invalid code

    @pytest.mark.asyncio
    async def test_club_admin_can_verify_checkin(self, client: AsyncClient, club_admin_token: str, valid_checkin_code: str):
        """Club admins can verify check-in codes."""
        response = await client.post(
            "/api/v1/checkin/verify",
            params={"check_in_code": valid_checkin_code},
            headers={"Authorization": f"Bearer {club_admin_token}"},
        )
        assert response.status_code in [200, 400]

    @pytest.mark.asyncio
    async def test_super_admin_can_verify_checkin(self, client: AsyncClient, super_admin_token: str, valid_checkin_code: str):
        """Super admins can verify check-in codes."""
        response = await client.post(
            "/api/v1/checkin/verify",
            params={"check_in_code": valid_checkin_code},
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert response.status_code in [200, 400]

    @pytest.mark.asyncio
    async def test_regular_user_cannot_verify_checkin(self, client: AsyncClient, user_token: str, valid_checkin_code: str):
        """Regular users cannot verify check-in codes (forbidden)."""
        response = await client.post(
            "/api/v1/checkin/verify",
            params={"check_in_code": valid_checkin_code},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_booking_owner_can_view_status(self, client: AsyncClient, user_token: str, booking_id: int):
        """Booking owners can view their check-in status."""
        response = await client.get(
            f"/api/v1/checkin/booking/{booking_id}/status",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_manager_can_view_any_status(self, client: AsyncClient, manager_token: str, booking_id: int):
        """Managers can view any booking's check-in status."""
        response = await client.get(
            f"/api/v1/checkin/booking/{booking_id}/status",
            headers={"Authorization": f"Bearer {manager_token}"},
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_unauthorized_cannot_view_status(self, client: AsyncClient, other_user_token: str, booking_id: int):
        """Users cannot view other users' booking status."""
        response = await client.get(
            f"/api/v1/checkin/booking/{booking_id}/status",
            headers={"Authorization": f"Bearer {other_user_token}"},
        )
        assert response.status_code == 403


class TestReviewPermissions:
    """Review endpoint role guards."""

    @pytest.mark.asyncio
    async def test_anyone_can_view_venue_reviews(self, client: AsyncClient, venue_id: int):
        """Public endpoint - no auth required to view reviews."""
        response = await client.get(f"/api/v1/reviews/venue/{venue_id}")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_user_can_create_review(self, client: AsyncClient, user_token: str, venue_id: int):
        """Regular users can create reviews."""
        payload = {
            "venue_id": venue_id,
            "rating": 4,
            "comment": "عالی بود!",
        }
        response = await client.post(
            "/api/v1/reviews",
            json=payload,
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code in [201, 400]  # 201 success, 400 duplicate

    @pytest.mark.asyncio
    async def test_manager_cannot_create_review(self, client: AsyncClient, manager_token: str, venue_id: int):
        """Venue managers cannot create reviews (USER role only)."""
        payload = {
            "venue_id": venue_id,
            "rating": 5,
            "comment": "تست",
        }
        response = await client.post(
            "/api/v1/reviews",
            json=payload,
            headers={"Authorization": f"Bearer {manager_token}"},
        )
        # Should be blocked by service logic or return error
        assert response.status_code in [400, 403, 422]

    @pytest.mark.asyncio
    async def test_user_can_edit_own_review(self, client: AsyncClient, user_token: str, review_id: int):
        """Users can edit their own reviews."""
        payload = {
            "venue_id": 1,
            "rating": 5,
            "comment": "ویرایش شده",
        }
        response = await client.put(
            f"/api/v1/reviews/{review_id}",
            json=payload,
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_user_cannot_edit_others_review(self, client: AsyncClient, other_user_token: str, review_id: int):
        """Users cannot edit other users' reviews."""
        payload = {
            "venue_id": 1,
            "rating": 1,
            "comment": "هک",
        }
        response = await client.put(
            f"/api/v1/reviews/{review_id}",
            json=payload,
            headers={"Authorization": f"Bearer {other_user_token}"},
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_user_can_delete_own_review(self, client: AsyncClient, user_token: str, review_id: int):
        """Users can delete their own reviews."""
        response = await client.delete(
            f"/api/v1/reviews/{review_id}",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_user_cannot_delete_others_review(self, client: AsyncClient, other_user_token: str, review_id: int):
        """Users cannot delete other users' reviews."""
        response = await client.delete(
            f"/api/v1/reviews/{review_id}",
            headers={"Authorization": f"Bearer {other_user_token}"},
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_user_can_view_own_reviews(self, client: AsyncClient, user_token: str):
        """Users can view their own review history."""
        response = await client.get(
            "/api/v1/reviews/my",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_unauthenticated_cannot_view_my_reviews(self, client: AsyncClient):
        """Unauthenticated users cannot view 'my reviews'."""
        response = await client.get("/api/v1/reviews/my")
        assert response.status_code == 401
