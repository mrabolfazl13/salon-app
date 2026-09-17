# backend/tests/helpers.py
"""کمکی‌های مشترک تست‌ها."""


def auth(phone: str) -> dict:
    """هدر احراز هویت تست — توکن = شماره تلفن (resolve در conftest)."""
    return {"Authorization": f"Bearer {phone}"}


def err_code(response) -> str | None:
    """استخراج کد خطای ساختارمند از detail دیکشنری."""
    try:
        detail = response.json().get("detail")
    except Exception:
        return None
    if isinstance(detail, dict):
        return detail.get("code")
    return None


class _FakePipeline:
    def __init__(self, redis):
        self.redis = redis
        self.ops = []

    def set(self, key, value, ex=None):
        self.ops.append(("set", key, value))
        return self

    def delete(self, key):
        self.ops.append(("delete", key))
        return self

    def sadd(self, key, value):
        self.ops.append(("sadd", key, value))
        return self

    def srem(self, key, value):
        self.ops.append(("srem", key, value))
        return self

    def execute(self):
        out = []
        for op in self.ops:
            kind = op[0]
            if kind == "set":
                out.append(self.redis.set(op[1], op[2]))
            elif kind == "delete":
                out.append(self.redis.delete(op[1]))
            elif kind == "sadd":
                out.append(self.redis.sadd(op[1], op[2]))
            elif kind == "srem":
                out.append(self.redis.srem(op[1], op[2]))
        self.ops = []
        return out


class FakeRedis:
    """شبیه‌ساز in-memory ریدیس — سازگار با API موردنظر سرویس‌های pending/verification/rate-limit"""

    def __init__(self):
        self.store: dict = {}
        self.sets: dict = {}

    def get(self, key):
        return self.store.get(key)

    def set(self, key, value, ex=None, nx=False):
        if nx and key in self.store:
            return None
        self.store[key] = value
        return True

    def setex(self, key, ttl, value):
        self.store[key] = value
        return True

    def exists(self, key):
        if key in self.store:
            return 1
        if key in self.sets:
            return 1
        return 0

    def delete(self, *keys):
        n = 0
        for k in keys:
            if k in self.store:
                del self.store[k]
                n += 1
            if k in self.sets:
                del self.sets[k]
                n += 1
        return n

    def sadd(self, key, value):
        s = self.sets.setdefault(key, set())
        changed = str(value) not in s
        s.add(str(value))
        return 1 if changed else 0

    def srem(self, key, value):
        s = self.sets.get(key)
        if s and str(value) in s:
            s.discard(str(value))
            return 1
        return 0

    def smembers(self, key):
        return set(self.sets.get(key, set()))

    def keys(self, pattern="*"):
        import fnmatch
        return [k for k in self.store if fnmatch.fnmatch(k, pattern)]

    def scan_iter(self, match="*", count=None):
        import fnmatch
        for k in self.store:
            if fnmatch.fnmatch(k, match):
                yield k

    def incr(self, key):
        try:
            v = int(self.store.get(key) or 0) + 1
        except (TypeError, ValueError):
            v = 1
        self.store[key] = str(v)
        return v

    def expire(self, key, seconds):
        return True

    def pipeline(self):
        return _FakePipeline(self)
