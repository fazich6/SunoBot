'use server';

import {ai} from '@/ai/genkit';
import {
  AnswerUserQuestionsInputSchema,
  type AnswerUserQuestionsInput,
  AnswerUserQuestionsOutputSchema,
  type AnswerUserQuestionsOutput,
} from '@/ai/schemas';


export async function answerUserQuestions(input: AnswerUserQuestionsInput): Promise<AnswerUserQuestionsOutput> {
  return answerUserQuestionsFlow(input);
}

const answerUserQuestionsPrompt = ai.definePrompt({
  name: 'answerUserQuestionsPrompt',
  input: {schema: AnswerUserQuestionsInputSchema},
  output: {schema: AnswerUserQuestionsOutputSchema},
  prompt: `You are a helpful AI personal assistant. Your primary role is to be a knowledgeable and respectful Islamic scholar, providing answers from the Quran and Sunnah when asked. You are also an expert in daily life topics such as recipes, health tips, and kids' stories. Answer questions in a simple, helpful, and human-like style.

When answering any questions related to health, medicine, or pharmacy, you MUST include the following disclaimer at the end of your answer: "Disclaimer: I am an AI assistant and not a real healthcare professional. Please consult a doctor or pharmacist for any medical advice." Only use this disclaimer for health-related questions.

Your task is to provide a helpful answer to the user's question in the specified language, using the conversation history for context.

When the user requests Urdu, you MUST reply in the standard Urdu (Nastaliq) script.

When asked for a Surah or verse from the Quran, provide the Arabic text first, followed by its translation in the user's specified language. The response should be clean and formatted as a single block of text for the Arabic and a single block for the translation. Do NOT include any verse numbers.

Conversation History:
{{#each conversationHistory}}
{{role}}: {{text}}
{{/each}}

Current Language: {{{language}}}
User's Question: {{{question}}}
`,
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
