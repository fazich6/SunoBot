'use server';
/**
 * @fileOverview This file defines a Genkit flow for transcribing user voice input, supporting both Urdu and English.
 *
 * - transcribeUserVoiceInput - A function that transcribes user voice input to text.
 * - TranscribeUserVoiceInputInput - The input type for the transcribeUserVoiceInput function.
 * - TranscribeUserVoiceInputOutput - The return type for the transcribeUserVoiceInput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeUserVoiceInputInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      'The audio data as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type TranscribeUserVoiceInputInput = z.infer<typeof TranscribeUserVoiceInputInputSchema>;

const TranscribeUserVoiceInputOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the user\'s voice input.'),
});
export type TranscribeUserVoiceInputOutput = z.infer<typeof TranscribeUserVoiceInputOutputSchema>;

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
