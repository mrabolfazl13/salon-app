// src/theme/index.ts
import { createTheme } from '@mui/material/styles'
import type { Theme, ThemeOptions } from '@mui/material/styles'
import type { ThemeMode } from '@/store/themeStore'

/* ─── Design Tokens — هویت اسپرت پرانرژی ───────────────────────────────
   آبی = اعتماد و اقدام (رزرو، لینک‌ها)؛ کهربایی = انرژی برند (بنرها، بج‌ها،
   حالت انتخاب‌شده). گرادیان تیره navy→blue برای Hero و CTA اصلی. */

export const brand = {
  amber: '#f59e0b',
  amberLight: '#fbbf24',
  amberDark: '#d97706',
  amberInk: '#1c1917',
  blue: '#2563eb',
  blueDark: '#1d4ed8',
  navy: '#0f172a',
  pitch: '#1e3a8a',
} as const

export const gradients = {
  /** Hero و CTA اصلی — متن سفید روی آن کنتراست کامل دارد */
  primary: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 58%, #1d4ed8 100%)',
  primaryHover: 'linear-gradient(135deg, #020617 0%, #172554 58%, #1e40af 100%)',
  /** انرژی برند — متن تیره (#1c1917) روی آن استفاده شود */
  brandEnergy: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 55%, #f97316 100%)',
  /** بنر تخفیف‌ها / شگفت‌انگیزها */
  deals: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  primarySoft: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(37,99,235,0.08) 100%)',
  heroOverlay: 'linear-gradient(180deg, rgba(2,6,23,0.15) 0%, rgba(2,6,23,0.72) 100%)',
} as const

export const radii = {
  card: 20,
  sheet: 24,
  button: 14,
  chip: 10,
  image: 16,
} as const

export const shadows = {
  card: '0 1px 3px rgba(15,23,42,0.05), 0 8px 24px rgba(15,23,42,0.05)',
  cardHover: '0 4px 12px rgba(15,23,42,0.07), 0 16px 40px rgba(15,23,42,0.09)',
  cta: '0 6px 20px rgba(37,99,235,0.32)',
  nav: '0 -4px 24px rgba(15,23,42,0.06)',
} as const

export const shadowsDark = {
  card: '0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)',
  cardHover: '0 4px 12px rgba(0,0,0,0.45), 0 16px 40px rgba(0,0,0,0.4)',
  cta: '0 6px 20px rgba(96,165,250,0.25)',
  nav: '0 -4px 24px rgba(0,0,0,0.45)',
} as const

const typography = {
  fontFamily: 'Vazirmatn, system-ui, sans-serif',
  h1: { fontWeight: 800, fontSize: '3.5rem', letterSpacing: '-0.02em' },
  h2: { fontWeight: 700, fontSize: '2.5rem', letterSpacing: '-0.01em' },
  h3: { fontWeight: 700, fontSize: '2rem' },
  h4: { fontWeight: 700, fontSize: '1.5rem' },
  h5: { fontWeight: 600, fontSize: '1.25rem' },
  h6: { fontWeight: 600, fontSize: '1rem' },
  button: { fontWeight: 600, textTransform: 'none' as const },
  body1: { fontSize: '1rem', lineHeight: 1.7 },
  body2: { fontSize: '0.875rem', lineHeight: 1.6 },
}

