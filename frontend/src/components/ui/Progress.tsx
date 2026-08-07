// src/components/ui/Progress.tsx
import React from 'react'
import { Box, LinearProgress, Typography } from '@mui/material'

interface ProgressProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
}

const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'primary',
}) => {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <Box>
      {(label || showPercentage) && (
        <Box display="flex" justifyContent="space-between" mb={1}>
          {label && (
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          )}
          {showPercentage && (
            <Typography variant="body2" fontWeight={600}>
              {Math.round(percentage)}%
            </Typography>
          )}
        </Box>
      )}
      <LinearProgress
        variant="determinate"
        value={percentage}
        color={color}
        sx={{
          height: 8,
          borderRadius: 4,
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
          },
        }}
      />
    </Box>
  )
}

export default Progress