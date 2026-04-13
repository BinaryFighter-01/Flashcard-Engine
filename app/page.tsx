'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase-client';

export default function Home() {
     const [user, setUser] = useState<any>(null);
     const [loading, setLoading] = useState(true);
     const supabase = createClient();

     useEffect(() => {
          const checkUser = async () => {
               try {
                    const {
                         data: { user },
                    } = await supabase.auth.getUser();
                    setUser(user);
               } catch (error) {
                    console.error('Error checking user:', error);
               } finally {
                    setLoading(false);
               }
          };

          checkUser();
     }, []);

     if (loading) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-amber"></div>
               </div>
          );
     }

     return (
          <main className="flex-1 flex flex-col">
               {/* Hero Section */}
               <section className="flex-1 flex items-center justify-center px-4 py-20 text-center">
                    <div className="space-y-8 max-w-2xl">
                         <h1 className="text-5xl md:text-6xl font-bold font-serif">
                              <span className="text-gradient">RecallAI</span>
                         </h1>

                         <p className="text-xl text-gray-300">
                              Master any subject with AI-generated flashcards and scientifically-backed spaced repetition
                         </p>

                         <div className="flex gap-4 justify-center flex-wrap">
                              {user ? (
                                   <>
                                        <Link href="/dashboard" className="btn-primary">
                                             Go to Dashboard
                                        </Link>
                                        <Link href="/upload" className="btn-secondary">
                                             Create New Deck
                                        </Link>
                                   </>
                              ) : (
                                   <>
                                        <Link href="/auth/login" className="btn-primary">
                                             Sign In
                                        </Link>
                                        <Link href="/auth/signup" className="btn-secondary">
                                             Create Account
                                        </Link>
                                   </>
                              )}
                         </div>

                         {/* Features Preview */}
                         <div className="grid md:grid-cols-3 gap-6 mt-16">
                              <div className="card-container">
                                   <div className="text-3xl mb-2">🤖</div>
                                   <h3 className="font-bold mb-2">AI Card Generation</h3>
                                   <p className="text-sm text-gray-400">Upload PDFs and let AI create comprehensive flashcards</p>
                              </div>
                              <div className="card-container">
                                   <div className="text-3xl mb-2">🧠</div>
                                   <h3 className="font-bold mb-2">Spaced Repetition</h3>
                                   <p className="text-sm text-gray-400">Study smarter with SM-2 algorithm optimization</p>
                              </div>
                              <div className="card-container">
                                   <div className="text-3xl mb-2">📊</div>
                                   <h3 className="font-bold mb-2">Progress Tracking</h3>
                                   <p className="text-sm text-gray-400">Visualize your mastery and study patterns</p>
                              </div>
                         </div>
                    </div>
               </section>

               {/* Footer */}
               <footer className="border-t border-dark-border py-8 px-4">
                    <div className="text-center text-gray-400">
                         <p>&copy; 2024 RecallAI. All rights reserved.</p>
                    </div>
               </footer>
          </main>
     );
}
