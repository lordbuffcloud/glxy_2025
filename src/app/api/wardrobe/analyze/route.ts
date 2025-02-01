import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    // Analyze image using OpenAI's Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this clothing item and provide the following details in JSON format:\n" +
                "1. tags: array of descriptive tags\n" +
                "2. colors: array of colors present\n" +
                "3. seasons: array of suitable seasons\n" +
                "4. styles: array of fashion styles this fits into\n" +
                "5. occasions: array of suitable occasions\n" +
                "6. confidence: number between 0 and 1 indicating confidence in analysis",
            },
            {
              type: "image_url",
              image_url: imageUrl,
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
} 