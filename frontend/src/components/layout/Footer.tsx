import React from 'react'
import { Box, Container, Typography, Link, ButtonBase } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'

const Footer: React.FC = () => {
  const navigate = useNavigate()

  const persianYear = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
  }).format(new Date())

  const quickLinks = [
    { label: 'سالن‌ها', href: '/venues' },
    { label: 'رزروهای من', href: '/bookings' },
    { label: 'قراردادها', href: '/contracts' },
  ]

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
              alignItems: { xs: 'center', md: 'flex-start' },
              gap: 3,
            }}
          >
            <ButtonBase
              component="div"
              onClick={() => navigate('/')}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, '&:hover': { opacity: 0.85 } }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon icon="mdi:soccer" className="h-5 w-5 text-white" />
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                رزرو سالن فوتسال
              </Typography>
            </ButtonBase>

            <Box sx={{ display: 'flex', gap: 3 }}>
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  component="button"
                  onClick={() => navigate(link.href)}
                  color="text.secondary"
                  underline="hover"
                  sx={{ fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', p: 0 }}
                >
                  {link.label}
                </Link>
              ))}
            </Box>

            <Typography variant="body2" color="text.secondary">
              © {persianYear} — تمامی حقوق محفوظ است
            </Typography>
          </Box>
        </Container>
      </Box>
    </motion.footer>
  )
}

export default Footer
