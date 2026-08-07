// src/components/ui/Loading.tsx
import React from 'react'
import { Box, CircularProgress, Typography, Backdrop } from '@mui/material'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'

interface LoadingProps {
  fullScreen?: boolean
  message?: string
  size?: 'small' | 'medium' | 'large'
}

const Loading: React.FC<LoadingProps> = ({
  fullScreen = false,
  message = 'در حال بارگذاری...',
  size = 'medium',
}) => {
  const sizeMap = {
    small: 32,
    medium: 48,
    large: 64,
  }

  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <CircularProgress size={sizeMap[size]} />
      </motion.div>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  )

  if (fullScreen) {
    return (
      <Backdrop open sx={{ zIndex: 9999 }}>
        {content}
      </Backdrop>
    )
  }

  return content
}

export default Loading