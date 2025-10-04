'use server';

/**
 * @fileOverview An AI agent that can answer questions about an image.
 *
 * - answerImageQuestion - A function that takes an image and a question (text or audio) and returns a spoken answer.
 */

import {ai} from '@/ai/genkit';
import {
  AnswerImageQuestionInputSchema,
  type AnswerImageQuestionInput,
  AnswerImageQuestionOutputSchema,
  type AnswerImageQuestionOutput,
} from '@/ai/schemas';
import { z } from 'zod';


export async function answerImageQuestion(input: AnswerImageQuestionInput): Promise<AnswerImageQuestionOutput> {
  return answerImageQuestionFlow(input);
}

const answerImageQuestionPrompt = ai.definePrompt({
  name: 'answerImageQuestionPrompt',
  input: {schema: AnswerImageQuestionInputSchema},
  output: {schema: AnswerImageQuestionOutputSchema},
  prompt: `You are a visual assistant. Your task is to do two things:
1. If audio is provided, transcribe the user's spoken question about the image. If text is provided, use that as the question.
2. Provide a helpful answer to the question based on the content of the image, in the specified language.

When the user requests Urdu, you MUST reply in the standard Urdu (Nastaliq) script.

Current Language: {{{language}}}
Image: {{media url=imageDataUri}}
{{#if audioDataUri}}
Audio Question: {{media url=audioDataUri}}
{{else}}
Text Question: {{{question}}}
{{/if}}
`,
});

const answerImageQuestionFlow = ai.defineFlow(
  {
    name: 'answerImageQuestionFlow',
    inputSchema: AnswerImageQuestionInputSchema,
    outputSchema: AnswerImageQuestionOutputSchema,
  },
  async input => {
    const {output} = await answerImageQuestionPrompt(input);
    return output!;
  }
);
