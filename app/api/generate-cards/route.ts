import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card } from '@/app/types/database';

const SYSTEM_PROMPT = `Create flashcards from the given text.

For each important concept, provide:
{
  "front": "Question about the concept",
  "back": "Answer explaining it",
  "hint": "Helpful hint",
  "card_type": "concept",
  "difficulty_level": 3,
  "tags": ["tag1"]
}

Return ONLY a valid JSON array with 10-20 cards. Start with [ and end with ].
No text before or after the JSON array.`;

// Chunk text intelligently (don't split mid-sentence/paragraph)
function chunkText(text: string, chunkSize: number = 2000): string[] {
     const paragraphs = text.split('\n\n');
     const chunks: string[] = [];
     let currentChunk = '';

     for (const paragraph of paragraphs) {
          if ((currentChunk + paragraph).length > chunkSize && currentChunk) {
               chunks.push(currentChunk);
               currentChunk = paragraph;
          } else {
               currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
          }
     }

     if (currentChunk) {
          chunks.push(currentChunk);
     }

     return chunks;
}

export async function POST(request: NextRequest) {
     try {
          const { pdfText, deckTitle } = await request.json();

          if (!pdfText || !deckTitle) {
               return NextResponse.json(
                    { error: 'Missing pdfText or deckTitle' },
                    { status: 400 }
               );
          }

          // Log text length for debugging
          console.log(`Processing PDF: "${deckTitle}", Text length: ${pdfText.length} characters`);

          const geminiApiKey = process.env.GEMINI_API_KEY;
          if (!geminiApiKey) {
               return NextResponse.json(
                    { error: 'Gemini API key not configured' },
                    { status: 500 }
               );
          }

          // For short texts (like resumes), don't chunk - send as is
          const shouldChunk = pdfText.length > 3000;
          const chunks = shouldChunk ? chunkText(pdfText, 2500) : [pdfText];

          console.log(`Processing ${chunks.length} chunk(s)`);

          const allCards: any[] = [];

          // Initialize Google Generative AI with official SDK
          const genAI = new GoogleGenerativeAI(geminiApiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

          // Process each chunk
          for (let i = 0; i < chunks.length; i++) {
               const chunk = chunks[i];

               try {
                    const prompt = `${SYSTEM_PROMPT}\n\nText to analyze:\n${chunk}`;

                    console.log(`Sending chunk ${i + 1}/${chunks.length} to Gemini (${chunk.length} chars)...`);

                    const result = await model.generateContent(prompt);
                    const generatedText = result.response.text();

                    console.log(`Chunk ${i + 1} response length: ${generatedText.length} characters`);
                    console.log(`Chunk ${i + 1} response preview:`, generatedText.substring(0, 500));

                    if (!generatedText || generatedText.length < 10) {
                         console.warn(`Chunk ${i + 1} generated no meaningful content`);
                         continue;
                    }

                    // Parse JSON from the response - try multiple ways
                    let cards: any[] = [];
                    try {
                         // First try: exact JSON array match
                         const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
                         if (jsonMatch) {
                              cards = JSON.parse(jsonMatch[0]);
                         } else {
                              // Second try: find JSON object array another way
                              const trimmed = generatedText.trim();
                              if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                                   cards = JSON.parse(trimmed);
                              }
                         }

                         if (Array.isArray(cards) && cards.length > 0) {
                              console.log(`Chunk ${i + 1}: Extracted ${cards.length} cards`);
                              allCards.push(...cards);
                         } else {
                              console.warn(`Chunk ${i + 1}: No valid card objects found in JSON`);
                         }
                    } catch (parseError: any) {
                         console.error(`Chunk ${i + 1}: JSON parse error:`, parseError.message);
                         console.log('Full response:', generatedText);
                    }
               } catch (chunkError: any) {
                    console.error(`Error processing chunk ${i}:`, chunkError.message);
               }
          }

          console.log(`Total cards generated: ${allCards.length}`);

          if (allCards.length === 0) {
               return NextResponse.json(
                    { error: 'No cards generated. This PDF content may not be suitable for flashcard generation. Try a PDF with educational content (book chapters, articles, notes).' },
                    { status: 400 }
               );
          }

          // Format cards for database
          const formattedCards: Card[] = allCards.map((card: any) => ({
               id: crypto.randomUUID(),
               deck_id: '', // Will be set by client
               front: card.front || '',
               back: card.back || '',
               hint: card.hint || '',
               card_type: card.card_type || 'concept',
               difficulty_level: Math.min(5, Math.max(1, card.difficulty_level || 3)),
               tags: Array.isArray(card.tags) ? card.tags : [],
               created_at: new Date().toISOString(),
          }));

          return NextResponse.json({
               cards: formattedCards,
               count: formattedCards.length,
          });
     } catch (error: any) {
          console.error('Error in generate-cards:', error);
          return NextResponse.json(
               { error: error.message || 'Internal server error' },
               { status: 500 }
          );
     }
}
