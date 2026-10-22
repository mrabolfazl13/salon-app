import React from 'react'
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
      className="mt-auto border-t border-border bg-card"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 md:flex-row md:items-start">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex min-h-9 items-center gap-3 rounded-xl px-1 transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-amber-400 to-orange-500">
            <Icon icon="mdi:soccer" className="h-5 w-5" style={{ color: '#1c1917' }} />
          </span>
          <span className="bg-gradient-to-bl from-amber-700 to-orange-700 bg-clip-text text-sm font-extrabold text-transparent">
            رزرو سالن فوتسال
          </span>
        </button>

        <nav aria-label="پیوندهای سریع" className="flex gap-1">
          {quickLinks.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => navigate(link.href)}
              className="min-h-9 rounded-xl px-3 py-2 text-[0.68rem] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <p className="text-[0.68rem] text-muted-foreground">© {persianYear} — تمامی حقوق محفوظ است</p>
      </div>
    </motion.footer>
  )
}

export default Footer
