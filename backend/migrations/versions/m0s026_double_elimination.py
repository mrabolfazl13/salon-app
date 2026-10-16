# backend/migrations/versions/m0s026_double_elimination.py
"""دو-حذفی (P005/C2.6): عضو `DOUBLE_ELIMINATION` + ستون «کدام نیمه» + لینکِ بازنده.

سه چیز لازم شد، هر سه اندازه‌گیری‌شده (نه حدس):

۱) نوع native `tournamentformat` روی PostgreSQL باید برچسبِ تازه را بگیرد
   (`ALTER TYPE … ADD VALUE`) و تا کامیت نشدنی است ⇒ داخل `autocommit_block()`
   (الگوی رسمی alembic، همان m0s021/m0s025). روی SQLite همان ستون
   `VARCHAR(18)` **بدون CHECK** است (از `sqlite_master` خوانده شد) ⇒ بی‌اثر.
   طول ستون هم قفل نمی‌شود: `DOUBLE_ELIMINATION` دقیقاً ۱۸ کاراکتر است، همان‌قدر
   `SINGLE_ELIMINATION` ⇒ `VARCHAR(18)` جا می‌دهد.

۲) `tournament_rounds.bracket`: نوع تازهٔ enum. اندازه‌گیری شد که
   `ADD COLUMN … Enum(...)` روی SQLite بی‌CHECK می‌نشیند
   (`VARCHAR(11) DEFAULT 'WINNERS' NOT NULL`)، پس بازسازی جدول لازم نیست و با DDLِ
   `create_all` آزمون‌ها یکی است. روی PostgreSQL دو چیز لازم شد: نوع **قبل** از
   `ADD COLUMN` با `CREATE TYPE` ساخته شود (خودِ add_column آن را نمی‌سازد) و
   ستون با `create_type=False` تعریف شود تا alembic دوباره سراغ ساختش نرود.

۳) `tournament_matches.loser_next_match_id` / `loser_next_slot`: دو-حذفی «بازنده به
   کجا می‌افتد» را هم مثل برنده encode می‌کند. این ستون **خود‌مرجع** است و ادعای
   m0s022 («بعداً با ALTER نشدنی است») برای افزودن سنجیده شد و غلط درآمد:
   `ALTER TABLE … ADD COLUMN x INTEGER REFERENCES tournament_matches(id)` با
   `PRAGMA foreign_keys` خاموش و روشن هر دو پذیرفته شد. اما **برگشتش** فرق دارد:
   روی SQLite همان ستونِ دارای FK با `DROP COLUMN` برداشته نمی‌شود (خطای
   «unknown column … in foreign key definition») ⇒ downgrade در این شاخه جدول را
   با `batch_alter_table(recreate="always")` بازسازی می‌کند. توجه: در زنجیرۀ
   کاملِ SQLite، جدول‌های تورنمنت را `d4j004baseline` از `SQLModel.metadata`
   می‌سازد (پس ستون‌ها از ابتدا هستند و `upgrade` اینجا no-op است)؛ مسیر
   `add_column` فقط برای DBهای alembic-سازِ قبلی (از جمله PostgreSQL پروڈ) اجرا
   می‌شود — هر دو با `upgrade → downgrade -1 → upgrade` سنجیده شدند.

downgrade عمداً برچسبِ enum را حذف نمی‌کند (دلیل مثل m0s025: PostgreSQL حذف مقدار
enum را مستقیم پشتیبانی نمی‌کند) و ستون‌ها را در هر دو dialect برمی‌گرداند — با
دو مسیر، چون SQLite همان‌که بالا سنجیده شد DROP COLUMNِ دارای FK را رد می‌کند.
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "m0s026doubleelim"
down_revision: Union[str, None] = "m0s025roundrobin"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

FORMAT_TYPE = "tournamentformat"
NEW_FORMAT_LABEL = "DOUBLE_ELIMINATION"
BRACKET_TYPE = "tournamentbracket"
BRACKET_LABELS = ("WINNERS", "LOSERS", "GRAND_FINAL")


def _is_pg() -> bool:
    return op.get_bind().dialect.name == "postgresql"


def _enum_labels(type_name: str) -> list:
    if not _is_pg():
        return []
    rows = op.get_bind().execute(sa.text(
        "SELECT e.enumlabel FROM pg_type t "
        "JOIN pg_enum e ON e.enumtypid = t.oid "
        "WHERE t.typname = :name ORDER BY e.enumsortorder"
    ), {"name": type_name}).fetchall()
    return [r[0] for r in rows]


def _columns(table: str) -> set:
    return {c["name"] for c in sa.inspect(op.get_bind()).get_columns(table)}


def _fk_columns(table: str) -> set:
    """ستون‌هایی که روی `table` FK دارند (هر naming convention).

    لازمه، چون شکلِ `create_all` (ساختۀ d4j004baseline) FK را با نام خودکار
    `tournament_matches_loser_next_match_id_fkey` می‌گذارد و شکلِ alembic‌ساز باید
    همان را با صریح بسازد — وگرنه یک DB چرخه‌دیده FK ندارد و DB تازه دارد.
    """
    out = set()
    for fk in sa.inspect(op.get_bind()).get_foreign_keys(table):
        out.update(fk.get("constrained_columns") or [])
    return out


def _bracket_enum(create_type: bool = True) -> sa.Enum:
    return sa.Enum(*BRACKET_LABELS, name=BRACKET_TYPE, create_type=create_type)


def _create_bracket_type() -> None:
    """نوع native را روی PostgreSQL پیش از `ADD COLUMN` می‌سازد (idempotent).

    اندازه‌گیری شد: `op.add_column` با `sa.Enum` روی PG **خودِ نوع را نمی‌سازد**
    (`ProgrammingError: type "tournamentbracket" does not exist`)، برخلاف
    `create_table` که این کار را می‌کند (m0s022). همین خطا اولین بار در pass دوم
    چرخۀ `upgrade → downgrade -1 → upgrade` دیده شد، چون downgrade نوع را drop
    می‌کند و upgrade باید دوباره بسازدش.
    """
    if op.get_bind().execute(sa.text(
            "SELECT 1 FROM pg_type WHERE typname = :name"),
            {"name": BRACKET_TYPE}).first():
        return
    labels = ", ".join(f"'{label}'" for label in BRACKET_LABELS)
    op.execute(sa.text(f"CREATE TYPE {BRACKET_TYPE} AS ENUM ({labels})"))


def upgrade() -> None:
    if _is_pg() and NEW_FORMAT_LABEL not in _enum_labels(FORMAT_TYPE):
        with op.get_context().autocommit_block():
            op.execute(
                f"ALTER TYPE {FORMAT_TYPE} ADD VALUE IF NOT EXISTS '{NEW_FORMAT_LABEL}'"
            )

    if "bracket" not in _columns("tournament_rounds"):
        if _is_pg():
            _create_bracket_type()
            column_type = _bracket_enum(create_type=False)
        else:
            # SQLite نوع ندارد: همان `VARCHAR + (بی‌)CHECK` از خودِ sa.Enum
            column_type = _bracket_enum()
        op.add_column("tournament_rounds", sa.Column(
            "bracket", column_type, server_default="WINNERS", nullable=False))

    match_columns = _columns("tournament_matches")
    if "loser_next_match_id" not in match_columns:
        op.add_column("tournament_matches", sa.Column(
            "loser_next_match_id", sa.Integer(), nullable=True,
            comment="بازنده به کدام دیدار می‌افتد (فقط دو-حذفی)"))
    if "loser_next_slot" not in match_columns:
        op.add_column("tournament_matches", sa.Column(
            "loser_next_slot", sqlmodel.VARCHAR(length=1), nullable=True))

    # روی PG، مسیر add_column (DBهای alembic-ساز مثل پروڈ) FK نمی‌گذارد، ولی شکلِ
    # create_all (SQLite تست) از مدل FK خود‌مرجع دارد. ایندکس/FK را صریح و idempotent
    # اضافه می‌کنیم تا هر دو شکل یک Constraint داشته باشند. SQLite ALTER با FK
    # خود‌مرجع روی جدول موجود شدنی نیست و PRAGMA foreign_keys خاموش است، پس فقط PG.
    if _is_pg() and "loser_next_match_id" not in _fk_columns("tournament_matches"):
        op.create_foreign_key(
            "fk_tournament_matches_loser_next_match", "tournament_matches",
            "tournament_matches", ["loser_next_match_id"], ["id"])

    existing = {i.get("name") for i in sa.inspect(op.get_bind()).get_indexes(
        "tournament_matches")}
    if "ix_tournament_matches_loser_next_match_id" not in existing:
        # انتشار نتیجه، دیدارِ بعدِ بازنده را با همین id پیدا می‌کند ⇒ ایندکس لازم است
        op.create_index("ix_tournament_matches_loser_next_match_id", "tournament_matches",
                        ["loser_next_match_id"], unique=False)


def downgrade() -> None:
    existing = {i.get("name") for i in sa.inspect(op.get_bind()).get_indexes(
        "tournament_matches")}
    if "ix_tournament_matches_loser_next_match_id" in existing:
        op.drop_index("ix_tournament_matches_loser_next_match_id",
                      table_name="tournament_matches")

    match_columns = _columns("tournament_matches")
    if not match_columns:  # جدول در مرحلۀ پایین‌تر (m0s022) حذف شده
        pass
    elif _is_pg():
        # PG ستون را با FK و ایندکس وابستۀ خودش می‌برد
        for column in ("loser_next_slot", "loser_next_match_id"):
            if column in match_columns:
                op.drop_column("tournament_matches", column)
    elif "loser_next_match_id" in match_columns:
        # اندازه‌گیری شد: روی SQLite `DROP COLUMN` برای همین ستون رد می‌شود —
        #   OperationalError: error in table tournament_matches after drop column:
        #   unknown column "loser_next_match_id" in foreign key definition
        # چون `d4j004baseline` جدول‌های تورنمنت را از `SQLModel.metadata` می‌سازد و
        # مدل، لینکِ بازنده را FK خود‌مرجع اعلام کرده است. راه‌حلِ alembic برای این
        # حالت بازسازی جدول است (`recreate="always"`)، نه حذفِ زورکی.
        with op.batch_alter_table("tournament_matches", recreate="always") as batch_op:
            batch_op.drop_column("loser_next_slot")
            batch_op.drop_column("loser_next_match_id")

    if "bracket" in _columns("tournament_rounds"):
        # این ستون FK ندارد ⇒ DROP COLUMN مستقیم روی هر دو dialect سالم است
        op.drop_column("tournament_rounds", "bracket")
    if _is_pg():
        op.execute("DROP TYPE IF EXISTS tournamentbracket")
