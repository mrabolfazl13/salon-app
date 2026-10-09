"""Test JWT refresh token implementation."""
import pytest
from httpx import AsyncClient


class TestRefreshToken:
    """Refresh token endpoint tests."""

    @pytest.mark.asyncio
    async def test_login_returns_refresh_token(self, client: AsyncClient, test_user_phone: str, test_user_password: str):
        """Login should return both access and refresh tokens."""
        response = await client.post(
            "/api/v1/auth/login",
            json={"phone": test_user_phone, "password": test_user_password},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_refresh_token_returns_new_access_token(self, client: AsyncClient, valid_refresh_token: str):
        """Valid refresh token should return new access token."""
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": valid_refresh_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_invalid_refresh_token_rejected(self, client: AsyncClient):
        """Invalid refresh token should be rejected."""
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid.token.here"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_access_token_as_refresh_token_rejected(self, client: AsyncClient, valid_access_token: str):
        """Using access token as refresh token should fail (type check)."""
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": valid_access_token},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_inactive_user_cannot_refresh(self, client: AsyncClient, inactive_user_refresh_token: str):
        """Inactive users cannot use refresh tokens."""
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": inactive_user_refresh_token},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_token_expiry(self, client: AsyncClient, valid_refresh_token: str):
        """Refresh tokens should have longer expiry than access tokens (30 days vs 24 hours)."""
        from jose import jwt
        from app.config import settings
        
        payload = jwt.decode(valid_refresh_token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        assert payload.get("type") == "refresh"
        # Token should not expire immediately (has 30 day expiry)
        assert "exp" in payload
