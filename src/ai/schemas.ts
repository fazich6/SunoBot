import {z} from 'genkit';
import { format } from 'date-fns';

/**
 * @fileOverview This file contains all the Zod schemas and TypeScript types for the AI flows.
 * By centralizing them here, we avoid "use server" directive errors in the flow files.
 */

// answer-user-questions.ts
export const AnswerUserQuestionsInputSchema = z.object({
  question: z.string().optional().describe("The user's text query. Use this if audio is not provided."),
  audioDataUri: z.string().optional().describe("The user's audio query as a data URI. Use this if available."),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    text: z.string(),
  })).describe('The history of the conversation.'),
  language: z.enum(['English', 'Urdu']).describe('The language for the response.'),
});
export type AnswerUserQuestionsInput = z.infer<typeof AnswerUserQuestionsInputSchema>;

export const AnswerUserQuestionsOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user\'s question.'),
  transcribedText: z.string().optional().describe("The transcribed text from the user's audio input."),
});
export type AnswerUserQuestionsOutput = z.infer<typeof AnswerUserQuestionsOutputSchema>;


// speak-responses-in-urdu-english-mix.ts
export const SpeakResponsesInUrduEnglishMixInputSchema = z.string().describe('The text to be spoken in a mix of Urdu and English.');
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
});
export type TranscribeUserVoiceInputInput = z.infer<typeof TranscribeUserVoiceInputInputSchema>;

export const TranscribeUserVoiceInputOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the user\'s voice input.'),
});
export type TranscribeUserVoiceInputOutput = z.infer<typeof TranscribeUserVoiceInputOutputSchema>;


// suggest-topics-flow.ts
export const SuggestTopicsInputSchema = z.object({
    userHistory: z.array(z.string()).describe("A list of user's past queries."),
    currentInterests: z.array(z.string()).describe('A list of topics the user is currently interested in.'),
});
export type SuggestTopicsInput = z.infer<typeof SuggestTopicsInputSchema>;

export const SuggestTopicsOutputSchema = z.object({
    suggestedTopics: z.array(z.string()).describe('An array of suggested topic strings in Urdu.'),
    suggestedHelperPacks: z.array(z.string()).describe('An array of suggested helper pack strings in Urdu.'),
});
export type SuggestTopicsOutput = z.infer<typeof SuggestTopicsOutputSchema>;
