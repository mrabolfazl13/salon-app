// src/pages/quiz/Quiz.tsx — چالش اطلاعات ورزشی هفتگی با جوایز امتیازی
import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material'
import Layout from '@/components/layout/Layout'
import { Shimmer } from '@/components/mobile'
import { quizService, type QuizAnswerResult } from '@/services/quiz'
import { toPersianDigits } from '@/lib/jalali'
import { gradients, shadows } from '@/theme'
import toast from 'react-hot-toast'

const Quiz: React.FC = () => {
  const weekQuery = useQuery({
    queryKey: ['quiz', 'week'],
    queryFn: quizService.getWeek,
    staleTime: 60_000,
  })

  // پاسخ‌های همین نشست — کلید: question_id
  const [answers, setAnswers] = useState<Record<number, { picked: number; result: QuizAnswerResult }>>({})

  const answerMut = useMutation({
    mutationFn: ({ questionId, answerIndex }: { questionId: number; answerIndex: number }) =>
      quizService.answer(questionId, answerIndex),
    onSuccess: (res, vars) => {
      setAnswers((prev) => ({ ...prev, [vars.questionId]: { picked: vars.answerIndex, result: res } }))
      if (res.correct && res.points_awarded > 0) toast.success(`${toPersianDigits(res.points_awarded)} امتیاز گرفتی!`)
      else if (res.correct) toast('پاسخت درست بود ولی امسال این سؤال پاسخ داده شده بود')
      else toast('پاسخ درست نبود')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'ثبت پاسخ ممکن نشد')
    },
  })

  const questions = weekQuery.data?.questions ?? []
  const answeredIds = useMemo(() => {
    const server: number[] = weekQuery.data?.status?.answered_question_ids ?? []
    return new Set([...server, ...Object.keys(answers).map(Number)])
  }, [weekQuery.data, answers])

  const weekPoints = (weekQuery.data?.status?.points_earned ?? 0) +
    Object.values(answers).reduce((s, a) => s + a.result.points_awarded, 0)

  const allDone = questions.length > 0 && answeredIds.size >= questions.length

  return (
    <Layout>
      <Box sx={{ py: 3, maxWidth: 720, mx: 'auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            چالش ورزشی هفته
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
            به ۳ سؤال اطلاعات ورزشی پاسخ بده و امتیاز وفاداری بگیر. هر هفته سؤال‌های تازه.
          </Typography>
        </motion.div>

        {/* کارت وضعیت هفته */}
        <Box
          sx={{
            borderRadius: '16px',
            p: 2.5,
            mb: 3,
            background: gradients.brandEnergy,
            color: '#1c1917',
            boxShadow: '0 10px 30px rgba(245,158,11,0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.75 }}>
              {weekQuery.data ? `هفته ${toPersianDigits(weekQuery.data.week_tag)}` : 'این هفته'}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {toPersianDigits(weekPoints)} امتیاز گرفتی
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, opacity: 0.75 }}>
              هر پاسخ درست
            </Typography>
            <Typography sx={{ fontWeight: 900 }}>
              +{toPersianDigits(weekQuery.data?.points_per_correct ?? 10)} امتیاز
            </Typography>
          </Box>
        </Box>

        {weekQuery.isPending && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Shimmer variant="rounded" sx={{ height: 150, borderRadius: '16px' }} />
            <Shimmer variant="rounded" sx={{ height: 150, borderRadius: '16px' }} />
          </Box>
        )}
        {weekQuery.isError && (
          <Alert severity="warning" sx={{ borderRadius: '12px', mb: 2 }}>
            دریافت سؤال‌ها ممکن نشد — با بارگذاری مجدد تلاش کنید.
          </Alert>
        )}
        {weekQuery.isSuccess && questions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6, border: '1px dashed', borderColor: 'divider', borderRadius: '16px' }}>
            <Icon icon="mdi:help-box-outline" style={{ width: 44, height: 44, color: '#94a3b8' }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              هنوز سؤالی برای این هفته ثبت نشده — هفتهٔ بعد سر بزن!
            </Typography>
          </Box>
        )}

        {questions.map((q, qi) => {
          const mine = answers[q.id]
          const answeredByServer = !mine && answeredIds.has(q.id)
          const isBusy = answerMut.isPending && answerMut.variables?.questionId === q.id
          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: qi * 0.06 }}
            >
              <Box
                sx={{
                  p: 2.5,
                  mb: 2.5,
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  boxShadow: shadows.card,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 2 }}>
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: '10px',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: gradients.brandEnergy,
                      color: '#1c1917',
                      fontWeight: 900,
                      fontSize: '0.9rem',
                    }}
                  >
                    {toPersianDigits(qi + 1)}
                  </Box>
                  <Typography sx={{ fontWeight: 700, lineHeight: 1.7 }}>{q.text}</Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {q.options.map((opt, oi) => {
                    const picked = mine?.picked === oi
                    const isCorrectChoice = mine && mine.result.correct_index === oi
                    const disabled = Boolean(mine) || answeredByServer || isBusy
                    let sx: any = {
                      justifyContent: 'flex-start',
                      minHeight: 48,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: 'divider',
                      color: 'text.primary',
                      '&:hover': disabled ? {} : { borderColor: '#f59e0b', bgcolor: 'rgba(245,158,11,0.06)' },
                    }
                    if (isCorrectChoice) {
                      sx = {
                        ...sx,
                        bgcolor: 'rgba(5,150,105,0.12)',
                        borderColor: '#059669',
                        color: '#059669',
                        fontWeight: 800,
                      }
                    } else if (picked && mine && !mine.result.correct) {
                      sx = {
                        ...sx,
                        bgcolor: 'rgba(220,38,38,0.10)',
                        borderColor: '#dc2626',
                        color: '#dc2626',
                        fontWeight: 800,
                      }
                    }
                    return (
                      <Button
                        key={oi}
                        variant="outlined"
                        disabled={disabled}
                        onClick={() => answerMut.mutate({ questionId: q.id, answerIndex: oi })}
                        startIcon={
                          isBusy && picked ? <CircularProgress size={16} /> :
                          isCorrectChoice ? <Icon icon="mdi:check-circle" style={{ width: 18, height: 18 }} /> :
                          picked ? <Icon icon="mdi:close-circle" style={{ width: 18, height: 18 }} /> : undefined
                        }
                        sx={sx}
                      >
                        {opt}
                      </Button>
                    )
                  })}
                </Box>

                {mine && (
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1.5,
                      fontWeight: 700,
                      color: mine.result.points_awarded > 0 ? '#059669' : mine.result.correct ? '#059669' : '#dc2626',
                    }}
                  >
                    {mine.result.points_awarded > 0
                      ? `درست! ${toPersianDigits(mine.result.points_awarded)} امتیاز گرفتی — موجودی: ${toPersianDigits(mine.result.balance)}`
                      : mine.result.correct
                        ? 'درست بود (بدون امتیاز جدید)'
                        : `اشتباه — پاسخ درست: ${q.options[mine.result.correct_index]}`}
                  </Typography>
                )}
                {answeredByServer && (
                  <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary', fontWeight: 600 }}>
                    این هفته به این سؤال پاسخ داده‌ای.
                  </Typography>
                )}
              </Box>
            </motion.div>
          )
        })}

        {weekQuery.isSuccess && questions.length > 0 && allDone && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: '16px',
                textAlign: 'center',
                border: '1px solid rgba(245,158,11,0.45)',
                bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(251,191,36,0.08)' : 'rgba(255,247,237,0.8)'),
              }}
            >
              <Icon icon="mdi:trophy" style={{ width: 36, height: 36, color: '#f59e0b' }} />
              <Typography sx={{ fontWeight: 800, mt: 1 }}>
                چالش این هفته کامل شد — {toPersianDigits(weekPoints)} امتیاز
              </Typography>
              <Button
                component={Link}
                to="/profile"
                sx={{ mt: 1.5, fontWeight: 800, color: '#b45309', textTransform: 'none' }}
                endIcon={<Icon icon="mdi:arrow-left" />}
              >
                مشاهده امتیازها در پروفایل
              </Button>
            </Box>
          </motion.div>
        )}
      </Box>
    </Layout>
  )
}

export default Quiz
