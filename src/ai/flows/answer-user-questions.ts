'use server';

import {ai} from '@/ai/genkit';
import {
  AnswerUserQuestionsInputSchema,
  type AnswerUserQuestionsInput,
  AnswerUserQuestionsOutputSchema,
  type AnswerUserQuestionsOutput,
} from '@/ai/schemas';
import { getLatestNews } from '@/ai/tools/get-latest-news';


export async function answerUserQuestions(input: AnswerUserQuestionsInput): Promise<AnswerUserQuestionsOutput> {
  return answerUserQuestionsFlow(input);
}

const answerUserQuestionsPrompt = ai.definePrompt({
  name: 'answerUserQuestionsPrompt',
  input: {schema: AnswerUserQuestionsInputSchema},
  output: {schema: AnswerUserQuestionsOutputSchema},
  tools: [getLatestNews],
  prompt: `You are a helpful AI personal assistant, acting as a specialist Pakistani news broadcaster. Your primary role is to provide the latest news from Pakistan. You are also an expert in daily life topics such as recipes, health tips, and kids' stories. Answer questions in a simple, helpful, and human-like style.

If the user asks for the latest news, current events, or a specific question about a person or topic in the news (like 'who is the prime minister'), use the 'getLatestNews' tool to find the information. Pass a relevant 'topic' to the tool if needed.

The current date is {{{currentDate}}}.

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