function buildComponents(mode: ThemeMode): ThemeOptions['components'] {
  const dark = mode === 'dark'
  const accent = dark ? '#60a5fa' : '#2563eb'
  const accentSoft = dark ? 'rgba(96,165,250,0.14)' : 'rgba(37,99,235,0.08)'
  const hairline = dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'
  const surfaceBlur = dark ? 'rgba(11,18,32,0.85)' : 'rgba(255,255,255,0.85)'

  return {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        contained: {
          boxShadow: dark ? '0 4px 14px rgba(0,0,0,0.35)' : '0 4px 14px rgba(37,99,235,0.22)',
        },
        outlined: {
          borderWidth: 2,
          '&:hover': { borderWidth: 2 },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: radii.card,
          boxShadow: dark ? shadowsDark.card : shadows.card,
          transition: 'box-shadow 0.25s cubic-bezier(0.4,0,0.2,1), transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          border: `1px solid ${hairline}`,
          '&:hover': {
            boxShadow: dark ? shadowsDark.cardHover : shadows.cardHover,
            transform: 'translateY(-3px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: radii.card,
          backgroundImage: 'none',
        },
        elevation1: { boxShadow: dark ? shadowsDark.card : shadows.card },
        elevation2: { boxShadow: dark ? shadowsDark.cardHover : '0 8px 32px rgba(15,23,42,0.06)' },
        elevation3: { boxShadow: dark ? shadowsDark.cardHover : '0 12px 48px rgba(15,23,42,0.08)' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.25s ease',
            '&:hover fieldset': { borderColor: accent },
            '&.Mui-focused fieldset': { borderColor: accent, borderWidth: 2 },
          },
        },
      },
    },
    MuiSelect: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: radii.chip, fontWeight: 500 },
      },
    },
    MuiAvatar: { styleOverrides: { root: { borderRadius: 14 } } },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: surfaceBlur,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${hairline}`,
          boxShadow: 'none',
          color: dark ? '#eef2f7' : '#0f172a',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: dark ? 'rgba(11,18,32,0.96)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderInlineEnd: `1px solid ${hairline}`,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTab-root': {
            borderRadius: 10,
            textTransform: 'none',
            fontWeight: 600,
            minHeight: 48,
            transition: 'all 0.25s ease',
            '&.Mui-selected': {
              backgroundColor: accent,
              color: dark ? '#0b1220' : '#ffffff',
            },
            '&:hover': {
              backgroundColor: accentSoft,
            },
          },
          '& .MuiTabs-indicator': { display: 'none' },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radii.sheet,
          boxShadow: dark ? '0 24px 80px rgba(0,0,0,0.6)' : '0 24px 80px rgba(15,23,42,0.16)',
        },
      },
    },
    MuiAlert: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 8, height: 8 },
        bar: { borderRadius: 8 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 500,
        },
      },
    },
  }
}

function buildTheme(mode: ThemeMode): Theme {
  const dark = mode === 'dark'
  return createTheme({
    direction: 'rtl',
    typography,
    shape: { borderRadius: 16 },
    palette: {
      mode,
      primary: {
        main: dark ? '#60a5fa' : '#2563eb',
        light: dark ? '#93c5fd' : '#60a5fa',
        dark: dark ? '#3b82f6' : '#1d4ed8',
        contrastText: dark ? '#0b1220' : '#ffffff',
      },
      secondary: {
        main: dark ? '#fbbf24' : '#f59e0b',
        light: dark ? '#fcd34d' : '#fbbf24',
        dark: dark ? '#f59e0b' : '#d97706',
        contrastText: brand.amberInk,
      },
      success: {
        // متن/آلاینده روی سفید باید ۴.۵:1 را پاس کند (ممیزی UI: چیپ «فعال» ۲.۵:1 بود)
        main: dark ? '#34d399' : '#047857',
        light: dark ? '#6ee7b7' : '#10b981',
        dark: dark ? '#10b981' : '#065f46',
      },
      error: {
        main: dark ? '#f87171' : '#dc2626',
        light: dark ? '#fca5a5' : '#ef4444',
        dark: dark ? '#ef4444' : '#b91c1c',
      },
      warning: {
        // amber برند برای پس‌زمینه پر با جوهر تیره مناسب است، اما به‌عنوان
        // متن/بوردر روی سفید کنتراش ۲.۱ داشت → نسخه تیره‌تر amber
        main: dark ? '#fbbf24' : '#b45309',
        light: dark ? '#fcd34d' : '#d97706',
        dark: dark ? '#f59e0b' : '#92400e',
      },
      info: {
        main: dark ? '#60a5fa' : '#2563eb',
        light: dark ? '#93c5fd' : '#3b82f6',
        dark: dark ? '#3b82f6' : '#1d4ed8',
      },
      background: {
        default: dark ? '#0b1220' : '#f6f7f9',
        paper: dark ? '#121a2b' : '#ffffff',
      },
      text: {
        primary: dark ? '#eef2f7' : '#0f172a',
        secondary: dark ? '#9aa7b8' : '#5b6472',
      },
      divider: dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
      grey: dark
        ? {
            50: '#1a2438',
            100: '#162033',
            200: '#223049',
            300: '#2e3f5e',
            400: '#55677f',
            500: '#7c8ca3',
            600: '#9aa7b8',
            700: '#bcc7d4',
            800: '#d9e1ea',
            900: '#eef2f7',
          }
        : {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#64748b',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
          },
    },
    components: buildComponents(mode),
  })
}

export const lightTheme = buildTheme('light')
export const darkTheme = buildTheme('dark')

export const getTheme = (mode: ThemeMode): Theme => (mode === 'dark' ? darkTheme : lightTheme)

/** سازگاری با ایمپورت‌های قبلی — تم روشن پیش‌فرض */
export const themeOptions: ThemeOptions = {
  direction: 'rtl',
  typography,
  shape: { borderRadius: 16 },
}
export const theme = lightTheme
