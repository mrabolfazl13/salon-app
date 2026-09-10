# -*- coding: utf-8 -*-
"""Seed real Qom gym venues scraped from poolticket.org (2026-09).

- اطلاعات (نام، آدرس، مختصات، تلفن، تصاویر) عیناً از منبع poolticket.org استخراج شده است.
- تلفن‌هایی که در منبع موجود نبودند عمداً NULL ثبت شده‌اند (اطلاعات نادرست وارد نشده).
- شماره 02191018757 متعلق به پشتیبانی خودِ poolticket.org است و به هیچ باشگاهی
  نسبت داده نشده است.
- باشگاه tim-life-stail به دلیل نداشتن مختصات جغرافیایی در منبع، وارد نشده است.

اجرا (روی سرور):
    docker compose exec -T backend python -m app.seed_gyms_poolticket
اسکریپت idempotent است: با (name, category="gym") upsert می‌کند.
"""
import json

from sqlmodel import Session, select

from app.database import engine
from app.models.membership import MembershipPlan, PlanType
from app.models.user import User, UserRole
from app.models.venue import Venue

_GYMS_JSON = r"""[
  {
    "poolticket_id": "5547",
    "name": "باشگاه بدنسازی استار بادی قم",
    "category": "gym",
    "address": "نبش صدوقی ۴۶، بغل کافی نت، قم، ایران",
    "latitude": 34.61137684169431,
    "longitude": 50.85765560825449,
    "phone": null,
    "price": 10000000,
    "images": [
      "gym-star-buddy-qom-1.jpg",
      "gym-star-buddy-qom-2.jpg",
      "gym-star-buddy-qom-3.jpg",
      "gym-star-buddy-qom-4.jpg"
    ],
    "source_url": "https://www.poolticket.org/gym/star-buddy-qom"
  },
  {
    "poolticket_id": "1916",
    "name": "باشگاه بدنسازی ستارگان قم",
    "category": "gym",
    "address": "بعد از میدان سپاه، بین کوچه ۱۵ و ۱۷، روبروی اداره ارشاد، پلاک ۷۱، قم، ایران",
    "latitude": 34.62425530464512,
    "longitude": 50.86980704092362,
    "phone": null,
    "price": 1000000,
    "images": [
      "gym-setaregan-ghom-1.jpg",
      "gym-setaregan-ghom-2.jpg",
      "gym-setaregan-ghom-3.jpg",
      "gym-setaregan-ghom-4.jpg",
      "gym-setaregan-ghom-5.jpg"
    ],
    "source_url": "https://www.poolticket.org/gym/setaregan-ghom"
  },
  {
    "poolticket_id": "3050",
    "name": "باشگاه بدنسازی فیت استایل قم",
    "category": "gym",
    "address": "زنبیل آباد، نبش کوچه ۴۷، قم، ایران",
    "latitude": 34.607186691134864,
    "longitude": 50.85644245147705,
    "phone": null,
    "price": 1500000,
    "images": [
      "gym-fit-style-qom-1.jpg",
      "gym-fit-style-qom-2.jpg"
    ],
    "source_url": "https://www.poolticket.org/gym/fit-style-qom"
  },
  {
    "poolticket_id": "3459",
    "name": "باشگاه بدنسازی نیترو قم",
    "category": "gym",
    "address": "بلوار امین، نبش کوچه ۱۷، قم، ایران",
    "latitude": 34.62628679469815,
    "longitude": 50.856002569198616,
    "phone": null,
    "price": 2000000,
    "images": [
      "gym-nitro-qom-1.jpg",
      "gym-nitro-qom-2.jpg",
      "gym-nitro-qom-3.jpg",
      "gym-nitro-qom-4.jpg"
    ],
    "source_url": "https://www.poolticket.org/gym/nitro-qom"
  },
  {
    "poolticket_id": "4167",
    "name": "باشگاه بدنسازی سام قم",
    "category": "gym",
    "address": "۴۵ متری صدوقی، بین کوچه ۱ و ۳، قم، ایران",
    "latitude": 34.62543739217263,
    "longitude": 50.86037456989289,
    "phone": null,
    "price": 3000000,
    "images": [],
    "source_url": "https://www.poolticket.org/gym/sam-qom"
  },
  {
    "poolticket_id": "4397",
    "name": "باشگاه بدنسازی دریا قم",
    "category": "gym",
    "address": "بلوار خلیج فارس، جنب میدان بقیه الله جمکران، قم، ایران",
    "latitude": 34.59953525437303,
    "longitude": 50.92434526545584,
    "phone": "02537209925",
    "price": 7500000,
    "images": [
      "gym-darya-qom-1.jpg",
      "gym-darya-qom-2.jpg",
      "gym-darya-qom-3.jpg",
      "gym-darya-qom-4.jpg",
      "gym-darya-qom-5.jpg",
      "gym-darya-qom-6.jpg"
    ],
    "source_url": "https://www.poolticket.org/gym/darya-qom"
  },
  {
    "poolticket_id": "4398",
    "name": "باشگاه بدنسازی الماس پلاس قم",
    "category": "gym",
    "address": "بلوار الغدیر، کوچه ۱۵، نرسیده به تالار امیران، قم، ایران",
    "latitude": 34.609602181869015,
    "longitude": 50.82906150170295,
    "phone": null,
    "price": 3000000,
    "images": [],
    "source_url": "https://www.poolticket.org/gym/almas-plus-qom"
  },
  {
    "poolticket_id": "4409",
    "name": "باشگاه بدنسازی فیتنس پلاس قم",
    "category": "gym",
    "address": "بلوار دانش، روبه‌روی فروشگاه تلألؤ جمیل، قم، ایران",
    "latitude": 34.618448265499374,
    "longitude": 50.83973214014596,
    "phone": null,
    "price": 3000000,
    "images": [],
    "source_url": "https://www.poolticket.org/gym/fitness-plus-qom"
  },
  {
    "poolticket_id": "4376",
    "name": "باشگاه بدنسازی تخت جمشید قم",
    "category": "gym",
    "address": "خیابان ۱۹ دی (باجک ۲)، نبش کوچه ۶۸، قم، ایران",
    "latitude": 34.65830512070805,
    "longitude": 50.903232993165474,
    "phone": null,
    "price": 1800000,
    "images": [
      "gym-takhtjamshid-qom-1.jpg",
      "gym-takhtjamshid-qom-2.jpg",
      "gym-takhtjamshid-qom-3.jpg",
      "gym-takhtjamshid-qom-4.jpg",
      "gym-takhtjamshid-qom-5.jpg",
      "gym-takhtjamshid-qom-6.jpg"
    ],
    "source_url": "https://www.poolticket.org/gym/takhtjamshid-qom"
  },
  {
    "poolticket_id": "4378",
    "name": "باشگاه بدنسازی M۲ قم",
    "category": "gym",
    "address": "بلوار الغدیر، کوچه ۳۱، قم، ایران",
    "latitude": 34.598613728451674,
    "longitude": 50.82065151365475,
    "phone": null,
    "price": 4000000,
    "images": [
      "gym-m2-qom-1.jpg",
      "gym-m2-qom-2.jpg",
      "gym-m2-qom-3.jpg",
      "gym-m2-qom-4.jpg",
      "gym-m2-qom-5.jpg",
      "gym-m2-qom-6.jpg"
    ],
    "source_url": "https://www.poolticket.org/gym/m2-qom"
  },
  {
    "poolticket_id": "4381",
    "name": "باشگاه بدنسازی علیزاده قم",
    "category": "gym",
    "address": "خیابان توحید، نبش کوچه ۳۴، جنب بانک صادرات، قم، ایران",
    "latitude": 34.64820296832814,
    "longitude": 50.85087988104198,
    "phone": null,
    "price": 1200000,
    "images": [],
    "source_url": "https://www.poolticket.org/gym/alizadeh-qom"
  },
  {
    "poolticket_id": "4384",
    "name": "باشگاه بدنسازی سعادت قم (شعبه بنی‌فضل)",
    "category": "gym",
    "address": "بلوار یادگار امام، خیابان بنی‌فضل شمالی، نبش کوچه ۵۱، قم، ایران",
    "latitude": 34.64912111649733,
    "longitude": 50.83794057369232,
    "phone": null,
    "price": 2000000,
    "images": [
      "gym-saadat-bolvar-banifazl-qom-1.jpg",
      "gym-saadat-bolvar-banifazl-qom-2.jpg",
      "gym-saadat-bolvar-banifazl-qom-3.jpg",
      "gym-saadat-bolvar-banifazl-qom-4.jpg",
      "gym-saadat-bolvar-banifazl-qom-5.jpg",
      "gym-saadat-bolvar-banifazl-qom-6.jpg"
    ],
    "source_url": "https://www.poolticket.org/gym/saadat-bolvar-banifazl-qom"
  },
  {
    "poolticket_id": "1915",
    "name": "باشگاه بدنسازی جوان قم",
    "category": "gym",
    "address": "میدان امام، بلوار شهید بهشتی، نبش کوچه ۳، قم، ایران",
    "latitude": 34.668142821663466,
    "longitude": 50.88040329222669,
    "phone": "02536624626",
    "price": 1400000,
    "images": [
      "gym-javan-ghom-1.jpg",
      "gym-javan-ghom-2.jpg",
      "gym-javan-ghom-3.jpg"
    ],
    "source_url": "https://www.poolticket.org/gym/javan-ghom"
  },
  {
    "poolticket_id": "1918",
    "name": "باشگاه بدنسازی شهرزاد قم",
    "category": "gym",
    "address": "ابتدای خیابان دورشهر (شهید فاطمی) پاساژ حریر، طبقه منفی ۲، قم، ایران",
    "latitude": 34.63239056686529,
    "longitude": 50.8690129040914,
    "phone": "02537740387",
    "price": 2000000,
    "images": [
      "gym-shahrzad-ghom-1.jpg",
      "gym-shahrzad-ghom-2.jpg",
      "gym-shahrzad-ghom-3.jpg",
      "gym-shahrzad-ghom-4.jpg",
      "gym-shahrzad-ghom-5.jpg",
      "gym-shahrzad-ghom-6.jpg"
    ],
    "source_url": "https://www.poolticket.org/gym/shahrzad-ghom"
  },
  {
    "poolticket_id": "1920",
    "name": "باشگاه بدنسازی سون قم",
    "category": "gym",
    "address": "خیابان توحید، بین کوچه ۴ و ۶، روبه روی بازار بزرگ موبایل، قم، ایران",
    "latitude": 34.640959317925635,
    "longitude": 50.86617528593148,
    "phone": "02538820750",
    "price": 1400000,
    "images": [
      "gym-seven-ghom-1.jpg",
      "gym-seven-ghom-2.jpg",
      "gym-seven-ghom-3.jpg"
    ],
    "source_url": "https://www.poolticket.org/gym/seven-ghom"
  },
  {
    "poolticket_id": "1922",
    "name": "باشگاه بدنسازی بهمن قم",
    "category": "gym",
    "address": "فلکه مفتح، میدان مفتح، قم، ایران",
    "latitude": 34.627838913202524,
    "longitude": 50.862507340282384,
    "phone": "02532932918",
    "price": 1400000,
    "images": [],
    "source_url": "https://www.poolticket.org/gym/bahman-ghom"
  },
  {
    "poolticket_id": "1924",
    "name": "باشگاه بدنسازی وینر قم",
    "category": "gym",
    "address": "فلکه شهید دقایقی، ابتدای انصارالحسین، پلاک ۸، قم، ایران",
    "latitude": 34.67317402802589,
    "longitude": 50.88021386596989,
    "phone": null,
    "price": 1400000,
    "images": [],
    "source_url": "https://www.poolticket.org/gym/viner-ghom"
  },
  {
    "poolticket_id": "1926",
    "name": "باشگاه ایموشن (i-motion) قم",
    "category": "gym",
    "address": "خیابان مالک اشتر، تقاطع سواران، سواران ۱.۱، طبقه بالا، آکادمی جودو استان قم، قم، ایران",
    "latitude": 34.642737926790524,
    "longitude": 50.858734783314766,
    "phone": "02538820168",
    "price": 1400000,
    "images": [],
    "source_url": "https://www.poolticket.org/gym/i-motion-ghom"
  },
  {
    "poolticket_id": "1928",
    "name": "باشگاه ساندو قم",
    "category": "gym",
    "address": "نبش کوچه ۴، ساختمان تیسا، قم، ایران",
    "latitude": 34.62755452992604,
    "longitude": 50.8612988139933,
    "phone": "09195425700",
    "price": 1400000,
    "images": [
      "gym-sando-ghom-1.jpg",
      "gym-sando-ghom-2.jpg",
      "gym-sando-ghom-3.jpg"
    ],
    "source_url": "https://www.poolticket.org/gym/sando-ghom"
  },
  {
    "poolticket_id": "1929",
    "name": "باشگاه ورزشی انقلاب قم",
    "category": "gym",
    "address": "خیابان شهید صدوقی، خیابان کوکب، قم، ایران",
    "latitude": 34.609823514839206,
    "longitude": 50.85596123480631,
    "phone": "02532918735",
    "price": 1400000,
    "images": [],
    "source_url": "https://www.poolticket.org/gym/enghelab-ghom"
  },
  {
    "poolticket_id": "1930",
    "name": "باشگاه آراد قم",
    "category": "gym",
    "address": "بین کوچه ۴۸ و ۵۰، قم، ایران",
    "latitude": 34.67216020075129,
    "longitude": 50.874864435529915,
    "phone": null,
    "price": 1400000,
    "images": [
      "gym-arad-ghom-1.jpg",
      "gym-arad-ghom-2.jpg",
      "gym-arad-ghom-3.jpg"
    ],
    "source_url": "https://www.poolticket.org/gym/arad-ghom"
  },
  {
    "poolticket_id": "2750",
    "name": "باشگاه بدنسازی ایلیا قم",
    "category": "gym",
    "address": "میدان سپاه، خیابان رسالت، نبش رسالت ۳، قم، ایران",
    "latitude": 34.63178432221987,
    "longitude": 50.866155352265686,
    "phone": "02532928071",
    "price": 600000,
    "images": [
      "gym-ilia-qom-1.jpg",
      "gym-ilia-qom-2.jpg",
      "gym-ilia-qom-3.jpg",
      "gym-ilia-qom-4.jpg",
      "gym-ilia-qom-5.jpg",
      "gym-ilia-qom-6.jpg"
    ],
    "source_url": "https://www.poolticket.org/gym/ilia-qom"
  },
  {
    "poolticket_id": "2751",
    "name": "باشگاه بدنسازی نگار قم",
    "category": "gym",
    "address": "قم سالاریه خیابان یاسمن پلاک ۲۶۰، قم، ایران",
    "latitude": 34.613411398915126,
    "longitude": 50.846746757364365,
    "phone": null,
    "price": 1400000,
    "images": [],
    "source_url": "https://www.poolticket.org/gym/ngar-qom"
  },
  {
    "poolticket_id": "3569",
    "name": "باشگاه بدنسازی فیزیک قم",
    "category": "gym",
    "address": "خیابان صدوقی، خیابان بوعلی، روبه روی بیمارستان علی بن ابیطالب جنب فروشگاه پوشاک اکیپ، قم، ایران",
    "latitude": 34.61825260951905,
    "longitude": 50.851507186889656,
    "phone": "02532945360",
    "price": 1500000,
    "images": [
      "gym-fizik-qom-1.jpg",
      "gym-fizik-qom-2.jpg",
      "gym-fizik-qom-3.jpg",
      "gym-fizik-qom-4.jpg",
      "gym-fizik-qom-5.jpg",
      "gym-fizik-qom-6.jpg"
    ],
    "source_url": "https://www.poolticket.org/gym/fizik-qom"
  },
  {
    "poolticket_id": "4168",
    "name": "باشگاه بدنسازی تارگت قم",
    "category": "gym",
    "address": "سالاریه، خیابان اقاقیا ۳، پاساژ باران، طبقه ۴، قم، ایران",
    "latitude": 34.61286280377383,
    "longitude": 50.841529369354255,
    "phone": "09109708749",
    "price": 1400000,
    "images": [
      "gym-target-qom-1.jpg",
      "gym-target-qom-2.jpg",
      "gym-target-qom-3.jpg",
      "gym-target-qom-4.jpg",
      "gym-target-qom-5.jpg"
    ],
    "source_url": "https://www.poolticket.org/gym/target-qom"
  },
  {
    "poolticket_id": "4500",
    "name": "باشگاه بدنسازی یاران قم",
    "category": "gym",
    "address": "خیابان شهید فاطمی، کوچه ۸، قم، ایران",
    "latitude": 34.6327632116442,
    "longitude": 50.869617503144624,
    "phone": null,
    "price": 1500000,
    "images": [],
    "source_url": "https://www.poolticket.org/gym/yaran-qom"
  },
  {
    "poolticket_id": "4415",
    "name": "باشگاه بدنسازی اچ قم",
    "category": "gym",
    "address": "بلوار الغدیر، الغدیر ۱۱، قم، ایران",
    "latitude": 34.61257323431007,
    "longitude": 50.83370825268787,
    "phone": "02532855213",
    "price": 1400000,
    "images": [],
    "source_url": "https://www.poolticket.org/gym/h-qom-%D8%A7%DA%86"
  },
  {
    "poolticket_id": "4368",
    "name": "باشگاه بدنسازی بانوان ایران نوین قم",
    "category": "gym",
    "address": "خیابان جمهوری، میدان سپاه، نبش میدان، طبقه زیرین اسباب فروشی سادات، قم، ایران",
    "latitude": 34.62775320465941,
    "longitude": 50.86733213851068,
    "phone": "02532903953",
    "price": 1400000,
    "images": [
      "gym-banovan-iran-novin-qom-1.jpg",
      "gym-banovan-iran-novin-qom-2.jpg",
      "gym-banovan-iran-novin-qom-3.jpg"
    ],
    "source_url": "https://www.poolticket.org/gym/banovan-iran-novin-qom"
  },
  {
    "poolticket_id": "4521",
    "name": "باشگاه بدنسازی جواد بشرنیا قم (انقلاب)",
    "category": "gym",
    "address": "خیابان زنبیل آباد، کوچه‌ی ۳۹، قم، ایران",
    "latitude": 34.60939348047296,
    "longitude": 50.85687670580375,
    "phone": null,
    "price": 1500000,
    "images": [],
    "source_url": "https://www.poolticket.org/gym/bashgah-basharnia-qom"
  },
  {
    "poolticket_id": "5164",
    "name": "باشگاه بدنسازی دی من قم",
    "category": "gym",
    "address": "قم، اول عما یاسر، روبروی پارکینگ شرقی حرم، مجتمع تجاری زمزم، طبقه همکف، باشگاه دی من، قم، ایران",
    "latitude": 34.64992671361553,
    "longitude": 50.90181946752637,
    "phone": "02537845190",
    "price": 1400000,
    "images": [],
    "source_url": "https://www.poolticket.org/gym/day-man-qom"
  },
  {
    "poolticket_id": "5165",
    "name": "باشگاه بدنسازی آریا فیت قم",
    "category": "gym",
    "address": "قم، بلوار جمهوری، کنار گذار ولیعصر، خیابان ۱۲ متری ولیعصر، پلاک ۸۶، باشگاه آریافیت، قم، ایران",
    "latitude": 34.642437528768056,
    "longitude": 50.85745036600202,
    "phone": "09127524583",
    "price": 1400000,
    "images": [],
    "source_url": "https://www.poolticket.org/gym/arya-fit-qom"
  },
  {
    "poolticket_id": "5173",
    "name": "باشگاه بدنسازی فیتان قم",
    "category": "gym",
    "address": "خیابان مالک اشتر، تقاطع سواران، سواران ۱/۱، طبقه بالا آکادمی جودو استان قم، باشگاه فیتان، قم، ایران",
    "latitude": 34.64326922635266,
    "longitude": 50.85880279541016,
    "phone": "09127492085",
    "price": 1400000,
    "images": [],
    "source_url": "https://www.poolticket.org/gym/fiton-qom"
  }
]"""

