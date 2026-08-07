import React from 'react'
import { Box, Container, Typography, Link, IconButton } from '@mui/material'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'

const Footer: React.FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Box
        component="footer"
        sx={{
          py: 4,
          px: 2,
          mt: 'auto',
          borderTop: '1px solid',
          borderColor: 'rgba(0,0,0,0.05)',
          bgcolor: 'background.paper',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                © ۱۴۰۲ فوتسال - تمامی حقوق محفوظ است
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                component="a"
                href="#"
                target="_blank"
                sx={{
                  '&:hover': {
                    background: 'rgba(37, 99, 235, 0.08)',
                  },
                }}
              >
                <Icon icon="mdi:instagram" className="h-5 w-5 text-muted-foreground" />
              </IconButton>
              <IconButton
                component="a"
                href="#"
                target="_blank"
                sx={{
                  '&:hover': {
                    background: 'rgba(37, 99, 235, 0.08)',
                  },
                }}
              >
                <Icon icon="mdi:telegram" className="h-5 w-5 text-muted-foreground" />
              </IconButton>
              <IconButton
                component="a"
                href="#"
                target="_blank"
                sx={{
                  '&:hover': {
                    background: 'rgba(37, 99, 235, 0.08)',
                  },
                }}
              >
                <Icon icon="mdi:youtube" className="h-5 w-5 text-muted-foreground" />
              </IconButton>
              <IconButton
                component="a"
                href="#"
                target="_blank"
                sx={{
                  '&:hover': {
                    background: 'rgba(37, 99, 235, 0.08)',
                  },
                }}
              >
                <Icon icon="mdi:github" className="h-5 w-5 text-muted-foreground" />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 3 }}>
              <Link href="#" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                درباره ما
              </Link>
              <Link href="#" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                تماس با ما
              </Link>
              <Link href="#" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                قوانین
              </Link>
            </Box>
          </Box>
        </Container>
      </Box>
    </motion.footer>
  )
}

export default Footer