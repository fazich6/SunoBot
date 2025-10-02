'use server';

import { answerUserQuestions } from '@/ai/flows/answer-user-questions';
import { speakResponsesInUrduEnglishMix } from '@/ai/flows/speak-responses-in-urdu-english-mix';
import { analyzeImage } from '@/ai/flows/analyze-image-flow';
import { homeworkHelper } from '@/ai/flows/homework-helper-flow';
import { parseReminder } from '@/ai/flows/parse-reminder-flow';
import { transcribeUserVoiceInput } from '@/ai/flows/transcribe-user-voice-input';

import type {
  AnswerUserQuestionsInput,
  AnswerUserQuestionsOutput,
  SpeakResponsesInUrduEnglishMixInput,
  SpeakResponsesInUrduEnglishMixOutput,
  AnalyzeImageInput,
  AnalyzeImageOutput,
  HomeworkHelperInput,
  HomeworkHelperOutput,
  ParseReminderInput,
  ParseReminderOutput,
  TranscribeUserVoiceInputInput,
  TranscribeUserVoiceInputOutput,
} from '@/ai/schemas';

export async function getAIAnswer(
  input: AnswerUserQuestionsInput
): Promise<AnswerUserQuestionsOutput> {
  return await answerUserQuestions(input);
}

export async function getSpokenResponse(
  input: SpeakResponsesInUrduEnglishMixInput
): Promise<SpeakResponsesInUrduEnglishMixOutput> {
  return await speakResponsesInUrduEnglishMix(input);
}

export async function getImageAnalysis(
  input: AnalyzeImageInput
): Promise<AnalyzeImageOutput> {
  return await analyzeImage(input);
}

export async function getHomeworkHelp(
  input: HomeworkHelperInput
): Promise<HomeworkHelperOutput> {
  return await homeworkHelper(input);
}

export async function getParsedReminder(
  input: ParseReminderInput
): Promise<ParseReminderOutput> {
  return await parseReminder(input);
}

export async function getTranscription(
  input: TranscribeUserVoiceInputInput
): Promise<TranscribeUserVoiceInputOutput> {
    return await transcribeUserVoiceInput(input);
}
