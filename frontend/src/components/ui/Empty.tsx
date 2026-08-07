// src/components/ui/Empty.tsx
import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'

interface EmptyProps {
  title?: string
  description?: string
  icon?: string
  actionLabel?: string
  onAction?: () => void
}

const Empty: React.FC<EmptyProps> = ({
  title = 'موردی یافت نشد',
  description = 'هیچ داده‌ای برای نمایش وجود ندارد',
  icon = 'mdi:file-document-outline',
  actionLabel,
  onAction,
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={8}
      px={4}
      textAlign="center"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon icon={icon} className="h-24 w-24 text-gray-300" />
      </motion.div>
      <Typography variant="h6" fontWeight={600} sx={{ mt: 3 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{ mt: 3 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  )
}

export default Empty