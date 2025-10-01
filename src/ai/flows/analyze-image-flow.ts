'use server';

/**
 * @fileOverview An AI agent that analyzes images.
 *
 * - analyzeImage - A function that analyzes an image and returns a description and extracted text.
 */

import {ai} from '@/ai/genkit';
import {
  AnalyzeImageInputSchema,
  type AnalyzeImageInput,
  AnalyzeImageOutputSchema,
  type AnalyzeImageOutput,
} from '@/ai/schemas';

export async function analyzeImage(input: AnalyzeImageInput): Promise<AnalyzeImageOutput> {
  return analyzeImageFlow(input);
}

const analyzeImagePrompt = ai.definePrompt({
  name: 'analyzeImagePrompt',
  input: {schema: AnalyzeImageInputSchema},
  output: {schema: AnalyzeImageOutputSchema},
  prompt: `You are an expert image analyst. Your task is to do two things in the user's specified language:
1.  Describe the contents of the image in detail.
2.  Extract any and all text visible in the image. If there is no text, do not include the 'extractedText' field in your output.

When the user requests Urdu, you MUST reply in the standard Urdu (Nastaliq) script. Do NOT use Roman Urdu.

Language: {{{language}}}
Image: {{media url=imageDataUri}}`,
});

const analyzeImageFlow = ai.defineFlow(
  {
    name: 'analyzeImageFlow',
    inputSchema: AnalyzeImageInputSchema,
    outputSchema: AnalyzeImageOutputSchema,
  },
  async input => {
    const {output} = await analyzeImagePrompt(input);
    return output!;
  }
);