GYMS = json.loads(_GYMS_JSON)


def _find_manager(session: Session) -> User:
    admin = session.exec(
        select(User).where(User.role == UserRole.SUPER_ADMIN).order_by(User.id)
    ).first()
    if admin:
        return admin
    mgr = session.exec(
        select(User).where(User.role == UserRole.VENUE_MANAGER).order_by(User.id)
    ).first()
    if mgr:
        return mgr
    raise RuntimeError("No SUPER_ADMIN or VENUE_MANAGER user found to own venues")


def _seed_session_plan(session: Session, venue: Venue, price_rial: int) -> None:
    """ایجاد پلن «جلسه‌ای» از قیمت واقعی منبع (ریال → تومان). idempotent."""
    if not price_rial:
        return
    price_toman = int(price_rial) // 10
    existing = session.exec(
        select(MembershipPlan).where(
            MembershipPlan.venue_id == venue.id,
            MembershipPlan.title == "جلسه‌ای",
        )
    ).first()
    if existing:
        return
    session.add(
        MembershipPlan(
            venue_id=venue.id,
            title="جلسه‌ای",
            plan_type=PlanType.SESSION,
            price=price_toman,
            sessions_count=1,
            description="قیمت هر جلسه طبق منبع poolticket.org",
            is_active=True,
        )
    )


