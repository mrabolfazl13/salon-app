// frontend/src/services/quiz.ts — چالش اطلاعات ورزشی هفتگی (قرارداد با backend/app/api/v1/quiz.py)
import apiClient from './api'

export interface QuizQuestionView {
  id: number
  text: string
  options: string[]
}

export interface QuizStatus {
  answered_question_ids: number[]
  correct_count: number
  points_earned: number
}

export interface QuizWeek {
  week_tag: string
  points_per_correct: number
  questions: QuizQuestionView[]
  status: QuizStatus
}

export interface QuizAnswerResult {
  correct: boolean
  correct_index: number
  points_awarded: number
  balance: number
}

export const quizService = {
  getWeek: async (): Promise<QuizWeek> => {
    const response = await apiClient.get('/quiz/questions')
    return response.data
  },

  answer: async (questionId: number, answerIndex: number): Promise<QuizAnswerResult> => {
    const response = await apiClient.post('/quiz/answer', {
      question_id: questionId,
      answer_index: answerIndex,
    })
    return response.data
  },
}
