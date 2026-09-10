# -*- coding: utf-8 -*-
"""نسخه‌ی قدیمی seed - دیتای واقعی سالن‌های قم به app/seed_qom.py منتقل شد.
این اسکریپت فقط نسخه‌ی جدید را اجرا می‌کند:
   python backend/seed_qom.py          (ویندوز)
   docker exec -w /app futsal_backend python -m app.seed_qom   (WSL/Docker)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.seed_qom import seed

if __name__ == "__main__":
    seed()
