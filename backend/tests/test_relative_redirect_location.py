# -*- coding: utf-8 -*-
"""backend/tests/test_relative_redirect_location.py

رگرسیونِ «لیست سالن‌ها روی پروداکشن جواب نمی‌داد» (۱۴۰۵/۰۸/۰۲):
مسیرهای API روی «/» ثبت شده‌اند، پس `/api/v1/venues?category=futsal` یک ۳۰۷
می‌گیرد. Starlette آن Location را مطلق و با طرح‌واژهٔ دیده‌شده توسط uvicorn
(= http، چون nginx داخل شبکه وصل می‌شود) می‌سازد؛ مرورگر روی صفحهٔ HTTPS
دنبال‌کردنِ ریدایرکت http را به‌عنوان mixed-content می‌بندد و درخواست هرگز به
اپ نمی‌رسد. پس Locationِ همان‌میزبان باید نسبی بماند.
"""
from fastapi.testclient import TestClient

from app.main import app as fastapi_app
from app.utils.redirects import relative_location


def _client():
    # بدون context-manager ⇒ lifespan اجرا نمی‌شود؛ follow_redirects=False تا
    # خودِ هدر Location سنجیده شود نه پاسخ پایانی.
    return TestClient(
        fastapi_app,
        base_url="https://salon.absadeghi.ir",
        follow_redirects=False,
    )


def test_slash_redirect_location_is_relative_not_absolute():
    response = _client().get("/api/v1/venues?category=futsal")
    assert response.status_code == 307
    location = response.headers["location"]
    assert location == "/api/v1/venues/?category=futsal"
    assert not location.startswith("http"), f"absolute Location blocks on HTTPS: {location}"


def test_slash_redirect_keeps_query_for_other_collection_routes():
    response = _client().get("/api/v1/venues?limit=48")
    assert response.status_code == 307
    assert response.headers["location"] == "/api/v1/venues/?limit=48"


def test_external_redirect_stays_absolute():
    """درگاه پرداخت و هر میزبان بیرونی دست‌نخورده می‌مانند."""
    gateway = "https://www.zarinpal.com/pg/v4/Payment/112233"
    assert relative_location(gateway, "salon.absadeghi.ir") == gateway


def test_different_host_redirect_stays_absolute():
    assert (
        relative_location("http://localhost:8000/api/v1/venues/", "salon.absadeghi.ir")
        == "http://localhost:8000/api/v1/venues/"
    )


def test_already_relative_location_is_untouched():
    assert relative_location("/api/v1/venues/?category=gym", "salon.absadeghi.ir") == "/api/v1/venues/?category=gym"


def test_host_port_is_compared_without_the_port():
    """کلاینت با پورت (dev: localhost:8000) هم نسبی می‌شود."""
    assert relative_location("http://localhost:8000/api/v1/venues/", "localhost:8000") == "/api/v1/venues/"