def seed() -> None:
    with Session(engine) as session:
        manager = _find_manager(session)
        created = 0
        updated = 0
        for g in GYMS:
            existing = session.exec(
                select(Venue).where(Venue.name == g["name"], Venue.category == "gym")
            ).first()
            desc = "منبع: %s" % g["source_url"]
            if g.get("price"):
                desc += " — قیمت جلسه (ریال): %s" % g["price"]
            values = {
                "address": g["address"],
                "latitude": g["latitude"],
                "longitude": g["longitude"],
                "phone": g.get("phone"),  # None = در منبع موجود نبود
                "description": desc,
                "amenities": "[]",
                "images": json.dumps(g.get("images", []), ensure_ascii=False),
                "is_verified": True,
                "manager_id": manager.id,
            }
            if existing:
                for k, v in values.items():
                    setattr(existing, k, v)
                session.add(existing)
                session.flush()
                _seed_session_plan(session, existing, g.get("price"))
                updated += 1
            else:
                venue = Venue(
                    name=g["name"],
                    category="gym",
                    **values,
                )
                session.add(venue)
                session.flush()
                _seed_session_plan(session, venue, g.get("price"))
                created += 1
        session.commit()
        print(
            "seed done: created=%d updated=%d total=%d manager_id=%d"
            % (created, updated, len(GYMS), manager.id)
        )


if __name__ == "__main__":
    seed()
