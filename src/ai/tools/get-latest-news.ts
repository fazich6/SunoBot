'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NewsArticleSchema = z.object({
    headline: z.string().describe('The headline of the news article.'),
    source: z.string().describe('The source of the news article (e.g., BBC News).'),
    summary: z.string().describe('A brief summary of the article.'),
});

export const getLatestNews = ai.defineTool(
    {
        name: 'getLatestNews',
        description: 'Returns the latest news headlines from around the world.',
        inputSchema: z.object({
            topic: z.string().optional().describe('A specific topic to get news for (e.g., "technology", "sports").'),
        }),
        outputSchema: z.array(NewsArticleSchema),
    },
    async (input) => {
        // In a real application, this would call a News API.
        // For this prototype, we will return dummy data.
        console.log(`Fetching news for topic: ${input.topic || 'general'}`);

        return [
            {
                headline: "Global Markets Rally on Positive Economic Data",
                source: "Reuters",
                summary: "Stock markets worldwide saw significant gains after new reports indicated stronger than expected economic growth and easing inflation."
            },
            {
                headline: "Breakthrough in Renewable Energy Storage Announced",
                source: "Science Daily",
                summary: "Researchers have developed a new battery technology that could dramatically lower the cost and increase the efficiency of storing wind and solar power."
            },
            {
                headline: "Blockbuster Movie 'Galaxy Voyager 5' Smashes Box Office Records",
                source: "Variety",
                summary: "The latest installment in the 'Galaxy Voyager' saga has had a record-breaking opening weekend, topping $500 million globally."
            }
        ];
    }
);
