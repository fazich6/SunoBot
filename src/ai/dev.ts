'use server';
import { config } from 'dotenv';
config();

// This file is used for local development with `genkit start`.
// It is not used in the Next.js app.
// Import your flows here.
import '@/ai/flows/answer-user-questions.ts';
import '@/ai/flows/speak-responses-in-urdu-english-mix.ts';
import '@/ai/flows/transcribe-user-voice-input.ts';
import '@/ai/flows/analyze-image-flow.ts';
import '@/ai/flows/homework-helper-flow.ts';
import '@/ai/flows/parse-reminder-flow.ts';
import '@/ai/flows/suggest-topics-flow.ts';
import '@/ai/flows/answer-image-question-flow.ts';
import '@/ai/flows/analyze-report-flow.ts';

// Import your tools here.
import '@/ai/tools/get-latest-news.ts';
