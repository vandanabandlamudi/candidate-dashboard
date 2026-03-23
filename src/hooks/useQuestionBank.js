import { useState } from 'react'
import { QUESTION_BANK } from '../constants/questionBank'

export function useQuestionBank() {
  const [questionBank, setQuestionBank] = useState(QUESTION_BANK)
  return { questionBank, setQuestionBank }
}
