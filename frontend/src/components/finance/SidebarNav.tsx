// Sidebar navigation for Finance Console - Modern & User-Friendly
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'

interface NavItem {
  id: string
  label: string
  icon: string
  path: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'نمای کلی', icon: 'mdi:view-dashboard-outline', path: '/finance' },
  { id: 'transactions', label: 'تراکنش‌ها', icon: 'mdi:swap-horizontal-bold', path: '/finance/transactions' },
  { id: 'accounts', label: 'حساب‌ها', icon: 'mdi:account-cash-outline', path: '/finance/accounts' },
  { id: 'reports', label: 'گزارش‌ها', icon: 'mdi:chart-bar', path: '/finance/reports' },
]

interface SidebarNavProps {
  activeTab?: string
}

export function SidebarNav({ activeTab = 'overview' }: SidebarNavProps) {
  const location = useLocation()
  
  // Determine active tab from URL if not provided
  const getActiveFromPath = () => {
    if (location.pathname.includes('/transactions')) return 'transactions'
    if (location.pathname.includes('/accounts')) return 'accounts'
    if (location.pathname.includes('/reports')) return 'reports'
    return 'overview'
  }
  
  const currentActive = activeTab || getActiveFromPath()

  return (
    <nav className="flex h-full w-full flex-col gap-1 p-2 md:w-48 md:border-r md:bg-card/50">
      {NAV_ITEMS.map((item) => {
        const isActive = currentActive === item.id
        return (
          <Link
            key={item.id}
            to={item.path}
            className={cn(
              'group flex min-h-[40px] items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all',
              'hover:bg-accent hover:text-accent-foreground',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground'
            )}
          >
            <Icon
              icon={item.icon}
              className={cn(
                'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                isActive && 'animate-pulse'
              )}
            />
            <span className="hidden md:inline truncate">{item.label}</span>
          </Link>
        )
      })}
      
      {/* Quick Stats Summary */}
      <div className="mt-auto hidden rounded-lg border bg-muted/30 p-2 md:block">
        <p className="mb-1 text-[10px] font-semibold text-muted-foreground">راهنما</p>
        <p className="text-[9px] leading-tight text-muted-foreground">
          برای مشاهده جزئیات هر بخش کلیک کنید
        </p>
      </div>
    </nav>
  )
}
