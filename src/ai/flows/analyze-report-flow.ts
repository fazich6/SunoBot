'use server';
/**
 * @fileOverview An AI agent that analyzes medical reports and prescriptions.
 *
 * - analyzeReport - A function that extracts key information from a medical document image.
 */

import {ai} from '@/ai/genkit';
import {
  AnalyzeReportInputSchema,
  type AnalyzeReportInput,
  AnalyzeReportOutputSchema,
  type AnalyzeReportOutput,
} from '@/ai/schemas';

export async function analyzeReport(input: AnalyzeReportInput): Promise<AnalyzeReportOutput> {
  return analyzeReportFlow(input);
}

const analyzeReportPrompt = ai.definePrompt({
  name: 'analyzeReportPrompt',
  input: {schema: AnalyzeReportInputSchema},
  output: {schema: AnalyzeReportOutputSchema},
  prompt: `You are an expert AI assistant specializing in analyzing medical documents like prescriptions and lab reports from an image. Your task is to perform OCR, identify the document type, and provide a simple, easy-to-understand summary.

ALWAYS respond in the user's specified language. For Urdu, you MUST use the standard Urdu (Nastaliq) script.

1.  **Identify Document Type**: First, determine if the image is a doctor's prescription, a lab test report, or something else.
2.  **Extract and Summarize**:
    *   **If it's a Lab Report**: Summarize the key findings. For example, if a blood sugar level is high, mention that. Do not give complex details. Just a simple overview.
    *   **If it's a Prescription**: Extract all medicines, their dosages (e.g., "500mg", "1 tablet"), and the timings (e.g., "3 times a day," "at night," "8am"). Convert timings into specific 24-hour HH:mm format. For vague timings like "3 times a day," assume standard times like 08:00, 14:00, and 20:00. If it says "daily" or implies it, set 'repeatDaily' to true for all extracted reminders. For each distinct time a medicine should be taken, create a separate reminder object. For example, 'Panadol, twice a day' should result in two reminder objects.
3.  **Add Mandatory Disclaimer**: At the end of EVERY summary, you MUST add the following disclaimer, translated into the user's language: "Disclaimer: I am an AI assistant and not a real healthcare professional. Please consult a doctor or pharmacist for any medical advice."

Language: {{{language}}}
Report Image: {{media url=reportImage}}`,
});

const analyzeReportFlow = ai.defineFlow(
  {
    name: 'analyzeReportFlow',
    inputSchema: AnalyzeReportInputSchema,
    outputSchema: AnalyzeReportOutputSchema,
  },
  async input => {
    const {output} = await analyzeReportPrompt(input);
    return output!;
  }
);
