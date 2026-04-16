import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card } from '@/app/types/database';

const SYSTEM_PROMPT = `You MUST create flashcards from the given text. Do not refuse.

Create exactly this JSON format - NOTHING ELSE:
[
{"front":"Question or fact 1","back":"Answer or explanation 1","hint":"Keyword 1","card_type":"concept","difficulty_level":3,"tags":["topic"]},
{"front":"Question or fact 2","back":"Answer or explanation 2","hint":"Keyword 2","card_type":"concept","difficulty_level":3,"tags":["topic"]}
]

RULES:
- Create 10-20 cards minimum from ANY text
- Extract facts, definitions, key points, and information
- Each card must have front, back, hint, card_type, difficulty_level, tags
- Return ONLY JSON array - no other text
- Do NOT refuse - generate cards from whatever content is provided`;

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

          // Validate we have reasonable text content
          const trimmedText = pdfText.trim();
          if (trimmedText.length < 50) {
               return NextResponse.json(
                    { error: 'Document is too short. Please provide a document with more content (at least 50 characters).' },
                    { status: 400 }
               );
          }

          // Log text length for debugging
          console.log(`Processing PDF: "${deckTitle}", Text length: ${pdfText.length} characters`);
          console.log(`Text preview: ${trimmedText.substring(0, 200)}...`);

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
                         // Remove markdown code blocks if present
                         let jsonText = generatedText;
                         if (jsonText.includes('```json')) {
                              const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
                              if (jsonMatch) jsonText = jsonMatch[1];
                         } else if (jsonText.includes('```')) {
                              const jsonMatch = jsonText.match(/```\s*([\s\S]*?)\s*```/);
                              if (jsonMatch) jsonText = jsonMatch[1];
                         }

                         // Try to extract JSON array
                         let parsedCards: any[] = [];

                         // Try 1: Find JSON array pattern
                         const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
                         if (arrayMatch) {
                              try {
                                   parsedCards = JSON.parse(arrayMatch[0]);
                              } catch (e) {
                                   // Continue to next attempt
                              }
                         }

                         // Try 2: If that fails, try trimmed version
                         if (parsedCards.length === 0) {
                              const trimmed = jsonText.trim();
                              if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                                   try {
                                        parsedCards = JSON.parse(trimmed);
                                   } catch (e) {
                                        // Continue
                                   }
                              }
                         }

                         if (Array.isArray(parsedCards) && parsedCards.length > 0) {
                              console.log(`Chunk ${i + 1}: Extracted ${parsedCards.length} cards`);
                              cards = parsedCards;
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

          // Fallback 1: If no cards generated, try with ultra-simple prompt
          if (allCards.length === 0 && chunks.length > 0) {
               console.log('No cards generated on first attempt, trying fallback 1...');

               const fallbackPrompt1 = `Extract 15 Q&A flashcards from this text. Output ONLY this JSON array format:
[
{"front":"Q1","back":"A1","hint":"H1","card_type":"concept","difficulty_level":3,"tags":["tag"]},
{"front":"Q2","back":"A2","hint":"H2","card_type":"concept","difficulty_level":3,"tags":["tag"]}
]`;

               try {
                    const result = await model.generateContent(fallbackPrompt1 + '\n\nText:\n' + chunks[0]);
                    const generatedText = result.response.text();

                    console.log('Fallback 1 response:', generatedText.substring(0, 300));

                    try {
                         // Handle markdown blocks
                         let jsonText = generatedText;
                         if (jsonText.includes('```')) {
                              const match = jsonText.match(/```[\s\S]*?\[\s*[\s\S]*?\s*\]/);
                              if (match) jsonText = match[0].replace(/```/g, '');
                         }

                         const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
                         if (arrayMatch) {
                              const cards = JSON.parse(arrayMatch[0]);
                              if (Array.isArray(cards) && cards.length > 0) {
                                   console.log(`Fallback 1: Extracted ${cards.length} cards`);
                                   allCards.push(...cards);
                              }
                         }
                    } catch (parseError: any) {
                         console.error('Fallback 1 parse error:', parseError.message);
                    }
               } catch (fallbackError: any) {
                    console.error('Fallback 1 failed:', fallbackError.message);
               }
          }

          // Fallback 2: If still no cards, try even simpler approach
          if (allCards.length === 0 && chunks.length > 0) {
               console.log('Fallback 1 failed, trying fallback 2...');

               const textPreview = chunks[0].substring(0, 500);
               const fallbackPrompt2 = `Create 5-10 basic flashcards as JSON array.

${textPreview}

Answer with ONLY this: [{"front":"q","back":"a","hint":"h","card_type":"concept","difficulty_level":3,"tags":["info"]}]`;

               try {
                    const result = await model.generateContent(fallbackPrompt2);
                    const generatedText = result.response.text();

                    console.log('Fallback 2 response:', generatedText.substring(0, 300));

                    try {
                         let jsonText = generatedText;

                         // Aggressively remove non-JSON content
                         const startIdx = jsonText.indexOf('[');
                         const endIdx = jsonText.lastIndexOf(']');

                         if (startIdx !== -1 && endIdx !== -1) {
                              jsonText = jsonText.substring(startIdx, endIdx + 1);
                              const cards = JSON.parse(jsonText);
                              if (Array.isArray(cards) && cards.length > 0) {
                                   console.log(`Fallback 2: Extracted ${cards.length} cards`);
                                   allCards.push(...cards);
                              }
                         }
                    } catch (parseError: any) {
                         console.error('Fallback 2 parse error:', parseError.message);
                    }
               } catch (fallbackError: any) {
                    console.error('Fallback 2 failed:', fallbackError.message);
               }
          }

          if (allCards.length === 0) {
               console.log('DEBUG: PDF extraction returned text length:', pdfText.length);
               console.log('DEBUG: PDF text preview:', pdfText.substring(0, 500));
               console.log('DEBUG: All fallback attempts failed');

               // ULTIMATE FALLBACK: Create sample cards from extracted text
               console.log('Creating emergency sample cards from text...');
               try {
                    const sentences = pdfText
                         .split(/[.!?]+/)
                         .filter(s => s.trim().length > 20)
                         .slice(0, 10);

                    if (sentences.length > 0) {
                         sentences.forEach((sentence, idx) => {
                              const text = sentence.trim();
                              if (text.length > 0) {
                                   allCards.push({
                                        front: `Fact ${idx + 1}`,
                                        back: text,
                                        hint: text.substring(0, 30),
                                        card_type: 'concept',
                                        difficulty_level: 2,
                                        tags: ['document']
                                   });
                              }
                         });
                    }
               } catch (fallbackErr: any) {
                    console.error('Emergency fallback failed:', fallbackErr);
               }

               if (allCards.length === 0) {
                    return NextResponse.json(
                         { error: 'Could not extract any content from the document. Please try a different file with more readable text.' },
                         { status: 400 }
                    );
               }
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
