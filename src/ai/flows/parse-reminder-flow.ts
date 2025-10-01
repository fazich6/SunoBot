'use server';
/**
 * @fileOverview An AI agent that parses natural language to set a medicine reminder.
 *
 * - parseReminder - A function that extracts reminder details from a query.
 */
import {ai} from '@/ai/genkit';
import { format } from 'date-fns';
import {
  ParseReminderInputSchema,
  type ParseReminderInput,
  ParseReminderOutputSchema,
  type ParseReminderOutput,
} from '@/ai/schemas';

export async function parseReminder(input: ParseReminderInput): Promise<ParseReminderOutput> {
  return parseReminderFlow(input);
}

const parseReminderPrompt = ai.definePrompt({
  name: 'parseReminderPrompt',
  input: {schema: ParseReminderInputSchema},
  output: {schema: ParseReminderOutputSchema},
  prompt: `You are an assistant that helps parse information for setting a medicine reminder. Extract the medicine name, dosage, time, and date from the user's query. Determine if the reminder is daily.

  - The current date is ${format(new Date(), 'yyyy-MM-dd')}.
  - The current time is ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}.
  - The 'time' field MUST be in HH:mm 24-hour format (e.g., 09:00, 17:30).
  - The 'date' field MUST be in yyyy-MM-dd format. If the user says "tomorrow", calculate the date.
  - If the query mentions "daily" or "every day", OR if no specific date is mentioned, 'isDaily' should be true and the 'date' field should be empty.
  - If a specific date (like "tomorrow" or "June 1st") is mentioned, 'isDaily' must be false and the 'date' should be set.
  - If the dosage is not mentioned, do not include it.

  Examples:
  - "remind me to take panadol every day at 8am" -> { "medicine": "panadol", "time": "08:00", "isDaily": true }
  - "remind me to take 2 tablets of aspirin tomorrow at 9:30 pm" -> { "medicine": "aspirin", "dosage": "2 tablets", "time": "21:30", "date": "${format(new Date(new Date().setDate(new Date().getDate() + 1)), 'yyyy-MM-dd')}", "isDaily": false }
  - "set a reminder for vitamin C at 10:00" -> { "medicine": "vitamin C", "time": "10:00", "isDaily": true }

  Query: {{{query}}}`,
});

const parseReminderFlow = ai.defineFlow(
  {
    name: 'parseReminderFlow',
    inputSchema: ParseReminderInputSchema,
    outputSchema: ParseReminderOutputSchema,
  },
  async input => {
    const {output} = await parseReminderPrompt(input);
    return output!;
  }
);
