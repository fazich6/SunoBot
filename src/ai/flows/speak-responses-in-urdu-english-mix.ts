'use server';
/**
 * @fileOverview An AI agent that speaks responses in a natural-sounding mix of Urdu and English.
 *
 * - speakResponsesInUrduEnglishMix - A function that generates spoken responses in a mix of Urdu and English.
 */

import {ai} from '@/ai/genkit';
import wav from 'wav';
import {
  SpeakResponsesInUrduEnglishMixInputSchema,
  type SpeakResponsesInUrduEnglishMixInput,
  SpeakResponsesInUrduEnglishMixOutputSchema,
  type SpeakResponsesInUrduEnglishMixOutput,
} from '@/ai/schemas';

export async function speakResponsesInUrduEnglishMix(input: SpeakResponsesInUrduEnglishMixInput): Promise<SpeakResponsesInUrduEnglishMixOutput> {
  return speakResponsesInUrduEnglishMixFlow(input);
}

const speakResponsesInUrduEnglishMixFlow = ai.defineFlow(
  {
    name: 'speakResponsesInUrduEnglishMixFlow',
    inputSchema: SpeakResponsesInUrduEnglishMixInputSchema,
    outputSchema: SpeakResponsesInUrduEnglishMixOutputSchema,
  },
  async (query) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: query.text,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {      
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
