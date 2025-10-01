
'use server';

import { transcribeUserVoiceInput } from '@/ai/flows/transcribe-user-voice-input';
import { answerUserQuestions } from '@/ai/flows/answer-user-questions';
import { speakResponsesInUrduEnglishMix } from '@/ai/flows/speak-responses-in-urdu-english-mix';
import type { TranscribeUserVoiceInputInput } from '@/ai/flows/transcribe-user-voice-input';
import type { AnswerUserQuestionsInput } from '@/ai/flows/answer-user-questions';

export async function getTranscription(input: TranscribeUserVoiceInputInput) {
  return await transcribeUserVoiceInput(input);
}

export async function getAIAnswer(input: AnswerUserQuestionsInput) {
  return await answerUserQuestions(input);
}

export async function getSpokenResponse(text: string) {
  return await speakResponsesInUrduEnglishMix(text);
}
