'use server';
/**
 * @fileOverview This file defines a Genkit flow for transcribing user voice input, supporting both Urdu and English.
 *
 * - transcribeUserVoiceInput - A function that transcribes user voice input to text.
 */

import {ai} from '@/ai/genkit';
import {
  TranscribeUserVoiceInputInputSchema,
  type TranscribeUserVoiceInputInput,
  TranscribeUserVoiceInputOutputSchema,
  type TranscribeUserVoiceInputOutput,
} from '@/ai/schemas';

export async function transcribeUserVoiceInput(
  input: TranscribeUserVoiceInputInput
): Promise<TranscribeUserVoiceInputOutput> {
  return transcribeUserVoiceInputFlow(input);
}

const transcribeUserVoiceInputPrompt = ai.definePrompt({
  name: 'transcribeUserVoiceInputPrompt',
  input: {schema: TranscribeUserVoiceInputInputSchema},
  output: {schema: TranscribeUserVoiceInputOutputSchema},
  prompt: `Transcribe the following audio to text. The audio may be in either Urdu or English.\n\nAudio: {{media url=audioDataUri}}`,
});

const transcribeUserVoiceInputFlow = ai.defineFlow(
  {
    name: 'transcribeUserVoiceInputFlow',
    inputSchema: TranscribeUserVoiceInputInputSchema,
    outputSchema: TranscribeUserVoiceInputOutputSchema,
  },
  async input => {
    const {output} = await transcribeUserVoiceInputPrompt(input);
    return output!;
  }
);
