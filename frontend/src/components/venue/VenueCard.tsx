import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Card, CardContent, Typography, Box, Chip, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';
import type { Venue } from '@/types';
import { parseList } from '@/utils/venueMedia';
import VenueImage from '@/components/mobile/VenueImage';
import FavoriteButton from '@/components/mobile/FavoriteButton';
import Rating from '@/components/mobile/Rating';
import Price from '@/components/mobile/Price';
import { gradients, radii, shadows, shadowsDark } from '@/theme';

interface Props { venue: Venue; onBook?: (id: number) => void; }

/**
 * کارت سالن — موبایل‌فرست (تصویر بزرگ ۱۶:۱۰، قلب روی تصویر، اطلاعات اصلی)
 * API قبلی ({ venue, onBook }) حفظ شده تا استفاده‌کننده‌ها نشکنند.
 */
const VenueCard: React.FC<Props> = ({ venue, onBook }) => {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
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
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: dark ? shadowsDark.card : shadows.card,
          transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
          '&:hover': {
            boxShadow: dark ? shadowsDark.cardHover : shadows.cardHover,
            borderColor: dark ? 'rgba(251,191,36,0.35)' : 'rgba(245,158,11,0.4)',
            '& .venue-card-img img': { transform: 'scale(1.04)' },
          },
        }}
      >
        {/* تصویر بزرگ + قلب روی تصویر */}
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
              sx={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.4, color: 'text.primary', minWidth: 0 }}
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
            <Icon icon="mdi:map-marker-outline" style={{ width: 16, height: 16, color: dark ? '#fbbf24' : '#d97706', flexShrink: 0 }} />
            <Typography
              variant="body2"
              sx={{ fontSize: '0.8rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
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
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    bgcolor: dark ? 'rgba(251,191,36,0.12)' : 'rgba(245,158,11,0.1)',
                    color: dark ? '#fcd34d' : '#b45309',
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
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    bgcolor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
                    color: 'text.secondary',
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
              borderTop: '1px solid',
              borderColor: 'divider',
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
                fontWeight: 800,
                fontSize: '0.85rem',
                color: '#1c1917',
                background: gradients.brandEnergy,
                boxShadow: dark ? '0 4px 14px rgba(245,158,11,0.22)' : '0 4px 14px rgba(245,158,11,0.35)',
                transition: 'all 0.2s ease',
                '&:hover': { filter: 'brightness(1.06)', boxShadow: '0 6px 18px rgba(245,158,11,0.45)' },
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
