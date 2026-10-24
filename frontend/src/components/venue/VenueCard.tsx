import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import type { Venue } from '@/types';
import { parseList } from '@/utils/venueMedia';
import { toPersianDigits } from '@/utils/l10n';
import VenueCardImage from '@/components/venue/VenueCardImage';
import FavoriteButton from '@/components/mobile/FavoriteButton';
import Rating from '@/components/mobile/Rating';
import Price from '@/components/mobile/Price';

interface Props { venue: Venue; onBook?: (id: number) => void; }

/**
 * کارت سالن — موبایل‌فرست (تصویر بزرگ ۱۶:۱۰، قلب روی تصویر، اطلاعات اصلی)
 * API قبلی ({ venue, onBook }) حفظ شده تا استفاده‌کننده‌ها نشکنند.
 */
const VenueCard: React.FC<Props> = ({ venue, onBook }) => {
  const am = parseList(venue.amenities);
  const href = `/venues/${venue.id}`;

  const handleBook = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBook?.(venue.id);
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-full"
    >
      <Link
        to={href}
        data-testid="venue-card"
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card text-inherit no-underline shadow-sm transition-colors [&_img]:transition-transform [&_img]:duration-300 group-hover:[&_img]:scale-[1.02] hover:border-amber-500/40 dark:hover:border-amber-400/35"
      >
        {/* تصویر بزرگ + قلب روی تصویر */}
        <div className="p-1.5 pb-0">
          <VenueCardImage images={venue.images} name={venue.name} ratio="16:10" verified={venue.is_verified}>
            <FavoriteButton venue={{ id: venue.id, name: venue.name }} size="sm" />
          </VenueCardImage>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-3 pt-2">
          {/* نام + امتیاز */}
          <div className="flex items-start justify-between gap-2">
            <h2 className="min-w-0 truncate text-[0.9rem] font-extrabold leading-snug text-foreground">
              {venue.name}
            </h2>
            <div className="shrink-0">
              <Rating value={venue.average_rating} count={venue.total_reviews} />
            </div>
          </div>

          {/* آدرس */}
          <div className="flex min-w-0 items-center gap-1.5">
            <Icon icon="mdi:map-marker-outline" aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="truncate text-[0.7rem] text-muted-foreground">{venue.address}</p>
          </div>

          {/* تگ امکانات */}
          {am.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {am.slice(0, 3).map((a, i) => (
                <span
                  key={i}
                  className="inline-flex h-5 items-center rounded-full bg-amber-500/10 px-1.5 text-[0.65rem] font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
                >
                  {a}
                </span>
              ))}
              {am.length > 3 && (
                <span className="inline-flex h-5 items-center rounded-full bg-foreground/5 px-1.5 text-[0.65rem] font-bold text-muted-foreground">
                  +{toPersianDigits(am.length - 3)}
                </span>
              )}
            </div>
          )}

          {/* فوتر: قیمت + دکمه رزرو */}
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2">
            <div className="min-w-0">
              <Price value={venue.price} from size="sm" />
            </div>
            <button
              type="button"
              onClick={handleBook}
              aria-label={`رزرو ${venue.name}`}
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border-0 bg-gradient-to-br from-amber-400 to-amber-500 px-3 text-[0.75rem] font-extrabold text-stone-900 shadow-[0_2px_8px_rgba(245,158,11,0.3)] transition hover:brightness-105 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon icon="mdi:calendar-check" aria-hidden="true" className="h-[14px] w-[14px]" />
              رزرو
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default VenueCard;
