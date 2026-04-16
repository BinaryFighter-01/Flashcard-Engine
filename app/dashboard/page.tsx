'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase-client';

export default function Dashboard() {
     const [loading, setLoading] = useState(true);
     const [decks, setDecks] = useState<any[]>([]);
     const supabase = createClient();

     useEffect(() => {
          const fetchDecks = async () => {
               try {
                    // Fetch all decks (no user filter)
                    const { data, error } = await supabase
                         .from('decks')
                         .select('*')
                         .order('created_at', { ascending: false });

                    if (!error && data) {
                         setDecks(data);
                    }
               } catch (error) {
                    console.error('Error:', error);
               } finally {
                    setLoading(false);
               }
          };

          fetchDecks();
     }, []);

     if (loading) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <div className="spinner-glass w-12 h-12"></div>
               </div>
          );
     }

     return (
          <div className="min-h-screen bg-dark-bg">
               {/* Header */}
               <header className="glass-bg sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                              <div className="text-3xl">✨</div>
                              <div>
                                   <h1 className="text-2xl font-bold text-gradient">RecallAI</h1>
                              </div>
                         </div>
                         <div className="flex gap-3 items-center">
                              <Link href="/upload" className="btn-primary text-sm">
                                   + Create Deck
                              </Link>
                         </div>
                    </div>
               </header>

               {/* Main Content */}
               <main className="max-w-7xl mx-auto px-4 py-12">
                    {/* Quick Stats */}
                    <div className="grid md:grid-cols-4 gap-4 mb-12">
                         <div className="card-container">
                              <div className="text-3xl font-bold text-accent-amber">{decks.length}</div>
                              <p className="text-sm text-gray-400">Total Decks</p>
                         </div>
                         <div className="card-container">
                              <div className="text-3xl font-bold text-accent-amber">0</div>
                              <p className="text-sm text-gray-400">Cards Due Today</p>
                         </div>
                         <div className="card-container">
                              <div className="text-3xl font-bold text-accent-amber">0</div>
                              <p className="text-sm text-gray-400">Study Streak</p>
                         </div>
                         <div className="card-container">
                              <div className="text-3xl font-bold text-accent-amber">0%</div>
                              <p className="text-sm text-gray-400">Average Mastery</p>
                         </div>
                    </div>

                    {/* Decks Section */}
                    <div>
                         <h2 className="text-2xl font-bold mb-6">Your Decks</h2>

                         {decks.length === 0 ? (
                              <div className="card-container text-center py-12">
                                   <p className="text-gray-400 mb-6">No decks yet. Create your first deck to get started!</p>
                                   <Link href="/upload" className="btn-primary">
                                        Create Your First Deck
                                   </Link>
                              </div>
                         ) : (
                              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                   {decks.map((deck) => (
                                        <Link
                                             key={deck.id}
                                             href={`/deck/${deck.id}`}
                                             className="card-container cursor-pointer group"
                                        >
                                             <div className={`w-full h-32 rounded-lg bg-gradient-to-br from-${deck.color_tag}-500 to-${deck.color_tag}-700 mb-4 group-hover:scale-105 transition-transform`}></div>
                                             <h3 className="font-bold text-lg mb-2 group-hover:text-accent-amber transition-colors">
                                                  {deck.title}
                                             </h3>
                                             <p className="text-sm text-gray-400 mb-4">{deck.description}</p>
                                             <p className="text-xs text-accent-amber">{deck.card_count} cards</p>
                                        </Link>
                                   ))}
                              </div>
                         )}
                    </div>
               </main>
          </div>
     );
}
