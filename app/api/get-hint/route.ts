import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function POST(request: NextRequest) {
     try {
          const { cardFront } = await request.json();

          if (!cardFront) {
               return NextResponse.json(
                    { error: 'Missing cardFront' },
                    { status: 400 }
               );
          }

          const geminiApiKey = process.env.GEMINI_API_KEY;
          if (!geminiApiKey) {
               return NextResponse.json(
                    { error: 'Gemini API key not configured' },
                    { status: 500 }
               );
          }

          const response = await fetch(GEMINI_API_URL, {
               method: 'POST',
               headers: {
                    'Content-Type': 'application/json',
               },
               body: JSON.stringify({
                    contents: [
                         {
                              parts: [
                                   {
                                        text: `Give a Socratic hint for this question that nudges thinking without revealing the answer. The hint should be 1-2 sentences max, subtle and thought-provoking.

Question: ${cardFront}

Provide only the hint, no other text.`,
                                   },
                              ],
                         },
                    ],
                    generationConfig: {
                         temperature: 0.7,
                         topK: 40,
                         topP: 0.95,
                         maxOutputTokens: 150,
                    },
                    apiKey: geminiApiKey,
               }),
          });

          if (!response.ok) {
               const error = await response.json();
               console.error('Gemini API error:', error);
               return NextResponse.json(
                    { error: 'Failed to generate hint from Gemini API' },
                    { status: 500 }
               );
          }

          const data = await response.json();
          const hint = data.contents?.[0]?.parts?.[0]?.text || '';

          return NextResponse.json({ hint });
     } catch (error: any) {
          console.error('Error in get-hint:', error);
          return NextResponse.json(
               { error: error.message || 'Internal server error' },
               { status: 500 }
          );
     }
}
