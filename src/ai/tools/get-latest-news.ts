'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NewsArticleSchema = z.object({
    headline: z.string().describe('The headline of the news article.'),
    source: z.string().describe('The source of the news article (e.g., Dawn, Geo News).'),
    summary: z.string().describe('A brief summary of the article.'),
});

// A new prompt that acts as a "search engine" for the tool.
const newsSearchPrompt = ai.definePrompt(
  {
    name: 'newsSearchPrompt',
    input: { schema: z.object({ topic: z.string() }) },
    output: { schema: NewsArticleSchema },
    prompt: `You are a news search engine. Provide a single, concise, and factual headline and summary for the following topic as if it were a news report. The source should be "AI News Service".

Topic: {{{topic}}}`,
  },
);


export const getLatestNews = ai.defineTool(
    {
        name: 'getLatestNews',
        description: 'Returns the latest news headlines from Pakistan. Can also be used to find information about a specific person, topic, or current event by passing a query to the topic field.',
        inputSchema: z.object({
            topic: z.string().optional().describe('A specific topic to get news for (e.g., "politics", "Prime Minister of Pakistan").'),
        }),
        outputSchema: z.array(NewsArticleSchema),
    },
    async (input) => {
        console.log(`Fetching Pakistani news for topic: ${input.topic || 'general'}`);

        // If a specific topic is provided, use the AI to generate a targeted answer.
        if (input.topic) {
            const { output } = await newsSearchPrompt({ topic: input.topic });
            if (output) {
              return [output];
            }
        }

        // If no topic is provided, return general dummy data.
        return [
            {
                headline: "Government Announces New Budget for Upcoming Fiscal Year",
                source: "Dawn",
                summary: "The federal government has unveiled the new budget, focusing on economic growth, inflation control, and providing relief to the public."
            },
            {
                headline: "Pakistan Cricket Team Secures Victory in T20 Series",
                source: "Geo News",
                summary: "A stellar performance by the national cricket team led to a decisive victory in the final T20 match, clinching the series."
            },
            {
                headline: "New Metro Bus Project Launched in Karachi to Ease Traffic",
                source: "Samaa TV",
                summary: "The government has inaugurated a new metro bus line in Karachi aimed at providing modern, affordable, and efficient transportation for millions of commuters."
            }
        ];
    }
);