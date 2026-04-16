'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase-client';
import { Deck, Card, CardProgress } from '@/app/types/database';
import { calculateMastery, getCardsDueToday } from '@/app/lib/spaced-repetition';

export default function DeckDetail() {
     const params = useParams();
     const deckId = params.id as string;
     const [deck, setDeck] = useState<Deck | null>(null);
     const [cards, setCards] = useState<(Card & { progress?: CardProgress })[]>([]);
     const [loading, setLoading] = useState(true);
     const [stats, setStats] = useState({
          mastery: 0,
          cardsDueToday: 0,
          totalReviews: 0,
          correctReviews: 0,
     });
     const router = useRouter();
     const supabase = createClient();

     useEffect(() => {
          const loadDeck = async () => {
               try {
                    // Fetch deck (no user filter)
                    const { data: deckData, error: deckError } = await supabase
                         .from('decks')
                         .select('*')
                         .eq('id', deckId)
                         .single();

                    if (deckError || !deckData) {
                         router.push('/dashboard');
                         return;
                    }

                    setDeck(deckData);

                    // Fetch cards
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
                                        .single();

                                   return {
                                        ...card,
                                        progress: progressData,
                                   };
                              })
                         );

                         setCards(cardsWithProgress);

                         // Calculate stats
                         const progressArray = cardsWithProgress
                              .map((c) => c.progress)
                              .filter(Boolean)
                              .map((p: any) => ({
                                   ...p,
                                   next_review_date: typeof p.next_review_date === 'string' ? new Date(p.next_review_date) : p.next_review_date,
                                   last_reviewed_at: typeof p.last_reviewed_at === 'string' ? new Date(p.last_reviewed_at) : p.last_reviewed_at,
                              }));

                         if (progressArray.length > 0) {
                              const mastery = calculateMastery(progressArray as any);
                              const cardsDue = getCardsDueToday(progressArray as any).length;
                              const totalReviews = progressArray.reduce((sum, p: any) => sum + (p?.total_reviews || 0), 0);
                              const correctReviews = progressArray.reduce((sum, p: any) => sum + (p?.correct_reviews || 0), 0);

                              setStats({
                                   mastery,
                                   cardsDueToday: cardsDue,
                                   totalReviews,
                                   correctReviews,
                              });
                         }
                    }
               } catch (error) {
                    console.error('Error loading deck:', error);
                    router.push('/dashboard');
               } finally {
                    setLoading(false);
               }
          };

          loadDeck();
     }, [deckId]);

     const handleDeleteCard = async (cardId: string, index: number) => {
          if (!confirm('Delete this card?')) return;

          try {
               await supabase.from('cards').delete().eq('id', cardId);
               setCards(cards.filter((_, i) => i !== index));

               // Update deck card count
               if (deck) {
                    await supabase
                         .from('decks')
                         .update({ card_count: deck.card_count - 1 })
                         .eq('id', deck.id);
               }
          } catch (error) {
               console.error('Error deleting card:', error);
          }
     };

     if (loading) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-amber"></div>
               </div>
          );
     }

     if (!deck) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <p className="text-gray-400">Deck not found</p>
               </div>
          );
     }

     return (
          <div className="min-h-screen bg-dark-bg">
               {/* Header */}
               <header className="border-b border-dark-border sticky top-0 bg-dark-bg/95 backdrop-blur">
                    <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                         <div>
                              <Link href="/dashboard" className="text-2xl font-bold text-gradient mb-1 block">
                                   RecallAI
                              </Link>
                         </div>
                         <div className="flex gap-4 items-center">
                              <Link href={`/study/${deckId}`} className="btn-primary">
                                   Start Study
                              </Link>
                              <Link href="/dashboard" className="btn-secondary">
                                   Back
                              </Link>
                         </div>
                    </div>
               </header>

               {/* Main Content */}
               <main className="max-w-7xl mx-auto px-4 py-12">
                    {/* Deck Header */}
                    <div className="mb-8">
                         <h1 className="text-4xl font-bold mb-2">{deck.title}</h1>
                         {deck.description && (
                              <p className="text-gray-400 text-lg mb-4">{deck.description}</p>
                         )}
                         <p className="text-sm text-gray-500">
                              Created {new Date(deck.created_at).toLocaleDateString()}
                         </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid md:grid-cols-4 gap-4 mb-12">
                         <div className="card-container">
                              <div className="text-3xl font-bold text-accent-amber">{cards.length}</div>
                              <p className="text-sm text-gray-400">Total Cards</p>
                         </div>
                         <div className="card-container">
                              <div className="text-3xl font-bold text-accent-amber">{stats.cardsDueToday}</div>
                              <p className="text-sm text-gray-400">Due Today</p>
                         </div>
                         <div className="card-container">
                              <div className="text-3xl font-bold text-accent-amber">{stats.mastery}%</div>
                              <p className="text-sm text-gray-400">Mastery</p>
                         </div>
                         <div className="card-container">
                              <div className="text-3xl font-bold text-accent-amber">
                                   {stats.totalReviews > 0
                                        ? Math.round(((stats.correctReviews / stats.totalReviews) * 100))
                                        : 0}
                                   %
                              </div>
                              <p className="text-sm text-gray-400">Accuracy</p>
                         </div>
                    </div>

                    {/* Cards List */}
                    <div className="card-container">
                         <h2 className="text-2xl font-bold mb-6">Cards ({cards.length})</h2>

                         {cards.length === 0 ? (
                              <p className="text-gray-400 text-center py-8">No cards in this deck yet</p>
                         ) : (
                              <div className="space-y-4">
                                   {cards.map((card, index) => (
                                        <div
                                             key={card.id}
                                             className="border border-dark-border rounded-lg p-4 hover:border-accent-amber/50 transition-all"
                                        >
                                             <div className="flex items-start justify-between mb-3">
                                                  <div className="flex-1">
                                                       <div className="font-semibold mb-1 text-accent-amber">
                                                            Q: {card.front}
                                                       </div>
                                                       <div className="text-gray-300 text-sm mb-2">A: {card.back}</div>
                                                       {card.hint && (
                                                            <div className="text-gray-500 text-xs italic mb-2">
                                                                 💡 Hint: {card.hint}
                                                            </div>
                                                       )}
                                                  </div>
                                                  <button
                                                       onClick={() => handleDeleteCard(card.id, index)}
                                                       className="text-red-400 hover:text-red-300 text-sm ml-4 whitespace-nowrap"
                                                  >
                                                       Delete
                                                  </button>
                                             </div>

                                             <div className="flex gap-2 flex-wrap items-center">
                                                  <span className="text-xs bg-accent-indigo/20 text-accent-indigo px-2 py-1 rounded">
                                                       {card.card_type}
                                                  </span>
                                                  <span className="text-xs bg-accent-amber/20 text-accent-amber px-2 py-1 rounded">
                                                       Lvl {card.difficulty_level}
                                                  </span>
                                                  {card.tags.map((tag) => (
                                                       <span
                                                            key={tag}
                                                            className="text-xs bg-dark-border text-gray-300 px-2 py-1 rounded"
                                                       >
                                                            {tag}
                                                       </span>
                                                  ))}

                                                  {card.progress && (
                                                       <>
                                                            <span className={`text-xs px-2 py-1 rounded ml-auto ${card.progress.interval > 21
                                                                 ? 'bg-green-500/20 text-green-400'
                                                                 : card.progress.total_reviews === 0
                                                                      ? 'bg-gray-500/20 text-gray-400'
                                                                      : 'bg-blue-500/20 text-blue-400'
                                                                 }`}>
                                                                 {card.progress.interval > 21
                                                                      ? `✓ Mastered (${card.progress.interval}d)`
                                                                      : card.progress.total_reviews === 0
                                                                           ? 'New'
                                                                           : `Learning (${card.progress.interval}d)`}
                                                            </span>
                                                       </>
                                                  )}
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex gap-4">
                         <Link
                              href={`/study/${deckId}`}
                              className="flex-1 btn-primary text-center text-lg py-3"
                         >
                              Full Review ({cards.length} cards)
                         </Link>
                         <Link
                              href={`/study/${deckId}?mode=quick`}
                              className="flex-1 btn-secondary text-center text-lg py-3"
                         >
                              Quick Study ({stats.cardsDueToday} due)
                         </Link>
                    </div>
               </main>
          </div>
     );
}
