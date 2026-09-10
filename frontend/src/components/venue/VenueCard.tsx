import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { Link } from 'react-router-dom';
import type { Venue } from '@/types';
import { parseList } from '@/utils/venueMedia';
import VenueImage from '@/components/mobile/VenueImage';
import FavoriteButton from '@/components/mobile/FavoriteButton';
import Rating from '@/components/mobile/Rating';
import Price from '@/components/mobile/Price';
import { radii, shadows } from '@/theme';

interface Props { venue: Venue; onBook?: (id: number) => void; }

/**
 * کارت سالن — موبایل‌فرست (تصویر بزرگ ۱۶:۱۰، ❤️ روی تصویر، اطلاعات اصلی)
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
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ height: '100%' }}
    >
      <Card
        component={Link}
        to={href}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          textDecoration: 'none',
          color: 'inherit',
          borderRadius: `${radii.card}px`,
          overflow: 'hidden',
          border: '1px solid rgba(15,23,42,0.06)',
          boxShadow: shadows.card,
          transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
          '&:hover': {
            boxShadow: shadows.cardHover,
            borderColor: 'rgba(37,99,235,0.25)',
            '& .venue-card-img img': { transform: 'scale(1.04)' },
          },
        }}
      >
        {/* تصویر بزرگ + ❤️ روی تصویر */}
        <Box sx={{ p: 1, pb: 0 }}>
          <Box className="venue-card-img" sx={{ position: 'relative', overflow: 'hidden', borderRadius: `${radii.image}px` }}>
            <VenueImage images={venue.images} name={venue.name} ratio="16:10" verified={venue.is_verified}>
              <FavoriteButton venue={{ id: venue.id, name: venue.name }} size="sm" />
            </VenueImage>
          </Box>
        </Box>

        <CardContent sx={{ p: 2, pt: 1.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* نام + امتیاز */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.4, color: '#0f172a', minWidth: 0 }}
              noWrap
            >
              {venue.name}
            </Typography>
            <Box sx={{ flexShrink: 0, pt: 0.25 }}>
              <Rating value={venue.average_rating} count={venue.total_reviews} />
            </Box>
          </Box>

          {/* آدرس */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
            <Icon icon="mdi:map-marker-outline" style={{ width: 16, height: 16, color: '#2563eb', flexShrink: 0 }} />
            <Typography
              variant="body2"
              sx={{ fontSize: '0.8rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {venue.address}
            </Typography>
          </Box>

          {/* تگ امکانات */}
          {am.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {am.slice(0, 3).map((a, i) => (
                <Chip
                  key={i}
                  label={a}
                  size="small"
                  sx={{
                    height: 24,
                    borderRadius: `${radii.chip}px`,
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    bgcolor: 'rgba(37,99,235,0.06)',
                    color: '#2563eb',
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              ))}
              {am.length > 3 && (
                <Chip
                  label={`+${(am.length - 3).toLocaleString('fa-IR')}`}
                  size="small"
                  sx={{
                    height: 24,
                    borderRadius: `${radii.chip}px`,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    bgcolor: 'rgba(15,23,42,0.05)',
                    color: '#64748b',
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              )}
            </Box>
          )}

          {/* فوتر: قیمت + دکمه رزرو */}
          <Box
            sx={{
              mt: 'auto',
              pt: 1.25,
              borderTop: '1px solid rgba(15,23,42,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Price value={venue.price} from size="md" />
            </Box>
            <Box
              component="button"
              onClick={handleBook}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                flexShrink: 0,
                minHeight: 44,
                minWidth: 44,
                px: { xs: 1.75, sm: 2.5 },
                borderRadius: `${radii.button}px`,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: '#fff',
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                boxShadow: '0 4px 14px rgba(37,99,235,0.28)',
                transition: 'all 0.2s ease',
                '&:hover': { boxShadow: '0 6px 18px rgba(37,99,235,0.4)' },
                '&:active': { transform: 'scale(0.97)' },
              }}
            >
              <Icon icon="mdi:calendar-check" style={{ width: 17, height: 17 }} />
              رزرو
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VenueCard;
