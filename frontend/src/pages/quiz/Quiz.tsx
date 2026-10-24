// src/pages/quiz/Quiz.tsx — چالش اطلاعات ورزشی هفتگی با جوایز امتیازی
import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import { Shimmer } from '@/components/mobile'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { quizService, type QuizAnswerResult } from '@/services/quiz'
import { toPersianDigits } from '@/lib/jalali'
import { cn } from '@/lib/utils'
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
      <div className="mx-auto max-w-[720px] py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl font-extrabold text-foreground">چالش ورزشی هفته</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">
            به ۳ سؤال اطلاعات ورزشی پاسخ بده و امتیاز وفاداری بگیر. هر هفته سؤال‌های تازه.
          </p>
        </motion.div>

        {/* کارت وضعیت هفته */}
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 p-5 text-stone-900 shadow-[0_10px_30px_rgba(245,158,11,0.25)]">
          <div>
            <p className="text-xs font-bold opacity-75">
              {weekQuery.data ? `هفته ${toPersianDigits(weekQuery.data.week_tag)}` : 'این هفته'}
            </p>
            <p className="text-xl font-black">
              {toPersianDigits(weekPoints)} امتیاز گرفتی
            </p>
          </div>
          <div className="text-end">
            <p className="block text-xs font-bold opacity-75">هر پاسخ درست</p>
            <p className="font-black">+{toPersianDigits(weekQuery.data?.points_per_correct ?? 10)} امتیاز</p>
          </div>
        </div>

        {weekQuery.isPending && (
          <div className="flex flex-col gap-4">
            <Shimmer variant="rounded" className="h-[150px] rounded-2xl" />
            <Shimmer variant="rounded" className="h-[150px] rounded-2xl" />
          </div>
        )}
        {weekQuery.isError && (
          <Alert variant="warning" className="mb-4 rounded-xl">
            <AlertDescription>دریافت سؤال‌ها ممکن نشد — با بارگذاری مجدد تلاش کنید.</AlertDescription>
          </Alert>
        )}
        {weekQuery.isSuccess && questions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center">
            <Icon icon="mdi:help-box-outline" aria-hidden="true" className="mx-auto h-11 w-11 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              هنوز سؤالی برای این هفته ثبت نشده — هفتهٔ بعد سر بزن!
            </p>
          </div>
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
              <div className="mb-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-start gap-2.5">
                  <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-amber-300 to-orange-500 text-[0.9rem] font-black text-stone-900">
                    {toPersianDigits(qi + 1)}
                  </span>
                  <p className="font-bold leading-[1.7] text-foreground">{q.text}</p>
                </div>

                <div className="flex flex-col gap-2">
                  {q.options.map((opt, oi) => {
                    const picked = mine?.picked === oi
                    const isCorrectChoice = Boolean(mine && mine.result.correct_index === oi)
                    const disabled = Boolean(mine) || answeredByServer || isBusy
                    return (
                      <button
                        key={oi}
                        type="button"
                        disabled={disabled}
                        onClick={() => answerMut.mutate({ questionId: q.id, answerIndex: oi })}
                        className={cn(
                          'inline-flex min-h-12 items-center justify-start gap-2 rounded-xl border px-4 text-start text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default',
                          isCorrectChoice
                            ? 'border-emerald-600 bg-emerald-600 font-extrabold text-white'
                            : picked && mine && !mine.result.correct
                              ? 'border-red-600 bg-red-600 font-extrabold text-white'
                              : 'border-border text-foreground enabled:hover:border-amber-500 enabled:hover:bg-amber-500/5'
                        )}
                      >
                        {isBusy && picked ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" role="status" aria-label="در حال ثبت" />
                        ) : isCorrectChoice ? (
                          <Icon icon="mdi:check-circle" aria-hidden="true" className="h-[18px] w-[18px]" />
                        ) : picked ? (
                          <Icon icon="mdi:close-circle" aria-hidden="true" className="h-[18px] w-[18px]" />
                        ) : null}
                        {opt}
                      </button>
                    )
                  })}
                </div>

                {mine && (
                  <p
                    className={cn(
                      'mt-3 text-sm font-bold',
                      mine.result.points_awarded > 0 || mine.result.correct
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {mine.result.points_awarded > 0
                      ? `درست! ${toPersianDigits(mine.result.points_awarded)} امتیاز گرفتی — موجودی: ${toPersianDigits(mine.result.balance)}`
                      : mine.result.correct
                        ? 'درست بود (بدون امتیاز جدید)'
                        : `اشتباه — پاسخ درست: ${q.options[mine.result.correct_index]}`}
                  </p>
                )}
                {answeredByServer && (
                  <p className="mt-2 block text-xs font-semibold text-muted-foreground">
                    این هفته به این سؤال پاسخ داده‌ای.
                  </p>
                )}
              </div>
            </motion.div>
          )
        })}

        {weekQuery.isSuccess && questions.length > 0 && allDone && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="rounded-2xl border border-amber-500/45 bg-orange-50/80 p-5 text-center dark:bg-amber-400/10">
              <Icon icon="mdi:trophy" aria-hidden="true" className="mx-auto h-9 w-9 text-amber-500" />
              <p className="mt-2 font-extrabold text-foreground">
                چالش این هفته کامل شد — {toPersianDigits(weekPoints)} امتیاز
              </p>
              <Link
                to="/profile"
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-extrabold text-amber-800 hover:bg-amber-500/10 dark:text-amber-400"
              >
                مشاهده امتیازها در پروفایل
                <Icon icon="mdi:arrow-left" aria-hidden="true" className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  )
}

export default Quiz
