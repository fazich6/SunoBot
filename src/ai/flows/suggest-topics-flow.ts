'use server';

/**
 * @fileOverview An AI agent that suggests topics based on conversation history.
 *
 * - suggestTopics - A function that suggests topics.
 */

import {ai} from '@/ai/genkit';
import {
  SuggestTopicsInputSchema,
  type SuggestTopicsInput,
  SuggestTopicsOutputSchema,
  type SuggestTopicsOutput,
} from '@/ai/schemas';

export async function suggestTopics(input: SuggestTopicsInput): Promise<SuggestTopicsOutput> {
  return suggestTopicsFlow(input);
}

const suggestTopicsPrompt = ai.definePrompt({
  name: 'suggestTopicsPrompt',
  input: {schema: SuggestTopicsInputSchema},
  output: {schema: SuggestTopicsOutputSchema},
  prompt: `You are an AI assistant designed to suggest relevant follow-up topics to users based on their conversation history.

Your suggestions MUST be in the standard Urdu (Nastaliq) script. Do NOT use Roman Urdu.

Conversation History:
{{#each userHistory}}
- {{this}}
{{/each}}

Based on this information, suggest three relevant and interesting topics the user might want to ask about next. The topics should be short, engaging, and directly related to the last few messages. Format your response as a JSON object with a "suggestedTopics" key containing an array of three strings in Urdu.
`,
});

const suggestTopicsFlow = ai.defineFlow(
  {
    name: 'suggestTopicsFlow',
    inputSchema: SuggestTopicsInputSchema,
    outputSchema: SuggestTopicsOutputSchema,
  },
  async input => {
    const {output} = await suggestTopicsPrompt(input);
    return output!;
  }
);
