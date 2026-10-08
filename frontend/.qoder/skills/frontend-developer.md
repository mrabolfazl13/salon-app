---
name: frontend-developer
description: React/Tauri frontend development skill. Handles component architecture, state management, API integration, UI/UX improvements, responsive design, and accessibility.
metadata:
  type: project
  version: "1.0"
  phase: all
---

# Frontend Developer Skill - Futsal Booking System

## Responsibilities
- Build React components with TypeScript
- Implement pages and user flows
- Manage state with Zustand stores
- Integrate with backend APIs using React Query
- Ensure responsive design (mobile-first)
- Implement accessibility (WCAG 2.1 AA)
- Optimize performance (code splitting, lazy loading)
- Build Tauri desktop/mobile app

## Tech Stack
- **Framework**: React 18.2 + TypeScript
- **Build Tool**: Vite 5.4
- **UI Libraries**: Material-UI v9.4, Tailwind CSS v3.4/v4.0
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query v5
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router DOM v7
- **Desktop/Mobile**: Tauri v2
- **Animations**: Framer Motion
- **Maps**: Leaflet + react-leaflet
- **Charts**: Recharts v3
- **Date Handling**: date-fns, jalaali-js (Persian calendar)

## Project Structure
```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── auth/         # Authentication components
│   ├── booking/      # Booking-related UI
│   ├── venue/        # Venue display components
│   └── layout/       # Layout components
├── pages/            # Route components
│   ├── public/       # Public pages
│   ├── user/         # User dashboard pages
│   ├── manager/      # Manager pages
│   └── admin/        # Admin pages
├── services/         # API service functions
├── stores/           # Zustand state stores
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Development Guidelines

### 1. Component Architecture
```typescript
// Use composition over inheritance
interface VenueCardProps {
  venue: Venue;
  onSelect: (id: string) => void;
  showActions?: boolean;
}

export const VenueCard: React.FC<VenueCardProps> = ({
  venue,
  onSelect,
  showActions = false
}) => {
  // Component logic
};
```

### 2. State Management with Zustand
```typescript
import { create } from 'zustand';

interface AuthStore {
  user: User | null;
  token: string | null;
  login: (credentials: LoginDTO) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  login: async (credentials) => {
    // Implementation
  },
  logout: () => set({ user: null, token: null }),
}));
```

### 3. API Integration with React Query
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['venues', filters],
  queryFn: () => fetchVenues(filters),
});

// Mutation
const mutation = useMutation({
  mutationFn: createBooking,
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  },
});
```

### 4. Form Validation with Zod
```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const bookingSchema = z.object({
  venueId: z.string().min(1, 'Venue is required'),
  slotId: z.string().min(1, 'Time slot is required'),
  date: z.string().min(10, 'Valid date is required'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const { register, handleSubmit, formState: { errors } } = useForm<BookingFormData>({
  resolver: zodResolver(bookingSchema),
});
```

### 5. Responsive Design
```typescript
// Mobile-first approach with MUI breakpoints
<Box
  sx={{
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('sm')]: {
      flexDirection: 'row',
    },
    [theme.breakpoints.up('md')]: {
      gap: 2,
    },
  }}
>
```

### 6. Accessibility (WCAG 2.1 AA)
- Use semantic HTML elements
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Maintain focus-visible styles
- Provide text alternatives for images
- Ensure color contrast ratio >= 4.5:1
- Test with screen readers

## Performance Optimization

### Code Splitting
```typescript
// Lazy load heavy components
const ManagerDashboard = React.lazy(() => import('./pages/manager/Dashboard'));

// Use Suspense for loading states
<Suspense fallback={<LoadingSkeleton />}>
  <ManagerDashboard />
</Suspense>
```

### Memoization
```typescript
// Memoize expensive computations
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback((id: string) => {
  setSelectedId(id);
}, []);
```

### Image Optimization
```typescript
// Use lazy loading for images
<img
  src={venue.imageUrl}
  alt={venue.name}
  loading="lazy"
/>
```

## Testing Strategy

### Unit Tests
```typescript
import { render, screen, fireEvent } from '@testing-library/react';

test('displays venue name', () => {
  render(<VenueCard venue={mockVenue} />);
  expect(screen.getByText(mockVenue.name)).toBeInTheDocument();
});
```

### Integration Tests
- Test complete user flows (login → search → book → pay)
- Mock API responses with MSW
- Test error states and edge cases

### E2E Tests
- Use Playwright or Cypress
- Test critical paths only
- Run on CI before deployment

## Code Review Checklist
- [ ] TypeScript types for all props/state
- [ ] Proper error boundaries
- [ ] Loading states for async operations
- [ ] Empty states for no data
- [ ] Responsive on mobile/tablet/desktop
- [ ] Accessible (keyboard, screen reader)
- [ ] No console.log in production
- [ ] Proper cleanup in useEffect
- [ ] Optimistic updates where appropriate
- [ ] Error messages in Persian

## Common Tasks

### Adding New Page
1. Create component in `src/pages/[category]/`
2. Add route in router configuration
3. Create API service in `src/services/`
4. Add to navigation if needed
5. Write tests
6. Update documentation

### Creating Reusable Component
1. Place in `src/components/ui/`
2. Define clear props interface
3. Add Storybook story if complex
4. Document usage examples
5. Export from index file

### State Management Decision
- **Local state**: useState for component-only state
- **Zustand**: Shared state across components
- **React Query**: Server state (API data)
- **URL params**: State that should be shareable/bookmarkable

## Phase-Specific Priorities

### Phase 0 (Critical Fixes)
- Fix build configuration
- Remove mock data dependencies
- Ensure proper environment variable usage
- Fix any TypeScript errors blocking builds

### Phase 1 (Core Completion)
- Implement split payment UI
- Build notification center
- Create waitlist management UI
- Add financial dashboard widgets

See `docs/tasks/frontend-tasks.md` for detailed task list.
