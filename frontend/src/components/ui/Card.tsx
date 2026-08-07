// src/components/ui/Card.tsx
import React from 'react'
import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  CardHeader as MuiCardHeader,
  CardActions as MuiCardActions,
  CardMedia as MuiCardMedia,
  CardProps as MuiCardProps,
  CardContentProps,
  CardHeaderProps,
  CardActionsProps,
  Typography,
} from '@mui/material'
import { motion } from 'framer-motion'

export interface CardProps extends MuiCardProps {
  hover?: boolean
}

const Card: React.FC<CardProps> = ({ hover = true, children, ...props }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ height: '100%' }}
    >
      <MuiCard {...props}>{children}</MuiCard>
    </motion.div>
  )
}

export const CardContent: React.FC<CardContentProps> = (props) => (
  <MuiCardContent {...props} />
)

export const CardHeader: React.FC<CardHeaderProps> = (props) => (
  <MuiCardHeader {...props} />
)

export const CardActions: React.FC<CardActionsProps> = (props) => (
  <MuiCardActions {...props} />
)

export const CardMedia: React.FC<any> = (props) => <MuiCardMedia {...props} />

export const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children, ...props }) => (
  <Typography variant="h5" component="h2" fontWeight={600} {...props}>
    {children}
  </Typography>
)

export const CardDescription: React.FC<{ children: React.ReactNode }> = ({ children, ...props }) => (
  <Typography variant="body2" color="text.secondary" {...props}>
    {children}
  </Typography>
)

export default Card