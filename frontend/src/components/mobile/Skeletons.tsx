import React from 'react'
import { Box, Skeleton, SkeletonProps } from '@mui/material'

/** اسکلتون‌های استاندارد — جایگزین spinner */

export const Shimmer: React.FC<SkeletonProps> = (props) => (
  <Skeleton
    variant="rounded"
    animation="pulse"
    sx={{ bgcolor: 'rgba(15,23,42,0.06)', ...props.sx }}
    {...props}
  />
)

/** اسکلتون کارت سالن (موبایل) */
export const VenueCardSkeleton: React.FC = () => (
  <Box
    sx={{
      borderRadius: '20px',
      bgcolor: 'background.paper',
      border: '1px solid rgba(15,23,42,0.05)',
      overflow: 'hidden',
    }}
  >
    <Skeleton variant="rectangular" height={0} sx={{ aspectRatio: '16 / 10', bgcolor: 'rgba(15,23,42,0.05)' }} />
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Shimmer width="60%" height={22} />
      <Shimmer width="35%" height={16} />
      <Shimmer width="80%" height={14} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
        <Shimmer width={110} height={22} />
        <Shimmer width={84} height={40} sx={{ borderRadius: '12px' }} />
      </Box>
    </Box>
  </Box>
)

export const VenueCardSkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
    {Array.from({ length: count }).map((_, i) => (
      <VenueCardSkeleton key={i} />
    ))}
  </Box>
)

/** اسکلتون صفحه جزئیات سالن */
export const VenueDetailSkeleton: React.FC = () => (
  <Box>
    <Skeleton variant="rectangular" height={260} sx={{ bgcolor: 'rgba(15,23,42,0.05)' }} />
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Shimmer width="55%" height={28} />
      <Shimmer width="40%" height={18} />
      <Shimmer width="75%" height={16} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        {[1, 2, 3, 4].map((i) => (
          <Shimmer key={i} width={72} height={30} sx={{ borderRadius: '10px' }} />
        ))}
      </Box>
      <Shimmer height={90} sx={{ borderRadius: '16px' }} />
      <Shimmer height={90} sx={{ borderRadius: '16px' }} />
    </Box>
  </Box>
)

/** اسکلتون لیست سانس‌ها */
export const SlotListSkeleton: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    {[1, 2, 3, 4].map((i) => (
      <Shimmer key={i} height={64} sx={{ borderRadius: '16px' }} />
    ))}
  </Box>
)

/** اسکلتون نتایج جستجو */
export const SearchResultsSkeleton: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    {[1, 2, 3].map((i) => (
      <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Shimmer width={64} height={64} sx={{ borderRadius: '14px', flexShrink: 0 }} />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Shimmer width="55%" height={16} />
          <Shimmer width="75%" height={12} />
        </Box>
      </Box>
    ))}
  </Box>
)
