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
               {/* Premium Header */}
               <header className="glass-bg sticky top-0 z-50 border-b border-white/5">
                    <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                              <div>
                                   <h1 className="text-4xl font-bold text-gradient">RecallAI</h1>
                                   <p className="text-xs text-gray-400 mt-1">Master anything with AI</p>
                              </div>
                         </div>
                         <div className="flex gap-4 items-center">
                              <Link href="/upload" className="btn-primary text-sm font-semibold">
                                   ➕ New Deck
                              </Link>
                         </div>
                    </div>
               </header>

               {/* Main Content */}
               <main className="max-w-7xl mx-auto px-4 py-16">
                    {/* Premium Stats Grid */}
                    <div className="grid md:grid-cols-4 gap-5 mb-16">
                         <div className="card-container-hover glass-bg p-8 rounded-2xl hover:scale-105 transition-all">
                              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-yellow-400 mb-2">
                                   {decks.length}
                              </div>
                              <p className="text-sm text-gray-400 font-medium">Total Decks</p>
                              <div className="mt-3 h-1 w-12 bg-gradient-to-r from-accent-amber to-yellow-400 rounded-full"></div>
                         </div>

                         <div className="card-container-hover glass-bg p-8 rounded-2xl hover:scale-105 transition-all">
                              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-indigo to-blue-400 mb-2">
                                   0
                              </div>
                              <p className="text-sm text-gray-400 font-medium">Due Today</p>
                              <div className="mt-3 h-1 w-12 bg-gradient-to-r from-accent-indigo to-blue-400 rounded-full"></div>
                         </div>

                         <div className="card-container-hover glass-bg p-8 rounded-2xl hover:scale-105 transition-all">
                              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-400 mb-2">
                                   0
                              </div>
                              <p className="text-sm text-gray-400 font-medium">Study Streak</p>
                              <div className="mt-3 h-1 w-12 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full"></div>
                         </div>

                         <div className="card-container-hover glass-bg p-8 rounded-2xl hover:scale-105 transition-all">
                              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400 mb-2">
                                   0%
                              </div>
                              <p className="text-sm text-gray-400 font-medium">Mastery</p>
                              <div className="mt-3 h-1 w-12 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full"></div>
                         </div>
                    </div>

                    {/* Decks Section */}
                    <div>
                         <div className="mb-10">
                              <h2 className="text-3xl font-bold mb-2">Your Decks</h2>
                              <p className="text-gray-400">Create, study, and master your subjects</p>
                         </div>

                         {decks.length === 0 ? (
                              <div className="glass-bg rounded-2xl p-16 text-center border-2 border-dashed border-white/10">
                                   <div className="text-6xl mb-4">📚</div>
                                   <p className="text-lg text-gray-400 mb-8">No decks yet. Start your learning journey!</p>
                                   <Link href="/upload" className="btn-primary inline-block">
                                        Create Your First Deck
                                   </Link>
                              </div>
                         ) : (
                              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                   {decks.map((deck) => (
                                        <Link
                                             key={deck.id}
                                             href={`/deck/${deck.id}`}
                                             className="group glass-bg rounded-2xl p-6 cursor-pointer hover:scale-105 transition-all duration-300"
                                        >
                                             <div className="w-full h-40 rounded-xl bg-gradient-to-br from-accent-amber/30 via-accent-indigo/20 to-purple-900/30 mb-6 group-hover:shadow-lg group-hover:shadow-accent-amber/20 transition-all flex items-center justify-center">
                                                  <div className="text-5xl">📖</div>
                                             </div>
                                             <h3 className="font-bold text-xl mb-2 group-hover:text-accent-amber transition-colors">
                                                  {deck.title}
                                             </h3>
                                             <p className="text-sm text-gray-400 mb-4 line-clamp-2">{deck.description}</p>
                                             <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                                  <span className="text-xs text-accent-amber font-semibold">
                                                       {deck.card_count || 0} cards
                                                  </span>
                                                  <div className="text-lg opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                                             </div>
                                        </Link>
                                   ))}
                              </div>
                         )}
                    </div>
               </main>
          </div>
     );
}
