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
  prompt: `You are an AI assistant designed to suggest relevant topics and helper packs to users based on their past interactions and current interests.

All of your suggestions MUST be in the standard Urdu (Nastaliq) script. Do NOT use Roman Urdu.

User History:
{{#each userHistory}}
- {{this}}
{{/each}}

Current Interests:
{{#each currentInterests}}
- {{this}}
{{/each}}

Based on this information, suggest relevant topics and helper packs that the user might find useful. Format your response as a JSON object with "suggestedTopics" and "suggestedHelperPacks" keys, each containing an array of strings in Urdu.

Ensure the suggested topics and helper packs are tailored to the user's needs and preferences, and are likely to be of interest to them. Topics should be related to daily life, recipes, health tips, or kids stories, as appropriate for SunoBot.
Helper packs should also align with these themes. Ensure that you return at least 3 topics, and 2 helper packs.`,
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
