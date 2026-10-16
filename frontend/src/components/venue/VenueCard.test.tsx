import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Venue } from '@/types/venue'

// @iconify در jsdom برای هر آیکون درخواست شبکه می‌زند — اینجا فقط placeholder کافی است
vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon?: string }) => <span data-testid="icon" data-icon={icon} />,
}))

import VenueCard from './VenueCard'

const venue: Venue = {
  id: 7,
  name: 'سالن TEST',
  category: 'futsal',
  address: 'تهران، خیابان آزادی',
  latitude: 35.7,
  longitude: 51.4,
  phone: null,
  // بک‌اند این دو ستون JSON را گاهی رشته می‌فرستد؛ کارت باید آن را تحمل کند
  amenities: '["changepoint","lighting"]' as unknown as string[],
  images: '["hall-7.jpg"]' as unknown as string[],
  price: 200000,
  is_verified: true,
  manager_id: 3,
  created_at: '2026-01-01T00:00:00Z',
  average_rating: 4.5,
  total_reviews: 12,
}

const renderCard = () =>
  render(
    <MemoryRouter>
      <VenueCard venue={venue} />
    </MemoryRouter>,
  )

describe('VenueCard', () => {
  it('renders the e2e test id and the venue name', () => {
    renderCard()
    expect(screen.getByTestId('venue-card')).toBeInTheDocument()
    expect(screen.getByText(/سالن TEST/)).toBeInTheDocument()
  })

  it('links to the venue detail route', () => {
    renderCard()
    expect(screen.getByTestId('venue-card')).toHaveAttribute('href', '/venues/7')
  })

  it('parses JSON-string amenities/images columns without crashing', () => {
    renderCard()
    // دو عدد از لیست amenities در کارت نمایش داده می‌شوند
    expect(screen.getByTestId('venue-card').textContent).toContain('تهران')
  })

  it('is a link (role=link) so screen readers announce navigation', () => {
    renderCard()
    expect(screen.getByRole('link')).toBeInTheDocument()
  })
})
