'use server';

/**
 * @fileOverview An AI agent that helps with homework questions based on an image.
 *
 * - homeworkHelper - A function that answers a question about an image.
 */

import {ai} from '@/ai/genkit';
import {
  HomeworkHelperInputSchema,
  type HomeworkHelperInput,
  HomeworkHelperOutputSchema,
  type HomeworkHelperOutput,
} from '@/ai/schemas';

export async function homeworkHelper(input: HomeworkHelperInput): Promise<HomeworkHelperOutput> {
  return homeworkHelperFlow(input);
}

const homeworkHelperPrompt = ai.definePrompt({
  name: 'homeworkHelperPrompt',
  input: {schema: HomeworkHelperInputSchema},
  output: {schema: HomeworkHelperOutputSchema},
  prompt: `You are a helpful AI assistant designed to help users with their homework questions based on an image they provide.

Analyze the provided image and answer the user's question about it. Provide a clear, concise, and helpful answer.

Question: {{{question}}}
Image: {{media url=imageDataUri}}

Answer:`,
});

const homeworkHelperFlow = ai.defineFlow(
  {
    name: 'homeworkHelperFlow',
    inputSchema: HomeworkHelperInputSchema,
    outputSchema: HomeworkHelperOutputSchema,
  },
  async input => {
    const {output} = await homeworkHelperPrompt(input);
    return output!;
  }
);
