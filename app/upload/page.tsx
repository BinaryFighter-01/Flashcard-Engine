'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase-client';
import * as pdfjs from 'pdfjs-dist';

interface GeneratedCard {
     id: string;
     front: string;
     back: string;
     hint: string;
     card_type: 'concept' | 'definition' | 'example' | 'relationship';
     difficulty_level: number;
     tags: string[];
     created_at: string;
}

export default function UploadPage() {
     const [isDragging, setIsDragging] = useState(false);
     const [file, setFile] = useState<File | null>(null);
     const [deckTitle, setDeckTitle] = useState('');
     const [deckDescription, setDeckDescription] = useState('');
     const [loading, setLoading] = useState(false);
     const [generating, setGenerating] = useState(false);
     const [generationProgress, setGenerationProgress] = useState(0);
     const [generationStatus, setGenerationStatus] = useState('');
     const [cards, setCards] = useState<GeneratedCard[]>([]);
     const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
     const [error, setError] = useState('');
     const [success, setSuccess] = useState('');
     const router = useRouter();
     const supabase = createClient();
     const dragRef = useRef<HTMLDivElement>(null);

     // Check if user is logged in
     const [userLoading, setUserLoading] = useState(true);
     const fileInputRef = useRef<HTMLInputElement>(null);

     useEffect(() => {
          let isMounted = true;

          const checkAuth = async () => {
               try {
                    const {
                         data: { user },
                    } = await supabase.auth.getUser();

                    if (isMounted) {
                         if (!user) {
                              router.push('/auth/login?redirect=/upload');
                         } else {
                              setUserLoading(false);
                         }
                    }
               } catch (err) {
                    console.error('Auth check failed:', err);
                    if (isMounted) {
                         router.push('/auth/login?redirect=/upload');
                    }
               }
          };

          checkAuth();

          return () => {
               isMounted = false;
          };
     }, [router, supabase]);

     const handleDragOver = useCallback((e: React.DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
     }, []);

     const handleDragLeave = useCallback((e: React.DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
     }, []);

     const handleDrop = useCallback((e: React.DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);

          const droppedFiles = e.dataTransfer.files;
          if (droppedFiles.length > 0) {
               const pdfFile = droppedFiles[0];
               if (pdfFile.type === 'application/pdf') {
                    setFile(pdfFile);
                    setError('');
               } else {
                    setError('Please upload a PDF file');
               }
          }
     }, []);

     const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.files && e.target.files[0]) {
               const pdfFile = e.target.files[0];
               if (pdfFile.type === 'application/pdf') {
                    setFile(pdfFile);
                    setError('');
               } else {
                    setError('Please upload a PDF file');
               }
          }
     };

     const openFileDialog = () => {
          fileInputRef.current?.click();
     };

     const extractTextFromPDF = async (pdfFile: File): Promise<string> => {
          return new Promise((resolve, reject) => {
               const reader = new FileReader();

               reader.onload = async (e) => {
                    try {
                         // Set up worker right before using PDF.js
                         if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
                              const workerUrl = '/pdf.worker.min.js';
                              pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
                         }

                         const arrayBuffer = e.target?.result as ArrayBuffer;

                         // Try to load PDF with error handling for worker issues
                         try {
                              const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

                              let fullText = '';
                              for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                                   try {
                                        const page = await pdf.getPage(pageNum);
                                        const textContent = await page.getTextContent();
                                        const pageText = textContent.items
                                             .map((item: any) => item.str)
                                             .join(' ');

                                        // Clean up extra whitespace while preserving paragraphs
                                        const cleanText = pageText
                                             .replace(/\s+/g, ' ')
                                             .trim();

                                        if (cleanText.length > 0) {
                                             fullText += cleanText + '\n\n';
                                        }
                                   } catch (pageErr) {
                                        console.warn(`Error extracting page ${pageNum}:`, pageErr);
                                   }
                              }

                              if (!fullText.trim()) {
                                   reject(new Error('PDF appears to be empty or contains no extractable text'));
                                   return;
                              }

                              // Additional validation
                              console.log(`Extracted ${fullText.length} characters from PDF`);
                              resolve(fullText);
                         } catch (workerErr: any) {
                              console.error('PDF worker error:', workerErr);
                              reject(new Error('PDF extraction failed. Make sure PDF contains readable text.'));
                         }
                    } catch (err) {
                         reject(err);
                    }
               };

               reader.onerror = () => {
                    reject(new Error('Failed to read PDF file'));
               };

               reader.readAsArrayBuffer(pdfFile);
          });
     };

     const handleGenerateCards = async () => {
          if (!file || !deckTitle.trim()) {
               setError('Please select a PDF and enter a deck title');
               return;
          }

          setLoading(true);
          setGenerating(true);
          setError('');
          setGenerationProgress(0);
          setGenerationStatus('Extracting text from PDF...');

          try {
               // Extract text from PDF
               setGenerationProgress(10);
               setGenerationStatus('Extracting text from PDF...');
               const pdfText = await extractTextFromPDF(file);

               if (!pdfText.trim()) {
                    setError('Could not extract text from PDF. Make sure it contains readable text.');
                    setGenerating(false);
                    setLoading(false);
                    return;
               }

               // Generate cards via API
               setGenerationProgress(30);
               setGenerationStatus('Sending to AI for card generation...');

               const response = await fetch('/api/generate-cards', {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                         pdfText,
                         deckTitle,
                    }),
               });

               if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to generate cards');
               }

               const data = await response.json();
               setGenerationProgress(90);
               setGenerationStatus(`Generated ${data.count} cards!`);

               setCards(data.cards);
               setTimeout(() => {
                    setGenerationProgress(100);
                    setGenerating(false);
               }, 500);
          } catch (err: any) {
               setError(err.message || 'Failed to generate cards');
               setGenerating(false);
          } finally {
               setLoading(false);
          }
     };

     const handleEditCard = (index: number, field: string, value: any) => {
          const updatedCards = [...cards];
          updatedCards[index] = {
               ...updatedCards[index],
               [field]: value,
          };
          setCards(updatedCards);
     };

     const handleRemoveCard = (index: number) => {
          setCards(cards.filter((_, i) => i !== index));
     };

     const handleSaveDeck = async () => {
          if (!deckTitle.trim() || cards.length === 0) {
               setError('Please generate cards before saving');
               return;
          }

          setLoading(true);
          setError('');

          try {
               const {
                    data: { user },
               } = await supabase.auth.getUser();

               if (!user) {
                    setError('You must be logged in to save decks');
                    return;
               }

               // Create deck
               const { data: deckData, error: deckError } = await supabase
                    .from('decks')
                    .insert({
                         user_id: user.id,
                         title: deckTitle,
                         description: deckDescription,
                         source_filename: file?.name,
                         card_count: cards.length,
                         color_tag: 'blue',
                    })
                    .select()
                    .single();

               if (deckError) throw deckError;

               // Create cards
               const cardsToInsert = cards.map((card) => ({
                    deck_id: deckData.id,
                    front: card.front,
                    back: card.back,
                    hint: card.hint,
                    card_type: card.card_type,
                    difficulty_level: card.difficulty_level,
                    tags: card.tags,
               }));

               const { error: cardsError } = await supabase
                    .from('cards')
                    .insert(cardsToInsert);

               if (cardsError) throw cardsError;

               setSuccess(`Deck "${deckTitle}" saved with ${cards.length} cards!`);
               setTimeout(() => {
                    router.push(`/deck/${deckData.id}`);
               }, 1500);
          } catch (err: any) {
               setError(err.message || 'Failed to save deck');
          } finally {
               setLoading(false);
          }
     };

     if (userLoading) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <div className="spinner-glass w-12 h-12"></div>
               </div>
          );
     }

     return (
          <div className="min-h-screen bg-dark-bg">
               {/* Premium Header */}
               <header className="glass-bg sticky top-0 z-50 border-b border-white/5">
                    <div className="max-w-5xl mx-auto px-4 py-8 flex items-center justify-between">
                         <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                              <h1 className="text-3xl font-bold text-gradient">RecallAI</h1>
                         </Link>
                         <Link href="/dashboard" className="btn-secondary text-sm font-semibold">
                              ← Back
                         </Link>
                    </div>
               </header>

               {/* Main Content */}
               <main className="max-w-5xl mx-auto px-4 py-16">
                    {cards.length === 0 ? (
                         <div className="space-y-8">
                              {/* Step 1: Upload PDF - Premium Design */}
                              <div className="glass-bg rounded-2xl p-8">
                                   <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 rounded-lg glass-bg flex items-center justify-center font-bold text-accent-amber">
                                             1
                                        </div>
                                        <h2 className="text-2xl font-bold">Upload Your Document</h2>
                                   </div>

                                   <div
                                        ref={dragRef}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`relative rounded-2xl p-16 text-center transition-all cursor-pointer border-2 ${isDragging
                                             ? 'border-accent-amber bg-accent-amber/10 shadow-lg shadow-accent-amber/20'
                                             : 'border-dashed border-white/20 hover:border-accent-amber/50'
                                             }`}
                                   >
                                        <input
                                             ref={fileInputRef}
                                             type="file"
                                             accept=".pdf"
                                             onChange={handleFileSelect}
                                             className="hidden"
                                        />
                                        <div className="text-6xl mb-6 animate-float">📄</div>
                                        <h3 className="text-2xl font-semibold mb-3">
                                             Drop your PDF here
                                        </h3>
                                        <p className="text-gray-400 mb-8 text-lg">or click to browse your computer</p>
                                        <button
                                             onClick={openFileDialog}
                                             type="button"
                                             className="btn-primary font-semibold"
                                        >
                                             Choose Document
                                        </button>
                                   </div>

                                   {file && (
                                        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                                             <span className="text-2xl">✓</span>
                                             <div>
                                                  <p className="text-emerald-400 font-semibold">{file.name}</p>
                                                  <p className="text-xs text-emerald-300">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                             </div>
                                        </div>
                                   )}
                              </div>

                              {/* Step 2: Deck Details - Premium Design */}
                              <div className="glass-bg rounded-2xl p-8">
                                   <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 rounded-lg glass-bg flex items-center justify-center font-bold text-accent-amber">
                                             2
                                        </div>
                                        <h2 className="text-2xl font-bold">Deck Details</h2>
                                   </div>

                                   <div className="space-y-6">
                                        <div>
                                             <label className="block text-sm font-semibold mb-3 text-gray-200">
                                                  Deck Title <span className="text-red-400">*</span>
                                             </label>
                                             <input
                                                  type="text"
                                                  value={deckTitle}
                                                  onChange={(e) => setDeckTitle(e.target.value)}
                                                  placeholder="e.g., Biology 101, Spanish Vocab"
                                                  className="w-full glass-bg py-3 px-4 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-accent-amber/50 transition-all border border-white/5"
                                             />
                                        </div>

                                        <div>
                                             <label className="block text-sm font-semibold mb-3 text-gray-200">
                                                  Description
                                             </label>
                                             <textarea
                                                  value={deckDescription}
                                                  onChange={(e) => setDeckDescription(e.target.value)}
                                                  placeholder="Add a description for your deck..."
                                                  rows={3}
                                                  className="w-full glass-bg py-3 px-4 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-accent-amber/50 transition-all border border-white/5"
                                             />
                                        </div>
                                   </div>
                              </div>

                              {/* Error Display */}
                              {error && (
                                   <div className="glass-bg border border-red-500/30 bg-red-500/10 rounded-xl p-4 text-red-300 flex items-center gap-3">
                                        <span className="text-2xl">⚠️</span>
                                        <span>{error}</span>
                                   </div>
                              )}

                              {/* Generate Button */}
                              <button
                                   onClick={handleGenerateCards}
                                   disabled={!file || !deckTitle.trim() || loading}
                                   className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold py-4 rounded-xl"
                              >
                                   {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                             <div className="spinner-glass w-5 h-5"></div>
                                             Generating...
                                        </span>
                                   ) : (
                                        '✨ Generate Flashcards'
                                   )}
                              </button>

                              {/* Generation Progress */}
                              {generating && (
                                   <div className="glass-bg rounded-2xl p-6">
                                        <p className="text-sm text-gray-300 font-medium mb-4">{generationStatus}</p>
                                        <div className="w-full bg-dark-surface/50 rounded-full h-3 overflow-hidden">
                                             <div
                                                  className="bg-gradient-to-r from-accent-amber via-accent-indigo to-accent-amber h-full transition-all duration-300"
                                                  style={{ width: `${generationProgress}%` }}
                                             ></div>
                                        </div>
                                        <div className="flex justify-between mt-4">
                                             <p className="text-xs text-gray-400">{generationProgress}% complete</p>
                                             <p className="text-xs text-gray-400">This may take a minute...</p>
                                        </div>
                                   </div>
                              )}
                         </div>
                    ) : (
                         <div className="space-y-8">
                              {/* Card Preview & Editing */}
                              <div className="glass-bg rounded-2xl p-8">
                                   <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-bold">
                                             ✨ Generated {cards.length} Card{cards.length !== 1 ? 's' : ''}
                                        </h2>
                                        <button
                                             onClick={() => setCards([])}
                                             className="btn-secondary text-sm font-semibold"
                                        >
                                             ← Start Over
                                        </button>
                                   </div>

                                   <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
                                        {cards.map((card, index) => (
                                             <div
                                                  key={index}
                                                  className="border border-dark-border rounded-lg p-4 hover:border-accent-amber/50 transition-all"
                                             >
                                                  <div className="flex items-start justify-between mb-3">
                                                       <span className="text-xs font-semibold text-accent-amber">
                                                            Card {index + 1}
                                                       </span>
                                                       <button
                                                            onClick={() => handleRemoveCard(index)}
                                                            className="text-red-400 hover:text-red-300 text-sm"
                                                       >
                                                            Delete
                                                       </button>
                                                  </div>

                                                  {editingCardIndex === index ? (
                                                       <div className="space-y-3">
                                                            <div>
                                                                 <label className="text-xs text-gray-400 block mb-1">
                                                                      Front (Question)
                                                                 </label>
                                                                 <textarea
                                                                      value={card.front}
                                                                      onChange={(e) =>
                                                                           handleEditCard(index, 'front', e.target.value)
                                                                      }
                                                                      rows={2}
                                                                      className="input-primary text-sm"
                                                                 />
                                                            </div>
                                                            <div>
                                                                 <label className="text-xs text-gray-400 block mb-1">
                                                                      Back (Answer)
                                                                 </label>
                                                                 <textarea
                                                                      value={card.back}
                                                                      onChange={(e) =>
                                                                           handleEditCard(index, 'back', e.target.value)
                                                                      }
                                                                      rows={2}
                                                                      className="input-primary text-sm"
                                                                 />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                 <div>
                                                                      <label className="text-xs text-gray-400 block mb-1">
                                                                           Type
                                                                      </label>
                                                                      <select
                                                                           value={card.card_type}
                                                                           onChange={(e) =>
                                                                                handleEditCard(index, 'card_type', e.target.value)
                                                                           }
                                                                           className="input-primary text-sm"
                                                                      >
                                                                           <option value="concept">Concept</option>
                                                                           <option value="definition">Definition</option>
                                                                           <option value="example">Example</option>
                                                                           <option value="relationship">Relationship</option>
                                                                      </select>
                                                                 </div>
                                                                 <div>
                                                                      <label className="text-xs text-gray-400 block mb-1">
                                                                           Difficulty (1-5)
                                                                      </label>
                                                                      <input
                                                                           type="number"
                                                                           min="1"
                                                                           max="5"
                                                                           value={card.difficulty_level}
                                                                           onChange={(e) =>
                                                                                handleEditCard(
                                                                                     index,
                                                                                     'difficulty_level',
                                                                                     parseInt(e.target.value)
                                                                                )
                                                                           }
                                                                           className="input-primary text-sm"
                                                                      />
                                                                 </div>
                                                            </div>
                                                            <button
                                                                 onClick={() => setEditingCardIndex(null)}
                                                                 className="btn-secondary text-sm w-full"
                                                            >
                                                                 Done Editing
                                                            </button>
                                                       </div>
                                                  ) : (
                                                       <>
                                                            <p className="font-semibold mb-2">{card.front}</p>
                                                            <p className="text-gray-300 text-sm mb-3">{card.back}</p>
                                                            <div className="flex gap-2 flex-wrap text-xs mb-3">
                                                                 <span className="bg-accent-indigo/20 text-accent-indigo px-2 py-1 rounded">
                                                                      {card.card_type}
                                                                 </span>
                                                                 <span className="bg-accent-amber/20 text-accent-amber px-2 py-1 rounded">
                                                                      Lvl {card.difficulty_level}
                                                                 </span>
                                                                 {card.tags.map((tag) => (
                                                                      <span
                                                                           key={tag}
                                                                           className="bg-dark-border px-2 py-1 rounded"
                                                                      >
                                                                           {tag}
                                                                      </span>
                                                                 ))}
                                                            </div>
                                                            <button
                                                                 onClick={() => setEditingCardIndex(index)}
                                                                 className="btn-ghost text-sm"
                                                            >
                                                                 Edit Card
                                                            </button>
                                                       </>
                                                  )}
                                             </div>
                                        ))}
                                   </div>
                              </div>

                              {/* Success Message */}
                              {success && (
                                   <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-green-300">
                                        ✓ {success}
                                   </div>
                              )}

                              {/* Error Display */}
                              {error && (
                                   <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-300">
                                        {error}
                                   </div>
                              )}

                              {/* Save Button */}
                              <button
                                   onClick={handleSaveDeck}
                                   disabled={loading}
                                   className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg py-3"
                              >
                                   {loading ? 'Saving Deck...' : `Save Deck with ${cards.length} Cards`}
                              </button>
                         </div>
                    )}
               </main>
          </div>
     );
}
