'use server';

/**
 * @fileOverview This file defines a Genkit flow for answering user questions in Urdu or English.
 * 
 * It uses a prompt to generate human-like answers based on the user's query.
 * The flow takes a question string as input and returns an answer string.
 * 
 * @exports answerUserQuestions - An async function that takes a question and returns an answer.
 * @exports AnswerUserQuestionsInput - The input type for the answerUserQuestions function.
 * @exports AnswerUserQuestionsOutput - The return type for the answerUserQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerUserQuestionsInputSchema = z.object({
  question: z.string().describe('The user\'s question in Urdu or English.'),
});
export type AnswerUserQuestionsInput = z.infer<typeof AnswerUserQuestionsInputSchema>;

const AnswerUserQuestionsOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user\'s question.'),
});
export type AnswerUserQuestionsOutput = z.infer<typeof AnswerUserQuestionsOutputSchema>;

export async function answerUserQuestions(input: AnswerUserQuestionsInput): Promise<AnswerUserQuestionsOutput> {
  return answerUserQuestionsFlow(input);
}

const answerUserQuestionsPrompt = ai.definePrompt({
  name: 'answerUserQuestionsPrompt',
  input: {schema: AnswerUserQuestionsInputSchema},
  output: {schema: AnswerUserQuestionsOutputSchema},
  prompt: `You are a helpful and friendly AI assistant that can answer questions in both Urdu and English.

  Please provide a simple, helpful, and human-like answer to the following question.  If you don't know the answer, say so.

  Question: {{{question}}}`,
});

const answerUserQuestionsFlow = ai.defineFlow(
  {
    name: 'answerUserQuestionsFlow',
    inputSchema: AnswerUserQuestionsInputSchema,
    outputSchema: AnswerUserQuestionsOutputSchema,
  },
  async input => {
    const {output} = await answerUserQuestionsPrompt(input);
    return output!;
  }
);
