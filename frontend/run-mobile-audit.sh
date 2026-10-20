#!/bin/sh
# اجرای harness ممیزی موبایل. آرگومان اختیاری: فهرست نقش‌ها برای اجرای تکه‌ای
# مثال: sh run-mobile-audit.sh guest,user
cd "$(dirname "$0")"
# Node 24 روی این ماشین با RAM آزاد کم، سقف heap را ~۱۶۰MB می‌گذارد و worker را
# وسط sweep با code=134 می‌کشد (NewSpace allocation failed). سقف را صریح می‌کنیم؛
# commit charge ماشین (≈۱۵GB) جای رشد دارد.
export NODE_OPTIONS="--max-old-space-size=1024 --max-semi-space-size=64"
export MOBILE_AUDIT=1
if [ -n "$1" ]; then export MOBILE_AUDIT_ROLES="$1"; fi
if [ -n "$2" ]; then export MOBILE_AUDIT_ROUTES="$2"; fi
if [ "$3" = "skip-sweep" ]; then export MOBILE_AUDIT_SKIP_SWEEP=1; fi
exec pnpm exec playwright test e2e/mobile-audit.spec.ts --project=chromium --reporter=line
