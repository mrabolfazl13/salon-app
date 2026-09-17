// علاقه‌مندی‌ها — هیبرید: مهمان دقیقاً مثل قبل localStorage؛ کاربر لاگین‌کرده در
// اولین بارگذاری/ورود، GET /favorites را می‌خواند، Ids محلیِ-only را POST می‌کند
// (POST idempotent است) و بعد سرور مبدأ اعتبار می‌شود. API همان شکل قبلی می‌ماند
// (FavoriteButton/Favorites بدون تغییر).
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'
import { favoriteService } from '@/services/favorites'
import { useAuthStore } from '@/store/authStore'

export interface FavoriteVenue {
  id: number
  name: string
  savedAt: number
}

interface FavoritesStore {
  favorites: FavoriteVenue[]
  /** شناسه کاربری که لیستش از سرور همگام شده (null = فعلاً محلی/مهمان) */
  syncedUserId: number | null
  isFavorite: (id: number) => boolean
  toggle: (venue: { id: number; name: string }) => boolean // true → اضافه شد
  remove: (id: number) => void
  clear: () => void
  syncWithServer: () => Promise<void>
}

const isAuthed = (): boolean => {
  const { isAuthenticated, user } = useAuthStore.getState()
  return isAuthenticated && !!user
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      syncedUserId: null,

      isFavorite: (id) => get().favorites.some((f) => f.id === id),

      toggle: (venue) => {
        const prev = get().favorites
        const exists = prev.some((f) => f.id === venue.id)
        const next = exists
          ? prev.filter((f) => f.id !== venue.id)
          : [{ id: venue.id, name: venue.name, savedAt: Date.now() }, ...prev]
        set({ favorites: next })

        if (isAuthed()) {
          const req = exists ? favoriteService.remove(venue.id) : favoriteService.add(venue.id)
          req.catch(() => {
            // واگرد و همگام‌سازی مجدد با واقعیت سرور
            set({ favorites: prev })
            get()
              .syncWithServer()
              .catch(() => {})
            toast.error('خطا در همگام‌سازی علاقه‌مندی با سرور')
          })
        }
        return !exists
      },

      remove: (id) => {
        const prev = get().favorites
        set({ favorites: prev.filter((f) => f.id !== id) })
        if (isAuthed()) {
          favoriteService
            .remove(id)
            .then(() => set({ favorites: get().favorites.filter((f) => f.id !== id) }))
            .catch(() => {
              set({ favorites: prev })
              get()
                .syncWithServer()
                .catch(() => {})
              toast.error('حذف از سرور انجام نشد')
            })
        }
      },

      clear: () => {
        const prev = get().favorites
        set({ favorites: [] })
        if (isAuthed()) {
          Promise.allSettled(prev.map((f) => favoriteService.remove(f.id))).then((results) => {
            if (results.some((r) => r.status === 'rejected')) {
              get()
                .syncWithServer()
                .catch(() => set({ favorites: prev }))
            }
          })
        }
      },

      syncWithServer: async () => {
        const { user } = useAuthStore.getState()
        if (!user || !useAuthStore.getState().isAuthenticated) return
        const serverIds = await favoriteService.list()
        const local = get().favorites
        const localIds = local.map((f) => f.id)
        const serverSet = new Set(serverIds)
        const onlyLocal = localIds.filter((id) => !serverSet.has(id))
        if (onlyLocal.length > 0) {
          // مهاجرت لیست محلی — POST idempotent است
          const results = await Promise.allSettled(onlyLocal.map((id) => favoriteService.add(id)))
          const okIds = onlyLocal.filter((_, i) => results[i].status === 'fulfilled')
          const failed = onlyLocal.filter((_, i) => results[i].status === 'rejected')
          if (failed.length > 0) {
            toast(`${failed.length} علاقه‌مندی محلی همگام نشد`, { icon: '⚠️', duration: 3000 })
          }
          const merged = [...serverIds, ...okIds.filter((id) => !serverIds.includes(id))]
          applyMerged(merged, local)
        } else {
          applyMerged(serverIds, local)
        }
        set({ syncedUserId: user.id })
      },
    }),
    {
      name: 'futsal-favorites',
      partialize: (state) => ({ favorites: state.favorites, syncedUserId: state.syncedUserId }),
    },
  ),
)

function applyMerged(ids: number[], local: FavoriteVenue[]) {
  const localById = new Map(local.map((f) => [f.id, f]))
  const now = Date.now()
  // حفظ ترتیب لیست محلی برای Ids مشترک؛ Ids جدید سرور آخر می‌آیند
  const kept = local.filter((f) => ids.includes(f.id))
  const keptIds = new Set(kept.map((f) => f.id))
  const additions = ids
    .filter((id) => !keptIds.has(id))
    .map((id) => localById.get(id) ?? { id, name: '', savedAt: now })
  useFavoritesStore.setState({ favorites: [...kept, ...additions] })
}

// ─────────────── خودهمگام‌سازی هنگام احراز هویت ───────────────
// login/hydrate → یک sync به‌ازای کاربر؛ logout → ریست نگهبانِ «مهمان».
let triggeredForUser: number | null = null

useAuthStore.subscribe((state) => {
  const uid = state.isAuthenticated ? state.user?.id ?? null : null
  if (uid != null) {
    if (triggeredForUser !== uid) {
      triggeredForUser = uid
      useFavoritesStore.getState().syncWithServer().catch(() => {
        // خطای شبکه/توکن منقضی — لیست محلی دست‌نخورده می‌ماند
      })
    }
    return
  }
  triggeredForUser = null
  if (!state.isAuthenticated && useFavoritesStore.getState().syncedUserId != null) {
    useFavoritesStore.setState({ syncedUserId: null })
  }
})

// هیدریت هم‌زمان zustand persist: اگر از قبل لاگین بودیم، همین حالا سینک کن
{
  const auth = useAuthStore.getState()
  if (auth.isAuthenticated && auth.user && triggeredForUser == null) {
    triggeredForUser = auth.user.id
    useFavoritesStore.getState().syncWithServer().catch(() => {})
  }
}