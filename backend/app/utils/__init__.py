# backend/app/utils/__init__.py
"""بسته‌ی ابزارها — عمداً خالی (lazy) است.

ماژول‌های مدل (app.models.staff و…) از app.utils.permissions تغذیه می‌شوند و
app.utils.auth خود app.database → app.models را import می‌کند؛ export ستاره‌ای
در __init__ چرخه‌ی import ایجاد می‌کرد. همه‌ی مصرف‌کنندهها `from app.utils.<mod>`
را مستقیم import می‌کنند (بازبینی‌شده).
"""