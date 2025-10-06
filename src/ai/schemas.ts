import {z} from 'genkit';
import { format } from 'date-fns';

/**
 * @fileOverview This file contains all the Zod schemas and TypeScript types for the AI flows.
 * By centralizing them here, we avoid "use server" directive errors in the flow files.
 */

// answer-user-questions.ts
export const AnswerUserQuestionsInputSchema = z.object({
  question: z.string().describe("The user's text query."),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    text: z.string(),
  })).describe('The history of the conversation.'),
  language: z.enum(['English', 'Urdu']).describe('The language for the response.'),
  currentDate: z.string().describe('The current date to provide context to the AI.'),
});
export type AnswerUserQuestionsInput = z.infer<typeof AnswerUserQuestionsInputSchema>;

export const AnswerUserQuestionsOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user\'s question.'),
});
export type AnswerUserQuestionsOutput = z.infer<typeof AnswerUserQuestionsOutputSchema>;


// speak-responses-in-urdu-english-mix.ts
export const SpeakResponsesInUrduEnglishMixInputSchema = z.object({
    text: z.string().describe('The text to be spoken in a mix of Urdu and English.'),
    voice: z.enum(['Male', 'Female']).optional().describe('The voice preference for the speech.'),
});
export type SpeakResponsesInUrduEnglishMixInput = z.infer<typeof SpeakResponsesInUrduEnglishMixInputSchema>;

export const SpeakResponsesInUrduEnglishMixOutputSchema = z.object({
  media: z.string().describe('The audio data URI of the spoken text in WAV format.'),
});
export type SpeakResponsesInUrduEnglishMixOutput = z.infer<typeof SpeakResponsesInUrduEnglishMixOutputSchema>;


// analyze-image-flow.ts
export const AnalyzeImageInputSchema = z.object({
  imageDataUri: z.string().describe('The image data as a data URI.'),
  language: z.enum(['English', 'Urdu']).describe('The language for the response.'),
});
export type AnalyzeImageInput = z.infer<typeof AnalyzeImageInputSchema>;

export const AnalyzeImageOutputSchema = z.object({
  description: z.string().describe('A detailed description of the image content.'),
  extractedText: z.string().optional().describe('Text extracted from the image.'),
});
export type AnalyzeImageOutput = z.infer<typeof AnalyzeImageOutputSchema>;


// homework-helper-flow.ts
export const HomeworkHelperInputSchema = z.object({
  imageDataUri: z.string().describe('The image of the homework as a data URI.'),
  question: z.string().describe('The user\'s question about the homework.'),
});
export type HomeworkHelperInput = z.infer<typeof HomeworkHelperInputSchema>;

export const HomeworkHelperOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the homework question.'),
});
export type HomeworkHelperOutput = z.infer<typeof HomeworkHelperOutputSchema>;


// parse-reminder-flow.ts
export const ParseReminderInputSchema = z.object({
  query: z.string().describe("The user's natural language query for a reminder."),
});
export type ParseReminderInput = z.infer<typeof ParseReminderInputSchema>;

export const ParseReminderOutputSchema = z.object({
  medicine: z.string().describe('The name of the medicine.'),
  dosage: z.string().optional().describe('The dosage of the medicine.'),
  time: z.string().describe('The time for the reminder in HH:mm format.'),
  date: z.string().optional().describe('The date for the reminder in yyyy-MM-dd format.'),
  isDaily: z.boolean().describe('Whether the reminder should repeat daily.'),
});
export type ParseReminderOutput = z.infer<typeof ParseReminderOutputSchema>;


// transcribe-user-voice-input.ts
export const TranscribeUserVoiceInputInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      'The audio data as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  language: z.enum(['English', 'Urdu']).describe('The language the user is speaking in.'),
});
export type TranscribeUserVoiceInputInput = z.infer<typeof TranscribeUserVoiceInputInputSchema>;

export const TranscribeUserVoiceInputOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the user\'s voice input.'),
});
export type TranscribeUserVoiceInputOutput = z.infer<typeof TranscribeUserVoiceInputOutputSchema>;


// suggest-topics-flow.ts
export const SuggestTopicsInputSchema = z.object({
    userHistory: z.array(z.string()).describe("A list of user's past queries."),
    currentInterests: z.array(z.string()).optional().describe('A list of topics the user is currently interested in.'),
});
export type SuggestTopicsInput = z.infer<typeof SuggestTopicsInputSchema>;

export const SuggestTopicsOutputSchema = z.object({
    suggestedTopics: z.array(z.string()).describe('An array of suggested topic strings in Urdu.'),
});
export type SuggestTopicsOutput = z.infer<typeof SuggestTopicsOutputSchema>;


// answer-image-question-flow.ts
export const AnswerImageQuestionInputSchema = z.object({
  imageDataUri: z.string().describe('The image data as a data URI.'),
  question: z.string().optional().describe("The user's text question."),
  audioDataUri: z.string().optional().describe("The user's spoken question as a data URI."),
  language: z.enum(['English', 'Urdu']).describe('The language for the response.'),
});
export type AnswerImageQuestionInput = z.infer<typeof AnswerImageQuestionInputSchema>;

export const AnswerImageQuestionOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer.'),
  transcribedText: z.string().optional().describe('The transcribed text of the spoken question.'),
});
export type AnswerImageQuestionOutput = z.infer<typeof AnswerImageQuestionOutputSchema>;

// analyze-report-flow.ts
export const AnalyzeReportInputSchema = z.object({
  reportImage: z.string().describe('The medical report image as a data URI.'),
  language: z.enum(['English', 'Urdu']).describe('The language for the summary.'),
});
export type AnalyzeReportInput = z.infer<typeof AnalyzeReportInputSchema>;

const ReminderSchema = z.object({
    medicineName: z.string().describe('The name of the medicine.'),
    dosage: z.string().optional().describe('The dosage of the medicine.'),
    time: z.string().describe('A single time for the reminder in HH:mm 24-hour format (e.g., 09:00, 21:30).'),
    repeatDaily: z.boolean().describe('Whether the reminder should repeat daily at this time.'),
});

export const AnalyzeReportOutputSchema = z.object({
  reportType: z.enum(['prescription', 'lab_report', 'other']).describe('The type of medical document detected.'),
  summary: z.string().describe('A simple summary of the report in the requested language. Includes a medical disclaimer.'),
  extractedReminders: z.array(ReminderSchema).optional().describe('An array of reminder objects extracted from a prescription.'),
});
export type AnalyzeReportOutput = z.infer<typeof AnalyzeReportOutputSchema>;
export type ExtractedReminder = z.infer<typeof ReminderSchema>;
