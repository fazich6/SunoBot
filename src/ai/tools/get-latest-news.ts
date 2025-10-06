'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NewsArticleSchema = z.object({
    headline: z.string().describe('The headline of the news article.'),
    source: z.string().describe('The source of the news article (e.g., Dawn, Geo News).'),
    summary: z.string().describe('A brief summary of the article.'),
});

export const getLatestNews = ai.defineTool(
    {
        name: 'getLatestNews',
        description: 'Returns the latest news headlines from Pakistan.',
        inputSchema: z.object({
            topic: z.string().optional().describe('A specific topic to get news for (e.g., "politics", "sports").'),
        }),
        outputSchema: z.array(NewsArticleSchema),
    },
    async (input) => {
        // In a real application, this would call a News API.
        // For this prototype, we will return dummy data.
        console.log(`Fetching Pakistani news for topic: ${input.topic || 'general'}`);

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
