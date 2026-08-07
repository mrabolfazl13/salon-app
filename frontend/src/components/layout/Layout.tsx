import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import Navbar from './Navbar'
import Footer from './Footer'
import Sidebar from './Sidebar'
import { motion } from 'framer-motion'

interface LayoutProps {
  children: React.ReactNode
  className?: string
  isAuthenticated?: boolean
  userRole?: string
  showSidebar?: boolean
}

const Layout: React.FC<LayoutProps> = ({
  children,
  className,
  isAuthenticated = false,
  userRole = 'user',
  showSidebar = false,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
      <Navbar
        isAuthenticated={isAuthenticated}
        userRole={userRole}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex">
        {showSidebar && (
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            userRole={userRole}
          />
        )}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            'flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
            className
          )}
        >
          {children}
        </motion.main>
      </div>
      <Footer />
    </div>
  )
}

export default Layout