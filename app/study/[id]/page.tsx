'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase-client';
import { Card, CardProgress } from '@/app/types/database';
import { calculateNextReview, getCardsDueToday } from '@/app/lib/spaced-repetition';
import confetti from 'canvas-confetti';

interface CardWithProgress extends Card {
     progress?: CardProgress;
}

type StudyMode = 'full' | 'quick';

export default function StudyPage() {
     const params = useParams();
     const searchParams = useSearchParams();
     const deckId = params.id as string;
     const queryMode = searchParams?.get('mode') || 'full';
     const studyMode: StudyMode = queryMode === 'quick' ? 'quick' : 'full';

     const [user, setUser] = useState<any>(null);
     const [cards, setCards] = useState<CardWithProgress[]>([]);
     const [currentCardIndex, setCurrentCardIndex] = useState(0);
     const [isFlipped, setIsFlipped] = useState(false);
     const [loading, setLoading] = useState(true);
     const [showHint, setShowHint] = useState(false);
     const [hintText, setHintText] = useState('');
     const [hintLoading, setHintLoading] = useState(false);
     const [sessionStats, setSessionStats] = useState({
          reviewed: 0,
          correct: 0,
          again: 0,
          hard: 0,
          good: 0,
          easy: 0,
     });
     const [sessionComplete, setSessionComplete] = useState(false);
     const router = useRouter();
     const supabase = createClient();

     // Load cards
     useEffect(() => {
          const loadCards = async () => {
               try {
                    const {
                         data: { user: currentUser },
                    } = await supabase.auth.getUser();

                    if (!currentUser) {
                         router.push('/auth/login');
                         return;
                    }

                    setUser(currentUser);

                    // Fetch all cards for this deck
                    const { data: cardsData, error: cardsError } = await supabase
                         .from('cards')
                         .select('*')
                         .eq('deck_id', deckId);

                    if (cardsError) throw cardsError;

                    if (cardsData) {
                         // Fetch progress for each card
                         const cardsWithProgress = await Promise.all(
                              cardsData.map(async (card) => {
                                   const { data: progressData } = await supabase
                                        .from('card_progress')
                                        .select('*')
                                        .eq('card_id', card.id)
                                        .eq('user_id', currentUser.id)
                                        .single();

                                   return {
                                        ...card,
                                        progress: progressData,
                                   };
                              })
                         );

                         // Filter cards based on study mode
                         let filteredCards = cardsWithProgress;
                         if (studyMode === 'quick') {
                              filteredCards = getCardsDueToday(
                                   cardsWithProgress.map((c) => c.progress).filter(Boolean)
                              ).map((progress) =>
                                   cardsWithProgress.find((c) => c.id === progress.card_id)
                              ).filter(Boolean) as CardWithProgress[];
                         }

                         setCards(filteredCards);
                    }
               } catch (error) {
                    console.error('Error loading cards:', error);
                    router.push('/dashboard');
               } finally {
                    setLoading(false);
               }
          };

          loadCards();
     }, [deckId, studyMode]);

     // Keyboard shortcuts
     useEffect(() => {
          const handleKeyDown = (e: KeyboardEvent) => {
               if (sessionComplete) return;

               switch (e.code) {
                    case 'Space':
                         e.preventDefault();
                         setIsFlipped(!isFlipped);
                         break;
                    case 'Digit1':
                         if (isFlipped) handleRate(0);
                         break;
                    case 'Digit2':
                         if (isFlipped) handleRate(3);
                         break;
                    case 'Digit3':
                         if (isFlipped) handleRate(4);
                         break;
                    case 'Digit4':
                         if (isFlipped) handleRate(5);
                         break;
               }
          };

          window.addEventListener('keydown', handleKeyDown);
          return () => window.removeEventListener('keydown', handleKeyDown);
     }, [isFlipped, sessionComplete]);

     // Get hint from AI
     const handleGetHint = async () => {
          if (!cards[currentCardIndex]) return;

          setHintLoading(true);
          try {
               const response = await fetch('/api/get-hint', {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                         cardFront: cards[currentCardIndex].front,
                    }),
               });

               if (response.ok) {
                    const data = await response.json();
                    setHintText(data.hint);
                    setShowHint(true);
               }
          } catch (error) {
               console.error('Error getting hint:', error);
          } finally {
               setHintLoading(false);
          }
     };

     // Speak card content
     const handleSpeak = () => {
          const card = cards[currentCardIndex];
          const text = isFlipped
               ? `Answer: ${card.back}`
               : `Question: ${card.front}`;

          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.95;
          window.speechSynthesis.speak(utterance);
     };

     // Rate card and update progress
     const handleRate = async (quality: number) => {
          const currentCard = cards[currentCardIndex];
          if (!currentCard) return;

          try {
               const response = await fetch('/api/update-progress', {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                         cardId: currentCard.id,
                         quality,
                    }),
               });

               if (!response.ok) throw new Error('Failed to update progress');

               const data = await response.json();

               // Update session stats
               setSessionStats({
                    ...sessionStats,
                    reviewed: sessionStats.reviewed + 1,
                    correct: quality >= 3 ? sessionStats.correct + 1 : sessionStats.correct,
                    again: quality === 0 ? sessionStats.again + 1 : sessionStats.again,
                    hard: quality === 3 ? sessionStats.hard + 1 : sessionStats.hard,
                    good: quality === 4 ? sessionStats.good + 1 : sessionStats.good,
                    easy: quality === 5 ? sessionStats.easy + 1 : sessionStats.easy,
               });

               // Play confetti if card is mastered (interval > 21 days)
               if (data.mastered && quality >= 3) {
                    confetti({
                         particleCount: 100,
                         spread: 70,
                         origin: { y: 0.6 },
                    });
               }

               // Move to next card or complete session
               if (currentCardIndex + 1 < cards.length) {
                    setCurrentCardIndex(currentCardIndex + 1);
                    setIsFlipped(false);
                    setShowHint(false);
                    setHintText('');
               } else {
                    setSessionComplete(true);
               }
          } catch (error) {
               console.error('Error rating card:', error);
          }
     };

     if (loading) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-amber"></div>
               </div>
          );
     }

     if (cards.length === 0) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <div className="card-container text-center max-w-md">
                         <p className="text-gray-400 mb-6">
                              {studyMode === 'quick'
                                   ? 'No cards due today! 🎉'
                                   : 'No cards in this deck yet'}
                         </p>
                         <Link href="/dashboard" className="btn-primary">
                              Back to Dashboard
                         </Link>
                    </div>
               </div>
          );
     }

     if (sessionComplete) {
          const accuracy = sessionStats.reviewed > 0
               ? Math.round(((sessionStats.correct / sessionStats.reviewed) * 100))
               : 0;

          return (
               <div className="flex items-center justify-center min-h-screen bg-dark-bg px-4">
                    <div className="card-container text-center max-w-md">
                         <div className="text-6xl mb-4">🎉</div>
                         <h1 className="text-3xl font-bold mb-6">Session Complete!</h1>

                         <div className="grid grid-cols-2 gap-4 mb-6">
                              <div>
                                   <p className="text-3xl font-bold text-accent-amber">
                                        {sessionStats.reviewed}
                                   </p>
                                   <p className="text-sm text-gray-400">Cards Reviewed</p>
                              </div>
                              <div>
                                   <p className="text-3xl font-bold text-accent-amber">{accuracy}%</p>
                                   <p className="text-sm text-gray-400">Accuracy</p>
                              </div>
                              <div>
                                   <p className="text-3xl font-bold text-accent-amber">
                                        {sessionStats.easy}
                                   </p>
                                   <p className="text-sm text-gray-400">Easy</p>
                              </div>
                              <div>
                                   <p className="text-3xl font-bold text-accent-amber">
                                        {sessionStats.again}
                                   </p>
                                   <p className="text-sm text-gray-400">Again</p>
                              </div>
                         </div>

                         <div className="space-y-2 text-sm mb-6">
                              <p className="text-gray-400">
                                   Hard: <span className="text-amber-400">{sessionStats.hard}</span> |
                                   Good: <span className="text-blue-400">{sessionStats.good}</span> |
                                   Easy: <span className="text-green-400">{sessionStats.easy}</span>
                              </p>
                         </div>

                         <div className="space-y-3">
                              <Link href={`/deck/${deckId}`} className="block btn-primary">
                                   View Deck
                              </Link>
                              <Link href={`/study/${deckId}`} className="block btn-secondary">
                                   Study Again
                              </Link>
                              <Link href="/dashboard" className="block btn-ghost">
                                   Dashboard
                              </Link>
                         </div>
                    </div>
               </div>
          );
     }

     const currentCard = cards[currentCardIndex];
     const progressPercent =
          ((currentCardIndex + 1) / cards.length) * 100;

     return (
          <div className="fixed inset-0 bg-dark-bg flex flex-col">
               {/* Minimal Header */}
               <header className="border-b border-dark-border px-4 py-3 flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                         Card {currentCardIndex + 1} / {cards.length}
                    </div>
                    <Link href={`/deck/${deckId}`} className="text-sm btn-ghost">
                         Exit
                    </Link>
               </header>

               {/* Progress Bar */}
               <div className="h-1 bg-dark-border">
                    <div
                         className="h-full bg-gradient-to-r from-accent-amber to-accent-indigo transition-all duration-300"
                         style={{ width: `${progressPercent}%` }}
                    ></div>
               </div>

               {/* Main Card Area */}
               <main className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl">
                         {/* Flip Card Container */}
                         <div
                              className="perspective mb-12"
                              style={{ perspective: '1000px' }}
                         >
                              <div
                                   className="relative w-full aspect-square bg-dark-surface border border-dark-border rounded-2xl cursor-pointer transition-transform duration-500 flex items-center justify-center p-8"
                                   onClick={() => setIsFlipped(!isFlipped)}
                                   style={{
                                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                        transformStyle: 'preserve-3d' as any,
                                   }}
                              >
                                   {/* Front */}
                                   <div
                                        className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-2xl"
                                        style={{
                                             backfaceVisibility: 'hidden',
                                        }}
                                   >
                                        <p className="text-sm text-accent-amber mb-4">Question</p>
                                        <p className="text-2xl md:text-4xl font-serif text-center leading-tight">
                                             {currentCard.front}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-8">Click to reveal answer</p>
                                   </div>

                                   {/* Back */}
                                   <div
                                        className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-2xl"
                                        style={{
                                             backfaceVisibility: 'hidden',
                                             transform: 'rotateY(180deg)',
                                        }}
                                   >
                                        <p className="text-sm text-accent-indigo mb-4">Answer</p>
                                        <p className="text-2xl md:text-4xl font-serif text-center leading-tight">
                                             {currentCard.back}
                                        </p>
                                   </div>
                              </div>
                         </div>

                         {/* Controls */}
                         <div className="space-y-6">
                              {/* Buttons Row 1: Flip & Hint */}
                              <div className="flex gap-4 justify-center">
                                   <button
                                        onClick={() => setIsFlipped(!isFlipped)}
                                        className="btn-secondary flex-1"
                                   >
                                        {isFlipped ? '← Hide' : 'Show →'}
                                   </button>
                                   <button
                                        onClick={handleGetHint}
                                        disabled={hintLoading || !isFlipped}
                                        className="btn-secondary flex-1 disabled:opacity-50"
                                   >
                                        {hintLoading ? '💭 Loading...' : '💡 Hint'}
                                   </button>
                                   <button
                                        onClick={handleSpeak}
                                        title="Read aloud (Space=flip, 1-4=rate)"
                                        className="btn-secondary px-4"
                                   >
                                        🔊
                                   </button>
                              </div>

                              {/* Hint Display */}
                              {showHint && hintText && (
                                   <div className="bg-accent-indigo/10 border border-accent-indigo/50 rounded-lg p-4">
                                        <p className="text-sm text-accent-indigo">
                                             <span className="font-semibold">💡 Hint: </span>
                                             {hintText}
                                        </p>
                                   </div>
                              )}

                              {/* Rating Buttons */}
                              {isFlipped && (
                                   <div className="space-y-2">
                                        <p className="text-xs text-gray-400 text-center mb-3">
                                             How well did you remember it?
                                        </p>
                                        <div className="grid grid-cols-4 gap-2">
                                             <button
                                                  onClick={() => handleRate(0)}
                                                  className="py-3 rounded-lg bg-red-500/20 text-red-400 font-semibold hover:bg-red-500/30 transition-all text-sm"
                                                  title="Keyboard: 1"
                                             >
                                                  <div>Again</div>
                                                  <div className="text-xs">(1)</div>
                                             </button>
                                             <button
                                                  onClick={() => handleRate(3)}
                                                  className="py-3 rounded-lg bg-orange-500/20 text-orange-400 font-semibold hover:bg-orange-500/30 transition-all text-sm"
                                                  title="Keyboard: 2"
                                             >
                                                  <div>Hard</div>
                                                  <div className="text-xs">(2)</div>
                                             </button>
                                             <button
                                                  onClick={() => handleRate(4)}
                                                  className="py-3 rounded-lg bg-blue-500/20 text-blue-400 font-semibold hover:bg-blue-500/30 transition-all text-sm"
                                                  title="Keyboard: 3"
                                             >
                                                  <div>Good</div>
                                                  <div className="text-xs">(3)</div>
                                             </button>
                                             <button
                                                  onClick={() => handleRate(5)}
                                                  className="py-3 rounded-lg bg-green-500/20 text-green-400 font-semibold hover:bg-green-500/30 transition-all text-sm"
                                                  title="Keyboard: 4"
                                             >
                                                  <div>Easy</div>
                                                  <div className="text-xs">(4)</div>
                                             </button>
                                        </div>
                                   </div>
                              )}

                              {/* Keyboard Help */}
                              <div className="text-xs text-gray-500 text-center">
                                   <p>💡 Space = Flip | 1/2/3/4 = Rate | 🔊 = Speak</p>
                              </div>
                         </div>
                    </div>
               </main>
          </div>
     );
}
