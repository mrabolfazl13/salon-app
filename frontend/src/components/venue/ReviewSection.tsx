import React, { useEffect, useState, useCallback, useId } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { reviewService, type ReviewResponse } from '@/services/review'
import { useAuthStore } from '@/store/authStore'
import { Avatar, AvatarFallback } from '@/components/ui/shadcn/avatar'
import { Button } from '@/components/ui/shadcn/button'
import { Label } from '@/components/ui/shadcn/label'
import { Separator } from '@/components/ui/shadcn/separator'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { cn, formatDateTime } from '@/lib/utils'
import { toPersianDigits } from '@/lib/jalali'

interface Props {
  venueId: number
  averageRating?: number
  totalReviews?: number
  onRatingChange?: (avg: number, total: number) => void
}

const STAR_SIZES = {
  sm: { box: 'h-[18px] w-[18px]', icon: 'h-[18px] w-[18px]' },
  md: { box: 'h-6 w-6', icon: 'h-6 w-6' },
} as const

/** نمایش ستاره‌ها با پشتیبانی از نیم‌ستاره (معادل precision=0.5 در Rating) */
const StarMeter: React.FC<{ value: number; size?: keyof typeof STAR_SIZES }> = ({ value, size = 'sm' }) => {
  const s = STAR_SIZES[size]
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)))
        return (
          <span key={i} className={cn('relative inline-block', s.box)}>
            <Icon icon="mdi:star-outline" className={cn('absolute inset-0 text-slate-400/50 dark:text-slate-500', s.icon)} />
            <span className="absolute inset-y-0 start-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Icon icon="mdi:star" className={cn('absolute start-0 top-0 text-amber-500', s.icon)} />
            </span>
          </span>
        )
      })}
    </span>
  )
}

