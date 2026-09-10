import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  Rating,
  Button,
  TextField,
  Divider,
  Avatar,
  Chip,
  CircularProgress,
  Paper,
  Stack,
} from '@mui/material'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { reviewService, type ReviewResponse } from '@/services/review'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime } from '@/lib/utils'

interface Props {
  venueId: number
  averageRating?: number
  totalReviews?: number
  onRatingChange?: (avg: number, total: number) => void
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
    <Box>
      {/* Header with summary */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon="mdi:star" className="h-5 w-5" style={{ color: '#f59e0b' }} />
          نظرات کاربران
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Rating value={averageRating || 0} readOnly precision={0.5} size="small" />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {averageRating ? averageRating.toFixed(1) : '—'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            ({totalReviews || 0} نظر)
          </Typography>
        </Box>
      </Box>

      {/* Review form */}
      {isNormalUser ? (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '16px',
            border: '1px solid rgba(37,99,235,0.12)',
            background: 'rgba(37,99,235,0.03)',
            mb: 3,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            {editing ? 'ویرایش نظر شما' : 'نظر خود را ثبت کنید'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>امتیاز شما:</Typography>
            <Rating
              value={rating}
              onChange={(_, newValue) => setRating(newValue)}
              size="medium"
            />
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            placeholder="تجربه خود را از این مجموعه بنویسید (اختیاری)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 1000 } }}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              disabled={submitting}
              onClick={handleSubmit}
              sx={{
                borderRadius: '10px', textTransform: 'none', fontWeight: 600,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                '&:hover': { background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)' },
              }}
            >
              {submitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : editing ? 'ذخیره تغییرات' : 'ثبت نظر'}
            </Button>
            {editing && (
              <Button
                variant="outlined"
                onClick={() => {
                  setEditing(false)
                  setComment('')
                  setRating(5)
                }}
                sx={{ borderRadius: '10px', textTransform: 'none' }}
              >
                انصراف
              </Button>
            )}
            {!editing && myReview && (
              <Button
                variant="outlined"
                onClick={() => myReview && handleEditStart(myReview)}
                sx={{ borderRadius: '10px', textTransform: 'none' }}
              >
                <Icon icon="mdi:pencil-outline" className="h-4 w-4 ml-1" />
                ویرایش نظر قبلی
              </Button>
            )}
          </Box>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{ p: 2.5, borderRadius: '16px', border: '1px dashed rgba(0,0,0,0.12)', textAlign: 'center', mb: 3, bgcolor: 'rgba(0,0,0,0.015)' }}
        >
          <Icon icon="mdi:star-outline" className="h-8 w-8" style={{ color: '#f59e0b', margin: '0 auto 8px', display: 'block' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            برای ثبت نظر، وارد حساب کاربری شوید
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate('/login')}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
          >
            ورود / ثبت‌نام
          </Button>
        </Paper>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* Review list */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : reviews.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Icon icon="mdi:comment-quote-outline" className="h-10 w-10" style={{ color: 'rgba(0,0,0,0.2)', margin: '0 auto 8px', display: 'block' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            هنوز نظری برای این مجموعه ثبت نشده است. اولین نفر باشید!
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {reviews.map((review) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', border: '1px solid rgba(0,0,0,0.07)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 700 }}>
                      {(review.user_name || '؟')[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {review.user_name || 'کاربر'}
                        {review.user_id === user?.id && (
                          <Chip
                            label="شما"
                            size="small"
                            sx={{ ml: 1, height: 18, fontSize: '0.62rem', bgcolor: 'rgba(37,99,235,0.1)', color: 'primary.main', fontWeight: 700 }}
                          />
                        )}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        {formatDateTime(review.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                  <Rating value={review.rating} readOnly size="small" sx={{ '& .MuiRating-icon': { fontSize: '0.9rem' } }} />
                </Box>
                {review.comment && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8, mt: 1, whiteSpace: 'pre-wrap' }}>
                    {review.comment}
                  </Typography>
                )}
                {review.user_id === user?.id && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                    <Button size="small" onClick={() => handleEditStart(review)} sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
                      <Icon icon="mdi:pencil-outline" className="h-3.5 w-3.5 ml-1" />
                      ویرایش
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      disabled={deletingId === review.id}
                      onClick={() => handleDelete(review.id)}
                      sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                    >
                      {deletingId === review.id ? <CircularProgress size={14} /> : <Icon icon="mdi:trash-can-outline" className="h-3.5 w-3.5 ml-1" />}
                      حذف
                    </Button>
                  </Box>
                )}
              </Paper>
            </motion.div>
          ))}
        </Stack>
      )}
    </Box>
  )
}

export default ReviewSection
