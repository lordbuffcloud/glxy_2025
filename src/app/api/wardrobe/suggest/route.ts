import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ClothingItem } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { wardrobe, occasion, style } = await request.json();

    // Format wardrobe items for the prompt
    const wardrobeDescription = wardrobe
      .map((item: ClothingItem) => ({
        id: item.id,
        category: item.category,
        colors: item.colors.join(', '),
        style: item.style.join(', '),
        tags: item.tags.join(', '),
      }))
      .reduce((acc: string, item: any) => {
        return acc + `\n- ${item.category}: ${item.colors} (${item.style}) [${item.tags}] (ID: ${item.id})`;
      }, '');

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional fashion stylist AI that creates outfit suggestions based on available clothing items.',
        },
        {
          role: 'user',
          content: `Create an outfit suggestion for the following occasion: "${occasion}"${
            style ? ` in this style: "${style}"` : ''
          }.\n\nAvailable items:\n${wardrobeDescription}\n\nProvide the response in JSON format with:\n1. items: array of item IDs to use\n2. explanation: detailed explanation of why these items work together\n3. style: the overall style of the outfit\n4. season: recommended season\n5. metadata: including confidence score`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const suggestion = JSON.parse(response.choices[0].message.content || '{}');

    // Map the suggested item IDs back to full item objects
    suggestion.items = suggestion.items.map((id: string) =>
      wardrobe.find((item: ClothingItem) => item.id === id)
    );

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('Error generating outfit suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to generate outfit suggestion' },
      { status: 500 }
    );
  }
} 