const ReviewSection: React.FC<Props> = ({ venueId, averageRating = 0, totalReviews = 0, onRatingChange }) => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [rating, setRating] = useState<number | null>(5)
  const [comment, setComment] = useState('')
  const [myReview, setMyReview] = useState<ReviewResponse | null>(null)
  const [editing, setEditing] = useState(false)
  // شناسانه یکتای برچسب دیداری امتیاز — دو نمونه ReviewSection (موبایل/دسکتاپ) هم‌زمان در DOM هستند
  const ratingLabelId = useId()

  const isNormalUser = isAuthenticated && user?.role === 'user'

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const data = await reviewService.getByVenue(venueId)
      setReviews(data)
      const mine = data.find((r) => r.user_id === user?.id) || null
      setMyReview(mine)
    } catch (error) {
      toast.error('خطا در دریافت نظرات')
    } finally {
      setLoading(false)
    }
  }, [venueId, user?.id])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const refreshSummary = async () => {
    try {
      const summary = await reviewService.getVenueSummary(venueId)
      onRatingChange?.(summary.average_rating, summary.total_reviews)
    } catch {
      // ignore
    }
  }

  const handleSubmit = async () => {
    if (!rating) {
      toast.error('لطفاً امتیاز را انتخاب کنید')
      return
    }
    setSubmitting(true)
    try {
      if (myReview && !editing) {
        // user already has a review -> switch to edit mode
        setEditing(true)
        setRating(myReview.rating)
        setComment(myReview.comment || '')
        toast('شما قبلاً برای این سالن نظر داده‌اید. می‌توانید نظر قبلی را ویرایش کنید.', { icon: '✏️' })
        return
      }
      if (editing && myReview) {
        await reviewService.update(myReview.id, { venue_id: venueId, rating, comment: comment || null })
        toast.success('نظر شما با موفقیت ویرایش شد')
      } else {
        await reviewService.create({ venue_id: venueId, rating, comment: comment || null })
        toast.success('نظر شما با موفقیت ثبت شد ⭐')
      }
      setComment('')
      setRating(5)
      setEditing(false)
      await fetchReviews()
      await refreshSummary()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در ثبت نظر')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (reviewId: number) => {
    setDeletingId(reviewId)
    try {
      await reviewService.delete(reviewId)
      toast.success('نظر شما حذف شد')
      setMyReview(null)
      setEditing(false)
      await fetchReviews()
      await refreshSummary()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در حذف نظر')
    } finally {
      setDeletingId(null)
    }
  }

  const handleEditStart = (review: ReviewResponse) => {
    setEditing(true)
    setRating(review.rating)
    setComment(review.comment || '')
  }

  return (
    <div>
      {/* Header with summary */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-bold">
          <Icon icon="mdi:star" className="h-5 w-5" style={{ color: '#f59e0b' }} />
          نظرات کاربران
        </h3>
        <div className="flex items-center gap-2">
          <span
            role="img"
            aria-label={`امتیاز متوسط ${toPersianDigits((averageRating || 0).toFixed(1))} از ۵`}
            className="inline-flex items-center"
          >
            <StarMeter value={averageRating || 0} />
          </span>
          <span className="text-sm font-bold">
            {averageRating ? toPersianDigits(averageRating.toFixed(1)).replace('.', '٫') : '—'}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            ({toPersianDigits(totalReviews || 0)} نظر)
          </span>
        </div>
      </div>

      {/* Review form */}
      {isNormalUser ? (
        <div className="mb-6 rounded-2xl border border-blue-600/[0.12] bg-blue-600/[0.03] p-5">
          <h3 className="mb-3 font-bold">
            {editing ? 'ویرایش نظر شما' : 'نظر خود را ثبت کنید'}
          </h3>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span id={ratingLabelId} className="text-sm text-muted-foreground">امتیاز شما:</span>
            <div
              role="radiogroup"
              aria-labelledby={ratingLabelId}
              aria-label="امتیاز شما"
              className="flex items-center"
            >
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={rating === v}
                  aria-label={`${toPersianDigits(v)} ستاره از ۵`}
                  onClick={() => setRating(v)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="relative inline-block h-6 w-6" aria-hidden="true">
                    <Icon icon="mdi:star-outline" className="absolute inset-0 h-6 w-6 text-slate-400/50 dark:text-slate-500" />
                    {v <= (rating ?? 0) && (
                      <Icon icon="mdi:star" className="absolute inset-0 h-6 w-6 text-amber-500" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor="review-comment">متن نظر</Label>
            <Textarea
              id="review-comment"
              rows={2}
              maxLength={1000}
              placeholder="تجربه خود را از این مجموعه بنویسید (اختیاری)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[72px] max-h-40 rounded-xl"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              disabled={submitting}
              onClick={handleSubmit}
              className="rounded-[10px] font-semibold"
            >
              {submitting ? (
                <span
                  className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
                  role="status"
                  aria-label="در حال بارگذاری"
                />
              ) : editing ? 'ذخیره تغییرات' : 'ثبت نظر'}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(false)
                  setComment('')
                  setRating(5)
                }}
                className="rounded-[10px]"
              >
                انصراف
              </Button>
            )}
            {!editing && myReview && (
              <Button
                type="button"
                variant="outline"
                onClick={() => myReview && handleEditStart(myReview)}
                className="rounded-[10px]"
              >
                <Icon icon="mdi:pencil-outline" className="h-4 w-4" />
                ویرایش نظر قبلی
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-dashed border-slate-900/10 bg-slate-900/[0.015] p-5 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <Icon icon="mdi:star-outline" className="mx-auto mb-2 block h-8 w-8" style={{ color: '#f59e0b' }} />
          <p className="mb-2 text-sm text-muted-foreground">
            برای ثبت نظر، وارد حساب کاربری شوید
          </p>
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={() => navigate('/login')}
            className="min-h-11 rounded-[10px] px-4 font-semibold"
          >
            ورود / ثبت‌نام
          </Button>
        </div>
      )}

      <Separator className="mb-4" />

      {/* Review list */}
      {loading ? (
        <div className="py-8 text-center">
          <span
            className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground"
            role="status"
            aria-label="در حال بارگذاری"
          />
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-10 text-center">
          <Icon icon="mdi:comment-quote-outline" className="mx-auto mb-2 block h-10 w-10 text-slate-400/50 dark:text-slate-600" />
          <p className="text-sm text-muted-foreground">
            هنوز نظری برای این مجموعه ثبت نشده است. اولین نفر باشید!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="rounded-[14px] border border-slate-900/[0.07] bg-card p-4 dark:border-white/10">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-[34px] w-[34px]">
                      <AvatarFallback className="bg-blue-600/10 text-[0.8rem] font-bold text-blue-700 dark:text-blue-300">
                        {(review.user_name || '؟')[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">
                        {review.user_name || 'کاربر'}
                        {review.user_id === user?.id && (
                          <span className="ms-2 inline-flex h-[18px] items-center rounded-full bg-blue-600/10 px-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                            شما
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDateTime(review.created_at)}
                      </p>
                    </div>
                  </div>
                  <span role="img" aria-label={`امتیاز ${toPersianDigits(review.rating)} از ۵`} className="inline-flex items-center">
                    <StarMeter value={review.rating} />
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-[1.8] text-muted-foreground">
                    {review.comment}
                  </p>
                )}
                {review.user_id === user?.id && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditStart(review)}
                      className="px-2 text-xs"
                    >
                      <Icon icon="mdi:pencil-outline" className="h-3.5 w-3.5" />
                      ویرایش
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === review.id}
                      onClick={() => handleDelete(review.id)}
                      className="px-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      {deletingId === review.id ? (
                        <span
                          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                          role="status"
                          aria-label="در حال بارگذاری"
                        />
                      ) : (
                        <Icon icon="mdi:trash-can-outline" className="h-3.5 w-3.5" />
                      )}
                      حذف
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReviewSection
